import Dexie, { Table } from 'dexie';
import { PlayerSaveState, SRSItemState } from '../types/codex';
import { createInitialSaveState } from '../engine/srs';

export const STORAGE_KEY = 'codex_albion_save_v2';

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

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

export async function loadPlayerSave(): Promise<PlayerSaveState> {
  try {
    await requestPersistentStorage();
    const fromIdb = await db.playerSaves.get('eclaireur_albion_1');
    if (fromIdb && fromIdb.srsStates) {
      return { ...createInitialSaveState(), ...fromIdb };
    }
  } catch {
    // Fallback to localStorage if IndexedDB is restricted
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('codex_albion_save_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...createInitialSaveState(), ...parsed };
    }
  } catch {
    // Ignore parse errors
  }

  return createInitialSaveState();
}

export async function persistPlayerSave(saveState: PlayerSaveState): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveState));
  } catch {
    // Ignore quota errors
  }

  try {
    await db.playerSaves.put(saveState);
    const items = Object.values(saveState.srsStates);
    if (items.length > 0) {
      await db.srsStates.bulkPut(items);
    }
  } catch {
    // Ignore IDB errors in restricted contexts
  }
}
