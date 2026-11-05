import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App.tsx';
import { createInitialSaveState, computeMaterial, computeNextReviewTimestamp, DAY_MS } from '../src/engine/srs.ts';
import { MAP_NODES } from '../src/data/tier1.ts';

for (const screen of ['launcher', 'camp', 'map', 'grimoire', 'boss']) {
  const html = renderToString(React.createElement(App, { initialScreen: screen }));
  console.log(`Initial state — Screen [${screen}] rendered OK! HTML length:`, html.length);
}

// Now test with unlocked state + cracked items
const unlockedSave = createInitialSaveState();
const now = Date.now();
Object.keys(unlockedSave.srsStates).forEach((id) => {
  unlockedSave.srsStates[id] = {
    ...unlockedSave.srsStates[id],
    unlocked: true,
    stability: 2.0,
    material: 'stone',
    lastReviewedAt: now - 5 * DAY_MS,
    nextReviewAt: computeNextReviewTimestamp(now - 5 * DAY_MS, 2.0),
    successCount: 2
  };
});
unlockedSave.completedNodeIds = MAP_NODES.map((n) => n.id);

for (const screen of ['launcher', 'camp', 'map', 'grimoire', 'boss']) {
  const html = renderToString(React.createElement(App, { initialScreen: screen, initialSaveState: unlockedSave }));
  console.log(`Unlocked/Cracked state — Screen [${screen}] rendered OK! HTML length:`, html.length);
}
