const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const FIELD_WEIGHTS = {
  notes: 2.4,
  description: 1,
  type: 0.7,
};

const AXES = [
  {
    id: 'delicate_body',
    left: 'Delicate',
    right: 'Full-bodied',
    leftTerms: ['delicate', 'light', 'subtle', 'gentle', 'airy', 'thin', 'clear', 'soft', 'watery'],
    rightTerms: ['full bodied', 'full-bodied', 'body', 'rich', 'thick', 'round', 'creamy', 'heavy', 'robust', 'bold', 'dense', 'plush'],
    typeBias: {
      black: 0.62,
      green: 0.42,
      oolong: 0.55,
      white: 0.34,
      puerh: 0.68,
      herbal: 0.44,
      yellow: 0.4,
    },
  },
  {
    id: 'mellow_brisk',
    left: 'Mellow',
    right: 'Brisk',
    leftTerms: ['mellow', 'soft', 'smooth', 'calming', 'relaxing', 'restful', 'easy', 'rounded', 'gentle'],
    rightTerms: ['brisk', 'bright', 'lively', 'zippy', 'sharp', 'crisp', 'sparkling', 'vibrant', 'refreshing', 'tingly'],
    typeBias: {
      black: 0.58,
      green: 0.55,
      oolong: 0.42,
      white: 0.35,
      puerh: 0.32,
      herbal: 0.44,
      yellow: 0.48,
    },
  },
  {
    id: 'sweet_astringent',
    left: 'Sweet',
    right: 'Astringent',
    leftTerms: ['sweet', 'honey', 'caramel', 'molasses', 'sugar', 'candy', 'vanilla', 'fruit', 'fruity', 'melon', 'peach', 'berry', 'mango', 'apricot'],
    rightTerms: ['astringent', 'astringency', 'dry', 'drying', 'bitter', 'tannic', 'tannin', 'puckering', 'grippy'],
    typeBias: {
      black: 0.55,
      green: 0.6,
      oolong: 0.42,
      white: 0.35,
      puerh: 0.46,
      herbal: 0.28,
      yellow: 0.42,
    },
  },
  {
    id: 'fresh_roasted',
    left: 'Fresh',
    right: 'Roasted',
    leftTerms: ['fresh', 'green', 'grassy', 'vegetal', 'herbal', 'herbaceous', 'meadow', 'spring', 'leafy', 'spinach', 'edamame', 'bok choy'],
    rightTerms: ['roasted', 'roasty', 'toast', 'toasty', 'toasted', 'baked', 'nutty', 'almond', 'grain', 'smoky', 'smoke', 'charcoal', 'charred', 'cocoa'],
    typeBias: {
      black: 0.62,
      green: 0.32,
      oolong: 0.58,
      white: 0.28,
      puerh: 0.58,
      herbal: 0.38,
      yellow: 0.36,
    },
  },
  {
    id: 'floral_earthy',
    left: 'Floral',
    right: 'Earthy',
    leftTerms: ['floral', 'flower', 'blossom', 'jasmine', 'rose', 'orchid', 'gardenia', 'honeysuckle', 'lavender', 'magnolia', 'aromatic'],
    rightTerms: ['earthy', 'earth', 'forest', 'moss', 'mossy', 'mushroom', 'mineral', 'woody', 'wood', 'damp', 'soil', 'wet leaf', 'aged'],
    typeBias: {
      black: 0.48,
      green: 0.34,
      oolong: 0.38,
      white: 0.3,
      puerh: 0.78,
      herbal: 0.35,
      yellow: 0.36,
    },
  },
  {
    id: 'savory_umami',
    left: 'Clean',
    right: 'Savory',
    leftTerms: ['clean', 'clear', 'pure', 'crisp', 'refreshing', 'light', 'bright'],
    rightTerms: ['umami', 'savory', 'marine', 'seaweed', 'brothy', 'saline', 'mineral', 'spinach', 'edamame', 'rich'],
    typeBias: {
      black: 0.34,
      green: 0.58,
      oolong: 0.36,
      white: 0.3,
      puerh: 0.48,
      herbal: 0.24,
      yellow: 0.44,
    },
  },
];

const countTerm = (text, term) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const matches = text.match(new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'g'));
  return matches ? matches.length : 0;
};

const scoreTerms = (text, terms) =>
  terms.reduce((total, term) => total + countTerm(text, normalize(term)), 0);

const evidenceForAxis = (axis, notesText, descriptionText) => {
  const left =
    scoreTerms(notesText, axis.leftTerms) * FIELD_WEIGHTS.notes +
    scoreTerms(descriptionText, axis.leftTerms) * FIELD_WEIGHTS.description;
  const right =
    scoreTerms(notesText, axis.rightTerms) * FIELD_WEIGHTS.notes +
    scoreTerms(descriptionText, axis.rightTerms) * FIELD_WEIGHTS.description;

  return { left, right, total: left + right };
};

export const buildTeaTasteProfile = (tea = {}) => {
  const flavorNotes = tea.flavorNotes || tea.flavor_notes || [];
  const notesText = normalize(Array.isArray(flavorNotes) ? flavorNotes.join(' ') : flavorNotes);
  const descriptionText = normalize(tea.description);
  const teaType = normalize(tea.teaType || tea.tea_type);

  const axes = AXES.map((axis) => {
    const evidence = evidenceForAxis(axis, notesText, descriptionText);
    const typeBias = axis.typeBias?.[teaType];
    const hasEvidence = evidence.total > 0;
    const directionalScore = hasEvidence
      ? evidence.right / evidence.total
      : typeBias;
    const typePull = hasEvidence && typeof typeBias === 'number' ? FIELD_WEIGHTS.type : 0;
    const value = hasEvidence && typeof typeBias === 'number'
      ? ((directionalScore * evidence.total) + (typeBias * typePull)) / (evidence.total + typePull)
      : directionalScore;

    return {
      id: axis.id,
      left: axis.left,
      right: axis.right,
      value: clamp(typeof value === 'number' ? value : 0.5),
      evidence: evidence.total,
      hasEvidence,
    };
  })
    .filter(axis => axis.hasEvidence)
    .sort((a, b) => b.evidence - a.evidence)
    .slice(0, 5);

  return {
    axes,
    hasProfile: axes.length >= 2,
  };
};

export default buildTeaTasteProfile;
