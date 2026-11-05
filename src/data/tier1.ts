import { Brick, Formula, Exercise, BossChallenge, MapNode, PartOfSpeech } from '../types/codex';

export const POS_STYLES: Record<
  PartOfSpeech,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    badge: string;
    glow: string;
  }
> = {
  noun: {
    label: 'Nom',
    bg: 'bg-sky-950/90 hover:bg-sky-900/95',
    border: 'border-sky-500/70',
    text: 'text-sky-100',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
    glow: 'shadow-sky-950/50'
  },
  pronoun: {
    label: 'Pronom',
    bg: 'bg-sky-950/90 hover:bg-sky-900/95',
    border: 'border-sky-400/80',
    text: 'text-sky-100',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
    glow: 'shadow-sky-950/50'
  },
  verb: {
    label: 'Verbe',
    bg: 'bg-rose-950/90 hover:bg-rose-900/95',
    border: 'border-rose-500/70',
    text: 'text-rose-100',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    glow: 'shadow-rose-950/50'
  },
  adjective: {
    label: 'Adjectif',
    bg: 'bg-emerald-950/90 hover:bg-emerald-900/95',
    border: 'border-emerald-500/70',
    text: 'text-emerald-100',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    glow: 'shadow-emerald-950/50'
  },
  determiner: {
    label: 'Déterminant',
    bg: 'bg-amber-950/90 hover:bg-amber-900/95',
    border: 'border-amber-500/70',
    text: 'text-amber-100',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    glow: 'shadow-amber-950/50'
  },
  particle: {
    label: 'Particule',
    bg: 'bg-amber-950/90 hover:bg-amber-900/95',
    border: 'border-amber-400/70',
    text: 'text-amber-100',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    glow: 'shadow-amber-950/50'
  },
  fr_meaning: {
    label: 'Sens FR',
    bg: 'bg-stone-800/95 hover:bg-stone-700/95',
    border: 'border-amber-400/50',
    text: 'text-amber-50',
    badge: 'bg-stone-700 text-amber-200 border-amber-500/30',
    glow: 'shadow-stone-950/60'
  }
};

// ============================================================================
// LES 32 BRIQUES DU PALIER 1 (Strates 1A, 1B, 1C)
// ============================================================================
export const TIER1_BRICKS: Brick[] = [
  // --- STRATE 1A : Les Objets du Seuil (10 Briques) ---
  {
    id: 'b_the',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'the',
    variants: [],
    fr: 'le / la / les',
    frAlternatives: ['le', 'la', 'les'],
    ipa: '/ðə/',
    pos: 'determiner',
    audioUkUrl: './audio/tier1/uk_b_the.mp3',
    audioUsUrl: './audio/tier1/us_b_the.mp3',
    mnemonicNote: 'Un seul mot universel pour le masculin, le féminin et le pluriel ! Place le bout de la langue entre les dents pour le son « th ».'
  },
  {
    id: 'b_a',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'a',
    variants: ['an'],
    fr: 'un / une',
    frAlternatives: ['un', 'une'],
    ipa: '/ə/ (ou /æn/)',
    pos: 'determiner',
    audioUkUrl: './audio/tier1/uk_b_a.mp3',
    audioUsUrl: './audio/tier1/us_b_a.mp3',
    mnemonicNote: 'Désigne un objet ou un être parmi d’autres.',
    falseFriendTrap: 'Devient obligatoirement « an » devant un son de voyelle pour éviter un choc de voix (ex: « an old door »).'
  },
  {
    id: 'b_door',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'door',
    variants: ['doors'],
    fr: 'porte',
    frAlternatives: ['la porte', 'une porte'],
    ipa: '/dɔːr/',
    pos: 'noun',
    audioUkUrl: './audio/tier1/uk_b_door.mp3',
    audioUsUrl: './audio/tier1/us_b_door.mp3',
    mnemonicNote: 'Le double « o » se prononce comme un « o » ouvert et long.'
  },
  {
    id: 'b_key',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'key',
    variants: ['keys'],
    fr: 'clé',
    frAlternatives: ['la clé', 'une clé', 'clef'],
    ipa: '/kiː/',
    pos: 'noun',
    audioUkUrl: './audio/tier1/uk_b_key.mp3',
    audioUsUrl: './audio/tier1/us_b_key.mp3',
    mnemonicNote: 'La clé qui ouvre les portes scellées.',
    falseFriendTrap: 'Piège audio majeur : ne se prononce JAMAIS « keille », mais exactement comme le mot français « qui » (/kiː/) !'
  },
  {
    id: 'b_stone',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'stone',
    variants: ['stones'],
    fr: 'pierre',
    frAlternatives: ['la pierre', 'une pierre'],
    ipa: '/stoʊn/',
    pos: 'noun',
    audioUkUrl: './audio/tier1/uk_b_stone.mp3',
    audioUsUrl: './audio/tier1/us_b_stone.mp3',
    mnemonicNote: 'Le « e » final est toujours muet.'
  },
  {
    id: 'b_guard',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'guard',
    variants: ['guards'],
    fr: 'garde',
    frAlternatives: ['le garde', 'un garde', 'gardien'],
    ipa: '/ɡɑːrd/',
    pos: 'noun',
    audioUkUrl: './audio/tier1/uk_b_guard.mp3',
    audioUsUrl: './audio/tier1/us_b_guard.mp3',
    mnemonicNote: 'Cousin direct du français « garde ». Le « u » ne se prononce pas.'
  },
  {
    id: 'b_old',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'old',
    variants: ['olds'],
    fr: 'vieux / vieille / ancien',
    frAlternatives: ['vieux', 'vieille', 'ancien'],
    ipa: '/oʊld/',
    pos: 'adjective',
    audioUkUrl: './audio/tier1/uk_b_old.mp3',
    audioUsUrl: './audio/tier1/us_b_old.mp3',
    mnemonicNote: 'Se place toujours AVANT le nom.',
    falseFriendTrap: 'Piège francophone : les adjectifs anglais sont invariables. « olds » avec un -s n’existe pas comme adjectif !'
  },
  {
    id: 'b_big',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'big',
    variants: [],
    fr: 'grand / gros',
    frAlternatives: ['grand', 'grande', 'gros', 'grosse'],
    ipa: '/bɪɡ/',
    pos: 'adjective',
    audioUkUrl: './audio/tier1/uk_b_big.mp3',
    audioUsUrl: './audio/tier1/us_b_big.mp3',
    mnemonicNote: 'Désigne la taille ou le volume concret d’un objet.'
  },
  {
    id: 'b_small',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'small',
    variants: ['smalls'],
    fr: 'petit / petite',
    frAlternatives: ['petit', 'petite'],
    ipa: '/smɔːl/',
    pos: 'adjective',
    audioUkUrl: './audio/tier1/uk_b_small.mp3',
    audioUsUrl: './audio/tier1/us_b_small.mp3',
    mnemonicNote: 'Le « a » devant « ll » tire vers le son « o » ouvert (/smɔːl/). Invariable au pluriel !'
  },
  {
    id: 'b_cold',
    tierId: 'tier_1',
    subtierId: '1A',
    en: 'cold',
    variants: [],
    fr: 'froid / froide',
    frAlternatives: ['froid', 'froide'],
    ipa: '/koʊld/',
    pos: 'adjective',
    audioUkUrl: './audio/tier1/uk_b_cold.mp3',
    audioUsUrl: './audio/tier1/us_b_cold.mp3',
    mnemonicNote: 'Rime exactement avec « old » (/oʊld/ → /koʊld/).'
  },

  // --- STRATE 1B : Les Êtres et l'État (11 Briques) ---
  {
    id: 'b_i',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'I',
    variants: [],
    fr: 'je',
    frAlternatives: ['je', 'moi'],
    ipa: '/aɪ/',
    pos: 'pronoun',
    audioUkUrl: './audio/tier1/uk_b_i.mp3',
    audioUsUrl: './audio/tier1/us_b_i.mp3',
    mnemonicNote: 'Se prononce « aïe » et s’écrit TOUJOURS avec une majuscule, même au milieu d’une phrase.'
  },
  {
    id: 'b_you',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'you',
    variants: [],
    fr: 'tu / vous',
    frAlternatives: ['tu', 'vous'],
    ipa: '/juː/',
    pos: 'pronoun',
    audioUkUrl: './audio/tier1/uk_b_you.mp3',
    audioUsUrl: './audio/tier1/us_b_you.mp3',
    mnemonicNote: 'Aucune différence entre le tutoiement et le vouvoiement en anglais : « you » sert aux deux !'
  },
  {
    id: 'b_he',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'he',
    variants: [],
    fr: 'il (humain)',
    frAlternatives: ['il'],
    ipa: '/hiː/',
    pos: 'pronoun',
    audioUkUrl: './audio/tier1/uk_b_he.mp3',
    audioUsUrl: './audio/tier1/us_b_he.mp3',
    mnemonicNote: 'Le « h » initial est soufflé.',
    falseFriendTrap: 'Uniquement pour un homme ou un garçon ! Jamais pour un objet masculin comme « le mur » ou « le chemin ».'
  },
  {
    id: 'b_she',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'she',
    variants: [],
    fr: 'elle (humaine)',
    frAlternatives: ['elle'],
    ipa: '/ʃiː/',
    pos: 'pronoun',
    audioUkUrl: './audio/tier1/uk_b_she.mp3',
    audioUsUrl: './audio/tier1/us_b_she.mp3',
    mnemonicNote: 'Se prononce « chi ».',
    falseFriendTrap: 'Uniquement pour une femme ou une fille ! Jamais pour « la porte », « la pierre » ou « la clé ».'
  },
  {
    id: 'b_it',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'it',
    variants: [],
    fr: 'il / elle / ce (objet)',
    frAlternatives: ['il', 'elle', 'ce', 'cela'],
    ipa: '/ɪt/',
    pos: 'pronoun',
    audioUkUrl: './audio/tier1/uk_b_it.mp3',
    audioUsUrl: './audio/tier1/us_b_it.mp3',
    mnemonicNote: 'Le pronom neutre des choses et des lieux.',
    falseFriendTrap: 'Crucial : remplace n’importe quel objet unique (la porte, la pierre, la clé), quel que soit son genre en français.'
  },
  {
    id: 'b_they',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'they',
    variants: [],
    fr: 'ils / elles',
    frAlternatives: ['ils', 'elles'],
    ipa: '/ðeɪ/',
    pos: 'pronoun',
    audioUkUrl: './audio/tier1/uk_b_they.mp3',
    audioUsUrl: './audio/tier1/us_b_they.mp3',
    mnemonicNote: 'Sert au pluriel aussi bien pour des humains que pour plusieurs objets (les portes, les pierres).'
  },
  {
    id: 'b_am',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'am',
    variants: [],
    fr: 'suis (être)',
    frAlternatives: ['suis'],
    ipa: '/æm/',
    pos: 'verb',
    audioUkUrl: './audio/tier1/uk_b_am.mp3',
    audioUsUrl: './audio/tier1/us_b_am.mp3',
    mnemonicNote: 'Marié exclusivement à « I » (« I am »).'
  },
  {
    id: 'b_is',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'is',
    variants: [],
    fr: 'est (être)',
    frAlternatives: ['est'],
    ipa: '/ɪz/',
    pos: 'verb',
    audioUkUrl: './audio/tier1/uk_b_is.mp3',
    audioUsUrl: './audio/tier1/us_b_is.mp3',
    mnemonicNote: 'Le « s » se prononce /z/. S’utilise avec he, she, it ou un nom singulier.',
    falseFriendTrap: 'En anglais, on utilise le verbe être (« I am cold / He is cold ») pour dire « avoir froid ».'
  },
  {
    id: 'b_are',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'are',
    variants: [],
    fr: 'es / êtes / sont',
    frAlternatives: ['es', 'êtes', 'sont'],
    ipa: '/ɑːr/',
    pos: 'verb',
    audioUkUrl: './audio/tier1/uk_b_are.mp3',
    audioUsUrl: './audio/tier1/us_b_are.mp3',
    mnemonicNote: 'S’utilise avec « you », « they » ou des noms au pluriel.'
  },
  {
    id: 'b_not',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'not',
    variants: [],
    fr: 'ne... pas',
    frAlternatives: ['pas', 'ne pas'],
    ipa: '/nɒt/',
    pos: 'particle',
    audioUkUrl: './audio/tier1/uk_b_not.mp3',
    audioUsUrl: './audio/tier1/us_b_not.mp3',
    mnemonicNote: 'Un seul mot qui se place juste APRÈS le verbe être (« is not », « are not », « am not »).'
  },
  {
    id: 'b_here',
    tierId: 'tier_1',
    subtierId: '1B',
    en: 'here',
    variants: [],
    fr: 'ici',
    frAlternatives: ['ici', 'là'],
    ipa: '/hɪər/',
    pos: 'particle',
    audioUkUrl: './audio/tier1/uk_b_here.mp3',
    audioUsUrl: './audio/tier1/us_b_here.mp3',
    mnemonicNote: 'Attention au « h » expiré au début.'
  },

  // --- STRATE 1C : Les Actions et les Illusions (11 Briques) ---
  {
    id: 'b_see',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'see',
    variants: ['sees'],
    fr: 'voir',
    frAlternatives: ['vois', 'voit', 'voient'],
    ipa: '/siː/',
    pos: 'verb',
    audioUkUrl: './audio/tier1/uk_b_see.mp3',
    audioUsUrl: './audio/tier1/us_b_see.mp3',
    mnemonicNote: 'Prend un « -s » avec he / she / it (« sees » prononcé /siːz/).'
  },
  {
    id: 'b_open',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'open',
    variants: ['opens'],
    fr: 'ouvrir / ouvert',
    frAlternatives: ['ouvrir', 'ouvert', 'ouverte'],
    ipa: '/ˈoʊpən/',
    pos: 'verb',
    audioUkUrl: './audio/tier1/uk_b_open.mp3',
    audioUsUrl: './audio/tier1/us_b_open.mp3',
    mnemonicNote: 'Sert à la fois de verbe (« ouvrir ») et d’adjectif (« ouvert »).'
  },
  {
    id: 'b_keep',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'keep',
    variants: ['keeps'],
    fr: 'garder / conserver',
    frAlternatives: ['garder', 'conserver', 'garde'],
    ipa: '/kiːp/',
    pos: 'verb',
    audioUkUrl: './audio/tier1/uk_b_keep.mp3',
    audioUsUrl: './audio/tier1/us_b_keep.mp3',
    mnemonicNote: 'Proche de « key » (/kiː/), mais fermé par un /p/ net à la fin (/kiːp/).'
  },
  {
    id: 'b_wait',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'wait',
    variants: ['waits'],
    fr: 'attendre',
    frAlternatives: ['attend', 'attends', 'attendre'],
    ipa: '/weɪt/',
    pos: 'verb',
    audioUkUrl: './audio/tier1/uk_b_wait.mp3',
    audioUsUrl: './audio/tier1/us_b_wait.mp3',
    mnemonicNote: 'Se prononce /weɪt/. Prend un -s avec he/she/it : « He waits ».'
  },
  {
    id: 'b_have',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'have',
    variants: ['has'],
    fr: 'avoir / posséder',
    frAlternatives: ['avoir', 'posséder', 'ai', 'a', 'ont'],
    ipa: '/hæv/',
    pos: 'verb',
    audioUkUrl: './audio/tier1/uk_b_have.mp3',
    audioUsUrl: './audio/tier1/us_b_have.mp3',
    mnemonicNote: 'Exprime la possession réelle (avoir une clé).',
    falseFriendTrap: 'Attention : avec he / she / it, « have » ne devient JAMAIS « haves » mais « has » (/hæz/) !'
  },
  {
    id: 'b_afraid',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'afraid',
    variants: [],
    fr: 'effrayé (avoir peur)',
    frAlternatives: ['effrayé', 'peur', 'avoir peur'],
    ipa: '/əˈfreɪd/',
    pos: 'adjective',
    audioUkUrl: './audio/tier1/uk_b_afraid.mp3',
    audioUsUrl: './audio/tier1/us_b_afraid.mp3',
    mnemonicNote: 'C’est un adjectif décrivant un état d’esprit.',
    falseFriendTrap: 'Piège majeur : en anglais on n’A pas peur, on EST effrayé (« I am afraid », jamais « I have afraid »).'
  },
  {
    id: 'b_shadow',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'shadow',
    variants: ['shadows'],
    fr: 'ombre',
    frAlternatives: ['ombre', "l'ombre", 'une ombre'],
    ipa: '/ˈʃædoʊ/',
    pos: 'noun',
    audioUkUrl: './audio/tier1/uk_b_shadow.mp3',
    audioUsUrl: './audio/tier1/us_b_shadow.mp3',
    mnemonicNote: 'Commence par le son « ch » (/ʃ/).'
  },
  {
    id: 'b_way',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'way',
    variants: ['ways'],
    fr: 'chemin / issue',
    frAlternatives: ['chemin', 'issue', 'voie'],
    ipa: '/weɪ/',
    pos: 'noun',
    audioUkUrl: './audio/tier1/uk_b_way.mp3',
    audioUsUrl: './audio/tier1/us_b_way.mp3',
    mnemonicNote: 'Proche de « wait » sans le /t/ final.'
  },
  {
    id: 'b_actually',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'actually',
    variants: [],
    fr: 'en réalité / en fait',
    frAlternatives: ['en réalité', 'en fait', 'à vrai dire'],
    ipa: '/ˈæktʃuəli/',
    pos: 'particle',
    audioUkUrl: './audio/tier1/uk_b_actually.mp3',
    audioUsUrl: './audio/tier1/us_b_actually.mp3',
    mnemonicNote: 'Sert à corriger une illusion ou révéler un fait réel.',
    falseFriendTrap: 'Faux-ami célèbre : ne veut JAMAIS dire « actuellement » ! Il signifie « en réalité / en fait ».'
  },
  {
    id: 'b_one',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'one',
    variants: [],
    fr: 'un (chiffre 1)',
    frAlternatives: ['un', '1', 'seul'],
    ipa: '/wʌn/',
    pos: 'determiner',
    audioUkUrl: './audio/tier1/uk_b_one.mp3',
    audioUsUrl: './audio/tier1/us_b_one.mp3',
    mnemonicNote: 'Se prononce /wʌn/ (commence par un son « ou », comme « ouane »).'
  },
  {
    id: 'b_three',
    tierId: 'tier_1',
    subtierId: '1C',
    en: 'three',
    variants: ['tree'],
    fr: 'trois (chiffre 3)',
    frAlternatives: ['trois', '3'],
    ipa: '/θriː/',
    pos: 'determiner',
    audioUkUrl: './audio/tier1/uk_b_three.mp3',
    audioUsUrl: './audio/tier1/us_b_three.mp3',
    mnemonicNote: 'Langue entre les dents sur le « th ».',
    falseFriendTrap: 'Sans le « h », « tree » (/triː/) veut dire un ARBRE !'
  }
];

// ============================================================================
// LES 3 FORMULES GRAMMATICALES DU PALIER 1
// ============================================================================
export const TIER1_FORMULAS: Formula[] = [
  {
    id: 'f_1a',
    tierId: 'tier_1',
    subtierId: '1A',
    name: "Formule I : L'Antéposition Immuable",
    subtitle: "Ordre de l'adjectif, invariabilité au pluriel et mutation phonétique a / an",
    patternSlots: [
      { id: 'slot_det', label: 'Déterminant (the / a / an)', pos: 'determiner' },
      { id: 'slot_adj', label: 'Adjectif (old / big / cold)', pos: 'adjective' },
      { id: 'slot_noun', label: 'Nom (door / stone / keys)', pos: 'noun' }
    ],
    inductiveSteles: [
      {
        enBricks: ['A', 'cold', 'stone'],
        frTranslation: 'Une pierre froide',
        highlightNote: 'Observe la position de « cold » (froide) : l’adjectif se place toujours AVANT le nom « stone ».'
      },
      {
        enBricks: ['An', 'old', 'key'],
        frTranslation: 'Une vieille clé',
        highlightNote: 'Devant le son de voyelle de « old », l’article « a » devient « an » pour éviter le choc de voyelles.'
      },
      {
        enBricks: ['The', 'old', 'doors'],
        frTranslation: 'Les vieilles portes',
        highlightNote: '« doors » prend un -s au pluriel, mais l’adjectif « old » reste invariable (jamais « olds ») !'
      }
    ],
    trapQuestion: {
      question: "En observant la 3e stèle (« The old doors »), que se passe-t-il sur l'adjectif « old » au pluriel ?",
      options: [
        { id: 'opt_1', text: "Il ne prend jamais de -S : l'adjectif anglais est totalement invariable.", isCorrect: true },
        { id: 'opt_2', text: "Il prend un -S comme en français (olds doors).", isCorrect: false },
        { id: 'opt_3', text: "Il se déplace après le nom quand il est au pluriel.", isCorrect: false }
      ]
    },
    coreRuleSummary: "1) L'adjectif anglais se place toujours AVANT le nom (a cold stone). 2) Il est totalement invariable et ne prend jamais de -s au pluriel (old doors). 3) Devant un son de voyelle, 'a' devient 'an' (an old key).",
    frenchTrapWarning: "Ne calque jamais l'ordre français (« a stone cold ») et n'ajoute jamais de -s à un adjectif (« the smalls doors »)."
  },
  {
    id: 'f_1b',
    tierId: 'tier_1',
    subtierId: '1B',
    name: "Formule II : Le Pilier d'État & La Neutralité des Choses",
    subtitle: "Verbe être (am/is/are), bouclier négatif 'not', pronom neutre 'it' et états physiques",
    patternSlots: [
      { id: 'slot_subj', label: 'Sujet (I / He / It / The key)', pos: 'pronoun' },
      { id: 'slot_be', label: 'Verbe Être (am / is / are)', pos: 'verb' },
      { id: 'slot_not', label: 'Négation (not - optionnel)', pos: 'particle', optional: true },
      { id: 'slot_attr', label: 'Adjectif ou Lieu (cold / small / here)', pos: 'adjective' }
    ],
    inductiveSteles: [
      {
        enBricks: ['The', 'key', 'is', 'not', 'here'],
        frTranslation: "La clé n'est pas ici.",
        highlightNote: 'En français la négation entoure le verbe (ne... pas). En anglais, un seul mot « not » se place juste APRÈS le verbe être.'
      },
      {
        enBricks: ['It', 'is', 'a', 'big', 'door'],
        frTranslation: "C'est (Elle est) une grande porte.",
        highlightNote: 'Les objets n’ont pas de genre sexué : la porte (féminin en FR) est remplacée par « it », jamais par « she ».'
      },
      {
        enBricks: ['I', 'am', 'cold'],
        frTranslation: "J'ai froid (litt. : Je suis froid).",
        highlightNote: 'Les états du corps utilisent le verbe ÊTRE (am/is/are) et non le verbe avoir : « I am cold ».'
      }
    ],
    trapQuestion: {
      question: "Quel pronom remplace « la vieille clé » (féminin en français) et quel verbe exprime « avoir froid » ?",
      options: [
        { id: 'opt_1', text: "Le pronom 'she' et le verbe avoir.", isCorrect: false },
        { id: 'opt_2', text: "Le pronom neutre 'it' (objet inanimé), et le verbe être ('I am cold').", isCorrect: true },
        { id: 'opt_3', text: "Le pronom 'he' et la négation 'not' placée avant le verbe.", isCorrect: false }
      ]
    },
    coreRuleSummary: "1) Un seul mot 'not' placé juste après am/is/are suffit pour nier. 2) Tout objet singulier est neutre ('it'), jamais 'he' ou 'she'. 3) Les états physiques et émotionnels (avoir froid, avoir peur) utilisent le verbe ÊTRE (I am cold).",
    frenchTrapWarning: "Ne traduis jamais « La clé, elle est ici » par « she is here » (c'est un objet → « it is here ») ni « J'ai froid » par « I have cold »."
  },
  {
    id: 'f_1c',
    tierId: 'tier_1',
    subtierId: '1C',
    name: "Formule III : Le Sceau du Singulier (-S)",
    subtitle: "Actions au présent, mutation have → has et Paradoxe du S",
    patternSlots: [
      { id: 'slot_subj3', label: 'Sujet Singulier 3e pers. (He / She / It / The guard)', pos: 'noun' },
      { id: 'slot_verb_s', label: 'Verbe d’action + S (sees / keeps / waits / has)', pos: 'verb' },
      { id: 'slot_obj', label: 'Objet (the key / a shadow)', pos: 'noun' }
    ],
    inductiveSteles: [
      {
        enBricks: ['I', 'see', 'the', 'guard.', 'He', 'sees', 'the', 'guard.'],
        frTranslation: 'Je vois le garde. Il voit le garde.',
        highlightNote: 'Dès que le sujet est un seul individu ou objet tiers (He / She / It / The guard), le verbe reçoit le sceau « -s » (sees).'
      },
      {
        enBricks: ['They', 'have', 'the', 'key.', 'She', 'has', 'the', 'key.'],
        frTranslation: 'Ils ont la clé. Elle a la clé.',
        highlightNote: 'Exception majeure : avec He/She/It, « have » + « -s » se contracte en « has » (jamais « haves ») !'
      },
      {
        enBricks: ['One', 'guard', 'waits.', 'Three', 'guards', 'wait.'],
        frTranslation: 'Un garde attend. Trois gardes attendent.',
        highlightNote: 'Le Paradoxe du S : le -s sur un nom marque le pluriel (guards), mais le -s sur un verbe marque le SINGULIER (waits) !'
      }
    ],
    trapQuestion: {
      question: "En quoi consiste le « Paradoxe du S » entre les noms et les verbes en anglais ?",
      options: [
        { id: 'opt_1', text: "Le -s sur un nom marque le pluriel (three guards), mais le -s sur un verbe marque le SINGULIER (one guard waits, three guards wait).", isCorrect: true },
        { id: 'opt_2', text: "Le verbe prend un -s uniquement au pluriel avec 'they'.", isCorrect: false },
        { id: 'opt_3', text: "Le verbe 'have' devient 'haves' au singulier.", isCorrect: false }
      ]
    },
    coreRuleSummary: "1) Au présent, avec he, she, it ou un nom singulier, le verbe d'action reçoit un -s (sees, opens, keeps, waits). 2) 'have' devient 'has'. 3) Au pluriel (they, three guards), le verbe ne prend JAMAIS de -s.",
    frenchTrapWarning: "Ne mets jamais de -s au verbe après un sujet pluriel : « The three guards sees » est un piège → « The three guards see » !"
  }
];

// ============================================================================
// BANQUE D'EXERCICES COMPLÈTE DU PALIER 1 (18 Exercices, 4 Types, 3 Strates)
// ============================================================================
export const TIER1_EXERCISES: Exercise[] = [
  // ================= STRATE 1A (6 Exercices) =================
  {
    id: 'ex_1a_1',
    tierId: 'tier_1',
    subtierId: '1A',
    type: 'assemble_fr_en',
    promptText: 'Une vieille clé',
    spokenTarget: 'An old key',
    targetSequence: ['An', 'old', 'key'],
    distractorPool: ['A', 'keys', 'olds', 'the'],
    requiredBrickIds: ['b_a', 'b_old', 'b_key'],
    requiredFormulaIds: ['f_1a'],
    defaultErrorFeedback: 'Formule I : l’adjectif (« old ») se place avant le nom (« key »), et « A » devient « An » devant le son de voyelle de « old ».',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'A',
        errorCategory: 'phonetic',
        explanation: 'Presque ! « Old » commence par un son de voyelle (/oʊ/). Pour que la phrase coule à l’oreille, « a » se transforme obligatoirement en « an » devant un son de voyelle : « An old key ».',
        ruleReminder: 'Devant un son de voyelle (old) : a → an.'
      },
      {
        triggerBrickOrChoice: 'olds',
        errorCategory: 'morphology',
        explanation: 'La brique « olds » est un piège ! En anglais, les adjectifs sont invariables et ne prennent jamais de -s.',
        ruleReminder: 'Adjectif toujours invariable : old.'
      },
      {
        triggerBrickOrChoice: 'WORD_ORDER',
        errorCategory: 'word_order',
        explanation: 'C’est le réflexe français ! En anglais (Formule I), l’adjectif (« old ») se place toujours AVANT le nom qu’il décrit (« key »).',
        ruleReminder: '[Déterminant] + [Adjectif] + [Nom] → An old key.'
      }
    ]
  },
  {
    id: 'ex_1a_2',
    tierId: 'tier_1',
    subtierId: '1A',
    type: 'corrupted_brick',
    promptText: 'Les petites portes',
    spokenTarget: 'The small doors',
    corruptedInitialSequence: ['The', 'smalls', 'doors'],
    targetSequence: ['The', 'small', 'doors'],
    distractorPool: ['small', 'door', 'a'],
    requiredBrickIds: ['b_the', 'b_small', 'b_door'],
    requiredFormulaIds: ['f_1a'],
    defaultErrorFeedback: 'En anglais, les adjectifs sont invariables. Même s’il y a plusieurs portes (« doors » avec un -s), l’adjectif « small » ne prend jamais de -s !',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'smalls',
        errorCategory: 'morphology',
        explanation: 'En anglais, les adjectifs sont invariables. Même s’il y a plusieurs portes (« doors » avec un -s), l’adjectif « small » ne prend jamais de -s !',
        ruleReminder: 'Pluriel sur le nom uniquement : The small doors.'
      }
    ]
  },
  {
    id: 'ex_1a_3',
    tierId: 'tier_1',
    subtierId: '1A',
    type: 'mirror_trap',
    promptText: 'Comment traduire « La grande pierre froide » ?',
    spokenTarget: 'The big cold stone',
    targetSequence: ['The', 'big', 'cold', 'stone'],
    distractorPool: [],
    mirrorChoices: [
      { id: 'c_calque', text: 'The stone big and cold', isCorrect: false },
      { id: 'c_ok', text: 'The big cold stone', isCorrect: true },
      { id: 'c_det', text: 'A big cold stone', isCorrect: false }
    ],
    requiredBrickIds: ['b_the', 'b_big', 'b_cold', 'b_stone'],
    requiredFormulaIds: ['f_1a'],
    defaultErrorFeedback: 'Même quand il y a deux adjectifs (« big » et « cold »), ils se placent tous les deux AVANT le nom « stone ».',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'c_calque',
        errorCategory: 'word_order',
        explanation: 'Piège de l’ordre des mots : même quand il y a deux adjectifs (« big » et « cold »), ils se placent tous les deux AVANT le nom « stone ».',
        ruleReminder: 'Tous les adjectifs précèdent le nom : The big cold stone.'
      },
      {
        triggerBrickOrChoice: 'c_det',
        errorCategory: 'false_friend',
        explanation: '« A » veut dire « une » (indéfini). Ici on parle de « LA grande pierre froide » : il faut utiliser « The ».',
        ruleReminder: 'The = le / la / les | A = un / une.'
      }
    ]
  },
  {
    id: 'ex_1a_4',
    tierId: 'tier_1',
    subtierId: '1A',
    type: 'translate_en_fr',
    promptText: 'An old guard, a cold door.',
    spokenTarget: 'An old guard, a cold door.',
    targetSequence: ['Un vieux garde,', 'une porte froide.'],
    distractorPool: ['Le vieux garde,', 'un garde froid,', 'les vieilles portes.'],
    requiredBrickIds: ['b_a', 'b_old', 'b_guard', 'b_cold', 'b_door'],
    requiredFormulaIds: ['f_1a'],
    defaultErrorFeedback: '« An old guard » = Un vieux garde ; « a cold door » = une porte froide.',
    specificFeedbacks: []
  },
  {
    id: 'ex_1a_5',
    tierId: 'tier_1',
    subtierId: '1A',
    type: 'assemble_fr_en',
    promptText: 'Les vieilles pierres, les petites clés',
    spokenTarget: 'The old stones, the small keys',
    targetSequence: ['The', 'old', 'stones,', 'the', 'small', 'keys'],
    distractorPool: ['olds', 'smalls', 'stone', 'key'],
    requiredBrickIds: ['b_the', 'b_old', 'b_stone', 'b_small', 'b_key'],
    requiredFormulaIds: ['f_1a'],
    defaultErrorFeedback: 'Les noms prennent un -s au pluriel (« stones », « keys »), mais les adjectifs « old » et « small » restent invariables !',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'olds',
        errorCategory: 'morphology',
        explanation: 'Piège d’accord français ! « old » ne prend jamais de -s, même devant « stones ».',
        ruleReminder: 'The old stones (jamais olds).'
      },
      {
        triggerBrickOrChoice: 'smalls',
        errorCategory: 'morphology',
        explanation: 'Piège d’accord français ! « small » est un adjectif et reste invariable devant « keys ».',
        ruleReminder: 'The small keys (jamais smalls).'
      }
    ]
  },
  {
    id: 'ex_1a_6',
    tierId: 'tier_1',
    subtierId: '1A',
    type: 'corrupted_brick',
    promptText: 'Une vieille porte',
    spokenTarget: 'An old door',
    corruptedInitialSequence: ['A', 'old', 'door'],
    targetSequence: ['An', 'old', 'door'],
    distractorPool: ['An', 'The', 'doors'],
    requiredBrickIds: ['b_a', 'b_old', 'b_door'],
    requiredFormulaIds: ['f_1a'],
    defaultErrorFeedback: 'Devant « old » qui commence par un son de voyelle (/oʊ/), « A » est corrompu : il doit devenir « An » !',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'A',
        errorCategory: 'phonetic',
        explanation: 'Devant le son de voyelle de « old », l’article indéfini « A » se mute obligatoirement en « An ».',
        ruleReminder: 'An old door.'
      }
    ]
  },

  // ================= STRATE 1B (6 Exercices) =================
  {
    id: 'ex_1b_1',
    tierId: 'tier_1',
    subtierId: '1B',
    type: 'assemble_fr_en',
    promptText: 'La clé est petite, elle est ici.',
    spokenTarget: 'The key is small, it is here.',
    targetSequence: ['The', 'key', 'is', 'small,', 'it', 'is', 'here.'],
    distractorPool: ['she', 'are', 'he', 'a'],
    requiredBrickIds: ['b_the', 'b_key', 'b_is', 'b_small', 'b_it', 'b_here'],
    requiredFormulaIds: ['f_1a', 'f_1b'],
    defaultErrorFeedback: 'Une clé est un objet inanimé : en anglais, « elle » se traduit obligatoirement par le pronom neutre « it » !',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'she',
        errorCategory: 'false_friend',
        explanation: 'Piège classique du genre français ! En français, « la clé » est féminin (« elle »). Mais en anglais, « she » est réservé aux femmes humaines. Une clé est un objet inanimé : on utilise obligatoirement le pronom neutre « it ».',
        ruleReminder: 'Objet inanimé singulier = IT (jamais she ou he).'
      },
      {
        triggerBrickOrChoice: 'are',
        errorCategory: 'morphology',
        explanation: '« Are » s’utilise au pluriel ou avec « you ». Pour un seul objet (« the key » / « it »), le verbe être est toujours « is ».',
        ruleReminder: 'It is / The key is.'
      }
    ]
  },
  {
    id: 'ex_1b_2',
    tierId: 'tier_1',
    subtierId: '1B',
    type: 'mirror_trap',
    promptText: 'Tu explores le couloir glacial et tu veux dire : « Je n’ai pas froid. »',
    spokenTarget: 'I am not cold.',
    targetSequence: ['I', 'am', 'not', 'cold.'],
    distractorPool: [],
    mirrorChoices: [
      { id: 'c_have', text: 'I have not cold.', isCorrect: false },
      { id: 'c_order', text: 'I not am cold.', isCorrect: false },
      { id: 'c_ok', text: 'I am not cold.', isCorrect: true }
    ],
    requiredBrickIds: ['b_i', 'b_am', 'b_not', 'b_cold'],
    requiredFormulaIds: ['f_1b'],
    defaultErrorFeedback: 'En anglais on « est » froid (« I am not cold »), et « not » se place toujours après le verbe être.',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'c_have',
        errorCategory: 'literal_translation',
        explanation: 'En français on « a » froid, mais en anglais le froid est un état dans lequel on se trouve : on « est » froid (« I am cold » / « I am not cold »). N’utilise jamais le verbe « have » pour le froid, la faim ou la peur !',
        ruleReminder: 'Avoir froid = to be cold (I am not cold).'
      },
      {
        triggerBrickOrChoice: 'c_order',
        errorCategory: 'word_order',
        explanation: 'En anglais, la particule « not » se place toujours APRÈS le verbe être (« am not »), jamais avant.',
        ruleReminder: 'I am not / He is not / They are not.'
      }
    ]
  },
  {
    id: 'ex_1b_3',
    tierId: 'tier_1',
    subtierId: '1B',
    type: 'translate_en_fr',
    promptText: 'They are old stones, they are not doors.',
    spokenTarget: 'They are old stones, they are not doors.',
    targetSequence: ['Ce sont', 'de vieilles pierres,', 'ce ne sont pas', 'des portes.'],
    distractorPool: ['Ils ont', 'une vieille pierre,', 'elles sont pas', 'la porte.'],
    requiredBrickIds: ['b_they', 'b_are', 'b_old', 'b_stone', 'b_not', 'b_door'],
    requiredFormulaIds: ['f_1a', 'f_1b'],
    defaultErrorFeedback: 'Au pluriel, « they are » pour des objets se traduit naturellement par « ce sont / elles sont ».',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'Ils ont',
        errorCategory: 'false_friend',
        explanation: 'Attention : « are » est le verbe ÊTRE (sont), et non le verbe avoir (ont) !',
        ruleReminder: 'They are = Ils/Elles sont / Ce sont.'
      }
    ]
  },
  {
    id: 'ex_1b_4',
    tierId: 'tier_1',
    subtierId: '1B',
    type: 'corrupted_brick',
    promptText: 'La grande porte n’est pas ici, elle est vieille.',
    spokenTarget: 'The big door is not here, it is old.',
    corruptedInitialSequence: ['The', 'big', 'door', 'is', 'not', 'here,', 'she', 'is', 'old.'],
    targetSequence: ['The', 'big', 'door', 'is', 'not', 'here,', 'it', 'is', 'old.'],
    distractorPool: ['it', 'he', 'they', 'are'],
    requiredBrickIds: ['b_the', 'b_big', 'b_door', 'b_is', 'b_not', 'b_here', 'b_it', 'b_old'],
    requiredFormulaIds: ['f_1b'],
    defaultErrorFeedback: 'La brique « she » est corrompue : « The big door » est un objet inanimé, il faut utiliser « it » !',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'she',
        errorCategory: 'false_friend',
        explanation: 'Une porte est un objet inanimé : en anglais elle est neutre (« it »), jamais « she ».',
        ruleReminder: 'The door → it.'
      }
    ]
  },
  {
    id: 'ex_1b_5',
    tierId: 'tier_1',
    subtierId: '1B',
    type: 'assemble_fr_en',
    promptText: 'Tu es un garde, tu n’as pas froid.',
    spokenTarget: 'You are a guard, you are not cold.',
    targetSequence: ['You', 'are', 'a', 'guard,', 'you', 'are', 'not', 'cold.'],
    distractorPool: ['is', 'have', 'am', 'an'],
    requiredBrickIds: ['b_you', 'b_are', 'b_a', 'b_guard', 'b_not', 'b_cold'],
    requiredFormulaIds: ['f_1b'],
    defaultErrorFeedback: 'Avec « You », le verbe être est toujours « are », et « avoir froid » se construit avec être (« you are not cold »).',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'is',
        errorCategory: 'morphology',
        explanation: 'Même quand « you » désigne une seule personne (« tu »), il prend toujours la forme verbale « are » (jamais « you is ») !',
        ruleReminder: 'You are (singulier et pluriel).'
      },
      {
        triggerBrickOrChoice: 'have',
        errorCategory: 'literal_translation',
        explanation: 'Piège du français « tu n’as pas froid » ! En anglais, le froid est un état : « you are not cold ».',
        ruleReminder: 'You are not cold.'
      }
    ]
  },
  {
    id: 'ex_1b_6',
    tierId: 'tier_1',
    subtierId: '1B',
    type: 'mirror_trap',
    promptText: 'Le garde regarde le vieux mur de pierre et dit : « Il est froid. » (en parlant du mur/de la pierre)',
    spokenTarget: 'It is cold.',
    targetSequence: ['It', 'is', 'cold.'],
    distractorPool: [],
    mirrorChoices: [
      { id: 'c_he', text: 'He is cold.', isCorrect: false },
      { id: 'c_it', text: 'It is cold.', isCorrect: true },
      { id: 'c_are', text: 'It are cold.', isCorrect: false }
    ],
    requiredBrickIds: ['b_it', 'b_is', 'b_cold'],
    requiredFormulaIds: ['f_1b'],
    defaultErrorFeedback: 'Pour un objet (même masculin en français), on utilise « It is cold ». « He is cold » voudrait dire qu’un homme a froid !',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'c_he',
        errorCategory: 'false_friend',
        explanation: 'Contresens majeur ! « He is cold » signifie qu’un homme a froid. Pour dire qu’un objet est froid au toucher, il faut utiliser le pronom des choses : « It is cold » !',
        ruleReminder: 'He is cold = Il (un homme) a froid | It is cold = C’est froid (un objet).'
      }
    ]
  },

  // ================= STRATE 1C (6 Exercices) =================
  {
    id: 'ex_1c_1',
    tierId: 'tier_1',
    subtierId: '1C',
    type: 'assemble_fr_en',
    promptText: 'Le vieux garde a trois clés. Il attend.',
    spokenTarget: 'The old guard has three keys. He waits.',
    targetSequence: ['The', 'old', 'guard', 'has', 'three', 'keys.', 'He', 'waits.'],
    distractorPool: ['have', 'wait', 'key', 'it', 'tree'],
    requiredBrickIds: ['b_the', 'b_old', 'b_guard', 'b_have', 'b_three', 'b_key', 'b_he', 'b_wait'],
    requiredFormulaIds: ['f_1a', 'f_1c'],
    defaultErrorFeedback: 'Formule III : avec « The old guard » et « He », « have » devient « has » et « wait » prend un -s (« waits »).',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'have',
        errorCategory: 'morphology',
        explanation: 'Le sujet est « The old guard » (3e personne du singulier, équivalent à « He »). Selon la Formule III, le verbe prend la marque du singulier : « have » se transforme en « has » !',
        ruleReminder: 'He / She / It / The guard + HAS.'
      },
      {
        triggerBrickOrChoice: 'wait',
        errorCategory: 'morphology',
        explanation: 'Oubli du Sceau du Singulier (Formule III) ! Avec « He », le verbe d’action prend toujours un -s : « He waits ».',
        ruleReminder: 'He waits.'
      },
      {
        triggerBrickOrChoice: 'tree',
        errorCategory: 'phonetic',
        explanation: 'Attention à l’orthographe et au son : « three » (avec un H) veut dire « trois ». Sans le H, « tree » est un arbre !',
        ruleReminder: 'Three = 3 | Tree = arbre.'
      }
    ]
  },
  {
    id: 'ex_1c_2',
    tierId: 'tier_1',
    subtierId: '1C',
    type: 'mirror_trap',
    promptText: 'Comment traduire : « En réalité, elle a peur. » ?',
    spokenTarget: 'Actually, she is afraid.',
    targetSequence: ['Actually,', 'she', 'is', 'afraid.'],
    distractorPool: [],
    mirrorChoices: [
      { id: 'c_fear', text: 'Actually, she has afraid.', isCorrect: false },
      { id: 'c_ok', text: 'Actually, she is afraid.', isCorrect: true },
      { id: 'c_here', text: 'Here, she is afraid.', isCorrect: false }
    ],
    requiredBrickIds: ['b_actually', 'b_she', 'b_is', 'b_afraid'],
    requiredFormulaIds: ['f_1b', 'f_1c'],
    defaultErrorFeedback: 'Deux points cruciaux ici : 1) « Actually » est un faux-ami célèbre qui veut dire « En réalité / En fait » (et jamais « actuellement »). 2) Comme pour « avoir froid » (« be cold »), « avoir peur » se construit avec le verbe être : « she is afraid ».',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'c_fear',
        errorCategory: 'literal_translation',
        explanation: 'Double piège ! « Afraid » est un adjectif (« effrayée »). Comme pour « avoir froid » (be cold), « avoir peur » se construit avec le verbe ÊTRE : « she is afraid » (jamais « she has afraid »).',
        ruleReminder: 'Avoir peur = to be afraid (she is afraid).'
      },
      {
        triggerBrickOrChoice: 'c_here',
        errorCategory: 'false_friend',
        explanation: '« Here » veut dire « ici ». Pour dire « En réalité / En fait », l’anglais utilise « Actually ».',
        ruleReminder: 'Actually = En réalité.'
      }
    ]
  },
  {
    id: 'ex_1c_3',
    tierId: 'tier_1',
    subtierId: '1C',
    type: 'corrupted_brick',
    promptText: 'Les trois gardes voient une ombre.',
    spokenTarget: 'The three guards see a shadow.',
    corruptedInitialSequence: ['The', 'three', 'guards', 'sees', 'a', 'shadow.'],
    targetSequence: ['The', 'three', 'guards', 'see', 'a', 'shadow.'],
    distractorPool: ['see', 'guard', 'is'],
    requiredBrickIds: ['b_the', 'b_three', 'b_guard', 'b_see', 'b_a', 'b_shadow'],
    requiredFormulaIds: ['f_1c'],
    defaultErrorFeedback: 'C’est le Paradoxe du S ! En anglais, le verbe ne prend « -s » (« sees ») qu’au SINGULIER (he/she/it). Au pluriel (« The three guards » = « they »), le verbe reste nu : « see » !',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'sees',
        errorCategory: 'morphology',
        explanation: 'C’est le Paradoxe du S ! En français, on est tenté de mettre un « s » partout au pluriel. En anglais, le verbe ne prend « -s » (« sees ») qu’au SINGULIER (he/she/it). Au pluriel (« The three guards » = « they »), le verbe reste nu : « see » !',
        ruleReminder: 'The guard sees (singulier) ↔ The guards see (pluriel).'
      }
    ]
  },
  {
    id: 'ex_1c_4',
    tierId: 'tier_1',
    subtierId: '1C',
    type: 'assemble_fr_en',
    promptText: 'Elle ouvre une porte, elle garde la clé.',
    spokenTarget: 'She opens one door, she keeps the key.',
    targetSequence: ['She', 'opens', 'one', 'door,', 'she', 'keeps', 'the', 'key.'],
    distractorPool: ['open', 'keep', 'doors', 'has'],
    requiredBrickIds: ['b_she', 'b_open', 'b_one', 'b_door', 'b_keep', 'b_the', 'b_key'],
    requiredFormulaIds: ['f_1c'],
    defaultErrorFeedback: 'Avec le sujet singulier « She », les deux verbes d’action portent le Sceau du Singulier : « opens » et « keeps ».',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'open',
        errorCategory: 'morphology',
        explanation: 'Après « She » (3e personne du singulier), le verbe « open » prend un -s : « She opens ».',
        ruleReminder: 'She opens.'
      },
      {
        triggerBrickOrChoice: 'keep',
        errorCategory: 'morphology',
        explanation: 'Après « she », le verbe « keep » prend un -s : « she keeps ».',
        ruleReminder: 'She keeps.'
      }
    ]
  },
  {
    id: 'ex_1c_5',
    tierId: 'tier_1',
    subtierId: '1C',
    type: 'translate_en_fr',
    promptText: 'Actually, they have one way, they are not afraid.',
    spokenTarget: 'Actually, they have one way, they are not afraid.',
    targetSequence: ['En réalité,', 'ils ont', 'une issue,', "ils n'ont pas", 'peur.'],
    distractorPool: ['Actuellement,', 'ils sont', 'trois chemins,', 'ils ne sont pas', 'froids.'],
    requiredBrickIds: ['b_actually', 'b_they', 'b_have', 'b_one', 'b_way', 'b_are', 'b_not', 'b_afraid'],
    requiredFormulaIds: ['f_1b', 'f_1c'],
    defaultErrorFeedback: '« Actually » = En réalité (jamais actuellement !) ; « one way » = une issue / un chemin ; « they are not afraid » = ils n’ont pas peur.',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'Actuellement,',
        errorCategory: 'false_friend',
        explanation: 'Tu es tombé dans le faux-ami numéro 1 entre le français et l’anglais ! « Actually » ne veut JAMAIS dire « Actuellement », mais « En réalité / En fait ».',
        ruleReminder: 'Actually = En réalité / En fait.'
      }
    ]
  },
  {
    id: 'ex_1c_6',
    tierId: 'tier_1',
    subtierId: '1C',
    type: 'corrupted_brick',
    promptText: 'Le garde a la clé, elle ouvre la grande porte.',
    spokenTarget: 'The guard has the key, it opens the big door.',
    corruptedInitialSequence: ['The', 'guard', 'has', 'the', 'key,', 'she', 'opens', 'the', 'big', 'door.'],
    targetSequence: ['The', 'guard', 'has', 'the', 'key,', 'it', 'opens', 'the', 'big', 'door.'],
    distractorPool: ['it', 'open', 'have', 'he'],
    requiredBrickIds: ['b_the', 'b_guard', 'b_have', 'b_key', 'b_it', 'b_open', 'b_big', 'b_door'],
    requiredFormulaIds: ['f_1a', 'f_1b', 'f_1c'],
    defaultErrorFeedback: 'Ici « elle » désigne « la clé » qui ouvre la porte ! Comme une clé est un objet, remplace « she » par « it » (« it opens »).',
    specificFeedbacks: [
      {
        triggerBrickOrChoice: 'she',
        errorCategory: 'false_friend',
        explanation: '« Elle ouvre la grande porte » parle de la clé (« the key »). En anglais, un objet est toujours « it » : « it opens the big door » !',
        ruleReminder: 'The key → it opens.'
      }
    ]
  }
];

// ============================================================================
// LES 15 PHRASES DU BOSS AUDIO : « LE GARDIEN DU SEUIL » (10 RANGS + 5 VARIANTES)
// ============================================================================
export const BOSS_CHALLENGES: BossChallenge[] = [
  // --- ACTE I (Rangs 1 à 5) : L'Écho de Pierre (Transcription piégée EN, briques muettes) ---
  {
    id: 'boss_1_main',
    tierId: 'tier_1',
    act: 1,
    difficultyRank: 1,
    audioBossUrl: './audio/tier1/boss_1_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_1_main.mp3',
    spokenEnglishTranscript: 'An old stone.',
    targetSequence: ['An', 'old', 'stone'],
    distractorPool: ['A', 'cold', 'stones', 'one'],
    requiredBrickIds: ['b_a', 'b_old', 'b_stone'],
    requiredFormulaIds: ['f_1a'],
    failureExplanation: 'Piège testé : entendre la liaison /ən_oʊld/ (« An » vs « A ») et distinguer /oʊld/ (« old ») de /koʊld/ (« cold »).'
  },
  {
    id: 'boss_1_var',
    tierId: 'tier_1',
    act: 1,
    difficultyRank: 1,
    audioBossUrl: './audio/tier1/boss_1_var.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_1_var.mp3',
    spokenEnglishTranscript: 'A cold shadow waits here.',
    targetSequence: ['A', 'cold', 'shadow', 'waits', 'here'],
    distractorPool: ['wait', 'old', 'shadows', 'are'],
    requiredBrickIds: ['b_a', 'b_cold', 'b_shadow', 'b_wait', 'b_here'],
    requiredFormulaIds: ['f_1a', 'f_1c'],
    failureExplanation: 'Le Gardien a dit : « A cold shadow waits here. » Comme « A cold shadow » est singulier, le verbe prend -s (« waits »).'
  },
  {
    id: 'boss_2_main',
    tierId: 'tier_1',
    act: 1,
    difficultyRank: 2,
    audioBossUrl: './audio/tier1/boss_2_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_2_main.mp3',
    spokenEnglishTranscript: 'The big door is not open.',
    targetSequence: ['The', 'big', 'door', 'is', 'not', 'open'],
    distractorPool: ['are', 'doors', 'opens', 'it'],
    requiredBrickIds: ['b_the', 'b_big', 'b_door', 'b_is', 'b_not', 'b_open'],
    requiredFormulaIds: ['f_1a', 'f_1b'],
    failureExplanation: 'Piège testé : distinguer le singulier « door is » de « doors are » et ne pas mettre -s à l’adjectif « open ».'
  },
  {
    id: 'boss_3_main',
    tierId: 'tier_1',
    act: 1,
    difficultyRank: 3,
    audioBossUrl: './audio/tier1/boss_3_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_3_main.mp3',
    spokenEnglishTranscript: 'She keeps one small key.',
    targetSequence: ['She', 'keeps', 'one', 'small', 'key'],
    distractorPool: ['keep', 'keys', 'he', 'a'],
    requiredBrickIds: ['b_she', 'b_keep', 'b_one', 'b_small', 'b_key'],
    requiredFormulaIds: ['f_1a', 'f_1c'],
    failureExplanation: 'Piège testé : entendre la différence entre « keeps » (/kiːps/) et « key » (/kiː/), et vérifier l’accord singulier « She keeps ».'
  },
  {
    id: 'boss_3_var',
    tierId: 'tier_1',
    act: 1,
    difficultyRank: 3,
    audioBossUrl: './audio/tier1/boss_3_var.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_3_var.mp3',
    spokenEnglishTranscript: 'You have one way, it is open.',
    targetSequence: ['You', 'have', 'one', 'way,', 'it', 'is', 'open'],
    distractorPool: ['has', 'waits', 'opens', 'he'],
    requiredBrickIds: ['b_you', 'b_have', 'b_one', 'b_way', 'b_it', 'b_is', 'b_open'],
    requiredFormulaIds: ['f_1b', 'f_1c'],
    failureExplanation: 'Le Gardien a dit : « You have one way, it is open. » Avec « You », le verbe est « have », et « one way » est repris par « it ».'
  },
  {
    id: 'boss_4_main',
    tierId: 'tier_1',
    act: 1,
    difficultyRank: 4,
    audioBossUrl: './audio/tier1/boss_4_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_4_main.mp3',
    spokenEnglishTranscript: 'Three guards see the shadow.',
    targetSequence: ['Three', 'guards', 'see', 'the', 'shadow'],
    distractorPool: ['Tree', 'guard', 'sees', 'shadows'],
    requiredBrickIds: ['b_three', 'b_guard', 'b_see', 'b_the', 'b_shadow'],
    requiredFormulaIds: ['f_1c'],
    failureExplanation: 'Piège testé : comme « Three guards » est au pluriel, le verbe est « see » (sans -s). De plus, la brique muette « Tree » (arbre) piège ceux qui oublient le H de « Three » (3).'
  },
  {
    id: 'boss_4_var',
    tierId: 'tier_1',
    act: 1,
    difficultyRank: 4,
    audioBossUrl: './audio/tier1/boss_4_var.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_4_var.mp3',
    spokenEnglishTranscript: 'They see three old stones.',
    targetSequence: ['They', 'see', 'three', 'old', 'stones'],
    distractorPool: ['sees', 'tree', 'olds', 'stone'],
    requiredBrickIds: ['b_they', 'b_see', 'b_three', 'b_old', 'b_stone'],
    requiredFormulaIds: ['f_1a', 'f_1c'],
    failureExplanation: 'Le Gardien a dit : « They see three old stones. » Au pluriel, « see » et « old » ne prennent pas de -s, seul « stones » prend -s.'
  },
  {
    id: 'boss_5_main',
    tierId: 'tier_1',
    act: 1,
    difficultyRank: 5,
    audioBossUrl: './audio/tier1/boss_5_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_5_main.mp3',
    spokenEnglishTranscript: 'He has the key, it is here.',
    targetSequence: ['He', 'has', 'the', 'key,', 'it', 'is', 'here'],
    distractorPool: ['have', 'she', 'his', 'are'],
    requiredBrickIds: ['b_he', 'b_have', 'b_the', 'b_key', 'b_it', 'b_is', 'b_here'],
    requiredFormulaIds: ['f_1b', 'f_1c'],
    failureExplanation: 'Piège testé : à l’oral, « it is » (/ɪt ɪz/) ressemble à « his ». Il faut mobiliser la Formule II (sujet « it » + verbe « is ») pour ne pas tomber dans le piège phonétique.'
  },

  // --- ACTE II (Rangs 6 à 10) : Le Jugement du Sens (Audio EN → Briques de sens en Français) ---
  {
    id: 'boss_6_main',
    tierId: 'tier_1',
    act: 2,
    difficultyRank: 6,
    audioBossUrl: './audio/tier1/boss_6_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_6_main.mp3',
    spokenEnglishTranscript: 'The old guard is here, he is cold.',
    targetSequence: ['Le vieux garde', 'est ici,', 'il a froid.'],
    distractorPool: ['La vieille porte', 'a froid,', 'il est vieux,', 'elle est ici.'],
    requiredBrickIds: ['b_the', 'b_old', 'b_guard', 'b_is', 'b_here', 'b_he', 'b_cold'],
    requiredFormulaIds: ['f_1a', 'f_1b'],
    failureExplanation: 'Ce qui est validé : entendre « he is cold » et comprendre que cela signifie « il a froid » en français.'
  },
  {
    id: 'boss_6_var',
    tierId: 'tier_1',
    act: 2,
    difficultyRank: 6,
    audioBossUrl: './audio/tier1/boss_6_var.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_6_var.mp3',
    spokenEnglishTranscript: 'I am cold, I am not afraid.',
    targetSequence: ["J'ai froid,", "je n'ai pas", 'peur.'],
    distractorPool: ['Je suis vieux,', "j'ai peur,", "il n'a pas", 'froid.'],
    requiredBrickIds: ['b_i', 'b_am', 'b_cold', 'b_not', 'b_afraid'],
    requiredFormulaIds: ['f_1b', 'f_1c'],
    failureExplanation: '« I am cold, I am not afraid » signifie « J’ai froid, je n’ai pas peur. »'
  },
  {
    id: 'boss_7_main',
    tierId: 'tier_1',
    act: 2,
    difficultyRank: 7,
    audioBossUrl: './audio/tier1/boss_7_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_7_main.mp3',
    spokenEnglishTranscript: 'I see the small door, it is not open.',
    targetSequence: ['Je vois', 'la petite porte,', "elle n'est pas", 'ouverte.'],
    distractorPool: ['Tu vois', 'le petit garde,', "il n'a pas", 'la clé.'],
    requiredBrickIds: ['b_i', 'b_see', 'b_the', 'b_small', 'b_door', 'b_it', 'b_is', 'b_not', 'b_open'],
    requiredFormulaIds: ['f_1a', 'f_1b'],
    failureExplanation: 'Ce qui est validé : relier auditivement le pronom neutre « it » à « the small door » (« elle n’est pas ouverte »).'
  },
  {
    id: 'boss_8_main',
    tierId: 'tier_1',
    act: 2,
    difficultyRank: 8,
    audioBossUrl: './audio/tier1/boss_8_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_8_main.mp3',
    spokenEnglishTranscript: 'Actually, you are not afraid.',
    targetSequence: ['En réalité,', "tu n'as pas", 'peur.'],
    distractorPool: ['Actuellement,', "tu n'es pas", 'froid,', 'vous avez peur.'],
    requiredBrickIds: ['b_actually', 'b_you', 'b_are', 'b_not', 'b_afraid'],
    requiredFormulaIds: ['f_1b', 'f_1c'],
    failureExplanation: 'Ce qui est validé : ne pas traduire « Actually » par « Actuellement », et comprendre « are not afraid » comme « n’as pas peur ».'
  },
  {
    id: 'boss_9_main',
    tierId: 'tier_1',
    act: 2,
    difficultyRank: 9,
    audioBossUrl: './audio/tier1/boss_9_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_9_main.mp3',
    spokenEnglishTranscript: 'She has three keys, she waits here.',
    targetSequence: ['Elle a', 'trois clés,', 'elle attend', 'ici.'],
    distractorPool: ['Elle est', 'une clé,', 'il voit', 'trois ombres,'],
    requiredBrickIds: ['b_she', 'b_have', 'b_three', 'b_key', 'b_wait', 'b_here'],
    requiredFormulaIds: ['f_1c'],
    failureExplanation: 'Le Gardien a dit : « She has three keys, she waits here » (« Elle a trois clés, elle attend ici »).'
  },
  {
    id: 'boss_9_var',
    tierId: 'tier_1',
    act: 2,
    difficultyRank: 9,
    audioBossUrl: './audio/tier1/boss_9_var.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_9_var.mp3',
    spokenEnglishTranscript: 'The guard is not old, he keeps the way.',
    targetSequence: ['Le garde', "n'est pas vieux,", 'il garde', 'le chemin.'],
    distractorPool: ['Les gardes', 'ont froid,', 'il attend', 'la porte.'],
    requiredBrickIds: ['b_the', 'b_guard', 'b_is', 'b_not', 'b_old', 'b_he', 'b_keep', 'b_way'],
    requiredFormulaIds: ['f_1b', 'f_1c'],
    failureExplanation: '« The guard is not old, he keeps the way » = « Le garde n’est pas vieux, il garde le chemin. »'
  },
  {
    id: 'boss_10_main',
    tierId: 'tier_1',
    act: 2,
    difficultyRank: 10,
    audioBossUrl: './audio/tier1/boss_10_main.mp3',
    audioBossSlowUrl: './audio/tier1/boss_slow_10_main.mp3',
    spokenEnglishTranscript: 'Actually, the old guard is afraid: he sees a big shadow, the door is not open.',
    targetSequence: [
      'En réalité,',
      'le vieux garde',
      'a peur :',
      'il voit',
      'une grande ombre,',
      'la porte',
      "n'est pas ouverte."
    ],
    distractorPool: [
      'Actuellement,',
      'les vieux gardes',
      'ont froid :',
      'elle ouvre',
      'une petite pierre,',
      'le chemin',
      'est ouvert.'
    ],
    requiredBrickIds: [
      'b_actually',
      'b_the',
      'b_old',
      'b_guard',
      'b_is',
      'b_afraid',
      'b_he',
      'b_see',
      'b_a',
      'b_big',
      'b_shadow',
      'b_door',
      'b_not',
      'b_open'
    ],
    requiredFormulaIds: ['f_1a', 'f_1b', 'f_1c'],
    failureExplanation: 'Énigme finale du Gardien combinant les 3 Formules : « Actually, the old guard is afraid: he sees a big shadow, the door is not open. »'
  }
];

// ============================================================================
// LES 9 NŒUDS DE LA CARTE DU PALIER 1 (3 Strates : 1A, 1B, 1C)
// ============================================================================
export const MAP_NODES: MapNode[] = [
  {
    id: 'node_1a_g1',
    subtierId: '1A',
    type: 'gisement',
    title: 'Gisement 1A-I : Les Pierres du Seuil',
    subtitle: '5 Briques : the, a/an, door, key, stone',
    brickIds: ['b_the', 'b_a', 'b_door', 'b_key', 'b_stone']
  },
  {
    id: 'node_1a_g2',
    subtierId: '1A',
    type: 'gisement',
    title: 'Gisement 1A-II : Les Qualités Anciennes',
    subtitle: '5 Briques : guard, old, big, small, cold',
    brickIds: ['b_guard', 'b_old', 'b_big', 'b_small', 'b_cold']
  },
  {
    id: 'node_1a_stele',
    subtierId: '1A',
    type: 'stele',
    title: "Stèle I : L'Antéposition Immuable",
    subtitle: 'Débloquer la Formule I par induction + 6 Épreuves de gravure',
    formulaId: 'f_1a',
    exerciseIds: ['ex_1a_1', 'ex_1a_2', 'ex_1a_3', 'ex_1a_4', 'ex_1a_5', 'ex_1a_6']
  },
  {
    id: 'node_1b_g1',
    subtierId: '1B',
    type: 'gisement',
    title: 'Gisement 1B-I : Les Âmes et les Choses',
    subtitle: '6 Briques : I, you, he, she, it, they',
    brickIds: ['b_i', 'b_you', 'b_he', 'b_she', 'b_it', 'b_they']
  },
  {
    id: 'node_1b_g2',
    subtierId: '1B',
    type: 'gisement',
    title: "Gisement 1B-II : Le Souffle de l'Être",
    subtitle: '5 Briques : am, is, are, not, here',
    brickIds: ['b_am', 'b_is', 'b_are', 'b_not', 'b_here']
  },
  {
    id: 'node_1b_stele',
    subtierId: '1B',
    type: 'stele',
    title: "Stèle II : Le Pilier d'État & La Neutralité",
    subtitle: 'Débloquer la Formule II par induction + 6 Épreuves de gravure',
    formulaId: 'f_1b',
    exerciseIds: ['ex_1b_1', 'ex_1b_2', 'ex_1b_3', 'ex_1b_4', 'ex_1b_5', 'ex_1b_6']
  },
  {
    id: 'node_1c_g1',
    subtierId: '1C',
    type: 'gisement',
    title: 'Gisement 1C-I : Les Gestes du Gardien',
    subtitle: '6 Briques : see, open, keep, wait, have/has, afraid',
    brickIds: ['b_see', 'b_open', 'b_keep', 'b_wait', 'b_have', 'b_afraid']
  },
  {
    id: 'node_1c_g2',
    subtierId: '1C',
    type: 'gisement',
    title: "Gisement 1C-II : Les Ombres et l'Illusion",
    subtitle: '5 Briques : shadow, way, actually, one, three',
    brickIds: ['b_shadow', 'b_way', 'b_actually', 'b_one', 'b_three']
  },
  {
    id: 'node_1c_stele',
    subtierId: '1C',
    type: 'stele',
    title: 'Stèle III : Le Sceau du Singulier (-S)',
    subtitle: 'Débloquer la Formule III par induction + 6 Épreuves de gravure',
    formulaId: 'f_1c',
    exerciseIds: ['ex_1c_1', 'ex_1c_2', 'ex_1c_3', 'ex_1c_4', 'ex_1c_5', 'ex_1c_6']
  }
];
