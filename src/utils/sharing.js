import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

const APP_STORE_URL = 'https://apps.apple.com/app/resteeped/id6758778808';

/**
 * Share a tea as an image card (primary) or text (fallback)
 * @param {Object} tea - Tea object
 * @param {string|null} imageUri - URI of captured card image (from ViewShot)
 */
export const shareTea = async (tea, imageUri = null) => {
  // If we have an image, share it via expo-sharing
  if (imageUri) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${tea.name}`,
          UTI: 'public.png', // iOS UTI for better share sheet behavior
        });
        return { success: true };
      }
    } catch (error) {
      console.error('Image share failed, falling back to text:', error);
      // Fall through to text share
    }
  }
  
  // Fallback: text-only share
  return shareTeaText(tea);
};

/**
 * Share a tea as text only (fallback)
 */
export const shareTeaText = async (tea) => {
  const teaName = tea.name;
  const brandName = tea.brandName;
  const rating = tea.avgRating?.toFixed(1) || 'N/A';
  const teaType = tea.teaType;
  
  const message = `Check out this ${teaType} tea I found on Resteeped!\n\n` +
    `🍵 ${teaName}\n` +
    `🏪 ${brandName}\n` +
    `⭐ ${rating} rating\n\n` +
    `Find it on Resteeped: ${APP_STORE_URL}`;

  try {
    const result = await Share.share({
      message,
      title: `${teaName} on Resteeped`,
    });
    
    return { success: result.action === Share.sharedAction, result };
  } catch (error) {
    console.error('Error sharing tea:', error);
    return { success: false, error };
  }
};

/**
 * Share a tea shop
 */
export const shareCompany = async (company) => {
  const name = company.name;
  const rating = company.avg_rating?.toFixed(1) || 'N/A';
  const teaCount = company.tea_count || 0;
  const location = company.headquarters_city 
    ? `${company.headquarters_city}, ${company.headquarters_state || ''}`
    : '';
  
  const message = `Check out this tea shop I found on Resteeped!\n\n` +
    `🏪 ${name}\n` +
    (location ? `📍 ${location}\n` : '') +
    `⭐ ${rating} rating\n` +
    `🍵 ${teaCount} teas\n\n` +
    `Find them on Resteeped: ${APP_STORE_URL}`;

  try {
    const result = await Share.share({
      message,
      title: `${name} on Resteeped`,
    });
    
    return { success: result.action === Share.sharedAction, result };
  } catch (error) {
    console.error('Error sharing company:', error);
    return { success: false, error };
  }
};

/**
 * Share your collection stats
 */
export const shareCollection = async (stats) => {
  const { totalTeas, triedCount, favoriteType } = stats;
  
  const message = `My tea journey on Resteeped 🍵\n\n` +
    `📚 ${totalTeas} teas in my collection\n` +
    `✅ ${triedCount} teas tried\n` +
    (favoriteType ? `💚 Favorite: ${favoriteType} tea\n` : '') +
    `\nStart your tea journey: ${APP_STORE_URL}`;

  try {
    const result = await Share.share({
      message,
      title: 'My Resteeped Collection',
    });
    
    return { success: result.action === Share.sharedAction, result };
  } catch (error) {
    console.error('Error sharing collection:', error);
    return { success: false, error };
  }
};

/**
 * Share tea insights / stats summary
 */
export const shareInsights = async (stats) => {
  const { totalTeas, uniqueBrands, uniqueTypes, totalBrews, favoriteType } = stats;
  
  const lines = [`My Tea Insights on Resteeped 🍵\n`];
  if (totalTeas > 0) lines.push(`📚 ${totalTeas} teas collected`);
  if (uniqueBrands > 0) lines.push(`🏪 ${uniqueBrands} brands explored`);
  if (uniqueTypes > 0) lines.push(`🎨 ${uniqueTypes}/7 tea types tried`);
  if (totalBrews > 0) lines.push(`☕ ${totalBrews} brew sessions`);
  if (favoriteType) lines.push(`💚 Favorite type: ${favoriteType}`);
  lines.push(`\nDiscover your tea stats: ${APP_STORE_URL}`);

  try {
    const result = await Share.share({
      message: lines.join('\n'),
      title: 'My Tea Insights — Resteeped',
    });
    
    return { success: result.action === Share.sharedAction, result };
  } catch (error) {
    console.error('Error sharing insights:', error);
    return { success: false, error };
  }
};
