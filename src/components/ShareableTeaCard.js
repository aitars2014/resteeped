import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Leaf } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { typography, spacing, fonts, getPlaceholderImage } from '../constants';
import { useTheme } from '../context';
import { haptics } from '../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // Full width with margin

/**
 * ShareableTeaCard - Screenshot-ready card for social sharing
 * Designed to look great when shared on Instagram, Twitter, etc.
 */
export const ShareableTeaCard = ({ 
  tea, 
  style,
  showBranding = true,
  variant = 'default', // 'default' | 'minimal' | 'comparison'
}) => {
  const { theme, isDark, getTeaTypeColor } = useTheme();
  const viewShotRef = useRef();
  const teaColor = getTeaTypeColor(tea.teaType || tea.tea_type);
  
  const rating = tea.avgRating || tea.avg_rating || 0;
  const teaName = tea.name;
  const brandName = tea.brandName || tea.brand_name || tea.company?.name || '';
  const teaType = (tea.teaType || tea.tea_type || '').toUpperCase();
  const placeholderImage = getPlaceholderImage(tea.teaType || tea.tea_type);
  
  // Capture and share
  const captureAndShare = async () => {
    try {
      haptics.medium();
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${teaName}`,
        });
        haptics.success();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      haptics.error();
    }
  };
  
  // Render stars
  const renderStars = () => {
    const fullStars = Math.floor(rating);
    return (
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={18}
            color={i < fullStars ? '#FFB347' : 'rgba(255,255,255,0.3)'}
            fill={i < fullStars ? '#FFB347' : 'transparent'}
          />
        ))}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <ViewShot 
      ref={viewShotRef} 
      options={{ format: 'png', quality: 1 }}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={isDark 
          ? ['#1A1A1A', '#0D0D0D'] 
          : ['#FAF8F5', '#F0ECE3']
        }
        style={styles.card}
      >
        {/* Tea image with gradient overlay */}
        <View style={styles.imageContainer}>
          <Image 
            source={tea.imageUrl || tea.image_url 
              ? { uri: tea.imageUrl || tea.image_url } 
              : placeholderImage
            } 
            style={styles.image} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
          
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: teaColor.primary }]}>
            <Leaf size={12} color="#FFF" />
            <Text style={styles.typeText}>{teaType}</Text>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Brand */}
          <Text style={[styles.brand, { color: teaColor.primary }]}>
            {brandName.toUpperCase()}
          </Text>
          
          {/* Name */}
          <Text style={[styles.name, { color: theme.text.primary }]}>
            {teaName}
          </Text>
          
          {/* Rating */}
          {renderStars()}
          
          {/* Description snippet */}
          {tea.description && (
            <Text style={[styles.description, { color: theme.text.secondary }]} numberOfLines={2}>
              {tea.description}
            </Text>
          )}
          
          {/* Flavor notes if available */}
          {tea.flavor_notes && tea.flavor_notes.length > 0 && (
            <View style={styles.flavorsRow}>
              {tea.flavor_notes.slice(0, 3).map((flavor, i) => (
                <View 
                  key={i} 
                  style={[styles.flavorPill, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                  }]}
                >
                  <Text style={[styles.flavorText, { color: theme.text.secondary }]}>
                    {flavor}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Branding footer */}
        {showBranding && (
          <View style={[styles.footer, { borderTopColor: theme.border.light }]}>
            <Text style={[styles.footerText, { color: theme.text.tertiary }]}>
              Discovered on
            </Text>
            <Text style={[styles.footerBrand, { color: theme.accent.primary }]}>
              Resteeped
            </Text>
          </View>
        )}
      </LinearGradient>
    </ViewShot>
  );
};

// Expose capture method
ShareableTeaCard.capture = (ref) => ref.current?.capture?.();

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  typeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  content: {
    padding: 24,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  name: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB347',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  flavorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flavorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  flavorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ShareableTeaCard;
