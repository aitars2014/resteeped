import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing, getPlaceholderImage, fonts } from '../constants';
import { useTheme } from '../context';
import { StarRating } from './StarRating';
import { TeaTypeBadge } from './TeaTypeBadge';
import { haptics } from '../utils/haptics';

const { width } = Dimensions.get('window');

/**
 * Editorial-style TeaCard
 * Magazine-inspired design with large images and refined typography
 */
export const TeaCard = ({ 
  tea, 
  onPress, 
  style,
  compact = false,
  featured = false, // Larger, hero-style card
  horizontal = false, // Compact horizontal layout
}) => {
  const { theme, getTeaTypeColor } = useTheme();
  const teaColor = getTeaTypeColor(tea.teaType || tea.tea_type);
  const placeholderImage = getPlaceholderImage(tea.teaType || tea.tea_type);
  
  const rating = tea.avgRating || tea.avg_rating || 0;
  const ratingCount = tea.ratingCount || tea.rating_count || 0;
  const teaName = tea.name;
  const brandName = tea.brandName || tea.brand_name || tea.company?.name || '';
  
  // Haptic feedback on press
  const handlePress = useCallback(() => {
    haptics.light();
    onPress?.();
  }, [onPress]);
  
  // Horizontal compact variant
  if (horizontal) {
    return (
      <TouchableOpacity 
        style={[styles.horizontalCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }, style]} 
        onPress={handlePress}
        activeOpacity={0.85}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${teaName} by ${brandName}. ${rating > 0 ? `Rated ${rating.toFixed(1)} stars` : 'No ratings yet'}`}
        accessibilityHint="Double tap to view tea details"
      >
        <Image 
          source={tea.imageUrl || tea.image_url ? { uri: tea.imageUrl || tea.image_url } : placeholderImage} 
          style={styles.horizontalImage} 
        />
        <View style={styles.horizontalContent}>
          <Text style={[styles.horizontalName, { color: theme.text.primary }]} numberOfLines={2}>
            {teaName}
          </Text>
          <Text style={[styles.horizontalBrand, { color: theme.text.secondary }]} numberOfLines={1}>
            {brandName}
          </Text>
          <View style={styles.horizontalMeta}>
            <StarRating rating={rating} size={12} showNumber={false} />
            <TeaTypeBadge teaType={tea.teaType || tea.tea_type} size="tiny" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Featured hero card variant
  if (featured) {
    return (
      <TouchableOpacity 
        style={[styles.featuredCard, { 
          backgroundColor: theme.background.secondary,
        }, style]} 
        onPress={handlePress}
        activeOpacity={0.9}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Featured: ${teaName} by ${brandName}. ${rating > 0 ? `Rated ${rating.toFixed(1)} stars` : 'No ratings yet'}`}
        accessibilityHint="Double tap to view tea details"
      >
        {/* Large hero image */}
        <View style={styles.featuredImageContainer}>
          <Image 
            source={tea.imageUrl || tea.image_url ? { uri: tea.imageUrl || tea.image_url } : placeholderImage} 
            style={styles.featuredImage} 
          />
          {/* Gradient overlay for text legibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.featuredGradient}
          />
          {/* Badge positioned on image */}
          <View style={styles.featuredBadge}>
            <TeaTypeBadge teaType={tea.teaType || tea.tea_type} size="small" />
          </View>
          {/* Content overlay */}
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredBrand} numberOfLines={1}>
              {brandName}
            </Text>
            <Text style={styles.featuredName} numberOfLines={2}>
              {teaName}
            </Text>
            <View style={styles.featuredRating}>
              <StarRating rating={rating} size={14} showNumber />
              {ratingCount > 0 && (
                <Text style={styles.featuredRatingCount}>
                  ({ratingCount})
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default editorial card
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        compact && styles.cardCompact,
        { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        },
        style
      ]} 
      onPress={handlePress}
      activeOpacity={0.9}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${teaName} by ${brandName}. ${rating > 0 ? `Rated ${rating.toFixed(1)} stars` : 'No ratings yet'}`}
      accessibilityHint="Double tap to view tea details"
    >
      {/* Image with type badge */}
      <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
        <Image 
          source={tea.imageUrl || tea.image_url ? { uri: tea.imageUrl || tea.image_url } : placeholderImage} 
          style={styles.image} 
        />
        {/* Subtle bottom gradient for depth */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)']}
          style={styles.imageGradient}
        />
        {/* Type badge - bottom right */}
        <View style={styles.badgeContainer}>
          <TeaTypeBadge teaType={tea.teaType || tea.tea_type} size="small" />
        </View>
      </View>
      
      {/* Content area */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Brand as overline */}
        {brandName && (
          <Text style={[styles.brand, { color: theme.accent.warm || theme.text.secondary }]} numberOfLines={1}>
            {brandName.toUpperCase()}
          </Text>
        )}
        
        {/* Tea name - editorial serif */}
        <Text style={[styles.name, { color: theme.text.primary }]} numberOfLines={2}>
          {teaName}
        </Text>
        
        {/* Rating row */}
        <View style={styles.ratingRow}>
          <StarRating rating={rating} size={14} />
          {ratingCount > 0 && (
            <Text style={[styles.ratingCount, { color: theme.text.tertiary }]}>
              ({ratingCount})
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default card
  card: {
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardCompact: {
    width: width * 0.44,
  },
  imageContainer: {
    height: spacing.cardImageHeight,
    position: 'relative',
  },
  imageContainerCompact: {
    height: 120,
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
    height: 40,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  content: {
    padding: spacing.cardPadding,
  },
  contentCompact: {
    padding: 14,
  },
  brand: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  name: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingCount: {
    fontSize: 12,
  },
  
  // Featured card
  featuredCard: {
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
  },
  featuredImageContainer: {
    height: spacing.heroImageHeight,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredBrand: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  featuredName: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredRatingCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Horizontal card
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    height: 100,
  },
  horizontalImage: {
    width: 100,
    height: '100%',
    resizeMode: 'cover',
  },
  horizontalContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  horizontalName: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  horizontalBrand: {
    fontSize: 12,
    marginBottom: 8,
  },
  horizontalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default TeaCard;
