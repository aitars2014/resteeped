import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, Star, Coffee, Hash } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context';
import { haptics } from '../utils/haptics';

// Instagram Story dimensions (9:16 aspect ratio)
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

// Collection gradient — warm, sophisticated
const COLLECTION_GRADIENT = ['#0A0A1A', '#1A1A3E', '#2D1B4E', '#4A2C6A'];

// Tea type display config
const TEA_TYPE_COLORS = {
  black: '#D2691E',
  green: '#52B788',
  oolong: '#F4A460',
  white: '#D4D4E8',
  puerh: '#8B6F47',
  herbal: '#D4A5C7',
  yellow: '#DAA520',
};

const TEA_TYPE_LABELS = {
  black: 'Black',
  green: 'Green',
  oolong: 'Oolong',
  white: 'White',
  puerh: "Pu'erh",
  herbal: 'Herbal',
  yellow: 'Yellow',
};

/**
 * Compute collection stats from an array of user_tea items
 */
function computeStats(collection) {
  const total = collection.length;
  
  // Count by type
  const typeCounts = {};
  let ratedCount = 0;
  let ratingSum = 0;
  const ratedTeas = [];

  for (const item of collection) {
    const tea = item.tea || item;
    const type = (tea.teaType || tea.tea_type || 'other').toLowerCase();
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    const rating = item.user_rating || 0;
    if (rating > 0) {
      ratedCount++;
      ratingSum += rating;
      ratedTeas.push({ ...item, _rating: rating });
    }
  }

  // Sort types by count descending
  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5 types

  // Favorite type
  const favoriteType = sortedTypes.length > 0 ? sortedTypes[0][0] : null;

  // Top rated teas (top 3)
  const topTeas = ratedTeas
    .sort((a, b) => b._rating - a._rating)
    .slice(0, 3);

  // Average rating
  const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : null;

  return {
    total,
    typeCounts: sortedTypes,
    favoriteType,
    topTeas,
    avgRating,
    ratedCount,
  };
}

/**
 * ShareableCollectionCard — "My Tea Collection" summary card
 * Spotify Wrapped-inspired, Instagram Story format (9:16)
 */
export const ShareableCollectionCard = React.forwardRef(({
  collection = [],
  style,
  showBranding = true,
}, ref) => {
  const { theme, getTeaTypeColor } = useTheme();
  const viewShotRef = useRef();

  const stats = computeStats(collection);

  // Capture and share
  const captureAndShare = async () => {
    try {
      haptics.medium();
      const uri = await viewShotRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share My Tea Collection',
        });
        haptics.success();
      }
    } catch (error) {
      console.error('Error sharing collection card:', error);
      haptics.error();
    }
  };

  // Bar chart — visual representation of type breakdown
  const maxCount = stats.typeCounts.length > 0 ? stats.typeCounts[0][1] : 1;

  return (
    <ViewShot
      ref={ref || viewShotRef}
      options={{ format: 'png', quality: 1, width: CARD_WIDTH, height: CARD_HEIGHT }}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={COLLECTION_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header pill */}
        <View style={styles.topSection}>
          <View style={styles.headerPill}>
            <Leaf size={26} color="#FFF" />
            <Text style={styles.headerLabel}>MY TEA COLLECTION</Text>
          </View>
        </View>

        {/* Big number — total teas */}
        <View style={styles.heroSection}>
          <Text style={styles.heroNumber}>{stats.total}</Text>
          <Text style={styles.heroLabel}>TEAS COLLECTED</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {stats.favoriteType && (
            <View style={styles.statItem}>
              <Coffee size={28} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statValue}>
                {TEA_TYPE_LABELS[stats.favoriteType] || stats.favoriteType}
              </Text>
              <Text style={styles.statLabel}>FAVORITE TYPE</Text>
            </View>
          )}
          {stats.avgRating && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Star size={28} color="rgba(255,255,255,0.7)" />
                <Text style={styles.statValue}>{stats.avgRating}</Text>
                <Text style={styles.statLabel}>AVG RATING</Text>
              </View>
            </>
          )}
          {stats.ratedCount > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Hash size={28} color="rgba(255,255,255,0.7)" />
                <Text style={styles.statValue}>{stats.ratedCount}</Text>
                <Text style={styles.statLabel}>RATED</Text>
              </View>
            </>
          )}
        </View>

        {/* Type breakdown — horizontal bars */}
        {stats.typeCounts.length > 0 && (
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>WHAT I DRINK</Text>
            {stats.typeCounts.map(([type, count]) => {
              const barWidth = (count / maxCount) * 100;
              const color = TEA_TYPE_COLORS[type] || 'rgba(255,255,255,0.5)';
              return (
                <View key={type} style={styles.barRow}>
                  <Text style={styles.barLabel}>
                    {TEA_TYPE_LABELS[type] || type}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${barWidth}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Top teas */}
        {stats.topTeas.length > 0 && (
          <View style={styles.topTeasSection}>
            <Text style={styles.sectionTitle}>TOP RATED</Text>
            {stats.topTeas.map((item, index) => {
              const tea = item.tea || item;
              const teaName = tea.name || 'Unknown Tea';
              const brand = tea.brandName || tea.brand_name || tea.company?.name || '';
              const rating = item._rating;
              return (
                <View key={index} style={styles.topTeaRow}>
                  <Text style={styles.topTeaRank}>#{index + 1}</Text>
                  <View style={styles.topTeaInfo}>
                    <Text style={styles.topTeaName} numberOfLines={1}>
                      {teaName}
                    </Text>
                    {brand ? (
                      <Text style={styles.topTeaBrand} numberOfLines={1}>
                        {brand}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.topTeaRating}>
                    <Star size={22} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.topTeaRatingText}>{rating}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Branding footer */}
        {showBranding && (
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerQuote}>Good tea is worth remembering</Text>
            <Image
              source={require('../../assets/resteeped-logo-dark.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
          </View>
        )}
      </LinearGradient>
    </ViewShot>
  );
});

// Expose capture method
ShareableCollectionCard.capture = (ref) => ref.current?.capture?.();

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    flex: 1,
    paddingHorizontal: 80,
    paddingTop: 100,
    paddingBottom: 80,
    justifyContent: 'space-between',
  },

  // Header
  topSection: {
    alignItems: 'flex-start',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 50,
    gap: 14,
  },
  headerLabel: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },

  // Hero number
  heroSection: {
    alignItems: 'center',
    marginVertical: 40,
  },
  heroNumber: {
    fontSize: 180,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 190,
    letterSpacing: -5,
  },
  heroLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 8,
    marginTop: 8,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 32,
    padding: 36,
    marginBottom: 36,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Type breakdown
  breakdownSection: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
    marginBottom: 24,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  barLabel: {
    width: 120,
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  barTrack: {
    flex: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 14,
    opacity: 0.85,
  },
  barCount: {
    width: 60,
    fontSize: 24,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },

  // Top teas
  topTeasSection: {
    marginBottom: 36,
  },
  topTeaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
  },
  topTeaRank: {
    fontSize: 36,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    width: 70,
  },
  topTeaInfo: {
    flex: 1,
    marginRight: 16,
  },
  topTeaName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topTeaBrand: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  topTeaRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topTeaRatingText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  footerDivider: {
    width: 80,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  footerQuote: {
    fontSize: 28,
    fontStyle: 'italic',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  footerLogo: {
    width: 320,
    height: 80,
    opacity: 0.85,
  },
});

export default ShareableCollectionCard;
