import {
  SRSItemState,
  MasteryMaterial,
  ErosionVisualState,
  Exercise,
  PlayerSaveState
} from '../types/codex';
import { TIER1_BRICKS, TIER1_FORMULAS } from '../data/tier1';

export const DAY_MS = 86_400_000;

export const MATERIAL_META: Record<
  MasteryMaterial,
  {
    rank: number;
    name: string;
    thresholdLabel: string;
    healthyLabel: string;
    degradedLabel: string;
    criticalLabel: string;
    badgeClass: string;
    icon: string;
  }
> = {
  clay: {
    rank: 1,
    name: 'Argile crue',
    thresholdLabel: 'S < 2 jours',
    healthyLabel: 'Terre cuite mate',
    degradedLabel: 'Fissures superficielles',
    criticalLabel: 'Brique Fissurée (Priorité SRS 1)',
    badgeClass: 'bg-orange-950/85 text-orange-300 border-orange-600/50',
    icon: '🏺'
  },
  stone: {
    rank: 2,
    name: 'Pierre taillée',
    thresholdLabel: '2 ≤ S < 10 jours',
    healthyLabel: 'Granit gris net',
    degradedLabel: 'Mousse verte sur les bords',
    criticalLabel: 'Envahie de Lierre (Bloque le Boss)',
    badgeClass: 'bg-stone-800 text-stone-200 border-stone-500/60',
    icon: '🪨'
  },
  marble: {
    rank: 3,
    name: 'Marbre veiné',
    thresholdLabel: '10 ≤ S < 30 jours',
    healthyLabel: 'Marbre blanc veiné',
    degradedLabel: 'Poussière et ternissement',
    criticalLabel: 'Marbre Fissuré',
    badgeClass: 'bg-slate-100/95 text-slate-900 border-white',
    icon: '🏛️'
  },
  gold: {
    rank: 4,
    name: 'Or runique',
    thresholdLabel: 'S ≥ 30 jours',
    healthyLabel: "Pierre noire gravée d'or",
    degradedLabel: "Éclat d'or pâli",
    criticalLabel: 'Or Runique Fissuré',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400',
    icon: '✨'
  }
};

export function computeMaterial(stability: number): MasteryMaterial {
  if (stability >= 30) return 'gold';
  if (stability >= 10) return 'marble';
  if (stability >= 2) return 'stone';
  return 'clay';
}

/**
 * Formule FSRS exacte de la Probabilité de Rappel : R(t) = 0.9^(t / S)
 */
export function calculateRetention(
  srsItem: SRSItemState | undefined,
  currentTimestamp: number
): number {
  if (!srsItem || !srsItem.unlocked) return 1.0;
  const elapsedDays = Math.max(0, (currentTimestamp - srsItem.lastReviewedAt) / DAY_MS);
  const S = Math.max(0.2, srsItem.stability || 0.2);
  const R = Math.pow(0.9, elapsedDays / S);
  return Math.max(0.05, Math.min(1.0, R));
}

export function getErosionState(retention: number): ErosionVisualState {
  if (retention >= 0.85) return 'healthy';
  if (retention >= 0.65) return 'degraded';
  return 'critical';
}

export function getVisualStatusDescription(
  material: MasteryMaterial,
  retention: number
): string {
  const meta = MATERIAL_META[material] || MATERIAL_META.clay;
  const erosion = getErosionState(retention);
  if (erosion === 'healthy') return meta.healthyLabel;
  if (erosion === 'degraded') return meta.degradedLabel;
  return meta.criticalLabel;
}

/**
 * Calcule le timestamp où R(t) descend à 0.85 :
 * 0.9^(t / S) = 0.85  =>  t = S * ln(0.85) / ln(0.9) ≈ S * 1.5425 jours
 */
export function computeNextReviewTimestamp(lastReviewedAt: number, stability: number): number {
  const daysUntil85 = stability * (Math.log(0.85) / Math.log(0.9));
  return Math.round(lastReviewedAt + daysUntil85 * DAY_MS);
}

/**
 * Mise à jour d'une Brique ou d'une Formule selon les équations de la section 3.D :
 * - Paliers initiaux de S à la découverte : 0.2j (~5h) -> 1.0j -> 3.0j -> calcul FSRS
 * - Si R <= 0.92 : S_new = S * (1 + 1.8 * (11 - D) * 0.15 * S^(-0.2))
 * - Si R > 0.92 (révision anticipée dans la même journée) : S_new = S * 1.15
 * - Si échec : S_new = max(0.2, S * 0.35), D_new = min(10.0, D + 0.8)
 */
export function updateSRSItem(
  prevItem: SRSItemState | undefined,
  isFirstTrySuccess: boolean,
  currentTimestamp: number
): SRSItemState {
  const base: SRSItemState = prevItem || {
    itemId: 'unknown',
    itemType: 'brick',
    unlocked: true,
    stability: 0.2,
    difficulty: 5.0,
    material: 'clay',
    lastReviewedAt: currentTimestamp,
    nextReviewAt: computeNextReviewTimestamp(currentTimestamp, 0.2),
    successCount: 0,
    lapseCount: 0
  };

  const R = calculateRetention(base, currentTimestamp);
  let newS = base.stability;
  let newD = base.difficulty;

  if (isFirstTrySuccess) {
    if (!base.unlocked || base.successCount === 0) {
      newS = 1.0;
    } else if (base.successCount === 1 && base.stability <= 1.15 && R <= 0.92) {
      newS = 3.0;
    } else if (R <= 0.92) {
      newS = newS * (1 + 1.8 * (11 - newD) * 0.15 * Math.pow(newS, -0.2));
    } else {
      newS = newS * 1.15;
    }
    newD = Math.max(1.0, newD - 0.25);
  } else {
    newS = Math.max(0.2, newS * 0.35);
    newD = Math.min(10.0, newD + 0.8);
  }

  newS = Math.min(180, Number(newS.toFixed(2)));
  newD = Number(newD.toFixed(2));
  const material = computeMaterial(newS);

  return {
    ...base,
    unlocked: true,
    stability: newS,
    difficulty: newD,
    material,
    lastReviewedAt: currentTimestamp,
    nextReviewAt: computeNextReviewTimestamp(currentTimestamp, newS),
    successCount: isFirstTrySuccess ? base.successCount + 1 : base.successCount,
    lapseCount: isFirstTrySuccess ? base.lapseCount : base.lapseCount + 1
  };
}

/**
 * Algorithme du générateur de session « 5 minutes » (Section 3.D) :
 * 1. Trie toutes les briques et formules débloquées par R(t) croissant.
 * 2. Sélectionne les 6 éléments ayant le R(t) le plus bas (où R(t) < 0.90).
 * 3. Pioche 6 exercices qui combinent au maximum ces éléments fragiles entre eux.
 */
export function getPriorityReviewQueue(
  srsStates: Record<string, SRSItemState>,
  allExercises: Exercise[],
  currentTimestamp: number
): { priorityItemIds: string[]; selectedExercises: Exercise[] } {
  const unlockedItems = Object.values(srsStates)
    .filter((st) => st.unlocked)
    .map((st) => ({
      state: st,
      retention: calculateRetention(st, currentTimestamp)
    }))
    .sort((a, b) => a.retention - b.retention);

  const fragileCandidates = unlockedItems
    .filter((item) => item.retention < 0.9)
    .slice(0, 6);

  const priorityItemIds = fragileCandidates.map((c) => c.state.itemId);
  const prioritySet = new Set(priorityItemIds);

  // Filtre les exercices accessibles
  const availableExercises = allExercises.filter((ex) =>
    ex.requiredBrickIds.some((id) => srsStates[id]?.unlocked)
  );

  const scored = availableExercises.map((ex) => {
    let score = 0;
    ex.requiredBrickIds.forEach((id) => {
      if (prioritySet.has(id)) {
        const R = calculateRetention(srsStates[id], currentTimestamp);
        score += R < 0.65 ? 5 : 3;
      }
    });
    ex.requiredFormulaIds.forEach((id) => {
      if (prioritySet.has(id)) {
        score += 4;
      }
    });
    return { ex, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selectedExercises = scored.slice(0, 6).map((s) => s.ex);

  return {
    priorityItemIds,
    selectedExercises:
      selectedExercises.length > 0 ? selectedExercises : allExercises.slice(0, 6)
  };
}

export function createInitialSaveState(now = Date.now()): PlayerSaveState {
  const srsStates: Record<string, SRSItemState> = {};

  TIER1_BRICKS.forEach((b) => {
    srsStates[b.id] = {
      itemId: b.id,
      itemType: 'brick',
      unlocked: false,
      stability: 0.2,
      difficulty: b.falseFriendTrap ? 6.5 : 5.0,
      material: 'clay',
      lastReviewedAt: now,
      nextReviewAt: computeNextReviewTimestamp(now, 0.2),
      successCount: 0,
      lapseCount: 0,
      freeEngravedMastery: false
    };
  });

  TIER1_FORMULAS.forEach((f) => {
    srsStates[f.id] = {
      itemId: f.id,
      itemType: 'formula',
      unlocked: false,
      stability: 0.2,
      difficulty: 5.5,
      material: 'clay',
      lastReviewedAt: now,
      nextReviewAt: computeNextReviewTimestamp(now, 0.2),
      successCount: 0,
      lapseCount: 0
    };
  });

  return {
    profileId: 'eclaireur_albion_1',
    version: 2,
    currentTierId: 'tier_1',
    unlockedSubtiers: ['1A'],
    completedNodeIds: [],
    bossDefeatedTiers: [],
    bossDefeated: false,
    bossAttemptsCount: { tier_1: 0 },
    bossAttempts: 0,
    preferredAccent: 'uk',
    virtualDaysOffset: 0,
    srsStates
  };
}
