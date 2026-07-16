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
  'collection sampler',
  'explorer set',
  'gift box',
  'gift set',
  'sampler',
  'sampler set',
  'set of',
  'tea set',
];

const hasAnyTerm = (text, terms) => terms.some(term => text.includes(term));

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
