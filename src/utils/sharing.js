import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

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
    `Download Resteeped to discover your next favorite tea!`;

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
    `Download Resteeped to discover your next favorite tea!`;

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
    `\nJoin me on Resteeped and start your tea discovery!`;

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
