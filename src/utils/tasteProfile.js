const TYPE_LABELS = {
  black: 'black',
  green: 'green',
  oolong: 'oolong',
  white: 'white',
  puerh: "pu'erh",
  yellow: 'yellow',
  herbal: 'herbal',
};

export const COLLECTION_STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'want_to_try', label: 'Wishlist' },
  { id: 'tried', label: 'Tried' },
  { id: 'finished', label: 'Finished' },
  { id: 'buy_again', label: 'Buy Again' },
];

export const COLLECTION_STATUS_LABELS = COLLECTION_STATUSES.reduce((acc, status) => {
  acc[status.id] = status.label;
  return acc;
}, {});

export const normalizeTea = (tea = {}) => ({
  ...tea,
  brandName: tea.brandName || tea.brand_name,
  teaType: tea.teaType || tea.tea_type,
  avgRating: tea.avgRating || tea.avg_rating || 0,
  ratingCount: tea.ratingCount || tea.rating_count || 0,
  imageUrl: tea.imageUrl || tea.image_url,
  companyId: tea.companyId || tea.company_id,
  flavorNotes: tea.flavorNotes || tea.flavor_notes || [],
  steepTempF: tea.steepTempF || tea.steep_temp_f,
  steepTimeMin: tea.steepTimeMin || tea.steep_time_min,
  steepTimeMax: tea.steepTimeMax || tea.steep_time_max,
});

const addWeight = (bucket, key, amount = 1) => {
  if (!key) return;
  const normalized = String(key).trim().toLowerCase();
  if (!normalized) return;
  bucket[normalized] = (bucket[normalized] || 0) + amount;
};

const topKeys = (bucket, limit) =>
  Object.entries(bucket)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);

export const buildTasteProfile = (collection = [], profile = null) => {
  const weightedTypes = {};
  const weightedBrands = {};
  const weightedFlavors = {};
  const rated = collection.filter(item => item.tea && item.user_rating > 0);

  rated.forEach(item => {
    const tea = normalizeTea(item.tea);
    const weight = Math.max(1, Number(item.user_rating || 0) - 2);
    addWeight(weightedTypes, tea.teaType, weight);
    addWeight(weightedBrands, tea.brandName, weight);
    tea.flavorNotes.forEach(note => addWeight(weightedFlavors, note, weight));
  });

  if (rated.length === 0 && profile) {
    (profile.preferred_tea_types || []).forEach(type => addWeight(weightedTypes, type, 2));
    (profile.preferred_flavors || []).forEach(flavor => addWeight(weightedFlavors, flavor, 2));
  }

  const types = topKeys(weightedTypes, 3);
  const brands = topKeys(weightedBrands, 3);
  const flavors = topKeys(weightedFlavors, 5);

  return {
    hasProfile: types.length > 0 || flavors.length > 0 || brands.length > 0,
    ratedCount: rated.length,
    types,
    brands,
    flavors,
    summary: [
      types.length > 0 ? `${types.slice(0, 2).map(type => TYPE_LABELS[type] || type).join(' and ')} teas` : null,
      flavors.length > 0 ? flavors.slice(0, 2).join(', ') : null,
    ].filter(Boolean).join(' with '),
  };
};

export const getMatchScore = (tea, tasteProfile) => {
  if (!tea || !tasteProfile?.hasProfile) return null;
  const normalizedTea = normalizeTea(tea);
  let score = 50;

  if (tasteProfile.types.includes((normalizedTea.teaType || '').toLowerCase())) {
    score += 22;
  }
  if (tasteProfile.brands.includes((normalizedTea.brandName || '').toLowerCase())) {
    score += 10;
  }

  const teaFlavors = normalizedTea.flavorNotes.map(note => String(note).toLowerCase());
  const flavorMatches = tasteProfile.flavors.filter(flavor => teaFlavors.includes(flavor)).length;
  score += Math.min(flavorMatches * 7, 18);
  score += Math.min((normalizedTea.avgRating || 0) * 2, 10);

  return Math.max(45, Math.min(99, Math.round(score)));
};

export const pickBrewTodayTea = (collection = [], fallbackTeas = []) => {
  const collectionCandidates = collection
    .filter(item => item.tea)
    .map(item => ({
      tea: normalizeTea(item.tea),
      score:
        (item.status === 'buy_again' ? 35 : 0) +
        (item.status === 'owned' ? 25 : 0) +
        (item.status === 'tried' ? 15 : 0) +
        ((item.user_rating || 0) * 8) +
        (item.preferred_steep_time ? 8 : 0) -
        (item.status === 'finished' ? 80 : 0),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (collectionCandidates[0]) return collectionCandidates[0].tea;

  return [...fallbackTeas]
    .map(normalizeTea)
    .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))[0] || null;
};
