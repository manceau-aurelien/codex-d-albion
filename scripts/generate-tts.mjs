/**
 * Script de pré-génération Neural TTS (Étape 1 de la Roadmap)
 * Voix A (Référence Britannique) : en-GB-SoniaNeural
 * Voix B (Référence Américaine)  : en-US-GuyNeural
 * Voix C (Le Gardien / Boss)     : en-GB-RyanNeural (1.0x et 0.80x)
 *
 * Usage : npm run generate:tts (nécessite edge-tts en Python ou msedge-tts)
 * Note  : L'application intègre également un moteur hybride Web Audio API + Web Speech API
 *         qui fonctionne immédiatement à 100 % hors-ligne même sans exécuter ce script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT_DIR = path.resolve('audio/tier1');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BRICKS = [
  ['b_the', 'the'], ['b_a', 'a'], ['b_door', 'door'], ['b_key', 'key'], ['b_stone', 'stone'],
  ['b_guard', 'guard'], ['b_old', 'old'], ['b_big', 'big'], ['b_small', 'small'], ['b_cold', 'cold'],
  ['b_i', 'I'], ['b_you', 'you'], ['b_he', 'he'], ['b_she', 'she'], ['b_it', 'it'],
  ['b_they', 'they'], ['b_am', 'am'], ['b_is', 'is'], ['b_are', 'are'], ['b_not', 'not'],
  ['b_here', 'here'], ['b_see', 'see'], ['b_open', 'open'], ['b_keep', 'keep'], ['b_wait', 'wait'],
  ['b_have', 'have'], ['b_afraid', 'afraid'], ['b_shadow', 'shadow'], ['b_way', 'way'],
  ['b_actually', 'actually'], ['b_one', 'one'], ['b_three', 'three']
];

const BOSS_SENTENCES = [
  ['boss_1_main', 'An old stone.'],
  ['boss_1_var', 'A cold shadow waits here.'],
  ['boss_2_main', 'The big door is not open.'],
  ['boss_3_main', 'She keeps one small key.'],
  ['boss_3_var', 'You have one way, it is open.'],
  ['boss_4_main', 'Three guards see the shadow.'],
  ['boss_4_var', 'They see three old stones.'],
  ['boss_5_main', 'He has the key, it is here.'],
  ['boss_6_main', 'The old guard is here, he is cold.'],
  ['boss_6_var', 'I am cold, I am not afraid.'],
  ['boss_7_main', 'I see the small door, it is not open.'],
  ['boss_8_main', 'Actually, you are not afraid.'],
  ['boss_9_main', 'She has three keys, she waits here.'],
  ['boss_9_var', 'The guard is not old, he keeps the way.'],
  ['boss_10_main', 'Actually, the old guard is afraid: he sees a big shadow, the door is not open.']
];

let failedCount = 0;

function synthWithEdgeTts(text, voice, outFile, rate = '+0%', pitch = '+0Hz') {
  if (fs.existsSync(outFile) && fs.statSync(outFile).size > 0) return true; // déjà généré
  try {
    execFileSync(process.env.EDGE_TTS_BIN || 'edge-tts', [
      '--voice', voice,
      '--text', text,
      `--rate=${rate}`,
      `--pitch=${pitch}`,
      '--write-media', outFile
    ], { stdio: 'ignore' });
    return true;
  } catch {
    failedCount++;
    return false;
  }
}

console.log('Génération des fichiers Neural TTS dans audio/tier1/ ...');
let generatedCount = 0;

for (const [id, word] of BRICKS) {
  if (synthWithEdgeTts(word, 'en-GB-SoniaNeural', path.join(OUT_DIR, `uk_${id}.mp3`))) generatedCount++;
  if (synthWithEdgeTts(word, 'en-US-GuyNeural', path.join(OUT_DIR, `us_${id}.mp3`))) generatedCount++;
}

for (const [id, sentence] of BOSS_SENTENCES) {
  if (synthWithEdgeTts(sentence, 'en-GB-RyanNeural', path.join(OUT_DIR, `${id}.mp3`), '+0%', '-5Hz')) generatedCount++;
  if (synthWithEdgeTts(sentence, 'en-GB-RyanNeural', path.join(OUT_DIR, `boss_slow_${id.replace('boss_', '')}.mp3`), '-20%', '-5Hz')) generatedCount++;
}

if (failedCount > 0) console.log(`⚠️ ${failedCount} fichiers n'ont pas pu être générés (relance le script pour les compléter).`);
if (generatedCount > 0) {
  console.log(`✅ ${generatedCount} fichiers audio neuronaux générés dans ${OUT_DIR}`);
} else {
  console.log('ℹ️ CLI edge-tts non détectée : l’application utilisera automatiquement son moteur hybride Web Audio API + Web Speech API multi-accents intégré.');
}
