import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Compass,
  Map as MapIcon,
  BookOpen,
  Skull,
  Volume2,
  VolumeX,
  Flame,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FastForward,
  Unlock,
  Download,
  ChevronRight,
  Award,
  Layers,
  AlertTriangle,
  Eye,
  Ear,
  Hammer,
  Gem,
  Clock,
  ArrowLeft,
  Play,
  Sliders,
  Lock,
  Keyboard
} from 'lucide-react';

import {
  Brick,
  Formula,
  Exercise,
  BossChallenge,
  MapNode,
  PartOfSpeech,
  MasteryMaterial,
  PlayerSaveState
} from './types/codex';
import {
  POS_STYLES,
  TIER1_BRICKS,
  TIER1_FORMULAS,
  TIER1_EXERCISES,
  BOSS_CHALLENGES,
  MAP_NODES
} from './data/tier1';
import {
  DAY_MS,
  MATERIAL_META,
  computeMaterial,
  calculateRetention,
  getErosionState,
  getVisualStatusDescription,
  updateSRSItem,
  getPriorityReviewQueue,
  createInitialSaveState,
  computeNextReviewTimestamp
} from './engine/srs';
import { sfx, speakEnglish } from './engine/audio';
import {
  getNodeAccess,
  getStrataProgress,
  getBossLocks,
  getObjective,
  STRATA_META,
  StrataId,
  StrataProgress,
  NodeAccess,
  BossLock,
  Objective
} from './engine/progression';
import {
  loadPlayerSave,
  persistPlayerSave,
  persistPlayerSaveSync,
  markIntentionalOverwrite
} from './db/codexDb';
import {
  downloadSaveFile,
  copySaveToClipboard,
  parseSaveText,
  summarizeSave,
  isImportWorse,
  getLastExportAt,
  readDevMode,
  writeDevMode,
  SaveSummary
} from './db/backup';

// ============================================================================
// COMPOSANT BRIQUE DE PIERRE (<BrickChip />)
// ============================================================================
interface BrickChipProps {
  text: string;
  pos?: PartOfSpeech;
  subLabel?: string;
  cracked?: boolean;
  critical?: boolean;
  material?: MasteryMaterial | null;
  silentMode?: boolean;
  selected?: boolean;
  corruptedHighlight?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function BrickChip({
  text,
  pos = 'noun',
  subLabel,
  cracked = false,
  critical = false,
  material = null,
  silentMode = false,
  selected = false,
  corruptedHighlight = false,
  disabled = false,
  size = 'md',
  onClick
}: BrickChipProps) {
  const style = POS_STYLES[pos] || POS_STYLES.noun;
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-sm rounded-lg'
      : size === 'lg'
      ? 'px-4 py-2.5 text-base sm:text-lg rounded-xl'
      : 'px-3.5 py-2 text-sm sm:text-base rounded-xl';

  // Texture de bordure selon le matériau SRS
  const materialRing =
    material === 'gold'
      ? 'ring-1 ring-amber-400/70'
      : material === 'marble'
      ? 'ring-1 ring-slate-200/60'
      : '';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group relative inline-flex flex-col items-center justify-center font-serif font-semibold tracking-wide border-2 border-b-4 transition-all duration-150 select-none active:translate-y-0.5 ${sizeClasses} ${style.bg} ${style.border} ${style.text} ${style.glow} ${materialRing} shadow-md ${
        selected ? 'ring-2 ring-amber-300 scale-105' : ''
      } ${corruptedHighlight ? 'ring-2 ring-rose-400 animate-pulse' : ''} ${
        disabled ? 'opacity-30 pointer-events-none' : 'cursor-pointer'
      }`}
    >
      {/* Fissures ou lierre SVG lorsque la brique s'érode (R(t) < 85%) */}
      {cracked && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-70"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 15 0 L 28 14 L 22 26 L 38 40 M 75 0 L 66 18 L 79 30"
            stroke={critical ? '#f43f5e' : '#fbbf24'}
            strokeWidth="1.9"
            fill="none"
          />
        </svg>
      )}

      <span className="relative z-10 flex items-center gap-1.5">
        <span>{text}</span>
        {!silentMode && pos !== 'fr_meaning' && (
          <Volume2 className="w-3.5 h-3.5 opacity-55 group-hover:opacity-100 transition-opacity" />
        )}
      </span>

      {subLabel && (
        <span className="relative z-10 text-[10px] font-sans font-normal opacity-80 mt-0.5">
          {subLabel}
        </span>
      )}

      {cracked && (
        <span
          className={`absolute -top-2 -right-2 px-1.5 py-0.2 text-[9px] font-sans font-bold uppercase tracking-wider rounded-full border ${
            critical
              ? 'bg-rose-950 text-rose-300 border-rose-500'
              : 'bg-amber-950 text-amber-300 border-amber-500'
          }`}
        >
          {critical ? 'Lierre' : 'Fissurée'}
        </span>
      )}

      {!cracked && material && (
        <span
          className="absolute -top-2 -right-1.5 text-[10px]"
          title={MATERIAL_META[material]?.name}
        >
          {MATERIAL_META[material]?.icon}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL : LE CODEX D'ALBION
// ============================================================================
type ScreenType =
  | 'launcher'
  | 'camp'
  | 'map'
  | 'grimoire'
  | 'gisement'
  | 'stele'
  | 'exercise_session'
  | 'free_engraving'
  | 'boss';

interface Celebration {
  id: string;
  emoji: string;
  title: string;
  body: string;
  cta: 'map' | 'boss';
}

export default function App({
  initialScreen = 'launcher',
  initialSaveState
}: {
  initialScreen?: ScreenType;
  initialSaveState?: PlayerSaveState;
} = {}) {
  const [saveState, setSaveState] = useState<PlayerSaveState>(
    () => initialSaveState || createInitialSaveState()
  );
  const [dbLoaded, setDbLoaded] = useState(false);

  const [activeScreen, setActiveScreen] = useState<ScreenType>(initialScreen);
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);
  const [sessionQueue, setSessionQueue] = useState<Exercise[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [soundMuted, setSoundMuted] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreview, setImportPreview] = useState<
    { state: PlayerSaveState; summary: SaveSummary } | null
  >(null);
  const [importError, setImportError] = useState('');
  const [dataNotice, setDataNotice] = useState('');
  const [lastExportAt, setLastExportAt] = useState<number | null>(() => getLastExportAt());

  // Mode développeur (caché) : 7 appuis sur le titre, ou ?dev=1 dans l'adresse
  const [devMode, setDevMode] = useState<boolean>(() => readDevMode());
  const titleTapsRef = useRef<{ count: number; last: number }>({ count: 0, last: 0 });
  const handleTitleTap = () => {
    const now = Date.now();
    const t = titleTapsRef.current;
    t.count = now - t.last < 1500 ? t.count + 1 : 1;
    t.last = now;
    if (t.count >= 7) {
      t.count = 0;
      const next = !devMode;
      writeDevMode(next);
      setDevMode(next);
      setDataNotice(next ? 'Mode développeur activé.' : 'Mode développeur désactivé.');
    }
  };
  const disableDevMode = () => {
    writeDevMode(false);
    setDevMode(false);
  };

  const resetVirtualClock = () => {
    setSaveState((prev) => ({ ...prev, virtualDaysOffset: 0 }));
  };

  const [notice, setNotice] = useState('');
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const notify = (message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), 5000);
  };
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  // Mis à true avant une réinitialisation / un import / un déblocage test : pas de fête pour ces changements
  const suppressCelebrationRef = useRef(false);

  const closeDataModal = () => {
    setShowDataModal(false);
    setImportJsonText('');
    setImportPreview(null);
    setImportError('');
    setDataNotice('');
  };

  const previewImport = (text: string) => {
    const result = parseSaveText(text);
    if (result.ok && result.state && result.summary) {
      setImportPreview({ state: result.state, summary: result.summary });
      setImportError('');
    } else {
      setImportPreview(null);
      setImportError(result.error || 'Sauvegarde illisible.');
    }
  };

  const handleExportFile = () => {
    downloadSaveFile(saveState);
    setLastExportAt(Date.now());
    setDataNotice('Fichier de sauvegarde téléchargé. Garde-le en lieu sûr (Drive, mail, etc.).');
  };

  const handleCopyCode = async () => {
    const ok = await copySaveToClipboard(saveState);
    if (ok) setLastExportAt(Date.now());
    setDataNotice(ok ? 'Sauvegarde copiée dans le presse-papiers.' : 'Copie impossible : utilise « Télécharger ».');
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5_000_000) {
      setImportPreview(null);
      setImportError('Fichier trop volumineux pour être une sauvegarde.');
      return;
    }
    const text = await file.text();
    setImportJsonText(text);
    previewImport(text);
  };

  const confirmImport = () => {
    if (!importPreview) return;
    if (
      isImportWorse(saveState, importPreview.state) &&
      !window.confirm(
        'Cette sauvegarde est MOINS avancée que ta progression actuelle.\n\nElle va la remplacer. Continuer ?'
      )
    ) {
      return;
    }
    markIntentionalOverwrite();
    suppressCelebrationRef.current = true;
    setCelebrations([]);
    setSaveState(importPreview.state);
    sfx.playSuccessRune();
    closeDataModal();
  };

  // Chargement initial depuis IndexedDB (Dexie) ou localStorage
  useEffect(() => {
    loadPlayerSave().then((loaded) => {
      setSaveState(loaded);
      setDbLoaded(true);
    });
  }, []);

  // Persistance automatique dans IndexedDB + localStorage
  const latestSaveRef = useRef(saveState);
  latestSaveRef.current = saveState;
  useEffect(() => {
    if (dbLoaded) {
      persistPlayerSave(saveState);
    }
  }, [saveState, dbLoaded]);

  // Sur mobile, l'onglet peut être tué dès qu'on quitte l'app : on force une écriture synchrone avant.
  useEffect(() => {
    if (!dbLoaded) return;
    const flush = () => {
      persistPlayerSaveSync(latestSaveRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dbLoaded]);

  // Horloge virtuelle (permet d'avancer le temps pour tester le SRS)
  const currentTimestamp = useMemo(() => {
    return Date.now() + (saveState.virtualDaysOffset || 0) * DAY_MS;
  }, [saveState.virtualDaysOffset]);

  const brickById = useMemo(() => {
    const map: Record<string, Brick> = {};
    TIER1_BRICKS.forEach((b) => {
      map[b.id] = b;
    });
    return map;
  }, []);

  const findBrickByWord = useCallback((word: string): Brick | undefined => {
    const clean = word.replace(/[.,:!?;]/g, '').toLowerCase();
    return TIER1_BRICKS.find(
      (b) =>
        b.en.toLowerCase() === clean ||
        (b.variants && b.variants.some((v) => v.toLowerCase() === clean))
    );
  }, []);

  // Diagnostic global SRS (intégrité, briques fissurées, verrous de strates)
  const srsDiagnostics = useMemo(() => {
    const unlockedBricks = TIER1_BRICKS.filter((b) => saveState.srsStates[b.id]?.unlocked);
    const unlockedFormulas = TIER1_FORMULAS.filter((f) => saveState.srsStates[f.id]?.unlocked);

    const crackedItems: Array<{
      id: string;
      en?: string;
      name?: string;
      fr?: string;
      pos?: PartOfSpeech;
      retention: number;
      critical: boolean;
      material: MasteryMaterial;
      statusDesc: string;
    }> = [];

    let totalRetention = 0;
    let count = 0;

    unlockedBricks.forEach((b) => {
      const st = saveState.srsStates[b.id];
      const R = calculateRetention(st, currentTimestamp);
      totalRetention += R;
      count++;
      if (R < 0.85) {
        crackedItems.push({
          id: b.id,
          en: b.en,
          fr: b.fr,
          pos: b.pos,
          retention: R,
          critical: R < 0.65,
          material: st.material,
          statusDesc: getVisualStatusDescription(st.material, R)
        });
      }
    });

    unlockedFormulas.forEach((f) => {
      const st = saveState.srsStates[f.id];
      const R = calculateRetention(st, currentTimestamp);
      totalRetention += R;
      count++;
      if (R < 0.85) {
        crackedItems.push({
          id: f.id,
          name: f.name,
          pos: 'particle',
          retention: R,
          critical: R < 0.65,
          material: st.material,
          statusDesc: getVisualStatusDescription(st.material, R)
        });
      }
    });

    crackedItems.sort((a, b) => a.retention - b.retention);

    const avgIntegrity = count > 0 ? Math.round((totalRetention / count) * 100) : 100;
    const nextUncompletedNode = MAP_NODES.find(
      (n) => !saveState.completedNodeIds.includes(n.id)
    );

    const strate1ADone = MAP_NODES.filter((n) => n.subtierId === '1A').every((n) =>
      saveState.completedNodeIds.includes(n.id)
    );
    const strate1BDone = MAP_NODES.filter((n) => n.subtierId === '1B').every((n) =>
      saveState.completedNodeIds.includes(n.id)
    );
    const strate1CDone = MAP_NODES.filter((n) => n.subtierId === '1C').every((n) =>
      saveState.completedNodeIds.includes(n.id)
    );

    const nodeAccess = getNodeAccess(saveState.completedNodeIds);
    const strata = getStrataProgress(saveState.completedNodeIds);
    const bossLocks = getBossLocks(strata, crackedItems.length);
    const bossUnlocked = bossLocks.every((l) => l.ok);
    const objective = getObjective(saveState.completedNodeIds, strata, bossLocks, saveState.bossDefeated);

    return {
      nodeAccess,
      strata,
      bossLocks,
      bossUnlocked,
      objective,
      unlockedBricks,
      unlockedFormulas,
      crackedItems,
      avgIntegrity,
      nextUncompletedNode,
      strate1ADone,
      strate1BDone,
      strate1CDone,
      allNodesCompleted: strate1ADone && strate1BDone && strate1CDone
    };
  }, [saveState.srsStates, saveState.completedNodeIds, saveState.bossDefeated, currentTimestamp]);

  // Entrée du Gardien : seulement quand les 4 verrous sont levés (ou déjà vaincu / mode développeur)
  const openBoss = () => {
    if (!srsDiagnostics.bossUnlocked && !saveState.bossDefeated && !devMode) {
      sfx.playTorchExtinguish();
      const missing = srsDiagnostics.bossLocks
        .filter((l: BossLock) => !l.ok)
        .map((l: BossLock) => l.hint)
        .join(', ');
      notify(`La Porte du Gardien est scellée. Pour l'ouvrir : ${missing}.`);
      if (activeScreen !== 'map') setActiveScreen('map');
      return;
    }
    sfx.playSteleUnlock();
    setActiveScreen('boss');
  };

  // Fêtes : une strate terminée ou la Porte du Gardien qui s'ouvre (jamais au chargement ni après un import)
  const prevProgressRef = useRef<{ a: boolean; b: boolean; c: boolean; boss: boolean } | null>(null);
  useEffect(() => {
    if (!dbLoaded) return;
    const strata: StrataProgress[] = srsDiagnostics.strata;
    const cur = { a: strata[0].done, b: strata[1].done, c: strata[2].done, boss: srsDiagnostics.bossUnlocked as boolean };
    const prev = prevProgressRef.current;
    prevProgressRef.current = cur;
    if (!prev) return;
    if (suppressCelebrationRef.current) {
      suppressCelebrationRef.current = false;
      return;
    }
    const events: Celebration[] = [];
    const strataDone = [
      [cur.a && !prev.a, 0],
      [cur.b && !prev.b, 1],
      [cur.c && !prev.c, 2]
    ] as Array<[boolean, number]>;
    strataDone.forEach(([happened, i]) => {
      if (!happened) return;
      const done = strata[i];
      const next = strata[i + 1];
      if (next) {
        events.push({
          id: `strate-${done.id}-${Date.now()}`,
          emoji: '🔓',
          title: STRATA_META[done.id].clearedTitle,
          body: `Un sceau se brise. ${STRATA_META[next.id].name} s'ouvre devant toi : ${next.brickCount} nouvelles briques${next.hasFormula ? ' et une nouvelle formule' : ''} t'attendent.`,
          cta: 'map'
        });
      } else {
        events.push({
          id: `strate-${done.id}-${Date.now()}`,
          emoji: '🏛️',
          title: STRATA_META[done.id].clearedTitle,
          body: cur.boss
            ? 'Tu as traversé toute la tour et le dernier verrou est levé : la Porte du Gardien du Seuil est ouverte. Es-tu prêt à briser les 10 Sceaux ?'
            : "Tu as traversé toute la tour. Plus qu'un verrou : restaure tes briques fissurées pour ouvrir la Porte du Gardien du Seuil.",
          cta: cur.boss ? 'boss' : 'map'
        });
      }
    });
    if (cur.boss && !prev.boss && prev.c) {
      events.push({
        id: `boss-${Date.now()}`,
        emoji: '💀',
        title: 'Dernier verrou levé !',
        body: 'Tes briques sont intactes : la Porte du Gardien du Seuil est ouverte. Es-tu prêt à briser les 10 Sceaux ?',
        cta: 'boss'
      });
    }
    if (events.length > 0) setCelebrations((q) => [...q, ...events]);
  }, [dbLoaded, srsDiagnostics.strata, srsDiagnostics.bossUnlocked]);

  // La fête s'affiche quand on est de retour sur le Campement ou la Carte (pas au milieu d'un exercice)
  const currentCelebration =
    activeScreen === 'camp' || activeScreen === 'map' ? celebrations[0] : undefined;
  useEffect(() => {
    if (currentCelebration) sfx.playSteleUnlock();
  }, [currentCelebration?.id]);

  const applySRSUpdates = useCallback(
    (brickIds: string[] = [], formulaIds: string[] = [], isFirstTrySuccess = true) => {
      setSaveState((prev) => {
        const nextSrs = { ...prev.srsStates };
        [...brickIds, ...formulaIds].forEach((id) => {
          if (nextSrs[id]) {
            nextSrs[id] = updateSRSItem(nextSrs[id], isFirstTrySuccess, currentTimestamp);
          }
        });
        return { ...prev, srsStates: nextSrs };
      });
    },
    [currentTimestamp]
  );

  const startMapNode = (node: MapNode) => {
    if (srsDiagnostics.nodeAccess[node.id] === 'locked' && !devMode) {
      sfx.playTorchExtinguish();
      notify('Cette étape est encore scellée : termine la précédente pour la débloquer.');
      return;
    }
    sfx.playStoneClick(true);
    setActiveNode(node);
    if (node.type === 'gisement') {
      setActiveScreen('gisement');
    } else if (node.type === 'stele') {
      const formulaState = node.formulaId ? saveState.srsStates[node.formulaId] : undefined;
      if (formulaState?.unlocked && saveState.completedNodeIds.includes(node.id)) {
        const exercises = (node.exerciseIds || [])
          .map((id) => TIER1_EXERCISES.find((e) => e.id === id))
          .filter((e): e is Exercise => Boolean(e));
        setSessionTitle(node.title);
        setSessionQueue(exercises);
        setActiveScreen('exercise_session');
      } else {
        setActiveScreen('stele');
      }
    }
  };

  // Session courte 5 minutes : générateur FSRS prioritaire
  const startRestorationSession = () => {
    sfx.playStoneClick(true);
    const { selectedExercises } = getPriorityReviewQueue(
      saveState.srsStates,
      TIER1_EXERCISES,
      currentTimestamp
    );
    setActiveNode(null);
    setSessionTitle('Entretien du Campement : Restauration Prioritaire SRS');
    setSessionQueue(selectedExercises);
    setActiveScreen('exercise_session');
  };

  const simulateTimeJump = (days: number) => {
    sfx.playTorchExtinguish();
    setSaveState((prev) => ({
      ...prev,
      virtualDaysOffset: Number(((prev.virtualDaysOffset || 0) + days).toFixed(2))
    }));
  };

  const completeNextNodeForTesting = () => {
    const node = MAP_NODES.find((n) => !saveState.completedNodeIds.includes(n.id));
    if (!node) return;
    const now = currentTimestamp;
    setSaveState((prev) => {
      const nextSrs = { ...prev.srsStates };
      [...(node.brickIds || []), ...(node.formulaId ? [node.formulaId] : [])].forEach((id) => {
        const prevSt = nextSrs[id];
        if (!prevSt) return;
        const nextS = Math.max(1.0, prevSt.stability || 0.2);
        nextSrs[id] = {
          ...prevSt,
          unlocked: true,
          stability: nextS,
          material: computeMaterial(nextS),
          lastReviewedAt: now,
          nextReviewAt: computeNextReviewTimestamp(now, nextS),
          successCount: (prevSt.successCount || 0) + 1
        };
      });
      return { ...prev, completedNodeIds: [...prev.completedNodeIds, node.id], srsStates: nextSrs };
    });
  };

  const unlockAllForTesting = () => {
    suppressCelebrationRef.current = true;
    sfx.playSteleUnlock();
    const now = currentTimestamp;
    setSaveState((prev) => {
      const nextSrs = { ...prev.srsStates };
      Object.keys(nextSrs).forEach((id) => {
        const newS = Math.max(3.5, nextSrs[id].stability);
        nextSrs[id] = {
          ...nextSrs[id],
          unlocked: true,
          stability: newS,
          material: computeMaterial(newS),
          lastReviewedAt: now,
          nextReviewAt: computeNextReviewTimestamp(now, newS),
          successCount: Math.max(2, nextSrs[id].successCount)
        };
      });
      return {
        ...prev,
        unlockedSubtiers: ['1A', '1B', '1C'],
        completedNodeIds: MAP_NODES.map((n) => n.id),
        srsStates: nextSrs
      };
    });
  };

  const resetProgress = () => {
    const ok = window.confirm(
      'Réinitialiser le Codex ?\n\nToute ta progression sera définitivement effacée. Cette action est irréversible.'
    );
    if (!ok) return;
    markIntentionalOverwrite();
    suppressCelebrationRef.current = true;
    setCelebrations([]);
    sfx.playTorchExtinguish();
    const fresh = createInitialSaveState(Date.now());
    setSaveState(fresh);
    setActiveScreen('camp');
  };

  const toggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sfx.muted = next;
    if (next) sfx.stopBossDrone();
  };

  const isBossTheme = activeScreen === 'boss';

  return (
    <div
      className={`min-h-screen min-h-dvh w-full max-w-full overflow-x-clip flex flex-col font-sans selection:bg-amber-500/30 transition-colors duration-500 ${
        isBossTheme ? 'bg-[#050508] text-amber-50' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* BARRE SUPÉRIEURE DU CODEX */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
          isBossTheme
            ? 'bg-[#08080e]/95 border-amber-500/40 shadow-lg shadow-amber-950/25'
            : 'bg-stone-900/90 border-stone-800'
        }`}
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {activeScreen !== 'camp' && activeScreen !== 'map' && activeScreen !== 'grimoire' && activeScreen !== 'launcher' ? (
              <button
                onClick={() => {
                  sfx.playStoneClick();
                  sfx.stopBossDrone();
                  setActiveScreen('camp');
                }}
                className="p-1.5 px-2.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Campement</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  sfx.playStoneClick();
                  setActiveScreen('launcher');
                }}
                className="w-8 h-8 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 flex items-center justify-center text-amber-400 cursor-pointer"
                title="Retour à l'Écran Titre (Launcher)"
              >
                <Compass className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="font-serif font-bold tracking-wider text-sm sm:text-base text-amber-100 flex items-center gap-2">
                <span onClick={handleTitleTap} className="select-none">LE CODEX D'ALBION</span>
                <span className="hidden md:inline-block text-[11px] font-sans font-normal px-2 py-0.5 rounded bg-stone-800 text-amber-300 border border-amber-500/30">
                  Palier I : Le Seuil de Pierre
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sélecteur d'accent UK / US */}
            <button
              onClick={() => {
                const nextAccent = saveState.preferredAccent === 'uk' ? 'us' : 'uk';
                setSaveState((prev) => ({ ...prev, preferredAccent: nextAccent }));
                speakEnglish('The old stone', { accent: nextAccent });
              }}
              className="px-2 py-1 rounded-lg bg-stone-800/90 hover:bg-stone-700 border border-stone-700 text-xs font-medium flex items-center gap-1 text-stone-200 cursor-pointer"
              title="Basculer la voix de référence (Britannique / Américaine)"
            >
              <span>{saveState.preferredAccent === 'uk' ? '🇬🇧 UK' : '🇺🇸 US'}</span>
            </button>

            {/* Compteur de Briques */}
            <div className="px-2.5 py-1 rounded-lg bg-stone-800/90 border border-stone-700 text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-amber-100 whitespace-nowrap">
                {srsDiagnostics.unlockedBricks.length}/32
              </span>
            </div>

            {/* Jauge d'intégrité SRS */}
            <div
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 font-medium ${
                srsDiagnostics.crackedItems.length > 0
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}
              title="Intégrité globale du Codex (SRS)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{srsDiagnostics.avgIntegrity}%</span>
            </div>

            {/* Bouton Audio */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-stone-800/90 hover:bg-stone-700 border border-stone-700 text-stone-300 cursor-pointer"
              title={soundMuted ? 'Activer les effets sonores' : 'Couper les effets sonores'}
            >
              {soundMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENU CENTRAL */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-5 py-4 pb-24">
        {activeScreen === 'launcher' && (
          <LauncherScreen
            saveState={saveState}
            srsDiagnostics={srsDiagnostics}
            onEnterCamp={() => {
              sfx.playSteleUnlock();
              setActiveScreen('camp');
            }}
            onStartQuickLesson={() => {
              const node = srsDiagnostics.nextUncompletedNode || MAP_NODES[0];
              startMapNode(node);
            }}
            onUnlockAllAndPlay={() => {
              unlockAllForTesting();
              setActiveScreen('camp');
            }}
            onOpenBossDirect={openBoss}
            devMode={devMode}
          />
        )}

        {activeScreen === 'camp' && (
          <CampScreen
            saveState={saveState}
            srsDiagnostics={srsDiagnostics}
            onStartNode={startMapNode}
            onStartRestoration={startRestorationSession}
            onOpenFreeEngraving={() => {
              sfx.playStoneClick(true);
              setActiveScreen('free_engraving');
            }}
            onOpenBoss={openBoss}
            onSimulateTime={simulateTimeJump}
            onUnlockAll={unlockAllForTesting}
            onCompleteNext={completeNextNodeForTesting}
            onReset={resetProgress}
            onOpenDataModal={() => setShowDataModal(true)}
            devMode={devMode}
            lastExportAt={lastExportAt}
            onResetClock={resetVirtualClock}
            onDisableDev={disableDevMode}
          />
        )}

        {activeScreen === 'map' && (
          <MapScreen
            saveState={saveState}
            srsDiagnostics={srsDiagnostics}
            onStartNode={startMapNode}
            onOpenBoss={openBoss}
          />
        )}

        {activeScreen === 'grimoire' && (
          <GrimoireScreen saveState={saveState} currentTimestamp={currentTimestamp} />
        )}

        {activeScreen === 'gisement' && activeNode && (
          <GisementArena
            node={activeNode}
            bricks={(activeNode.brickIds || []).map((id) => brickById[id]).filter(Boolean)}
            accent={saveState.preferredAccent}
            onComplete={() => {
              sfx.playSteleUnlock();
              const now = currentTimestamp;
              setSaveState((prev) => {
                const nextSrs = { ...prev.srsStates };
                (activeNode.brickIds || []).forEach((id) => {
                  const prevSt = nextSrs[id];
                  const nextS = Math.max(1.0, prevSt?.stability || 0.2);
                  nextSrs[id] = {
                    ...prevSt,
                    unlocked: true,
                    stability: nextS,
                    material: computeMaterial(nextS),
                    lastReviewedAt: now,
                    nextReviewAt: computeNextReviewTimestamp(now, nextS),
                    successCount: (prevSt?.successCount || 0) + 1
                  };
                });
                const nextCompleted = prev.completedNodeIds.includes(activeNode.id)
                  ? prev.completedNodeIds
                  : [...prev.completedNodeIds, activeNode.id];
                return {
                  ...prev,
                  completedNodeIds: nextCompleted,
                  srsStates: nextSrs
                };
              });
              setActiveScreen('map');
            }}
          />
        )}

        {activeScreen === 'stele' && activeNode && (
          <SteleFormulaArena
            formula={TIER1_FORMULAS.find((f) => f.id === activeNode.formulaId)}
            accent={saveState.preferredAccent}
            findBrickByWord={findBrickByWord}
            onSteleDecoded={() => {
              sfx.playSteleUnlock();
              const now = currentTimestamp;
              const fId = activeNode.formulaId!;
              setSaveState((prev) => {
                const nextSrs = { ...prev.srsStates };
                nextSrs[fId] = {
                  ...nextSrs[fId],
                  unlocked: true,
                  stability: 2.5,
                  material: 'stone',
                  lastReviewedAt: now,
                  nextReviewAt: computeNextReviewTimestamp(now, 2.5),
                  successCount: 1
                };
                return { ...prev, srsStates: nextSrs };
              });
              const exercises = (activeNode.exerciseIds || [])
                .map((id) => TIER1_EXERCISES.find((e) => e.id === id))
                .filter((e): e is Exercise => Boolean(e));
              setSessionTitle(`Épreuve de Gravure : ${activeNode.title}`);
              setSessionQueue(exercises);
              setActiveScreen('exercise_session');
            }}
          />
        )}

        {activeScreen === 'exercise_session' && (
          <ExerciseSessionArena
            title={sessionTitle}
            initialExercises={sessionQueue}
            accent={saveState.preferredAccent}
            findBrickByWord={findBrickByWord}
            onExerciseResult={(ex, isFirstTry) => {
              applySRSUpdates(ex.requiredBrickIds, ex.requiredFormulaIds, isFirstTry);
            }}
            onSessionComplete={() => {
              sfx.playSteleUnlock();
              if (activeNode) {
                setSaveState((prev) => ({
                  ...prev,
                  completedNodeIds: prev.completedNodeIds.includes(activeNode.id)
                    ? prev.completedNodeIds
                    : [...prev.completedNodeIds, activeNode.id]
                }));
              }
              setActiveScreen('camp');
            }}
          />
        )}

        {activeScreen === 'free_engraving' && (
          <FreeEngravingArena
            unlockedBricks={srsDiagnostics.unlockedBricks}
            accent={saveState.preferredAccent}
            onMasteryEngraved={(brickId) => {
              sfx.playSteleUnlock();
              const now = currentTimestamp;
              setSaveState((prev) => {
                const nextSrs = { ...prev.srsStates };
                nextSrs[brickId] = {
                  ...nextSrs[brickId],
                  unlocked: true,
                  stability: Math.max(32, nextSrs[brickId].stability),
                  material: 'gold',
                  lastReviewedAt: now,
                  nextReviewAt: computeNextReviewTimestamp(now, 32),
                  freeEngravedMastery: true
                };
                return { ...prev, srsStates: nextSrs };
              });
            }}
            onExit={() => setActiveScreen('camp')}
          />
        )}

        {activeScreen === 'boss' && (
          <BossGuardianArena
            findBrickByWord={findBrickByWord}
            onSRSUpdate={applySRSUpdates}
            onBossVictory={() => {
              sfx.playSteleUnlock();
              setSaveState((prev) => ({
                ...prev,
                bossDefeated: true,
                bossDefeatedTiers: ['tier_1'],
                bossAttempts: (prev.bossAttempts || 0) + 1
              }));
            }}
            onBossDefeat={() => {
              setSaveState((prev) => ({
                ...prev,
                bossAttempts: (prev.bossAttempts || 0) + 1
              }));
            }}
            onExit={() => {
              sfx.stopBossDrone();
              setActiveScreen('camp');
            }}
          />
        )}
      </main>

      {/* BARRE DE NAVIGATION BASSE (Mobile-First, accessible au pouce) */}
      {(activeScreen === 'camp' || activeScreen === 'map' || activeScreen === 'grimoire') && (
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-stone-900/95 border-t border-stone-800 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 h-16 grid grid-cols-4 gap-2 items-center">
            <button
              onClick={() => {
                sfx.playStoneClick();
                setActiveScreen('camp');
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors cursor-pointer ${
                activeScreen === 'camp'
                  ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[11px] font-medium mt-0.5">Campement</span>
            </button>

            <button
              onClick={() => {
                sfx.playStoneClick();
                setActiveScreen('map');
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors cursor-pointer ${
                activeScreen === 'map'
                  ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <MapIcon className="w-5 h-5" />
              <span className="text-[11px] font-medium mt-0.5">Carte</span>
            </button>

            <button
              onClick={() => {
                sfx.playStoneClick();
                setActiveScreen('grimoire');
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors cursor-pointer ${
                activeScreen === 'grimoire'
                  ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[11px] font-medium mt-0.5">Grimoire</span>
              {srsDiagnostics.crackedItems.length > 0 && (
                <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={openBoss}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer border ${
                srsDiagnostics.bossUnlocked || saveState.bossDefeated
                  ? 'text-amber-200 bg-gradient-to-b from-amber-950/70 to-stone-950 border-amber-500/40 hover:border-amber-400'
                  : 'text-stone-500 bg-stone-950 border-stone-800'
              }`}
            >
              {srsDiagnostics.bossUnlocked || saveState.bossDefeated ? (
                <Skull className="w-5 h-5 text-amber-400" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              <span className="text-[11px] font-serif font-semibold mt-0.5">Gardien</span>
            </button>
          </div>
        </nav>
      )}

      {/* MESSAGE ÉPHÉMÈRE (étape ou Porte verrouillée) */}
      {notice && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 pointer-events-none">
          <div className="max-w-md rounded-xl bg-stone-900 border border-amber-500/60 text-amber-100 text-xs px-4 py-3 shadow-xl flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* CÉLÉBRATION : STRATE FRANCHIE / PORTE DU GARDIEN OUVERTE */}
      {currentCelebration && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-[#08080e] border-2 border-amber-400/70 p-6 text-center space-y-4 shadow-2xl animate-rune-glow">
            <div className="text-5xl">{currentCelebration.emoji}</div>
            <h3 className="font-serif font-extrabold text-xl text-amber-100">{currentCelebration.title}</h3>
            <p className="text-sm text-stone-300 leading-relaxed">{currentCelebration.body}</p>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const cta = currentCelebration.cta;
                  setCelebrations((q) => q.slice(1));
                  if (cta === 'boss') openBoss();
                  else setActiveScreen('map');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-serif font-bold text-sm cursor-pointer"
              >
                {currentCelebration.cta === 'boss' ? 'Affronter le Gardien' : "Continuer l'aventure"}
              </button>
              {currentCelebration.cta === 'boss' && (
                <button
                  onClick={() => setCelebrations((q) => q.slice(1))}
                  className="w-full py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  Plus tard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SAUVEGARDE : EXPORT / IMPORT PAR FICHIER */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-serif font-bold text-lg text-amber-200">Sauvegarder / Restaurer</h3>
              <button
                onClick={closeDataModal}
                className="text-stone-400 hover:text-white text-sm cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Ta progression est enregistrée dans ce navigateur. Pour la garder en sécurité ou la
              passer d'un appareil à l'autre, télécharge un fichier de sauvegarde puis importe-le
              ailleurs.
            </p>

            {/* Exporter */}
            <div className="rounded-xl bg-stone-950 border border-stone-800 p-3 space-y-2">
              <div className="text-xs uppercase tracking-wider text-stone-400">Exporter</div>
              <div className="text-xs text-stone-300">
                {(() => {
                  const s = summarizeSave(saveState);
                  return `${s.unlockedItems} éléments débloqués · ${s.completedNodes} étapes terminées`;
                })()}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportFile}
                  className="flex-1 min-w-[9rem] py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger le fichier</span>
                </button>
                <button
                  onClick={handleCopyCode}
                  className="flex-1 min-w-[9rem] py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-medium text-xs cursor-pointer"
                >
                  Copier le code
                </button>
              </div>
              <div className="text-[11px] text-stone-400">
                {lastExportAt
                  ? `Dernier export : ${new Date(lastExportAt).toLocaleString('fr-FR')}`
                  : 'Tu n\'as encore jamais exporté de sauvegarde.'}
              </div>
            </div>

            {/* Importer */}
            <div className="rounded-xl bg-stone-950 border border-stone-800 p-3 space-y-2">
              <div className="text-xs uppercase tracking-wider text-stone-400">Importer</div>
              <label className="block w-full py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-medium text-xs text-center cursor-pointer">
                Choisir un fichier de sauvegarde
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    handleImportFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="text-[11px] text-stone-400">ou colle le code copié :</div>
              <textarea
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  if (e.target.value.trim()) previewImport(e.target.value);
                  else {
                    setImportPreview(null);
                    setImportError('');
                  }
                }}
                placeholder="Colle ici ton code de sauvegarde..."
                className="w-full h-16 bg-stone-900 border border-stone-800 rounded-lg p-2 text-[11px] font-mono text-stone-200"
              />
              {importError && (
                <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-lg p-2">
                  {importError}
                </div>
              )}
              {importPreview && (
                <div className="text-xs text-emerald-200 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2 space-y-2">
                  <div>
                    Sauvegarde valide : {importPreview.summary.unlockedItems} éléments débloqués ·{' '}
                    {importPreview.summary.completedNodes} étapes terminées
                    {importPreview.summary.savedAt
                      ? ` · enregistrée le ${new Date(importPreview.summary.savedAt).toLocaleString('fr-FR')}`
                      : ''}
                    .
                  </div>
                  <button
                    onClick={confirmImport}
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer"
                  >
                    Remplacer ma progression par cette sauvegarde
                  </button>
                </div>
              )}
            </div>

            {dataNotice && (
              <div className="text-xs text-amber-200 bg-amber-950/40 border border-amber-800/50 rounded-lg p-2">
                {dataNotice}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ÉCRAN 0 : LAUNCHER DU CODEX D'ALBION (ÉCRAN TITRE IMMÉDIAT)
// ============================================================================
function LauncherScreen({
  saveState,
  srsDiagnostics,
  onEnterCamp,
  onStartQuickLesson,
  onUnlockAllAndPlay,
  onOpenBossDirect,
  devMode
}: {
  saveState: PlayerSaveState;
  srsDiagnostics: any;
  onEnterCamp: () => void;
  onStartQuickLesson: () => void;
  onUnlockAllAndPlay: () => void;
  onOpenBossDirect: () => void;
  devMode: boolean;
}) {
  const hasProgress = srsDiagnostics.unlockedBricks.length > 0;

  return (
    <div className="min-h-[78vh] flex flex-col items-center justify-center py-6">
      <div className="w-full max-w-xl rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-[#08080e] border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Emblème Runique */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20 animate-rune-glow">
          <Compass className="w-11 h-11" />
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.25em] text-amber-400 font-bold">
            Launcher Officiel • Prototype Jouable Complet
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-wide text-amber-50">
            LE CODEX D'ALBION
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/80 font-serif">
            Palier I : Le Seuil de Pierre — Briques, Formules Inductives & Gardien Audio
          </p>
        </div>

        {/* Résumé de la sauvegarde détectée */}
        <div className="grid grid-cols-3 gap-2.5 bg-stone-950/90 border border-stone-800 rounded-2xl p-3.5 text-left">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400">Briques</div>
            <div className="text-base sm:text-lg font-serif font-bold text-sky-300">
              {srsDiagnostics.unlockedBricks.length} / 32
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400">Formules</div>
            <div className="text-base sm:text-lg font-serif font-bold text-emerald-300">
              {srsDiagnostics.unlockedFormulas.length} / 3
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400">Intégrité SRS</div>
            <div className="text-base sm:text-lg font-serif font-bold text-amber-300">
              {srsDiagnostics.avgIntegrity}%
            </div>
          </div>
        </div>

        {/* GROS BOUTON PRINCIPAL DE LANCEMENT */}
        <div className="space-y-3 pt-1">
          <button
            onClick={onEnterCamp}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-serif font-extrabold text-base sm:text-lg shadow-xl shadow-amber-950/60 flex items-center justify-center gap-3 transition-transform active:scale-98 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>
              {hasProgress ? 'CONTINUER MA PARTIE (CAMPEMENT)' : "DÉMARRER L'AVENTURE"}
            </span>
          </button>

          <button
            onClick={onStartQuickLesson}
            className="w-full py-3 px-4 rounded-xl bg-stone-800/90 hover:bg-stone-700 border border-amber-500/30 text-amber-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Lancer directement la prochaine leçon (3 min)</span>
          </button>
        </div>

        {/* Raccourcis de Test Rapide & Test Audio */}
        <div className="pt-4 border-t border-stone-800/90 space-y-2.5">
          <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
            Accès Rapides & Vérification Audio
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {devMode && (
              <button
                onClick={onUnlockAllAndPlay}
                className="py-2.5 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Mode Test : Tout Débloquer</span>
              </button>
            )}
            <button
              onClick={onOpenBossDirect}
              className="py-2.5 px-3 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {srsDiagnostics.bossUnlocked || saveState.bossDefeated ? (
                <Skull className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>
                {srsDiagnostics.bossUnlocked || saveState.bossDefeated
                  ? 'Affronter le Boss Audio'
                  : 'Gardien du Seuil (scellé)'}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => speakEnglish('Welcome to the Codex of Albion.', { accent: 'uk' })}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] text-stone-300 flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Tester Voix 🇬🇧 UK</span>
            </button>
            <button
              onClick={() => speakEnglish('The old guard keeps the key.', { accent: 'us' })}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] text-stone-300 flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Tester Voix 🇺🇸 US</span>
            </button>
            <button
              onClick={() => speakEnglish('I am the Guardian of the Threshold.', { accent: 'boss' })}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] text-stone-300 flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Tester Voix 💀 Boss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ÉCRAN 1 : LE CAMPEMENT (ACCUEIL, DIAGNOSTIC D'ÉROSION SRS & CTA DYNAMIQUE)
// ============================================================================
function CampScreen({
  saveState,
  srsDiagnostics,
  onStartNode,
  onStartRestoration,
  onOpenFreeEngraving,
  onOpenBoss,
  onSimulateTime,
  onUnlockAll,
  onCompleteNext,
  onReset,
  onOpenDataModal,
  devMode,
  lastExportAt,
  onResetClock,
  onDisableDev
}: {
  saveState: PlayerSaveState;
  srsDiagnostics: any;
  onStartNode: (node: MapNode) => void;
  onStartRestoration: () => void;
  onOpenFreeEngraving: () => void;
  onOpenBoss: () => void;
  onSimulateTime: (days: number) => void;
  onUnlockAll: () => void;
  onCompleteNext: () => void;
  onReset: () => void;
  onOpenDataModal: () => void;
  devMode: boolean;
  lastExportAt: number | null;
  onResetClock: () => void;
  onDisableDev: () => void;
}) {
  const hasProgressToSave = Object.values(saveState.srsStates).some((st) => st.unlocked);
  const exportStale = !lastExportAt || Date.now() - lastExportAt > 7 * DAY_MS;
  const { unlockedBricks, unlockedFormulas, crackedItems, nextUncompletedNode } = srsDiagnostics;

  return (
    <div className="space-y-5">
      {/* Bannière narrative de l'Éclaireur */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/30 border border-amber-500/30 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Carnet de l'Éclaireur • Palier I</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-50">
              Le Seuil de Pierre
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed max-w-xl">
              Explore la tour-bibliothèque oubliée. Récolte les{' '}
              <strong className="text-amber-200">32 Briques</strong>, déduis par l'observation les{' '}
              <strong className="text-amber-200">3 Formules</strong> des Anciens, protège tes pierres de l'érosion du temps et brise les 10 Sceaux du{' '}
              <strong className="text-amber-300">Gardien Audio</strong>.
            </p>
          </div>

          {saveState.bossDefeated && (
            <div className="shrink-0 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-400 flex items-center gap-3 animate-rune-glow">
              <Award className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-xs uppercase tracking-wider text-amber-300 font-bold">
                  Porte du Seuil Ouverte
                </div>
                <div className="text-xs text-stone-300">Gardien Audio vaincu</div>
              </div>
            </div>
          )}
        </div>

        {/* Compteurs des 3 Piliers */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-stone-800/80">
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
            <div className="text-[10px] sm:text-[11px] text-stone-400 uppercase tracking-wide">1. Vocabulaire</div>
            <div className="text-lg sm:text-xl font-serif font-bold text-sky-300 mt-0.5">
              {unlockedBricks.length}{' '}
              <span className="text-xs font-sans text-stone-500">/ 32 Briques</span>
            </div>
          </div>
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
            <div className="text-[10px] sm:text-[11px] text-stone-400 uppercase tracking-wide">2. Logique</div>
            <div className="text-lg sm:text-xl font-serif font-bold text-emerald-300 mt-0.5">
              {unlockedFormulas.length}{' '}
              <span className="text-xs font-sans text-stone-500">/ 3 Formules</span>
            </div>
          </div>
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
            <div className="text-[10px] sm:text-[11px] text-stone-400 uppercase tracking-wide">3. Boss Audio</div>
            <div className="text-lg sm:text-xl font-serif font-bold text-amber-300 mt-0.5">
              {saveState.bossDefeated ? 'Vaincu' : 'Scellé'}
            </div>
          </div>
        </div>
      </div>

      <AdventurePath srsDiagnostics={srsDiagnostics} bossDefeated={saveState.bossDefeated} />

      {/* BOUTON D'ACTION DYNAMIQUE (BOUCLE DE SESSION COURTE 5 MINUTES) */}
      <div className="rounded-2xl bg-stone-900 border-2 border-amber-500/40 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            L'Entretien du Campement (Session de 5 minutes)
          </span>
          {saveState.virtualDaysOffset > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
              Horloge SRS : +{saveState.virtualDaysOffset}j
            </span>
          )}
        </div>

        {crackedItems.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-100">
                  {crackedItems.length} élément{crackedItems.length > 1 ? 's' : ''} fissuré
                  {crackedItems.length > 1 ? 's' : ''} ou envahi{crackedItems.length > 1 ? 's' : ''} de mousse !
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
                  L'algorithme FSRS (R(t) = 0,9<sup>t/S</sup>) indique que ces acquis s'érodent (R &lt; 85 %). Une courte séance de restauration va consolider leur stabilité.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {crackedItems.slice(0, 8).map((item: any) => (
                <BrickChip
                  key={item.id}
                  text={item.en || item.name}
                  pos={item.pos || 'particle'}
                  subLabel={`${Math.round(item.retention * 100)}% • ${item.statusDesc}`}
                  cracked={true}
                  critical={item.critical}
                  size="sm"
                  onClick={() => {
                    if (item.en) speakEnglish(item.en, { accent: saveState.preferredAccent });
                  }}
                />
              ))}
            </div>

            <button
              onClick={onStartRestoration}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Hammer className="w-5 h-5" />
              <span>Restaurer {crackedItems.length} briques fissurées (2 min)</span>
            </button>
          </div>
        ) : nextUncompletedNode ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-300 shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-sky-400 font-semibold uppercase">
                  Expédition en cours • {STRATA_META[nextUncompletedNode.subtierId as StrataId].name}
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-100">
                  {nextUncompletedNode.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                  {nextUncompletedNode.subtitle}
                </p>
              </div>
            </div>

            <button
              onClick={() => onStartNode(nextUncompletedNode)}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                Poursuivre l'expédition : {STRATA_META[nextUncompletedNode.subtierId as StrataId].short} (3 min)
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 shrink-0">
                <Skull className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-100">
                  Tu as traversé toute la tour et aucune brique n'est fissurée !
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
                  Les 4 verrous du Seuil sont levés. Tu peux affronter la Statue Parlante dans l'Antre du Gardien.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBoss}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-stone-950 font-serif font-bold text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Skull className="w-5 h-5" />
              <span>Affronter le Gardien du Seuil</span>
            </button>
          </div>
        )}

        {/* Accès au mode optionnel « Gravure libre » (clavier) pour hisser une brique au rang Or Runique */}
        {unlockedBricks.length > 0 && (
          <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-stone-400">
              <strong className="text-amber-300">Épreuve optionnelle :</strong> Grave une brique au clavier sans aide pour la hisser au rang d'Or Runique (✨).
            </div>
            <button
              onClick={onOpenFreeEngraving}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Gravure Libre (Clavier)</span>
            </button>
          </div>
        )}
      </div>

      {/* LÉGENDE DU CODE COULEUR GRAMMATICAL ET DES MATÉRIAUX SRS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            Code Couleur Grammatical des Briques
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-sky-950/70 border border-sky-500/50 text-sky-100">
              <div className="font-bold">Bleu Ardoise</div>
              <div className="text-[11px] opacity-80">Noms & Pronoms (door, it)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-100">
              <div className="font-bold">Rouge Brique</div>
              <div className="text-[11px] opacity-80">Verbes (is, sees, has)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-100">
              <div className="font-bold">Vert Mousse</div>
              <div className="text-[11px] opacity-80">Adjectifs (old, cold, afraid)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/70 border border-amber-500/50 text-amber-100">
              <div className="font-bold">Ambre / Or</div>
              <div className="text-[11px] opacity-80">Déterminants & Outils (the, not)</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-amber-400" />
            Les 4 Matériaux & États d'Érosion SRS
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['clay', 'stone', 'marble', 'gold'] as MasteryMaterial[]).map((matKey) => {
              const m = MATERIAL_META[matKey];
              return (
                <div
                  key={matKey}
                  className="p-2 rounded-lg bg-stone-950 border border-stone-800 flex items-center gap-2"
                >
                  <span className="text-base">{m.icon}</span>
                  <div>
                    <div className="font-semibold text-stone-100">{m.name}</div>
                    <div className="text-[10px] text-stone-400">{m.thresholdLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MES DONNÉES : SAUVEGARDE ET RÉINITIALISATION */}
      <div
        className={`rounded-2xl border p-4 space-y-3 ${
          hasProgressToSave && exportStale
            ? 'bg-amber-950/30 border-amber-500/50'
            : 'bg-stone-900/70 border-stone-800'
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <Download className="w-4 h-4" />
          <span>Mes données</span>
        </div>
        <p className="text-xs text-stone-300">
          {hasProgressToSave && exportStale
            ? lastExportAt
              ? "Ta dernière sauvegarde a plus d'une semaine. Télécharge-en une nouvelle pour ne rien perdre."
              : "Tu n'as pas encore sauvegardé ta progression dans un fichier. Fais-le maintenant : si ton navigateur efface ses données, tu pourras tout restaurer."
            : 'Ta progression est enregistrée dans ce navigateur. Un fichier de sauvegarde te permet de la restaurer ou de la passer sur un autre appareil.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpenDataModal}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 border border-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sauvegarder / Restaurer</span>
          </button>
          {saveState.virtualDaysOffset > 0 && (
            <button
              onClick={onResetClock}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium cursor-pointer"
            >
              Remettre l'horloge à l'heure (+{saveState.virtualDaysOffset}j)
            </button>
          )}
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/50 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* LABORATOIRE DE TEST (MODE DÉVELOPPEUR UNIQUEMENT) */}
      {devMode && (
        <div className="rounded-2xl bg-stone-900/70 border border-dashed border-stone-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              <span>Mode développeur : Simulation Temporelle FSRS</span>
            </div>
            <button
              onClick={onDisableDev}
              className="text-[11px] text-stone-400 hover:text-white underline cursor-pointer"
            >
              Désactiver
            </button>
          </div>
          <p className="text-xs text-stone-400">
            Simule le passage des jours pour observer la fissuration progressive des briques (R(t) = 0,9<sup>t/S</sup>), débloque tout le Palier I en un clic ou teste directement le Boss Audio. Ces actions modifient ta progression réelle.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onUnlockAll}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Tout débloquer (32 Briques & 3 Formules)</span>
            </button>

            <button
              onClick={onCompleteNext}
              className="px-3 py-1.5 rounded-lg bg-sky-950/90 hover:bg-sky-900 text-sky-200 border border-sky-500/50 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terminer la prochaine étape</span>
            </button>

            <button
              onClick={() => onSimulateTime(1)}
              className="px-3 py-1.5 rounded-lg bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-500/50 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>+24h (1 jour)</span>
            </button>

            <button
              onClick={() => onSimulateTime(4)}
              className="px-3 py-1.5 rounded-lg bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-500/50 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>+4 jours (Éroder les briques)</span>
            </button>

            <button
              onClick={onOpenBoss}
              className="px-3 py-1.5 rounded-lg bg-purple-950/90 hover:bg-purple-900 text-purple-200 border border-purple-500/50 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Lancer le Boss Audio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CHEMIN DE L'AVENTURE (3 STRATES + GARDIEN) : progression, verrous et prochaine récompense
// ============================================================================
function AdventurePath({
  srsDiagnostics,
  bossDefeated
}: {
  srsDiagnostics: any;
  bossDefeated: boolean;
}) {
  const strata: StrataProgress[] = srsDiagnostics.strata;
  const objective: Objective = srsDiagnostics.objective;
  const bossUnlocked: boolean = srsDiagnostics.bossUnlocked;

  const steps: Array<{ key: string; label: string; state: 'done' | 'current' | 'locked'; sub: string; boss?: boolean }> = [
    ...strata.map((s) => ({
      key: s.id,
      label: STRATA_META[s.id].short,
      state: s.state as 'done' | 'current' | 'locked',
      sub: s.state === 'locked' ? 'À découvrir' : s.done ? 'Terminée' : `${s.doneCount}/${s.total}`
    })),
    {
      key: 'boss',
      label: 'Gardien',
      state: bossDefeated ? 'done' : bossUnlocked ? 'current' : 'locked',
      sub: bossDefeated ? 'Vaincu' : bossUnlocked ? 'Ouvert !' : 'Scellé',
      boss: true
    }
  ];

  return (
    <div className="rounded-2xl bg-stone-900/90 border border-amber-500/30 p-4 space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <Compass className="w-4 h-4" />
          <span>Chemin de l'aventure</span>
        </div>
        <span className="text-xs font-semibold text-amber-200">{objective.percent} %</span>
      </div>

      <div className="h-2 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-700"
          style={{ width: `${objective.percent}%` }}
        />
      </div>

      <div className="flex items-start">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center text-center w-[4.75rem] shrink-0">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                  s.state === 'done'
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : s.state === 'current'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-rune-glow'
                    : 'bg-stone-950 border-stone-700 text-stone-500'
                }`}
              >
                {s.state === 'done' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : s.state === 'locked' ? (
                  <Lock className="w-4 h-4" />
                ) : s.boss ? (
                  <Skull className="w-5 h-5" />
                ) : (
                  <span className="font-serif font-bold text-sm">
                    {STRATA_META[s.key as StrataId]?.numeral ?? s.key}
                  </span>
                )}
              </div>
              <div className={`text-[11px] font-semibold mt-1 ${s.state === 'locked' ? 'text-stone-500' : 'text-stone-200'}`}>
                {s.label}
              </div>
              <div className="text-[10px] text-stone-400">{s.sub}</div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-5 rounded ${
                  steps[i].state === 'done' ? 'bg-emerald-500/60' : 'bg-stone-800'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="rounded-xl bg-stone-950/80 border border-stone-800 p-3">
        <div className="text-sm font-serif font-bold text-amber-100">{objective.headline}</div>
        <div className="text-xs text-stone-300 mt-0.5">{objective.detail}</div>
      </div>
    </div>
  );
}

// ============================================================================
// ÉCRAN 2 : LA CARTE DU PALIER (3 STRATES + ARCHES DES 4 VERROUS DU GARDIEN)
// ============================================================================
function MapScreen({
  saveState,
  srsDiagnostics,
  onStartNode,
  onOpenBoss
}: {
  saveState: PlayerSaveState;
  srsDiagnostics: any;
  onStartNode: (node: MapNode) => void;
  onOpenBoss: () => void;
}) {
  const strata: StrataProgress[] = srsDiagnostics.strata;
  const nodeAccess: Record<string, NodeAccess> = srsDiagnostics.nodeAccess;
  const bossLocks: BossLock[] = srsDiagnostics.bossLocks;
  const bossUnlocked: boolean = srsDiagnostics.bossUnlocked;
  const missingLocks = bossLocks.filter((l) => !l.ok);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-amber-100">
          Carte Verticale du Palier I : Le Seuil de Pierre
        </h2>
        <p className="text-xs sm:text-sm text-stone-400">
          Chaque étape ouvre la suivante : traverse les trois lieux de la tour, du Parvis aux Cryptes, puis affronte le Gardien du Seuil.
        </p>
      </div>

      <AdventurePath srsDiagnostics={srsDiagnostics} bossDefeated={saveState.bossDefeated} />

      {strata.map((sp, sIdx) => {
        const previous = sIdx > 0 ? strata[sIdx - 1] : null;
        const meta = STRATA_META[sp.id];
        const sealed = sp.state === 'locked';

        return (
          <div
            key={sp.id}
            className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition-colors ${
              sealed
                ? 'bg-stone-950/70 border-stone-800/80'
                : sp.state === 'current'
                ? 'bg-stone-900/90 border-amber-500/40'
                : 'bg-stone-900/90 border-emerald-500/30'
            }`}
          >
            <div className="border-b border-stone-800 pb-3 flex items-start justify-between gap-3">
              <div>
                <h3
                  className={`font-serif font-bold text-base sm:text-lg flex items-center gap-2 ${
                    sealed ? 'text-stone-500' : 'text-amber-200'
                  }`}
                >
                  {sealed && <Lock className="w-4 h-4 shrink-0" />}
                  <span>{meta.name}</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {sealed
                    ? `La porte est scellée. Traverse ${previous ? STRATA_META[previous.id].the : 'le lieu précédent'} pour l'ouvrir : ${sp.brickCount} nouvelles briques${
                        sp.hasFormula ? ' et 1 formule' : ''
                      } t'y attendent.`
                    : `${sp.brickCount} briques${sp.hasFormula ? ' et 1 formule' : ''} • ${sp.doneCount}/${sp.total} étapes terminées`}
                </p>
              </div>
              {sp.done && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 shrink-0">
                  Terminée
                </span>
              )}
            </div>

            <div className="space-y-3">
              {sp.nodes.map((node) => {
                const access = nodeAccess[node.id];
                const isCompleted = access === 'completed';
                const isLocked = access === 'locked';
                const isNext = access === 'available';
                const isStele = node.type === 'stele';

                return (
                  <div
                    key={node.id}
                    className={`rounded-xl p-3.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLocked
                        ? 'bg-stone-950/60 border-stone-800/70 opacity-70'
                        : isCompleted
                        ? 'bg-stone-950/80 border-emerald-500/40'
                        : isNext
                        ? 'bg-gradient-to-r from-stone-950 to-amber-950/30 border-amber-400/70 shadow-lg shadow-amber-950/30'
                        : 'bg-stone-950 border-stone-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border font-serif font-bold ${
                          isLocked
                            ? 'bg-stone-900 border-stone-700 text-stone-500'
                            : isCompleted
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : isStele
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                            : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isStele ? (
                          <span className="text-lg">⬢</span>
                        ) : (
                          <span className="text-lg">◇</span>
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
                          {isStele ? '⬢ Stèle' : '◇ Gisement'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-serif font-bold text-sm sm:text-base ${
                              isLocked ? 'text-stone-500' : 'text-stone-100'
                            }`}
                          >
                            {isLocked && sealed ? '? ? ?' : node.title}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                              Maîtrisé
                            </span>
                          )}
                          {isNext && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold">
                              Prochaine étape
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {isLocked
                            ? sealed
                              ? 'Contenu caché jusqu’à la levée du sceau.'
                              : 'Termine l’étape précédente pour la révéler.'
                            : node.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartNode(node)}
                      disabled={isLocked}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                        isLocked
                          ? 'bg-stone-900 text-stone-500 border border-stone-800 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 cursor-pointer'
                          : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md cursor-pointer'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Verrouillé</span>
                        </>
                      ) : (
                        <>
                          <span>{isCompleted ? 'Réviser' : 'Explorer'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* NŒUD PORTE DU GARDIEN (ARCHE AUX 4 VERROUS) */}
      <div
        className={`rounded-2xl border-2 p-5 shadow-2xl space-y-4 bg-gradient-to-br from-[#08080f] via-stone-950 to-amber-950/40 ${
          bossUnlocked ? 'border-amber-400' : 'border-stone-700/80'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                bossUnlocked
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-rune-glow'
                  : 'bg-stone-900 border-stone-700 text-stone-500'
              }`}
            >
              {bossUnlocked ? <Skull className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                {bossUnlocked ? 'Arche Ouverte' : 'Arche Scellée'} • Boss de Compréhension Audio
              </div>
              <h3 className="text-xl font-serif font-bold text-amber-50">
                La Porte du Gardien du Seuil
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 mt-1">
                10 Phrases Audio (Acte I : Transcription piégée EN • Acte II : Sens pur FR) • 3 Torches de vie • Briques 100 % muettes.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenBoss}
            className={`px-5 py-3 rounded-xl font-serif font-bold text-sm shrink-0 shadow-lg ${
              bossUnlocked
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 cursor-pointer'
                : 'bg-stone-900 text-stone-400 border border-stone-700 cursor-pointer'
            }`}
          >
            {bossUnlocked ? 'Affronter le Gardien' : 'Voir les verrous'}
          </button>
        </div>

        {/* Les 4 Verrous de la Porte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-800/80">
          {bossLocks.map((l, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                l.ok
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-stone-900/90 border-stone-800 text-stone-400'
              }`}
            >
              {l.ok ? (
                <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500/70 shrink-0" />
              )}
              <span className="font-medium truncate">{l.label}</span>
            </div>
          ))}
        </div>
        {!bossUnlocked && missingLocks.length > 0 && (
          <p className="text-xs text-stone-400">
            Pour ouvrir la Porte : {missingLocks.map((m) => m.hint).join(', ')}.
          </p>
        )}
      </div>

      {/* PALIERS SUIVANTS : APERÇU VERROUILLÉ */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Au-delà du Seuil</div>
        {['II', 'III'].map((n) => (
          <div
            key={n}
            className="rounded-xl bg-stone-950/60 border border-dashed border-stone-800 p-3.5 flex items-center gap-3 opacity-70"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-700 text-stone-500 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-stone-400">Palier {n} : ???</div>
              <div className="text-xs text-stone-500">
                {saveState.bossDefeated && n === 'II'
                  ? 'Le Seuil est franchi. Ce territoire est encore en cours d’exploration (bientôt disponible).'
                  : 'Se déverrouille après avoir vaincu le Gardien du Seuil.'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ÉCRAN 3 : LE GRIMOIRE (COLLECTION DES 32 BRIQUES & 3 FORMULES)
// ============================================================================
function GrimoireScreen({
  saveState,
  currentTimestamp
}: {
  saveState: PlayerSaveState;
  currentTimestamp: number;
}) {
  const [tab, setTab] = useState<'bricks' | 'formulas'>('bricks');
  const [selectedBrick, setSelectedBrick] = useState<Brick>(TIER1_BRICKS[0]);
  const [filterSubtier, setFilterSubtier] = useState<'ALL' | '1A' | '1B' | '1C'>('ALL');

  const filteredBricks = useMemo(() => {
    if (filterSubtier === 'ALL') return TIER1_BRICKS;
    return TIER1_BRICKS.filter((b) => b.subtierId === filterSubtier);
  }, [filterSubtier]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-100">
            Le Grimoire de l'Éclaireur
          </h2>
          <p className="text-xs text-stone-400">
            Inspecte tes 32 Briques (prononciation UK/US, faux-amis, état d'usure SRS) et tes 3 Formules.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-stone-900 p-1 border border-stone-800">
          <button
            onClick={() => setTab('bricks')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === 'bricks'
                ? 'bg-amber-500 text-stone-950'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            32 Briques
          </button>
          <button
            onClick={() => setTab('formulas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === 'formulas'
                ? 'bg-amber-500 text-stone-950'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            3 Formules
          </button>
        </div>
      </div>

      {tab === 'bricks' ? (
        <div className="space-y-5">
          {selectedBrick && saveState.srsStates[selectedBrick.id]?.unlocked && (
            <div className="rounded-2xl bg-stone-900 border-2 border-amber-500/40 p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BrickChip
                    text={selectedBrick.en}
                    pos={selectedBrick.pos}
                    size="lg"
                    onClick={() =>
                      speakEnglish(selectedBrick.en, {
                        accent: saveState.preferredAccent,
                        audioUrl:
                          saveState.preferredAccent === 'uk'
                            ? selectedBrick.audioUkUrl
                            : selectedBrick.audioUsUrl
                      })
                    }
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-amber-100">
                        « {selectedBrick.fr} »
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-amber-300">
                        {selectedBrick.ipa}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {STRATA_META[selectedBrick.subtierId as StrataId].short} • Catégorie :{' '}
                      <span className="text-stone-200 font-medium">
                        {POS_STYLES[selectedBrick.pos]?.label}
                      </span>
                      {selectedBrick.variants && selectedBrick.variants.length > 0 && (
                        <span> • Formes plateau : {selectedBrick.variants.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Écoute multi-accents UK / US / Lent */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      speakEnglish(selectedBrick.en, {
                        accent: 'uk',
                        audioUrl: selectedBrick.audioUkUrl
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-semibold text-stone-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>🇬🇧 UK (Sonia)</span>
                  </button>
                  <button
                    onClick={() =>
                      speakEnglish(selectedBrick.en, {
                        accent: 'us',
                        audioUrl: selectedBrick.audioUsUrl
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-semibold text-stone-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>🇺🇸 US (Guy)</span>
                  </button>
                  <button
                    onClick={() =>
                      speakEnglish(selectedBrick.en, {
                        accent: saveState.preferredAccent,
                        slow: true
                      })
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs text-stone-300 cursor-pointer"
                    title="Écoute lente (0.75x)"
                  >
                    🐢 0.75x
                  </button>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-stone-200 bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                <strong className="text-amber-300">Astuce mnémotechnique : </strong>
                {selectedBrick.mnemonicNote}
              </div>

              {selectedBrick.falseFriendTrap && (
                <div className="text-xs sm:text-sm text-rose-200 bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-300">Piège & Faux-ami : </strong>
                    {selectedBrick.falseFriendTrap}
                  </div>
                </div>
              )}

              {(() => {
                const st = saveState.srsStates[selectedBrick.id];
                const R = calculateRetention(st, currentTimestamp);
                const rPercent = Math.round(R * 100);
                const mat = MATERIAL_META[st?.material || 'clay'];
                const visualDesc = getVisualStatusDescription(st?.material || 'clay', R);

                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800 text-xs text-stone-400">
                    <div className="flex items-center gap-2">
                      <span>Matériau :</span>
                      <span className={`px-2 py-0.5 rounded border font-semibold ${mat.badgeClass}`}>
                        {mat.icon} {mat.name} ({visualDesc})
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>
                        Stabilité (S) :{' '}
                        <strong className="text-stone-200">{st?.stability || 0.2} j</strong>
                      </span>
                      <span>
                        Difficulté (D) :{' '}
                        <strong className="text-stone-200">{st?.difficulty || 5.0}/10</strong>
                      </span>
                      <span>
                        Rétention R(t) :{' '}
                        <strong className={rPercent < 85 ? 'text-amber-400' : 'text-emerald-400'}>
                          {st?.unlocked ? `${rPercent}%` : 'Non découverte'}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {selectedBrick && !saveState.srsStates[selectedBrick.id]?.unlocked && (
            <div className="rounded-2xl bg-stone-900/60 border-2 border-dashed border-stone-700 p-5 text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-stone-950 border border-stone-700 flex items-center justify-center text-stone-500">
                <Lock className="w-6 h-6" />
              </div>
              <div className="font-serif font-bold text-stone-300">Brique non découverte</div>
              <p className="text-xs text-stone-400">
                Elle se cache dans {STRATA_META[selectedBrick.subtierId as StrataId].the}. Progresse sur la Carte pour la récolter et révéler son sens, sa prononciation et son astuce.
              </p>
            </div>
          )}

          {/* Filtre par Strate */}
          <div className="flex items-center gap-2">
            {(['ALL', '1A', '1B', '1C'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterSubtier(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                  filterSubtier === st
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-stone-900 border-stone-800 text-stone-400'
                }`}
              >
                {st === 'ALL' ? 'Toutes (32)' : STRATA_META[st].short}
              </button>
            ))}
          </div>

          {/* Grille des 32 Briques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {filteredBricks.map((brick) => {
              const st = saveState.srsStates[brick.id];
              const R = calculateRetention(st, currentTimestamp);
              const isCracked = Boolean(st?.unlocked && R < 0.85);
              const isCritical = Boolean(st?.unlocked && R < 0.65);

              if (!st?.unlocked) {
                return (
                  <div
                    key={brick.id}
                    onClick={() => setSelectedBrick(brick)}
                    className="p-2.5 rounded-xl border border-dashed border-stone-800 bg-stone-950/60 flex flex-col items-center text-center cursor-pointer hover:border-stone-700"
                  >
                    <div className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-600 font-serif font-bold text-sm tracking-widest">
                      ? ? ?
                    </div>
                    <div className="text-xs font-medium text-stone-600 mt-2">Non découverte</div>
                    <div className="text-[10px] text-stone-700">{STRATA_META[brick.subtierId as StrataId].short}</div>
                  </div>
                );
              }

              return (
                <div
                  key={brick.id}
                  onClick={() => {
                    setSelectedBrick(brick);
                    speakEnglish(brick.en, {
                      accent: saveState.preferredAccent,
                      audioUrl:
                        saveState.preferredAccent === 'uk' ? brick.audioUkUrl : brick.audioUsUrl
                    });
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                    selectedBrick?.id === brick.id
                      ? 'bg-stone-800/90 border-amber-400'
                      : 'bg-stone-900/70 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <BrickChip
                    text={brick.en}
                    pos={brick.pos}
                    cracked={isCracked}
                    critical={isCritical}
                    material={st?.unlocked ? st.material : null}
                    size="sm"
                  />
                  <div className="text-xs font-medium text-stone-200 mt-2">{brick.fr}</div>
                  <div className="text-[10px] text-stone-500 font-mono">{brick.ipa}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {TIER1_FORMULAS.map((form) => {
            const st = saveState.srsStates[form.id];
            if (!st?.unlocked) {
              return (
                <div
                  key={form.id}
                  className="rounded-2xl bg-stone-950/60 border border-dashed border-stone-800 p-5 flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-stone-900 border border-stone-700 text-stone-500 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      {STRATA_META[form.subtierId as StrataId].name}
                    </div>
                    <div className="font-serif font-bold text-stone-400">Formule scellée</div>
                    <div className="text-xs text-stone-500">
                      Déchiffre-la en franchissant la stèle {STRATA_META[form.subtierId as StrataId].ofShort}, sur la Carte.
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={form.id}
                className="rounded-2xl bg-stone-900 border border-stone-800 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      {STRATA_META[form.subtierId as StrataId].name}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-stone-100">{form.name}</h3>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      st?.unlocked
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                  >
                    {st?.unlocked ? 'Formule Déchiffrée' : 'À déchiffrer sur la Carte'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 py-2">
                  {form.patternSlots.map((slot, idx) => (
                    <React.Fragment key={slot.id}>
                      <span
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                          POS_STYLES[slot.pos]?.bg
                        } ${POS_STYLES[slot.pos]?.border} ${POS_STYLES[slot.pos]?.text}`}
                      >
                        {slot.label}
                      </span>
                      {idx < form.patternSlots.length - 1 && (
                        <span className="text-stone-500 font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Exemples sonores de la formule */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {form.inductiveSteles.map((stEx, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        speakEnglish(stEx.enBricks.join(' '), {
                          accent: saveState.preferredAccent
                        })
                      }
                      className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-left cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-serif font-bold text-amber-200 flex items-center justify-between">
                        <span>{stEx.enBricks.join(' ')}</span>
                        <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{stEx.frTranslation}</div>
                    </button>
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-stone-200 bg-stone-950 p-3 rounded-xl border border-stone-800">
                  {form.coreRuleSummary}
                </p>

                <div className="text-xs text-rose-200 bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl">
                  <strong className="text-rose-300">Piège francophone : </strong>
                  {form.frenchTrapWarning}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEÇON DE GISEMENT (ACQUISITION DE 5-6 BRIQUES EN 3 PASSES)
// ============================================================================
function GisementArena({
  node,
  bricks,
  accent,
  onComplete
}: {
  node: MapNode;
  bricks: Brick[];
  accent: 'uk' | 'us';
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const currentBrick = bricks[index];

  useEffect(() => {
    if (currentBrick && (phase === 1 || phase === 2)) {
      speakEnglish(currentBrick.en, {
        accent,
        audioUrl: accent === 'uk' ? currentBrick.audioUkUrl : currentBrick.audioUsUrl
      });
    }
  }, [phase, index, currentBrick, accent]);

  const choiceBricks = useMemo(() => {
    if (!currentBrick) return [];
    const others = TIER1_BRICKS.filter((b) => b.id !== currentBrick.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [currentBrick, ...others].sort(() => Math.random() - 0.5);
  }, [currentBrick, phase, index]);

  const handleChoice = (picked: Brick) => {
    if (feedback) return;
    if (picked.id === currentBrick.id) {
      sfx.playSuccessRune();
      speakEnglish(currentBrick.en, { accent });
      setFeedback({ ok: true, msg: `Exact ! « ${currentBrick.en} » = ${currentBrick.fr}.` });
    } else {
      sfx.playTorchExtinguish();
      setFeedback({
        ok: false,
        msg: `Tu as touché « ${picked.en} » (${picked.fr}). La bonne brique était « ${currentBrick.en} » (${currentBrick.fr}).`
      });
    }
  };

  const advance = () => {
    sfx.playStoneClick();
    setFeedback(null);
    if (index < bricks.length - 1) {
      setIndex(index + 1);
    } else if (phase < 3) {
      setPhase((phase + 1) as 1 | 2 | 3);
      setIndex(0);
    } else {
      onComplete();
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span className="font-semibold text-amber-300">{node.title}</span>
          <span>
            Passe {phase}/3 • Brique {index + 1}/{bricks.length}
          </span>
        </div>
        <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{
              width: `${(((phase - 1) * bricks.length + index + 1) / (bricks.length * 3)) * 100}%`
            }}
          />
        </div>
      </div>

      {phase === 1 && currentBrick && (
        <div className="rounded-2xl bg-stone-900 border-2 border-amber-500/40 p-6 text-center space-y-5 shadow-xl">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-amber-400 font-semibold">
            <Eye className="w-4 h-4" />
            <span>Passe 1 : Découverte (Voix UK & US)</span>
          </div>

          <div className="py-3 flex flex-col items-center gap-3">
            <BrickChip
              text={currentBrick.en}
              pos={currentBrick.pos}
              size="lg"
              onClick={() => speakEnglish(currentBrick.en, { accent })}
            />
            <div className="text-xs font-mono text-amber-300">{currentBrick.ipa}</div>
            <div className="text-2xl font-serif font-bold text-stone-100">
              « {currentBrick.fr} »
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={() => speakEnglish(currentBrick.en, { accent: 'uk' })}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>🇬🇧 Voix UK</span>
            </button>
            <button
              onClick={() => speakEnglish(currentBrick.en, { accent: 'us' })}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>🇺🇸 Voix US</span>
            </button>
          </div>

          <div className="text-left text-xs sm:text-sm bg-stone-950 border border-stone-800 rounded-xl p-3.5 text-stone-300">
            <strong className="text-amber-300">Ancrage : </strong>
            {currentBrick.mnemonicNote}
          </div>

          {currentBrick.falseFriendTrap && (
            <div className="text-left text-xs sm:text-sm bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 text-rose-200">
              <strong className="text-rose-300">Piège à déjouer : </strong>
              {currentBrick.falseFriendTrap}
            </div>
          )}

          <button
            onClick={advance}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm cursor-pointer"
          >
            Collecter cette Brique
          </button>
        </div>
      )}

      {phase === 2 && currentBrick && (
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-sky-400 font-semibold">
            <Ear className="w-4 h-4" />
            <span>Passe 2 : Discrimination Auditive (1 parmi 4)</span>
          </div>

          <p className="text-sm text-stone-300">
            Écoute le mot prononcé sans texte et touche la brique anglaise correspondante :
          </p>

          <div className="flex justify-center gap-3 py-2">
            <button
              onClick={() => speakEnglish(currentBrick.en, { accent })}
              className="px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-200 font-semibold text-sm flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              <span>Réécouter (1.0x)</span>
            </button>
            <button
              onClick={() => speakEnglish(currentBrick.en, { accent, slow: true })}
              className="px-3.5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-xs cursor-pointer"
            >
              🐢 0.75x
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {choiceBricks.map((b) => (
              <div
                key={b.id}
                onClick={() => handleChoice(b)}
                className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <BrickChip text={b.en} pos={b.pos} silentMode={true} />
              </div>
            ))}
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-xl border text-left space-y-3 ${
                feedback.ok
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-100'
              }`}
            >
              <div className="text-sm font-semibold">{feedback.msg}</div>
              <button
                onClick={advance}
                className="w-full py-2.5 rounded-lg bg-stone-100 text-stone-950 font-bold text-xs cursor-pointer"
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 3 && currentBrick && (
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-emerald-400 font-semibold">
            <Hammer className="w-4 h-4" />
            <span>Passe 3 : Ancrage Croisé (Français → Anglais)</span>
          </div>

          <div className="py-3">
            <div className="text-xs text-stone-400 uppercase">Touche la brique qui signifie :</div>
            <div className="text-2xl font-serif font-bold text-amber-100 mt-1">
              « {currentBrick.fr} »
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {choiceBricks.map((b) => (
              <div
                key={b.id}
                onClick={() => handleChoice(b)}
                className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 flex flex-col items-center cursor-pointer"
              >
                <BrickChip text={b.en} pos={b.pos} />
              </div>
            ))}
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-xl border text-left space-y-3 ${
                feedback.ok
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-100'
              }`}
            >
              <div className="text-sm font-semibold">{feedback.msg}</div>
              <button
                onClick={advance}
                className="w-full py-2.5 rounded-lg bg-stone-100 text-stone-950 font-bold text-xs cursor-pointer"
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STÈLE DE FORMULE (DÉBLOCAGE INDUCTIF EN 3 TEMPS : OBSERVATION -> EXTRACTION -> PREUVE)
// ============================================================================
function SteleFormulaArena({
  formula,
  accent,
  findBrickByWord,
  onSteleDecoded
}: {
  formula: Formula | undefined;
  accent: 'uk' | 'us';
  findBrickByWord: (w: string) => Brick | undefined;
  onSteleDecoded: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [placedSlots, setPlacedSlots] = useState<Formula['patternSlots']>([]);
  const [selectedTrapOption, setSelectedTrapOption] = useState<string | null>(null);
  const [deductionError, setDeductionError] = useState<string | null>(null);

  const availablePool = useMemo(() => {
    if (!formula) return [];
    return [...formula.patternSlots].sort(() => Math.random() - 0.5);
  }, [formula]);

  if (!formula) return null;

  const verifyDeduction = () => {
    const isOrderCorrect =
      placedSlots.length === formula.patternSlots.length &&
      placedSlots.every((s, idx) => s.id === formula.patternSlots[idx].id);

    const chosenOpt = formula.trapQuestion.options.find((o) => o.id === selectedTrapOption);

    if (!isOrderCorrect) {
      sfx.playTorchExtinguish();
      setDeductionError(
        "L'ordre des étiquettes grammaticales ne correspond pas aux stèles observées. Regarde bien la couleur et la place de chaque mot !"
      );
      return;
    }

    if (!chosenOpt || !chosenOpt.isCorrect) {
      sfx.playTorchExtinguish();
      setDeductionError(
        "Ta réponse à la question sur le piège francophone est inexacte. Relis l'indice des stèles !"
      );
      return;
    }

    sfx.playSteleUnlock();
    setDeductionError(null);
    setStep(3);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-2xl bg-stone-900 border border-amber-500/40 p-5 space-y-2">
        <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
          Méthode Inductive (Observation → Extraction → Preuve) • {formula.name}
        </div>
        <p className="text-xs sm:text-sm text-stone-300">{formula.subtitle}</p>
      </div>

      {step === 1 && (
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base sm:text-lg text-amber-100">
              Étape 1 : Observe et écoute la Stèle Bilingue
            </h3>
            <span className="text-xs text-stone-400">Touche chaque brique pour l'écouter</span>
          </div>

          <div className="space-y-3">
            {formula.inductiveSteles.map((stele, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {stele.enBricks.map((w, i) => {
                      const b = findBrickByWord(w);
                      return (
                        <BrickChip
                          key={i}
                          text={w}
                          pos={b?.pos || 'noun'}
                          size="sm"
                          onClick={() => speakEnglish(w, { accent })}
                        />
                      );
                    })}
                  </div>
                  <button
                    onClick={() => speakEnglish(stele.enBricks.join(' '), { accent })}
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 shrink-0 cursor-pointer"
                    title="Écouter la stèle complète"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm font-serif text-amber-100">
                  = « {stele.frTranslation} »
                </div>

                <div className="text-xs text-stone-400 bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                  🔎 {stele.highlightNote}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              sfx.playStoneClick(true);
              setStep(2);
            }}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm cursor-pointer"
          >
            J'ai observé la structure → Déduire la Formule
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5 space-y-5">
          <h3 className="font-serif font-bold text-base sm:text-lg text-amber-100">
            Étape 2 : Dans quel ordre les Anciens assemblent-ils ces pierres ?
          </h3>

          <p className="text-xs sm:text-sm text-stone-300">
            1. Touche les étiquettes grammaticales ci-dessous pour reconstruire le moule dans le bon ordre :
          </p>

          <div className="min-h-[68px] p-3 rounded-xl bg-stone-950 border-2 border-dashed border-stone-700 flex flex-wrap items-center gap-2">
            {placedSlots.length === 0 && (
              <span className="text-xs text-stone-500">
                Touche les étiquettes de couleur ci-dessous pour les placer dans le moule...
              </span>
            )}
            {placedSlots.map((slot, idx) => (
              <button
                key={slot.id}
                onClick={() => {
                  sfx.playStoneClick(false);
                  setPlacedSlots(placedSlots.filter((_, i) => i !== idx));
                }}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold cursor-pointer ${
                  POS_STYLES[slot.pos]?.bg
                } ${POS_STYLES[slot.pos]?.border} ${POS_STYLES[slot.pos]?.text}`}
              >
                {idx + 1}. {slot.label} ✕
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {availablePool.map((slot) => {
              const alreadyPlaced = placedSlots.some((s) => s.id === slot.id);
              return (
                <button
                  key={slot.id}
                  disabled={alreadyPlaced}
                  onClick={() => {
                    sfx.playStoneClick(true);
                    setPlacedSlots([...placedSlots, slot]);
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    POS_STYLES[slot.pos]?.bg
                  } ${POS_STYLES[slot.pos]?.border} ${POS_STYLES[slot.pos]?.text} ${
                    alreadyPlaced ? 'opacity-30 pointer-events-none' : 'cursor-pointer'
                  }`}
                >
                  + {slot.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-800 space-y-2.5">
            <p className="text-xs sm:text-sm font-semibold text-amber-200">
              2. Question flash sur le piège francophone : {formula.trapQuestion.question}
            </p>
            <div className="space-y-2">
              {formula.trapQuestion.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sfx.playStoneClick();
                    setSelectedTrapOption(opt.id);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                    selectedTrapOption === opt.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>

          {deductionError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
              {deductionError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
            >
              Revoir la Stèle
            </button>
            <button
              onClick={verifyDeduction}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm cursor-pointer"
            >
              Extraire la Formule
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-2xl bg-stone-900 border-2 border-emerald-500/50 p-6 space-y-4 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-serif font-bold text-emerald-200">
            {formula.name} Débloquée !
          </h3>
          <p className="text-sm text-stone-200 bg-stone-950 p-4 rounded-xl border border-stone-800 text-left">
            {formula.coreRuleSummary}
          </p>
          <div className="text-xs text-amber-200 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 text-left">
            <strong>Piège francophone : </strong>
            {formula.frenchTrapWarning}
          </div>
          <button
            onClick={onSteleDecoded}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm cursor-pointer"
          >
            Étape 3 : Prouver ma maîtrise (6 Épreuves sans aide)
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LA TABLE D'EXPLORATION : LES 4 TYPES D'EXERCICES + TIROIR DE FEEDBACK
// ============================================================================
function ExerciseSessionArena({
  title,
  initialExercises,
  accent,
  findBrickByWord,
  onExerciseResult,
  onSessionComplete
}: {
  title: string;
  initialExercises: Exercise[];
  accent: 'uk' | 'us';
  findBrickByWord: (w: string) => Brick | undefined;
  onExerciseResult: (ex: Exercise, isFirstTrySuccess: boolean) => void;
  onSessionComplete: () => void;
}) {
  const [queue, setQueue] = useState(() =>
    initialExercises.map((ex) => ({ ex, attempts: 0 }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const [assembled, setAssembled] = useState<Array<{ id: string; word: string }>>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [corruptedSlotIndex, setCorruptedSlotIndex] = useState<number | null>(null);
  const [replacementBrick, setReplacementBrick] = useState<string | null>(null);
  const [shakeBoard, setShakeBoard] = useState(false);
  const [feedbackDrawer, setFeedbackDrawer] = useState<{
    isCorrect: boolean;
    explanation: string;
    ruleReminder?: string;
    correctAnswer: string;
  } | null>(null);

  const currentItem = queue[currentIndex];
  const exercise = currentItem?.ex;

  // Alterne entre UK (Sonia) et US (Guy) sur 50% des exercices ou selon préférence
  const activeVoiceAccent = useMemo(() => {
    return currentIndex % 2 === 0 ? accent : accent === 'uk' ? 'us' : 'uk';
  }, [currentIndex, accent]);

  const boardBricks = useMemo(() => {
    if (!exercise) return [];
    if (exercise.type === 'assemble_fr_en' || exercise.type === 'translate_en_fr') {
      const combined = [...exercise.targetSequence, ...(exercise.distractorPool || [])];
      return combined
        .map((word, idx) => ({ id: `chip_${idx}_${word}`, word }))
        .sort(() => Math.random() - 0.5);
    }
    if (exercise.type === 'corrupted_brick') {
      return (exercise.distractorPool || []).map((word, idx) => ({
        id: `rep_${idx}_${word}`,
        word
      }));
    }
    return [];
  }, [exercise, currentIndex]);

  useEffect(() => {
    setAssembled([]);
    setSelectedChoiceId(null);
    setCorruptedSlotIndex(null);
    setReplacementBrick(null);
    setFeedbackDrawer(null);

    if (exercise && exercise.type === 'translate_en_fr' && exercise.spokenTarget) {
      speakEnglish(exercise.spokenTarget, { accent: activeVoiceAccent });
    }
  }, [currentIndex, exercise, activeVoiceAccent]);

  if (!exercise) return null;

  const buildErrorDiagnosis = (userWords: string[], choiceId: string | null) => {
    const specifics = exercise.specificFeedbacks || [];

    if (choiceId) {
      const match = specifics.find((s) => s.triggerBrickOrChoice === choiceId);
      if (match) return match;
    }

    for (const w of userWords) {
      const cleanW = w.replace(/[.,:!?;]/g, '');
      const match = specifics.find(
        (s) => s.triggerBrickOrChoice.toLowerCase() === cleanW.toLowerCase()
      );
      if (match) return match;
    }

    const targetSorted = [...exercise.targetSequence].sort().join('|').toLowerCase();
    const userSorted = [...userWords].sort().join('|').toLowerCase();
    if (targetSorted === userSorted) {
      const orderFeedback = specifics.find((s) => s.triggerBrickOrChoice === 'WORD_ORDER');
      if (orderFeedback) return orderFeedback;
      return {
        explanation:
          "Tu as choisi les bonnes briques, mais dans l'ordre français ! En anglais, vérifie la position de l'adjectif (toujours avant le nom) ou de la négation 'not' (toujours après le verbe être).",
        ruleReminder: `Ordre exact : « ${exercise.targetSequence.join(' ')} »`
      };
    }

    return {
      explanation: exercise.defaultErrorFeedback,
      ruleReminder: `Correction : « ${exercise.targetSequence.join(' ')} »`
    };
  };

  const handleValidate = () => {
    if (feedbackDrawer) return;

    let isCorrect = false;
    let userSequence: string[] = [];

    if (exercise.type === 'assemble_fr_en' || exercise.type === 'translate_en_fr') {
      userSequence = assembled.map((item) => item.word);
      isCorrect =
        userSequence.length === exercise.targetSequence.length &&
        userSequence.every((w, i) => w === exercise.targetSequence[i]);
    } else if (exercise.type === 'mirror_trap') {
      const picked = exercise.mirrorChoices?.find((c) => c.id === selectedChoiceId);
      isCorrect = Boolean(picked?.isCorrect);
    } else if (exercise.type === 'corrupted_brick') {
      if (corruptedSlotIndex !== null && replacementBrick) {
        const candidate = [...(exercise.corruptedInitialSequence || [])];
        candidate[corruptedSlotIndex] = replacementBrick;
        userSequence = candidate;
        isCorrect =
          candidate.length === exercise.targetSequence.length &&
          candidate.every((w, i) => w === exercise.targetSequence[i]);
      }
    }

    const isFirstTry = currentItem.attempts === 0;
    onExerciseResult(exercise, isCorrect && isFirstTry);

    if (isCorrect) {
      sfx.playSuccessRune();
      if (exercise.spokenTarget) {
        speakEnglish(exercise.spokenTarget, { accent: activeVoiceAccent });
      }
      setFeedbackDrawer({
        isCorrect: true,
        explanation: exercise.defaultErrorFeedback,
        correctAnswer: exercise.targetSequence.join(' ')
      });
    } else {
      sfx.playTorchExtinguish();
      setShakeBoard(true);
      setTimeout(() => setShakeBoard(false), 500);

      const diag = buildErrorDiagnosis(
        userSequence.length ? userSequence : exercise.corruptedInitialSequence || [],
        selectedChoiceId
      );
      setFeedbackDrawer({
        isCorrect: false,
        explanation: diag.explanation,
        ruleReminder: diag.ruleReminder || `Attendu : ${exercise.targetSequence.join(' ')}`,
        correctAnswer: exercise.targetSequence.join(' ')
      });
      // Replace automatiquement l'exercice raté en fin de file
      setQueue((prev) => [...prev, { ex: exercise, attempts: currentItem.attempts + 1 }]);
    }
  };

  const handleNext = () => {
    sfx.playStoneClick();
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSessionComplete();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Zone haute : Barre de progression & Voix active */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-amber-300">{title}</span>
          <span className="text-stone-400">
            Exercice {currentIndex + 1} / {queue.length} • Voix{' '}
            {activeVoiceAccent === 'uk' ? '🇬🇧 UK' : '🇺🇸 US'}
          </span>
        </div>
        <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Table d'Exploration */}
      <div
        className={`rounded-2xl bg-stone-900 border border-stone-800 p-5 space-y-4 shadow-lg ${
          shakeBoard ? 'animate-shake border-rose-500/60' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-stone-800 text-amber-300 border border-amber-500/30">
            {exercise.type === 'assemble_fr_en' && '1. Assemblage de Briques (FR → EN)'}
            {exercise.type === 'translate_en_fr' && '2. Traduction de Sens (EN → FR)'}
            {exercise.type === 'mirror_trap' && '3. Le Piège du Miroir (Faux-Amis & Calques)'}
            {exercise.type === 'corrupted_brick' && "4. L'Intrus Corrompu (Réflexe Grammatical)"}
          </span>

          {exercise.spokenTarget && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => speakEnglish(exercise.spokenTarget!, { accent: activeVoiceAccent })}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-amber-200 flex items-center gap-1 cursor-pointer"
                title="Écoute normale (1.0x)"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>1.0x</span>
              </button>
              <button
                onClick={() =>
                  speakEnglish(exercise.spokenTarget!, { accent: activeVoiceAccent, slow: true })
                }
                className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 cursor-pointer"
                title="Écoute lente (0.75x)"
              >
                🐢 0.75x
              </button>
            </div>
          )}
        </div>

        <div className="text-lg sm:text-xl font-serif font-bold text-stone-100">
          « {exercise.promptText} »
        </div>

        {/* --- MODE 1 & 2 : RAINURE D'ASSEMBLAGE --- */}
        {(exercise.type === 'assemble_fr_en' || exercise.type === 'translate_en_fr') && (
          <div className="space-y-4 pt-2">
            <div className="min-h-[76px] p-3.5 rounded-xl bg-stone-950 border-2 border-dashed border-stone-700 flex flex-wrap items-center gap-2">
              {assembled.length === 0 && (
                <span className="text-xs text-stone-500">
                  Rainure d'assemblage : touche les briques ci-dessous pour construire la phrase...
                </span>
              )}
              {assembled.map((item, idx) => {
                const b = findBrickByWord(item.word);
                return (
                  <BrickChip
                    key={item.id}
                    text={item.word}
                    pos={exercise.type === 'translate_en_fr' ? 'fr_meaning' : b?.pos || 'noun'}
                    silentMode={exercise.type === 'translate_en_fr'}
                    onClick={() => {
                      if (feedbackDrawer) return;
                      sfx.playStoneClick(false);
                      setAssembled(assembled.filter((_, i) => i !== idx));
                    }}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {boardBricks.map((item) => {
                const isUsed = assembled.some((a) => a.id === item.id);
                const b = findBrickByWord(item.word);
                return (
                  <BrickChip
                    key={item.id}
                    text={item.word}
                    pos={exercise.type === 'translate_en_fr' ? 'fr_meaning' : b?.pos || 'noun'}
                    silentMode={exercise.type === 'translate_en_fr'}
                    disabled={isUsed}
                    onClick={() => {
                      if (feedbackDrawer) return;
                      sfx.playStoneClick(true);
                      if (exercise.type === 'assemble_fr_en') {
                        speakEnglish(item.word, { accent: activeVoiceAccent });
                      }
                      setAssembled([...assembled, item]);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* --- MODE 3 : LE PIÈGE DU MIROIR (QCM 3 CHOIX) --- */}
        {exercise.type === 'mirror_trap' && (
          <div className="space-y-2.5 pt-2">
            {exercise.mirrorChoices?.map((choice) => (
              <button
                key={choice.id}
                onClick={() => {
                  if (feedbackDrawer) return;
                  sfx.playStoneClick(true);
                  speakEnglish(choice.text, { accent: activeVoiceAccent });
                  setSelectedChoiceId(choice.id);
                }}
                className={`w-full text-left p-4 rounded-xl border-2 font-serif text-base transition-all flex items-center justify-between cursor-pointer ${
                  selectedChoiceId === choice.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                    : 'bg-stone-950 border-stone-800 text-stone-200 hover:border-stone-700'
                }`}
              >
                <span>{choice.text}</span>
                <Volume2 className="w-4 h-4 opacity-60" />
              </button>
            ))}
          </div>
        )}

        {/* --- MODE 4 : L'INTRUS CORROMPU --- */}
        {exercise.type === 'corrupted_brick' && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-stone-400">
              1. Touche la brique fautive dans la phrase déjà assemblée sur la table :
            </p>
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-wrap gap-2">
              {exercise.corruptedInitialSequence?.map((word, idx) => {
                const b = findBrickByWord(word);
                const isSelected = corruptedSlotIndex === idx;
                const displayWord = isSelected && replacementBrick ? replacementBrick : word;
                return (
                  <BrickChip
                    key={idx}
                    text={displayWord}
                    pos={b?.pos || 'noun'}
                    corruptedHighlight={isSelected}
                    onClick={() => {
                      if (feedbackDrawer) return;
                      sfx.playStoneClick(true);
                      setCorruptedSlotIndex(idx);
                    }}
                  />
                );
              })}
            </div>

            {corruptedSlotIndex !== null && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-amber-300">
                  2. Choisis la brique saine pour remplacer «{' '}
                  {exercise.corruptedInitialSequence?.[corruptedSlotIndex]} » :
                </p>
                <div className="flex flex-wrap gap-2">
                  {boardBricks.map((item) => {
                    const b = findBrickByWord(item.word);
                    return (
                      <BrickChip
                        key={item.id}
                        text={item.word}
                        pos={b?.pos || 'noun'}
                        selected={replacementBrick === item.word}
                        onClick={() => {
                          if (feedbackDrawer) return;
                          sfx.playStoneClick(true);
                          speakEnglish(item.word, { accent: activeVoiceAccent });
                          setReplacementBrick(item.word);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!feedbackDrawer && (
          <button
            onClick={handleValidate}
            disabled={
              ((exercise.type === 'assemble_fr_en' || exercise.type === 'translate_en_fr') &&
                assembled.length === 0) ||
              (exercise.type === 'mirror_trap' && !selectedChoiceId) ||
              (exercise.type === 'corrupted_brick' &&
                (corruptedSlotIndex === null || !replacementBrick))
            }
            className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-stone-950 font-bold text-sm sm:text-base shadow-lg cursor-pointer"
          >
            Valider
          </button>
        )}
      </div>

      {/* TIROIR DE FEEDBACK (BOTTOM SHEET PÉDAGOGIQUE) */}
      {feedbackDrawer && (
        <div
          className={`rounded-2xl border-2 p-5 shadow-2xl space-y-3 transition-all ${
            feedbackDrawer.isCorrect
              ? 'bg-emerald-950/85 border-emerald-500 text-emerald-50'
              : 'bg-rose-950/90 border-rose-500 text-rose-50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {feedbackDrawer.isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <h4 className="font-serif font-bold text-lg">
                  {feedbackDrawer.isCorrect
                    ? 'Gravure Exacte !'
                    : 'Erreur détectée — Pourquoi est-ce faux ?'}
                </h4>
                <div className="text-xs font-mono text-amber-200 mt-0.5">
                  Correction : « {feedbackDrawer.correctAnswer} »
                </div>
              </div>
            </div>
            {exercise.spokenTarget && (
              <button
                onClick={() => speakEnglish(exercise.spokenTarget!, { accent: activeVoiceAccent })}
                className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Réécouter</span>
              </button>
            )}
          </div>

          <div className="text-xs sm:text-sm leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/10">
            {feedbackDrawer.explanation}
          </div>

          {!feedbackDrawer.isCorrect && feedbackDrawer.ruleReminder && (
            <div className="text-xs font-semibold text-amber-200 bg-black/40 p-3 rounded-xl border border-amber-500/30">
              📌 Ce qu'il faut retenir : {feedbackDrawer.ruleReminder}
            </div>
          )}

          <button
            onClick={handleNext}
            className={`w-full py-3 rounded-xl font-bold text-sm cursor-pointer ${
              feedbackDrawer.isCorrect
                ? 'bg-emerald-400 hover:bg-emerald-300 text-stone-950'
                : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
            }`}
          >
            {feedbackDrawer.isCorrect
              ? 'Continuer'
              : "J'ai compris (L'exercice reviendra en fin de file)"}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODE OPTIONNEL « GRAVURE LIBRE » (CLAVIER) POUR LE RANG D'OR RUNIQUE
// ============================================================================
function FreeEngravingArena({
  unlockedBricks,
  accent,
  onMasteryEngraved,
  onExit
}: {
  unlockedBricks: Brick[];
  accent: 'uk' | 'us';
  onMasteryEngraved: (brickId: string) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const brick = unlockedBricks[index];

  if (!brick) return null;

  const checkTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (result) return;
    const clean = input.trim().toLowerCase();
    if (clean === brick.en.toLowerCase()) {
      sfx.playSteleUnlock();
      speakEnglish(brick.en, { accent });
      onMasteryEngraved(brick.id);
      setResult({
        ok: true,
        msg: `Gravure libre parfaite ! La brique « ${brick.en} » s'élève au rang d'Or Runique (✨ Stabilité ≥ 30j).`
      });
    } else {
      sfx.playTorchExtinguish();
      setResult({
        ok: false,
        msg: `Orthographe attendue : « ${brick.en} » (${brick.ipa}).`
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto rounded-2xl bg-stone-900 border-2 border-amber-500/40 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
          <Keyboard className="w-4 h-4" />
          Gravure Libre (Maîtrise Ultime Or Runique)
        </span>
        <span className="text-xs text-stone-400">
          {index + 1} / {unlockedBricks.length}
        </span>
      </div>

      <div className="text-center py-3 space-y-2">
        <div className="text-xs text-stone-400 uppercase">
          Grave de mémoire le mot anglais pour :
        </div>
        <div className="text-2xl font-serif font-bold text-amber-100">« {brick.fr} »</div>
        <div className="text-xs text-stone-500">{brick.mnemonicNote}</div>
      </div>

      <form onSubmit={checkTyped} className="space-y-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tape le mot anglais exact..."
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-stone-950 border-2 border-stone-700 focus:border-amber-400 outline-none font-serif text-lg text-center text-amber-100"
        />
        {!result && (
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-sm cursor-pointer"
          >
            Graver dans l'Or Runique
          </button>
        )}
      </form>

      {result && (
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            result.ok
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-100'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-100'
          }`}
        >
          <div className="text-xs sm:text-sm font-semibold">{result.msg}</div>
          <div className="flex gap-2">
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-lg bg-stone-800 text-stone-200 text-xs font-semibold cursor-pointer"
            >
              Retour Campement
            </button>
            <button
              onClick={() => {
                setResult(null);
                setInput('');
                setIndex((index + 1) % unlockedBricks.length);
              }}
              className="flex-1 py-2 rounded-lg bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer"
            >
              Brique suivante
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ÉCRAN 5 : L'ANTRE DU GARDIEN (LE BOSS AUDIO — 10 PHRASES EN 2 ACTES, BRIQUES MUETTES)
// ============================================================================
function BossGuardianArena({
  findBrickByWord,
  onSRSUpdate,
  onBossVictory,
  onBossDefeat,
  onExit
}: {
  findBrickByWord: (w: string) => Brick | undefined;
  onSRSUpdate: (brickIds: string[], formulaIds: string[], ok: boolean) => void;
  onBossVictory: () => void;
  onBossDefeat: () => void;
  onExit: () => void;
}) {
  const [challenges, setChallenges] = useState<BossChallenge[]>(() => pickTenBossChallenges());
  const [stepIndex, setStepIndex] = useState(0);
  const [torches, setTorches] = useState(3);
  const [freeReplaysLeft, setFreeReplaysLeft] = useState(1);
  const [slowCrystalsLeft, setSlowCrystalsLeft] = useState(2);
  const [assembled, setAssembled] = useState<Array<{ id: string; word: string }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shakeBoss, setShakeBoss] = useState(false);
  const [roundResult, setRoundResult] = useState<{
    ok: boolean;
    transcript: string;
    explanation: string;
    expected?: string;
  } | null>(null);
  const [combatState, setCombatState] = useState<'fighting' | 'victory' | 'defeat'>('fighting');

  const currentChallenge = challenges[stepIndex];

  // Tirage aléatoire stratifié de 10 phrases sur le pool de 15 (1 par rang de 1 à 10)
  function pickTenBossChallenges(): BossChallenge[] {
    const picked: BossChallenge[] = [];
    for (let rank = 1; rank <= 10; rank++) {
      const candidates = BOSS_CHALLENGES.filter((c) => c.difficultyRank === rank);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      if (chosen) picked.push(chosen);
    }
    return picked;
  }

  // Démarre le bourdonnement sourd de l'antre (Web Audio API)
  useEffect(() => {
    sfx.startBossDrone();
    return () => {
      sfx.stopBossDrone();
    };
  }, []);

  const boardBricks = useMemo(() => {
    if (!currentChallenge) return [];
    const all = [...currentChallenge.targetSequence, ...currentChallenge.distractorPool];
    return all
      .map((word, idx) => ({ id: `boss_b_${idx}_${word}`, word }))
      .sort(() => Math.random() - 0.5);
  }, [currentChallenge, stepIndex]);

  const triggerBossVoice = useCallback(
    (slowMode = false) => {
      if (!currentChallenge) return;
      setIsSpeaking(true);
      speakEnglish(currentChallenge.spokenEnglishTranscript, {
        accent: 'boss',
        slow: slowMode,
        audioUrl: slowMode
          ? currentChallenge.audioBossSlowUrl
          : currentChallenge.audioBossUrl,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false)
      });
    },
    [currentChallenge]
  );

  useEffect(() => {
    if (combatState === 'fighting' && currentChallenge) {
      setAssembled([]);
      setFreeReplaysLeft(1);
      setRoundResult(null);
      const timer = setTimeout(() => {
        triggerBossVoice(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, combatState, currentChallenge, triggerBossVoice]);

  const handleReplayNormal = () => {
    if (freeReplaysLeft <= 0) return;
    setFreeReplaysLeft(freeReplaysLeft - 1);
    triggerBossVoice(false);
  };

  const handleUseCrystal = () => {
    if (slowCrystalsLeft <= 0) return;
    setSlowCrystalsLeft(slowCrystalsLeft - 1);
    triggerBossVoice(true);
  };

  const handleEngraveAnswer = () => {
    if (roundResult || !currentChallenge) return;
    const userWords = assembled.map((a) => a.word);
    const isCorrect =
      userWords.length === currentChallenge.targetSequence.length &&
      userWords.every((w, i) => w === currentChallenge.targetSequence[i]);

    onSRSUpdate(
      currentChallenge.requiredBrickIds,
      currentChallenge.requiredFormulaIds,
      isCorrect
    );

    if (isCorrect) {
      sfx.playSuccessRune();
      setRoundResult({
        ok: true,
        transcript: currentChallenge.spokenEnglishTranscript,
        explanation: currentChallenge.failureExplanation
      });
    } else {
      sfx.playTorchExtinguish();
      setShakeBoss(true);
      setTimeout(() => setShakeBoss(false), 500);

      const nextTorches = torches - 1;
      setTorches(nextTorches);
      setRoundResult({
        ok: false,
        transcript: currentChallenge.spokenEnglishTranscript,
        explanation: currentChallenge.failureExplanation,
        expected: currentChallenge.targetSequence.join(' ')
      });
      if (nextTorches <= 0) {
        onBossDefeat();
      }
    }
  };

  const handleNextSeal = () => {
    sfx.playStoneClick();
    if (torches <= 0) {
      setCombatState('defeat');
      return;
    }
    if (stepIndex < challenges.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onBossVictory();
      setCombatState('victory');
    }
  };

  const restartBoss = () => {
    sfx.playSteleUnlock();
    setChallenges(pickTenBossChallenges());
    setStepIndex(0);
    setTorches(3);
    setFreeReplaysLeft(1);
    setSlowCrystalsLeft(2);
    setCombatState('fighting');
  };

  if (combatState === 'victory') {
    return (
      <div className="max-w-xl mx-auto rounded-3xl bg-[#0a0a12] border-2 border-amber-400 p-7 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center mx-auto text-amber-300 animate-rune-glow">
          <Award className="w-10 h-10" />
        </div>
        <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
          Les 10 Sceaux sont brisés • Porte Ouverte
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
          Le Gardien du Seuil s'incline !
        </h2>
        <p className="text-sm text-stone-300 leading-relaxed">
          Dans le silence oppressant des briques muettes, ton oreille a triomphé de l'Écho de Pierre (Acte I) et du Jugement du Sens (Acte II). Le Palier I du Codex d'Albion est entièrement maîtrisé !
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={restartBoss}
            className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold text-xs cursor-pointer"
          >
            Rejouer (Nouveau tirage)
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm cursor-pointer"
          >
            Retour au Campement
          </button>
        </div>
      </div>
    );
  }

  if (combatState === 'defeat') {
    return (
      <div className="max-w-xl mx-auto rounded-3xl bg-[#0a0a12] border-2 border-rose-500/70 p-7 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500 flex items-center justify-center mx-auto text-rose-400">
          <Skull className="w-10 h-10" />
        </div>
        <div className="text-xs uppercase tracking-widest text-rose-400 font-bold">
          Les 3 Torches se sont éteintes
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-100">
          Le Silence de l'Antre t'a repoussé
        </h2>
        <p className="text-sm text-stone-300 leading-relaxed">
          Conformément à la loi du Seuil, tu ne perds pas ta progression sur la Carte, mais le combat contre le Gardien reprend au Sceau 1 (avec de nouvelles variantes tirées du pool de 15 phrases).
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs cursor-pointer"
          >
            Consolider mes briques
          </button>
          <button
            onClick={restartBoss}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm cursor-pointer"
          >
            Recommencer depuis le Sceau 1
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* EN-TÊTE OBSIDIENNE : LES 10 SCEAUX & LES 3 TORCHES */}
      <div className="rounded-2xl bg-[#0b0b13] border border-amber-500/40 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
              {currentChallenge?.act === 1
                ? "Acte I (Phrases 1-5) — L'Écho de Pierre (Transcription piégée EN)"
                : 'Acte II (Phrases 6-10) — Le Jugement du Sens (Compréhension pure FR)'}
            </span>
            <h3 className="font-serif font-bold text-base sm:text-lg text-amber-100">
              Sceau {stepIndex + 1} sur 10 • Briques 100 % Muettes
            </h3>
          </div>

          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-amber-500/30">
            {[1, 2, 3].map((t) => {
              const lit = t <= torches;
              return (
                <div
                  key={t}
                  className={`flex items-center gap-1 transition-all duration-300 ${
                    lit ? 'text-amber-400 scale-105' : 'text-stone-700 scale-90'
                  }`}
                  title={lit ? 'Torche de vie allumée' : 'Torche éteinte'}
                >
                  <Flame className={`w-5 h-5 ${lit ? 'fill-amber-400 animate-pulse' : ''}`} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1.5">
          {challenges.map((c, idx) => (
            <div
              key={c.id}
              className={`h-2 rounded-full transition-all ${
                idx < stepIndex
                  ? 'bg-amber-400'
                  : idx === stepIndex
                  ? 'bg-amber-200 animate-pulse'
                  : idx >= 5
                  ? 'bg-purple-950/60 border border-purple-500/30'
                  : 'bg-stone-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* MASQUE DU GARDIEN & CONTRÔLES D'ÉCOUTE */}
      <div
        className={`rounded-2xl bg-gradient-to-b from-[#11111a] to-[#07070c] border-2 border-amber-500/50 p-6 text-center space-y-5 shadow-2xl ${
          shakeBoss ? 'animate-shake border-rose-500' : ''
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              isSpeaking
                ? 'border-amber-300 bg-amber-500/20 shadow-lg shadow-amber-500/30 scale-105'
                : 'border-amber-500/40 bg-stone-950'
            }`}
          >
            <Skull
              className={`w-10 h-10 ${
                isSpeaking ? 'text-amber-300 animate-bounce' : 'text-amber-500/80'
              }`}
            />
          </div>

          <div className="flex items-center justify-center gap-1 h-4">
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
              <span
                key={bar}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking ? 'h-4 bg-amber-400 animate-pulse' : 'h-1.5 bg-stone-700'
                }`}
              />
            ))}
          </div>

          <p className="text-xs sm:text-sm text-stone-300 max-w-md">
            {currentChallenge?.act === 1
              ? "Acte I : Le Gardien parle en anglais. Reconstruis sa phrase exacte malgré les jumeaux phonétiques (three/tree, see/sees, it is/his)."
              : "Acte II : Aucun mot anglais n'est écrit à l'écran ! Écoute la voix du Gardien et assemble sa signification exacte en français."}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleReplayNormal}
            disabled={freeReplaysLeft <= 0}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-35 disabled:pointer-events-none border border-amber-400/60 text-amber-200 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Réécouter ({freeReplaysLeft} restant)</span>
          </button>

          <button
            onClick={handleUseCrystal}
            disabled={slowCrystalsLeft <= 0}
            className="px-4 py-2.5 rounded-xl bg-sky-950/90 hover:bg-sky-900 disabled:opacity-35 disabled:pointer-events-none border border-sky-400/60 text-sky-200 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Gem className="w-4 h-4 text-sky-400" />
            <span>Cristal de Ralentissement 0.80x ({slowCrystalsLeft} restants)</span>
          </button>
        </div>

        {/* RAINURE D'ASSEMBLAGE SILENCIEUSE */}
        <div className="min-h-[80px] p-4 rounded-xl bg-black/75 border-2 border-dashed border-amber-500/40 flex flex-wrap items-center justify-center gap-2">
          {assembled.length === 0 && (
            <span className="text-xs text-stone-500 italic">
              Silence de pierre... Pose et déplace librement les briques muettes avant de graver.
            </span>
          )}
          {assembled.map((item, idx) => {
            const b = findBrickByWord(item.word);
            return (
              <BrickChip
                key={item.id}
                text={item.word}
                pos={currentChallenge.act === 2 ? 'fr_meaning' : b?.pos || 'noun'}
                silentMode={true}
                onClick={() => {
                  if (roundResult) return;
                  sfx.playStoneClick(false);
                  setAssembled(assembled.filter((_, i) => i !== idx));
                }}
              />
            );
          })}
        </div>

        {/* PLATEAU DE BRIQUES 100 % MUETTES */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {boardBricks.map((item) => {
            const isUsed = assembled.some((a) => a.id === item.id);
            const b = findBrickByWord(item.word);
            return (
              <BrickChip
                key={item.id}
                text={item.word}
                pos={currentChallenge.act === 2 ? 'fr_meaning' : b?.pos || 'noun'}
                silentMode={true}
                disabled={isUsed}
                onClick={() => {
                  if (roundResult) return;
                  sfx.playStoneClick(true);
                  setAssembled([...assembled, item]);
                }}
              />
            );
          })}
        </div>

        {!roundResult && (
          <button
            onClick={handleEngraveAnswer}
            disabled={assembled.length === 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 disabled:opacity-35 disabled:pointer-events-none text-stone-950 font-serif font-bold text-base shadow-lg cursor-pointer"
          >
            Graver la réponse
          </button>
        )}
      </div>

      {/* FEEDBACK DU SCEAU */}
      {roundResult && (
        <div
          className={`rounded-2xl border-2 p-5 space-y-3 shadow-2xl ${
            roundResult.ok
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-50'
              : 'bg-rose-950/90 border-rose-500 text-rose-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-lg">
              {roundResult.ok
                ? `Sceau ${stepIndex + 1} Brisé !`
                : 'Une Torche s’éteint dans un souffle sourd !'}
            </h4>
            <button
              onClick={() => triggerBossVoice(false)}
              className="px-3 py-1 rounded-lg bg-black/40 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Réécouter</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-1.5">
            <div className="text-amber-300 font-serif font-semibold">
              Parole révélée du Gardien : « {roundResult.transcript} »
            </div>
            {!roundResult.ok && (
              <div className="text-emerald-300 font-semibold">
                Gravure attendue : « {roundResult.expected} »
              </div>
            )}
            <div className="text-stone-200">{roundResult.explanation}</div>
          </div>

          <button
            onClick={handleNextSeal}
            className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm cursor-pointer"
          >
            {torches <= 0
              ? 'Constater la défaite'
              : stepIndex < challenges.length - 1
              ? 'Passer au Sceau suivant'
              : 'Ouvrir la Porte du Seuil'}
          </button>
        </div>
      )}
    </div>
  );
}
