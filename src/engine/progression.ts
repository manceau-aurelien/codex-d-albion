import { MAP_NODES } from '../data/tier1';
import { MapNode } from '../types/codex';

// ============================================================================
// PROGRESSION DE L'AVENTURE : les étapes se débloquent dans l'ordre.
// Tout est déduit de `completedNodeIds` (aucun état supplémentaire à sauvegarder).
// ============================================================================

export type StrataId = '1A' | '1B' | '1C';
export type NodeAccess = 'completed' | 'available' | 'locked';
export type StrataState = 'done' | 'current' | 'locked';

export const STRATA_IDS: StrataId[] = ['1A', '1B', '1C'];

export const STRATA_META: Record<StrataId, { name: string; short: string }> = {
  '1A': { name: 'Strate 1A : Les Objets du Seuil', short: 'Les Objets du Seuil' },
  '1B': { name: "Strate 1B : Les Êtres et l'État", short: "Les Êtres et l'État" },
  '1C': { name: 'Strate 1C : Les Actions et les Illusions', short: 'Les Actions et les Illusions' }
};

export interface StrataProgress {
  id: StrataId;
  nodes: MapNode[];
  doneCount: number;
  total: number;
  done: boolean;
  state: StrataState;
  brickCount: number;
  hasFormula: boolean;
}

export interface BossLock {
  label: string;
  ok: boolean;
  hint: string;
}

/** Une étape est accessible si toutes les précédentes sont terminées (ou si elle l'est déjà). */
export function getNodeAccess(completedNodeIds: string[]): Record<string, NodeAccess> {
  const access: Record<string, NodeAccess> = {};
  let previousAllDone = true;
  for (const node of MAP_NODES) {
    if (completedNodeIds.includes(node.id)) {
      access[node.id] = 'completed';
    } else if (previousAllDone) {
      access[node.id] = 'available';
      previousAllDone = false;
    } else {
      access[node.id] = 'locked';
      previousAllDone = false;
    }
  }
  return access;
}

export function getStrataProgress(completedNodeIds: string[]): StrataProgress[] {
  let foundCurrent = false;
  return STRATA_IDS.map((id) => {
    const nodes = MAP_NODES.filter((n) => n.subtierId === id);
    const doneCount = nodes.filter((n) => completedNodeIds.includes(n.id)).length;
    const done = doneCount === nodes.length;
    let state: StrataState = 'locked';
    if (done) state = 'done';
    else if (!foundCurrent) {
      state = 'current';
      foundCurrent = true;
    }
    return {
      id,
      nodes,
      doneCount,
      total: nodes.length,
      done,
      state,
      brickCount: nodes.reduce((sum, n) => sum + (n.brickIds?.length || 0), 0),
      hasFormula: nodes.some((n) => Boolean(n.formulaId))
    };
  });
}

/** Les 4 verrous de la Porte du Gardien : 3 strates terminées + aucune brique fissurée. */
export function getBossLocks(strata: StrataProgress[], crackedCount: number): BossLock[] {
  const locks: BossLock[] = strata.map((s) => ({
    label: `Strate ${s.id}`,
    ok: s.done,
    hint: `Termine la Strate ${s.id}`
  }));
  locks.push({
    label: 'Zéro brique fissurée',
    ok: crackedCount === 0,
    hint: `Restaure tes ${crackedCount} brique${crackedCount > 1 ? 's' : ''} fissurée${crackedCount > 1 ? 's' : ''}`
  });
  return locks;
}

export interface Objective {
  percent: number; // avancement global de l'aventure (étapes + Gardien)
  headline: string;
  detail: string;
}

/** Prochain objectif et récompense annoncée : de quoi donner envie de continuer. */
export function getObjective(
  completedNodeIds: string[],
  strata: StrataProgress[],
  bossLocks: BossLock[],
  bossDefeated: boolean
): Objective {
  const totalSteps = MAP_NODES.length + 1; // + le Gardien
  const doneSteps = MAP_NODES.filter((n) => completedNodeIds.includes(n.id)).length + (bossDefeated ? 1 : 0);
  const percent = Math.round((doneSteps / totalSteps) * 100);

  const current = strata.find((s) => s.state === 'current');
  if (current) {
    const remaining = current.total - current.doneCount;
    const next = strata[strata.indexOf(current) + 1];
    const reward = next
      ? `Récompense : la Strate ${next.id} « ${STRATA_META[next.id].short} » (${next.brickCount} nouvelles briques${
          next.hasFormula ? ' + 1 formule' : ''
        }).`
      : 'Récompense : la Porte du Gardien du Seuil.';
    return {
      percent,
      headline:
        remaining === 1
          ? `Dernière étape de la Strate ${current.id} !`
          : `Strate ${current.id} : encore ${remaining} étapes`,
      detail: reward
    };
  }

  if (!bossDefeated) {
    const missing = bossLocks.filter((l) => !l.ok);
    if (missing.length > 0) {
      return { percent, headline: 'Un dernier verrou protège le Gardien', detail: missing.map((m) => m.hint).join(' · ') };
    }
    return {
      percent,
      headline: 'La Porte du Gardien est ouverte !',
      detail: 'Brise les 10 Sceaux pour franchir le Seuil de Pierre.'
    };
  }
  return { percent: 100, headline: 'Palier I terminé !', detail: 'Le Seuil de Pierre est franchi. La suite de l’aventure t’attend bientôt.' };
}
