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

// Les identifiants 1A/1B/1C restent internes ; le joueur ne voit que ces noms.
export interface StrataMeta {
  name: string; // « Le Parvis des Pierres »
  short: string; // « Le Parvis »
  the: string; // « le Parvis des Pierres » (en milieu de phrase)
  ofShort: string; // « du Parvis »
  numeral: string; // « I »
  clearedTitle: string; // titre de la fête
  place: string; // décor, pour les textes d'ambiance
}

export const STRATA_META: Record<StrataId, StrataMeta> = {
  '1A': {
    name: 'Le Parvis des Pierres',
    short: 'Le Parvis',
    the: 'le Parvis des Pierres',
    ofShort: 'du Parvis',
    numeral: 'I',
    clearedTitle: 'Le Parvis est franchi !',
    place: 'Portes, clés et gardiens de pierre : le seuil de la tour.'
  },
  '1B': {
    name: 'Le Cloître des Âmes',
    short: 'Le Cloître',
    the: 'le Cloître des Âmes',
    ofShort: 'du Cloître',
    numeral: 'II',
    clearedTitle: 'Le Cloître est franchi !',
    place: 'Les voix qui hantent la tour : qui es-tu, qui est là ?'
  },
  '1C': {
    name: 'Les Cryptes des Ombres',
    short: 'Les Cryptes',
    the: 'les Cryptes des Ombres',
    ofShort: 'des Cryptes',
    numeral: 'III',
    clearedTitle: 'Les Cryptes sont franchies !',
    place: 'Gestes, ombres et illusions : là où les faux-amis se cachent.'
  }
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
    label: STRATA_META[s.id].short,
    ok: s.done,
    hint: `traverse ${STRATA_META[s.id].the}`
  }));
  locks.push({
    label: 'Pierres intactes',
    ok: crackedCount === 0,
    hint: `restaure tes ${crackedCount} brique${crackedCount > 1 ? 's' : ''} fissurée${crackedCount > 1 ? 's' : ''}`
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
      ? `Récompense : ${STRATA_META[next.id].name} (${next.brickCount} nouvelles briques${
          next.hasFormula ? ' + 1 formule' : ''
        }).`
      : 'Récompense : la Porte du Gardien du Seuil.';
    return {
      percent,
      headline:
        remaining === 1
          ? `Dernière étape ${STRATA_META[current.id].ofShort} !`
          : `${STRATA_META[current.id].name} : encore ${remaining} étapes`,
      detail: reward
    };
  }

  if (!bossDefeated) {
    const missing = bossLocks.filter((l) => !l.ok);
    if (missing.length > 0) {
      const todo = missing.map((m) => m.hint).join(', ');
      return {
        percent,
        headline: 'Un dernier verrou protège le Gardien',
        detail: todo.charAt(0).toUpperCase() + todo.slice(1) + '.'
      };
    }
    return {
      percent,
      headline: 'La Porte du Gardien est ouverte !',
      detail: 'Brise les 10 Sceaux pour franchir le Seuil de Pierre.'
    };
  }
  return { percent: 100, headline: 'Palier I terminé !', detail: 'Le Seuil de Pierre est franchi. La suite de l’aventure t’attend bientôt.' };
}
