// ============================================================================
// TESTS UNITAIRES DU MOTEUR SRS (FSRS SIMPLIFIÉ - ÉTAPE 2 DE LA ROADMAP)
// ============================================================================
import assert from 'node:assert/strict';

const DAY_MS = 86_400_000;

function computeMaterial(stability) {
  if (stability >= 30) return 'gold';
  if (stability >= 10) return 'marble';
  if (stability >= 2) return 'stone';
  return 'clay';
}

function calculateRetention(srsItem, currentTimestamp) {
  if (!srsItem || !srsItem.unlocked) return 1.0;
  const elapsedDays = Math.max(0, (currentTimestamp - srsItem.lastReviewedAt) / DAY_MS);
  const S = Math.max(0.2, srsItem.stability || 0.2);
  const R = Math.pow(0.9, elapsedDays / S);
  return Math.max(0.05, Math.min(1.0, R));
}

function getErosionState(retention) {
  if (retention >= 0.85) return 'healthy';
  if (retention >= 0.65) return 'degraded';
  return 'critical';
}

function updateSRSItem(prevItem, isFirstTrySuccess, currentTimestamp) {
  const R = calculateRetention(prevItem, currentTimestamp);
  let newS = prevItem.stability;
  let newD = prevItem.difficulty;

  if (isFirstTrySuccess) {
    if (!prevItem.unlocked || prevItem.successCount === 0) {
      newS = 1.0;
    } else if (prevItem.successCount === 1 && prevItem.stability <= 1.15 && R <= 0.92) {
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
  return {
    ...prevItem,
    unlocked: true,
    stability: newS,
    difficulty: newD,
    material: computeMaterial(newS),
    lastReviewedAt: currentTimestamp,
    successCount: isFirstTrySuccess ? prevItem.successCount + 1 : prevItem.successCount,
    lapseCount: isFirstTrySuccess ? prevItem.lapseCount : prevItem.lapseCount + 1
  };
}

console.log('--- Exécution des tests unitaires SRS (Le Codex d’Albion) ---');

const t0 = Date.now();
let brickState = {
  itemId: 'b_door',
  itemType: 'brick',
  unlocked: true,
  stability: 0.2,
  difficulty: 5.0,
  material: 'clay',
  lastReviewedAt: t0,
  successCount: 0,
  lapseCount: 0
};

// 1. Test croissance de l'intervalle (0.2j -> 1.0j -> 3.0j -> FSRS)
brickState = updateSRSItem(brickState, true, t0 + 0.25 * DAY_MS);
assert.equal(brickState.stability, 1.0, '1re réussite doit fixer S = 1.0 jour');
assert.equal(brickState.material, 'clay', 'Matériau à S=1.0j doit être Argile (clay)');

const t1 = t0 + 1.25 * DAY_MS;
brickState = updateSRSItem(brickState, true, t1);
assert.equal(brickState.stability, 3.0, '2e réussite le lendemain doit fixer S = 3.0 jours');
assert.equal(brickState.material, 'stone', 'Matériau à S=3.0j doit passer à Pierre taillée (stone)');

// 2. Test d'érosion temporelle : Saine -> Fissurée (degraded) -> Envahie de lierre (critical)
const rAfter1Day = calculateRetention(brickState, t1 + 1 * DAY_MS);
assert.equal(getErosionState(rAfter1Day), 'healthy', 'Après 1j sur S=3j, la brique est saine (R >= 85%)');

const rAfter6Days = calculateRetention(brickState, t1 + 6 * DAY_MS);
assert.equal(getErosionState(rAfter6Days), 'degraded', 'Après 6j sur S=3j, la brique est dégradée (65% <= R < 85%)');

const rAfter15Days = calculateRetention(brickState, t1 + 15 * DAY_MS);
assert.equal(getErosionState(rAfter15Days), 'critical', 'Après 15j sur S=3j, la brique est critique / envahie de lierre (R < 65%)');

// 3. Test de chute de stabilité en cas d'erreur
const afterFail = updateSRSItem(brickState, false, t1 + 4 * DAY_MS);
assert.ok(afterFail.stability < brickState.stability, 'Une erreur doit faire chuter la stabilité S');
assert.ok(afterFail.difficulty > brickState.difficulty, 'Une erreur doit augmenter la difficulté D');

console.log('✅ Tous les tests unitaires FSRS (croissance, matériaux, fissuration et lierre) sont validés !');
