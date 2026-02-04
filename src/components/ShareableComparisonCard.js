import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Swords, Thermometer, Clock, Leaf } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { typography, spacing, fonts, getPlaceholderImage } from '../constants';
import { useTheme } from '../context';
import { haptics } from '../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

/**
 * ShareableComparisonCard - Side-by-side tea comparison for social sharing
 * "Tea Battle" style card perfect for Instagram stories
 */
export const ShareableComparisonCard = ({ 
  tea1, 
  tea2,
  winner = null, // 'tea1' | 'tea2' | null (no winner yet)
  style,
}) => {
  const { theme, isDark, getTeaTypeColor } = useTheme();
  const viewShotRef = useRef();
  
  const tea1Color = getTeaTypeColor(tea1.teaType || tea1.tea_type);
  const tea2Color = getTeaTypeColor(tea2.teaType || tea2.tea_type);
  
  // Get tea data
  const getTea = (tea, color) => ({
    name: tea.name,
    brand: (tea.brandName || tea.brand_name || '').toUpperCase(),
    type: (tea.teaType || tea.tea_type || '').toUpperCase(),
    rating: tea.avgRating || tea.avg_rating || 0,
    image: tea.imageUrl || tea.image_url 
      ? { uri: tea.imageUrl || tea.image_url } 
      : getPlaceholderImage(tea.teaType || tea.tea_type),
    color,
    steepTime: tea.steep_time_seconds ? `${Math.floor(tea.steep_time_seconds / 60)}min` : null,
    steepTemp: tea.steep_temp_f ? `${tea.steep_temp_f}°F` : null,
  });
  
  const t1 = getTea(tea1, tea1Color);
  const t2 = getTea(tea2, tea2Color);
  
  // Capture and share
  const captureAndShare = async () => {
    try {
      haptics.medium();
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${t1.name} vs ${t2.name}`,
        });
        haptics.success();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      haptics.error();
    }
  };
  
  // Render tea side
  const renderTeaSide = (tea, isWinner, side) => (
    <View style={[styles.teaSide, isWinner && styles.winnerSide]}>
      {/* Image */}
      <View style={[styles.imageWrapper, { borderColor: tea.color.primary }]}>
        <Image source={tea.image} style={styles.teaImage} />
        {isWinner && (
          <View style={[styles.winnerBadge, { backgroundColor: tea.color.primary }]}>
            <Text style={styles.winnerText}>👑</Text>
          </View>
        )}
      </View>
      
      {/* Brand */}
      <Text style={[styles.brand, { color: tea.color.primary }]} numberOfLines={1}>
        {tea.brand}
      </Text>
      
      {/* Name */}
      <Text style={[styles.name, { color: theme.text.primary }]} numberOfLines={2}>
        {tea.name}
      </Text>
      
      {/* Rating */}
      <View style={styles.ratingRow}>
        <Star size={16} color="#FFB347" fill="#FFB347" />
        <Text style={styles.ratingText}>{tea.rating.toFixed(1)}</Text>
      </View>
      
      {/* Stats */}
      <View style={styles.statsColumn}>
        {tea.steepTemp && (
          <View style={styles.statRow}>
            <Thermometer size={12} color={theme.text.tertiary} />
            <Text style={[styles.statText, { color: theme.text.secondary }]}>
              {tea.steepTemp}
            </Text>
          </View>
        )}
        {tea.steepTime && (
          <View style={styles.statRow}>
            <Clock size={12} color={theme.text.tertiary} />
            <Text style={[styles.statText, { color: theme.text.secondary }]}>
              {tea.steepTime}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

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
        {/* Header */}
        <View style={styles.header}>
          <Swords size={20} color={theme.accent.warm || theme.accent.primary} />
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Tea Battle
          </Text>
        </View>
        
        {/* VS Layout */}
        <View style={styles.vsLayout}>
          {renderTeaSide(t1, winner === 'tea1', 'left')}
          
          {/* VS Badge */}
          <View style={styles.vsBadgeContainer}>
            <LinearGradient
              colors={[theme.accent.warm || '#C4956A', theme.accent.primary]}
              style={styles.vsBadge}
            >
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
          </View>
          
          {renderTeaSide(t2, winner === 'tea2', 'right')}
        </View>
        
        {/* Question prompt */}
        <Text style={[styles.prompt, { color: theme.text.secondary }]}>
          {winner ? 'The winner is clear! 🏆' : 'Which would you choose? 🤔'}
        </Text>
        
        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.border.light }]}>
          <Leaf size={14} color={theme.accent.primary} />
          <Text style={[styles.footerText, { color: theme.accent.primary }]}>
            Resteeped
          </Text>
        </View>
      </LinearGradient>
    </ViewShot>
  );
};

ShareableComparisonCard.capture = (ref) => ref.current?.capture?.();

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 22,
    fontWeight: '600',
  },
  vsLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  teaSide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  winnerSide: {
    transform: [{ scale: 1.02 }],
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  teaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  winnerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 14,
  },
  brand: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  name: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    minHeight: 40,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFB347',
  },
  statsColumn: {
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  vsBadgeContainer: {
    width: 50,
    alignItems: 'center',
    paddingTop: 35,
  },
  vsBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  prompt: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ShareableComparisonCard;
