import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swords, ArrowRight, Sparkles } from 'lucide-react-native';
import { typography, spacing, fonts, getPlaceholderImage } from '../constants';
import { useTheme } from '../context';

const { width } = Dimensions.get('window');

/**
 * TeaBattle Component
 * Prominent comparison feature showcase
 * "Jasmine Pearl vs Dragon Well — which wins?"
 */
export const TeaBattle = ({ teas, onCompare, onViewTea, style }) => {
  const { theme, getTeaTypeColor } = useTheme();
  
  // Pick two interesting teas to compare (same type, different brands)
  const battlePair = useMemo(() => {
    if (!teas || teas.length < 2) return null;
    
    // Group teas by type
    const teaGroups = {};
    teas.forEach(tea => {
      const type = tea.teaType || tea.tea_type || 'other';
      if (!teaGroups[type]) teaGroups[type] = [];
      teaGroups[type].push(tea);
    });
    
    // Find a type with multiple high-rated teas from different brands
    for (const type of ['green', 'black', 'oolong', 'white']) {
      const typeTeas = teaGroups[type] || [];
      if (typeTeas.length >= 2) {
        // Sort by rating
        const sorted = typeTeas
          .filter(t => (t.avgRating || t.avg_rating || 0) >= 3.5)
          .sort((a, b) => (b.avgRating || b.avg_rating || 0) - (a.avgRating || a.avg_rating || 0));
        
        if (sorted.length >= 2) {
          // Try to get different brands
          const first = sorted[0];
          const second = sorted.find(t => 
            (t.brandName || t.brand_name) !== (first.brandName || first.brand_name)
          ) || sorted[1];
          
          return [first, second];
        }
      }
    }
    
    // Fallback: just pick top 2 rated teas
    const sorted = [...teas]
      .filter(t => (t.avgRating || t.avg_rating || 0) >= 3.0)
      .sort((a, b) => (b.avgRating || b.avg_rating || 0) - (a.avgRating || a.avg_rating || 0));
    
    return sorted.length >= 2 ? [sorted[0], sorted[1]] : null;
  }, [teas]);
  
  if (!battlePair) return null;
  
  const [tea1, tea2] = battlePair;
  const tea1Color = getTeaTypeColor(tea1.teaType || tea1.tea_type);
  const tea2Color = getTeaTypeColor(tea2.teaType || tea2.tea_type);
  
  const Tea1Image = tea1.imageUrl || tea1.image_url 
    ? { uri: tea1.imageUrl || tea1.image_url } 
    : getPlaceholderImage(tea1.teaType || tea1.tea_type);
  const Tea2Image = tea2.imageUrl || tea2.image_url 
    ? { uri: tea2.imageUrl || tea2.image_url } 
    : getPlaceholderImage(tea2.teaType || tea2.tea_type);

  return (
    <View style={[styles.container, style]}>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Swords size={18} color={theme.accent.warm || theme.accent.primary} />
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Tea Battle
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => onCompare && onCompare(tea1, tea2)}
        >
          <Text style={[styles.headerActionText, { color: theme.accent.primary }]}>
            Compare
          </Text>
          <ArrowRight size={16} color={theme.accent.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Battle card */}
      <TouchableOpacity 
        style={[styles.card, { 
          backgroundColor: theme.background.tertiary,
          borderColor: theme.border.light,
        }]}
        onPress={() => onCompare && onCompare(tea1, tea2)}
        activeOpacity={0.9}
      >
        {/* VS layout */}
        <View style={styles.battleLayout}>
          {/* Tea 1 */}
          <TouchableOpacity 
            style={styles.teaSide}
            onPress={() => onViewTea && onViewTea(tea1)}
            activeOpacity={0.8}
          >
            <View style={[styles.teaImageWrapper, { borderColor: tea1Color.primary }]}>
              <Image source={Tea1Image} style={styles.teaImage} />
            </View>
            <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={2}>
              {tea1.name}
            </Text>
            <Text style={[styles.teaBrand, { color: theme.text.secondary }]} numberOfLines={1}>
              {tea1.brandName || tea1.brand_name}
            </Text>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>
                ★ {(tea1.avgRating || tea1.avg_rating || 0).toFixed(1)}
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* VS badge */}
          <View style={styles.vsBadgeContainer}>
            <LinearGradient
              colors={[theme.accent.warm || '#C4956A', theme.accent.primary]}
              style={styles.vsBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
            <Sparkles 
              size={12} 
              color={theme.accent.warm || theme.accent.primary} 
              style={styles.sparkle1}
            />
            <Sparkles 
              size={10} 
              color={theme.accent.primary} 
              style={styles.sparkle2}
            />
          </View>
          
          {/* Tea 2 */}
          <TouchableOpacity 
            style={styles.teaSide}
            onPress={() => onViewTea && onViewTea(tea2)}
            activeOpacity={0.8}
          >
            <View style={[styles.teaImageWrapper, { borderColor: tea2Color.primary }]}>
              <Image source={Tea2Image} style={styles.teaImage} />
            </View>
            <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={2}>
              {tea2.name}
            </Text>
            <Text style={[styles.teaBrand, { color: theme.text.secondary }]} numberOfLines={1}>
              {tea2.brandName || tea2.brand_name}
            </Text>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>
                ★ {(tea2.avgRating || tea2.avg_rating || 0).toFixed(1)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Call to action */}
        <View style={[styles.ctaBar, { borderTopColor: theme.border.light }]}>
          <Text style={[styles.ctaText, { color: theme.text.secondary }]}>
            Tap to see the full comparison
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sectionSpacing,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 18,
    fontWeight: '600',
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    borderWidth: 1,
  },
  battleLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  teaSide: {
    flex: 1,
    alignItems: 'center',
  },
  teaImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  teaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  teaName: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  teaBrand: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingPill: {
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFB347',
  },
  vsBadgeContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    position: 'relative',
  },
  vsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    right: 0,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 30,
    left: 2,
  },
  ctaBar: {
    borderTopWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 13,
  },
});

export default TeaBattle;
