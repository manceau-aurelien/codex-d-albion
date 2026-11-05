// ============================================================================
// MODÈLE DE DONNÉES COMPLET DU CODEX D'ALBION (Section 5 de la Spécification)
// ============================================================================

export type PartOfSpeech =
  | 'noun'
  | 'pronoun'
  | 'verb'
  | 'adjective'
  | 'determiner'
  | 'particle'
  | 'fr_meaning';

export interface Brick {
  id: string;                 // ex: "b_door"
  tierId: string;             // ex: "tier_1"
  subtierId: '1A' | '1B' | '1C';
  en: string;                 // Forme canonique : "door"
  variants?: string[];        // Formes fléchies ou pièges générés sur le plateau : ["doors"]
  fr: string;                 // Traduction principale : "porte"
  frAlternatives?: string[];  // Variantes FR acceptées : ["la porte", "une porte"]
  ipa: string;                // Transcription phonétique : "/dɔːr/"
  pos: PartOfSpeech;          // Détermine la couleur de la brique
  audioUkUrl?: string;        // Chemin vers le fichier .opus UK
  audioUsUrl?: string;        // Chemin vers le fichier .opus US
  mnemonicNote: string;       // Astuce d'ancrage ou note culturelle
  falseFriendTrap?: string;   // Avertissement si faux-ami ou piège fréquent
}

export interface Formula {
  id: string;                 // ex: "f_1a"
  tierId: string;
  subtierId: '1A' | '1B' | '1C';
  name: string;               // ex: "Formule I : L'Antéposition Immuable"
  subtitle: string;
  patternSlots: {
    id: string;
    label: string;
    pos: PartOfSpeech;
    optional?: boolean;
  }[];
  inductiveSteles: {
    enBricks: string[];
    frTranslation: string;
    audioUrl?: string;
    highlightNote: string;
  }[];
  trapQuestion: {
    question: string;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
  };
  coreRuleSummary: string;
  frenchTrapWarning: string;
}

export type ExerciseType =
  | 'assemble_fr_en'   // Reconstruire en anglais à partir du français
  | 'translate_en_fr'  // Reconstruire le sens en français à partir de l'anglais
  | 'mirror_trap'      // QCM à 3 choix ciblant les faux-amis et calques littéraux
  | 'corrupted_brick'; // Réparer la brique fautive ou inversée dans une phrase

export interface SpecificErrorFeedback {
  triggerBrickOrChoice: string; // Brique piège utilisée ou ID du mauvais choix QCM ou 'WORD_ORDER'
  errorCategory: 'literal_translation' | 'word_order' | 'morphology' | 'false_friend' | 'phonetic';
  explanation: string;
  ruleReminder: string;
}

export interface Exercise {
  id: string;
  tierId: string;
  subtierId: '1A' | '1B' | '1C';
  type: ExerciseType;
  promptText: string;
  spokenTarget?: string;
  audioUrl?: string;
  targetSequence: string[];
  distractorPool: string[];
  corruptedInitialSequence?: string[];
  mirrorChoices?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  requiredBrickIds: string[];
  requiredFormulaIds: string[];
  defaultErrorFeedback: string;
  specificFeedbacks: SpecificErrorFeedback[];
}

export interface BossChallenge {
  id: string;
  tierId: string;
  act: 1 | 2;                   // Acte 1 = Transcription piégée (EN), Acte 2 = Sens pur (FR)
  difficultyRank: number;       // De 1 à 10 (permet de tirer 1 phrase par rang parmi les variantes)
  audioBossUrl?: string;
  audioBossSlowUrl?: string;
  spokenEnglishTranscript: string;
  targetSequence: string[];
  distractorPool: string[];
  requiredBrickIds: string[];
  requiredFormulaIds: string[];
  failureExplanation: string;
}

export type MasteryMaterial = 'clay' | 'stone' | 'marble' | 'gold';

export type ErosionVisualState = 'healthy' | 'degraded' | 'critical';

export interface SRSItemState {
  itemId: string;
  itemType: 'brick' | 'formula';
  unlocked: boolean;
  stability: number;            // S (en jours, de 0.2 à 180)
  difficulty: number;           // D (de 1.0 à 10.0)
  material: MasteryMaterial;
  lastReviewedAt: number;       // Timestamp Unix (ms)
  nextReviewAt: number;         // Timestamp Unix (ms) où R(t) descend à 0.85
  successCount: number;
  lapseCount: number;
  freeEngravedMastery?: boolean; // Mode optionnel « Gravure libre » au clavier réussi
}

export interface PlayerSaveState {
  profileId: string;
  version: number;
  currentTierId: string;
  unlockedSubtiers: string[];
  completedNodeIds: string[];
  bossDefeatedTiers: string[];
  bossDefeated: boolean;
  bossAttemptsCount: Record<string, number>;
  bossAttempts: number;
  preferredAccent: 'uk' | 'us';
  virtualDaysOffset: number;
  srsStates: Record<string, SRSItemState>;
}

export interface MapNode {
  id: string;
  subtierId: '1A' | '1B' | '1C';
  type: 'gisement' | 'stele';
  title: string;
  subtitle: string;
  brickIds?: string[];
  formulaId?: string;
  exerciseIds?: string[];
}
