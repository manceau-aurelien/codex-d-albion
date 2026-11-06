import { PlayerSaveState } from '../types/codex';
import { createInitialSaveState } from '../engine/srs';
import { progressScore } from './codexDb';

const LAST_EXPORT_KEY = 'codex_albion_last_export';
const DEV_MODE_KEY = 'codex_albion_dev';
const FORMAT_ID = 'codex-albion-save';

export interface SaveSummary {
  unlockedItems: number;
  completedNodes: number;
  bossDefeated: boolean;
  savedAt?: number;
}

export interface ParseResult {
  ok: boolean;
  error?: string;
  state?: PlayerSaveState;
  summary?: SaveSummary;
}

export function summarizeSave(state: PlayerSaveState): SaveSummary {
  return {
    unlockedItems: Object.values(state.srsStates || {}).filter((s) => s?.unlocked).length,
    completedNodes: state.completedNodeIds?.length || 0,
    bossDefeated: !!state.bossDefeated || (state.bossDefeatedTiers?.length || 0) > 0,
    savedAt: state.savedAt
  };
}

/** Format de fichier : enveloppe versionnée autour de la sauvegarde. */
export function buildExportText(state: PlayerSaveState): string {
  return JSON.stringify(
    { format: FORMAT_ID, exportVersion: 1, exportedAt: Date.now(), save: { ...state, savedAt: Date.now() } },
    null,
    2
  );
}

export function exportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `codex-albion-sauvegarde-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/** Lit un texte (fichier ou collé) : accepte l'enveloppe ou une ancienne sauvegarde brute. Vérifie la structure. */
export function parseSaveText(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text.trim());
  } catch {
    return { ok: false, error: "Ce texte n'est pas un fichier de sauvegarde valide (JSON illisible)." };
  }
  const raw = (data && typeof data === 'object' && 'save' in (data as object)
    ? (data as { save: unknown }).save
    : data) as Partial<PlayerSaveState> | null;

  if (!raw || typeof raw !== 'object' || !raw.srsStates || typeof raw.srsStates !== 'object') {
    return { ok: false, error: "Ce fichier ne ressemble pas à une sauvegarde du Codex d'Albion." };
  }

  // On repart d'un état neuf (toutes les briques connues) puis on applique uniquement des valeurs saines.
  const base = createInitialSaveState();
  const srsStates = { ...base.srsStates };
  for (const [id, value] of Object.entries(raw.srsStates)) {
    if (!srsStates[id] || !value || typeof value !== 'object') continue; // identifiant inconnu : ignoré
    const v = value as unknown as Record<string, unknown>;
    const num = (x: unknown, fallback: number) => (typeof x === 'number' && Number.isFinite(x) ? x : fallback);
    const prev = srsStates[id];
    srsStates[id] = {
      ...prev,
      unlocked: v.unlocked === true,
      stability: Math.min(180, Math.max(0.2, num(v.stability, prev.stability))),
      difficulty: Math.min(10, Math.max(1, num(v.difficulty, prev.difficulty))),
      material: (['clay', 'stone', 'marble', 'gold'] as const).includes(v.material as 'clay')
        ? (v.material as typeof prev.material)
        : prev.material,
      lastReviewedAt: num(v.lastReviewedAt, prev.lastReviewedAt),
      nextReviewAt: num(v.nextReviewAt, prev.nextReviewAt),
      successCount: Math.max(0, num(v.successCount, 0)),
      lapseCount: Math.max(0, num(v.lapseCount, 0)),
      freeEngravedMastery: v.freeEngravedMastery === true
    };
  }

  const strArray = (x: unknown, fallback: string[]) =>
    Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : fallback;

  const state: PlayerSaveState = {
    ...base,
    currentTierId: typeof raw.currentTierId === 'string' ? raw.currentTierId : base.currentTierId,
    unlockedSubtiers: strArray(raw.unlockedSubtiers, base.unlockedSubtiers),
    completedNodeIds: strArray(raw.completedNodeIds, base.completedNodeIds),
    bossDefeatedTiers: strArray(raw.bossDefeatedTiers, base.bossDefeatedTiers),
    bossDefeated: raw.bossDefeated === true,
    bossAttemptsCount:
      raw.bossAttemptsCount && typeof raw.bossAttemptsCount === 'object' ? raw.bossAttemptsCount : base.bossAttemptsCount,
    bossAttempts: typeof raw.bossAttempts === 'number' ? raw.bossAttempts : 0,
    preferredAccent: raw.preferredAccent === 'us' ? 'us' : 'uk',
    virtualDaysOffset: typeof raw.virtualDaysOffset === 'number' && raw.virtualDaysOffset >= 0 ? raw.virtualDaysOffset : 0,
    srsStates,
    savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : undefined
  };
  return { ok: true, state, summary: summarizeSave(state) };
}

export function isImportWorse(current: PlayerSaveState, incoming: PlayerSaveState): boolean {
  return progressScore(incoming) < progressScore(current);
}

/** Télécharge la sauvegarde sous forme de fichier .json. */
export function downloadSaveFile(state: PlayerSaveState): void {
  const blob = new Blob([buildExportText(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  markExported();
}

export async function copySaveToClipboard(state: PlayerSaveState): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildExportText(state));
    markExported();
    return true;
  } catch {
    return false;
  }
}

export function markExported(): void {
  try {
    localStorage.setItem(LAST_EXPORT_KEY, String(Date.now()));
  } catch {
    // ignoré
  }
}

export function getLastExportAt(): number | null {
  try {
    const v = Number(localStorage.getItem(LAST_EXPORT_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/** Mode développeur : outils de test (voyage dans le temps, tout débloquer). Caché par défaut. */
export function readDevMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === '1') localStorage.setItem(DEV_MODE_KEY, '1');
    if (params.get('dev') === '0') localStorage.removeItem(DEV_MODE_KEY);
    return localStorage.getItem(DEV_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeDevMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(DEV_MODE_KEY, '1');
    else localStorage.removeItem(DEV_MODE_KEY);
  } catch {
    // ignoré
  }
}
