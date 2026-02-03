// Tea type placeholder images
// These are used when a tea doesn't have a specific image

export const placeholderImages = {
  black: require('../../assets/placeholders/black-tea.jpg'),
  green: require('../../assets/placeholders/green-tea.jpg'),
  oolong: require('../../assets/placeholders/oolong-tea.jpg'),
  white: require('../../assets/placeholders/white-tea.jpg'),
  puerh: require('../../assets/placeholders/puerh-tea.jpg'),
  herbal: require('../../assets/placeholders/herbal-tea.jpg'),
};

/**
 * Get the appropriate placeholder image for a tea type
 * @param {string} teaType - The type of tea (black, green, oolong, white, puerh, herbal)
 * @returns {number} - The require() result for the image
 */
export const getPlaceholderImage = (teaType) => {
  const type = teaType?.toLowerCase();
  return placeholderImages[type] || placeholderImages.black;
};
