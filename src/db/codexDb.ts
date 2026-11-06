import Dexie, { Table } from 'dexie';
import { PlayerSaveState, SRSItemState } from '../types/codex';
import { createInitialSaveState } from '../engine/srs';

export const STORAGE_KEY = 'codex_albion_save_v2';
// Copie de secours : on y garde toujours la sauvegarde la plus avancée jamais vue.
export const BACKUP_KEY = 'codex_albion_backup_v2';
const PROFILE_ID = 'eclaireur_albion_1';
const IDB_TIMEOUT_MS = 3000;

export class CodexDatabase extends Dexie {
  playerSaves!: Table<PlayerSaveState, string>;
  srsStates!: Table<SRSItemState, string>;

  constructor() {
    super('CodexAlbionDB');
    this.version(1).stores({
      playerSaves: 'profileId, currentTierId',
      srsStates: 'itemId, itemType, material, nextReviewAt'
    });
  }
}

export const db = new CodexDatabase();

/** Demande au navigateur de ne pas purger les données. Ne doit JAMAIS bloquer le chargement. */
export function requestPersistentStorage(): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  } catch {
    // ignoré
  }
}

/** Mesure de l'avancement : sert à ne jamais écraser une bonne sauvegarde par une moins bonne. */
export function progressScore(state: PlayerSaveState | null | undefined): number {
  if (!state || !state.srsStates) return -1;
  let score = 0;
  for (const st of Object.values(state.srsStates)) {
    if (st?.unlocked) score += 1 + (st.successCount || 0);
  }
  score += (state.completedNodeIds?.length || 0) * 10;
  score += (state.bossDefeatedTiers?.length || 0) * 100;
  if (state.bossDefeated) score += 100;
  return score;
}

function isValidSave(value: unknown): value is PlayerSaveState {
  return !!value && typeof value === 'object' && !!(value as PlayerSaveState).srsStates;
}

function readLocal(key: string): PlayerSaveState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidSave(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });
}

async function readIdb(): Promise<PlayerSaveState | null> {
  const fromIdb = await withTimeout(db.playerSaves.get(PROFILE_ID), IDB_TIMEOUT_MS);
  return isValidSave(fromIdb) ? fromIdb : null;
}

/**
 * Charge la meilleure sauvegarde disponible parmi IndexedDB, localStorage et la copie de secours.
 * La plus avancée gagne (à égalité : la plus récente).
 */
export async function loadPlayerSave(): Promise<PlayerSaveState> {
  requestPersistentStorage();

  const candidates: PlayerSaveState[] = [];
  const idb = await readIdb();
  if (idb) candidates.push(idb);
  const local = readLocal(STORAGE_KEY) || readLocal('codex_albion_save_v1');
  if (local) candidates.push(local);
  const backup = readLocal(BACKUP_KEY);
  if (backup) candidates.push(backup);

  if (candidates.length === 0) return createInitialSaveState();

  candidates.sort((a, b) => {
    const diff = progressScore(b) - progressScore(a);
    return diff !== 0 ? diff : (b.savedAt || 0) - (a.savedAt || 0);
  });
  return { ...createInitialSaveState(), ...candidates[0] };
}

// Le prochain enregistrement est volontaire (réinitialisation / import) : il remplace tout, secours compris.
let forceNextPersist = false;
export function markIntentionalOverwrite(): void {
  forceNextPersist = true;
}

/** Écriture synchrone (localStorage) : fiable même si l'onglet mobile est tué juste après. */
export function persistPlayerSaveSync(saveState: PlayerSaveState): PlayerSaveState {
  const force = forceNextPersist;
  forceNextPersist = false;
  const stamped: PlayerSaveState = { ...saveState, savedAt: Date.now() };
  const json = JSON.stringify(stamped);

  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // quota / mode privé
  }

  try {
    const best = readLocal(BACKUP_KEY);
    if (force || !best || progressScore(stamped) >= progressScore(best)) {
      localStorage.setItem(BACKUP_KEY, json);
    }
  } catch {
    // ignoré
  }
  return stamped;
}

let idbQueue: Promise<void> = Promise.resolve();

/** Sauvegarde complète : localStorage tout de suite, puis IndexedDB (écritures sérialisées, dans l'ordre). */
export function persistPlayerSave(saveState: PlayerSaveState): Promise<void> {
  const stamped = persistPlayerSaveSync(saveState);
  idbQueue = idbQueue.then(async () => {
    try {
      await db.playerSaves.put(stamped);
      const items = Object.values(stamped.srsStates);
      if (items.length > 0) {
        await db.srsStates.bulkPut(items);
      }
    } catch {
      // IndexedDB indisponible : localStorage reste la source de repli
    }
  });
  return idbQueue;
}
