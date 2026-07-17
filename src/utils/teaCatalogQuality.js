const NON_TEA_TERMS = [
  'accessory',
  'accessories',
  'bottle',
  'chashaku',
  'coaster',
  'cup',
  'cups',
  'gift card',
  'kettle',
  'mug',
  'pitcher',
  'spoon',
  'strainer',
  'towel',
  'tray',
  'tumbler',
  'whisk',
];

const SET_TERMS = [
  'advent calendar',
  'assortment',
  'bundle',
  'choose your own',
  'collection box',
  'collection sampler',
  'discovery kit',
  'event box',
  'explorer set',
  'flight',
  'gift bag',
  'gift box',
  'gift set',
  'iced tea kit',
  'kit',
  'loose leaf starter set',
  'petite presentation box',
  'presentation box',
  'sample pack',
  'sample set',
  'sampler',
  'sampler set',
  'set of',
  'starter kit',
  'starter set',
  'tea chest',
  'tea collection',
  'tea filters',
  'tea starter',
  'tea set',
  'variety bag',
  'variety pack',
];

const normalizeSearchText = (text) => ` ${String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;

const hasAnyTerm = (text, terms) => {
  const normalizedText = normalizeSearchText(text);
  return terms.some(term => normalizedText.includes(normalizeSearchText(term)));
};

export const isDisplayableTea = (tea = {}, { requireImage = false } = {}) => {
  const name = String(tea.name || '').toLowerCase();
  const productUrl = String(tea.productUrl || tea.product_url || '').toLowerCase();
  const categories = (tea.categories || tea.tags || [])
    .map(category => String(category).toLowerCase())
    .join(' ');
  const merchandisingText = `${name} ${productUrl} ${categories}`;

  if (requireImage && !(tea.imageUrl || tea.image_url)) {
    return false;
  }

  if (hasAnyTerm(merchandisingText, SET_TERMS)) {
    return false;
  }

  if (hasAnyTerm(name, NON_TEA_TERMS) || hasAnyTerm(categories, NON_TEA_TERMS)) {
    return false;
  }

  if (productUrl.includes('tea-accessories') || productUrl.includes('/teaware')) {
    return false;
  }

  return true;
};

export const getTeaShopKey = (tea = {}) => (
  tea.companyId ||
  tea.company_id ||
  tea.brandName ||
  tea.brand_name ||
  'unknown'
);

// Interleave teas by shop while preserving each shop's relative order.
export const diversifyTeasByShop = (teas = []) => {
  if (teas.length <= 1) return teas;

  const byShop = new Map();
  teas.forEach(tea => {
    const shopKey = getTeaShopKey(tea);
    if (!byShop.has(shopKey)) {
      byShop.set(shopKey, []);
    }
    byShop.get(shopKey).push(tea);
  });

  const result = [];
  let hasMore = true;
  let index = 0;

  while (hasMore) {
    hasMore = false;
    byShop.forEach(shopTeas => {
      if (shopTeas.length > index) {
        result.push(shopTeas[index]);
        if (shopTeas.length > index + 1) {
          hasMore = true;
        }
      }
    });
    index++;
  }

  return result;
};
