import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Leaf, Coffee, Award, Star, Trophy, Target, Sparkles, Crown, Heart, Share2 } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { FlavorRadar } from '../components';
import { useCollection, useTheme, useAuth } from '../context';
import { useBrewHistory } from '../hooks';
import { shareInsights } from '../utils/sharing';

// ─── Helpers ────────────────────────────────────────────────────────────────

const TEA_TYPES = ['black', 'green', 'oolong', 'white', 'puerh', 'herbal', 'yellow'];
const TEA_TYPE_LABELS = {
  black: 'Black',
  green: 'Green',
  oolong: 'Oolong',
  white: 'White',
  puerh: "Pu'erh",
  herbal: 'Herbal',
  yellow: 'Yellow',
};

const formatSteepTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
};

// ─── Component ──────────────────────────────────────────────────────────────

export const TeaInsightsScreen = ({ navigation }) => {
  const { theme, isDark, getTeaTypeColor } = useTheme();
  const { user } = useAuth();
  const { collection } = useCollection();
  const { brewSessions, getBrewStats, getMostBrewedTeas } = useBrewHistory();

  // ── Computed Stats ──

  const collectionStats = useMemo(() => {
    const tried = collection.filter(item => item.status === 'tried');
    const allItems = collection;

    // Unique brands
    const brands = new Set();
    allItems.forEach(item => {
      const brand = item.tea?.brand_name || item.brand_name;
      if (brand) brands.add(brand);
    });

    // Unique tea types
    const types = new Set();
    allItems.forEach(item => {
      const type = item.tea?.tea_type || item.tea_type;
      if (type) types.add(type.toLowerCase());
    });

    // Type breakdown
    const typeCounts = {};
    TEA_TYPES.forEach(t => { typeCounts[t] = 0; });
    allItems.forEach(item => {
      const type = (item.tea?.tea_type || item.tea_type || '').toLowerCase();
      if (type && typeCounts[type] !== undefined) {
        typeCounts[type]++;
      }
    });

    // Aggregate flavor notes for FlavorRadar
    const allFlavorNotes = [];
    allItems.forEach(item => {
      const notes = item.tea?.flavor_notes || item.flavor_notes;
      if (Array.isArray(notes)) {
        allFlavorNotes.push(...notes);
      }
    });

    return {
      total: allItems.length,
      tried: tried.length,
      uniqueBrands: brands.size,
      uniqueTypes: types.size,
      typeCounts,
      allFlavorNotes,
    };
  }, [collection]);

  const brewStats = useMemo(() => getBrewStats(), [brewSessions]);
  const mostBrewed = useMemo(() => getMostBrewedTeas(3), [brewSessions]);

  // ── Milestones ──

  const milestones = useMemo(() => {
    const earned = [];
    const locked = [];

    const items = [
      {
        id: 'first_steep',
        title: 'First Steep',
        description: 'Complete your first brew session',
        Icon: Coffee,
        check: brewSessions.length > 0,
      },
      {
        id: 'explorer_10',
        title: 'Tea Explorer',
        description: 'Add 10 teas to your collection',
        Icon: Leaf,
        check: collectionStats.total >= 10,
      },
      {
        id: 'diverse_5',
        title: 'Diverse Palette',
        description: 'Try 5 different tea types',
        Icon: Target,
        check: collectionStats.uniqueTypes >= 5,
      },
      {
        id: 'brand_10',
        title: 'Brand Connoisseur',
        description: 'Try teas from 10 different brands',
        Icon: Crown,
        check: collectionStats.uniqueBrands >= 10,
      },
      {
        id: 'dedicated_50',
        title: 'Dedicated Drinker',
        description: 'Log 50 brew sessions',
        Icon: Trophy,
        check: brewStats.totalBrews >= 50,
      },
      {
        id: 'collector_25',
        title: 'Serious Collector',
        description: 'Add 25 teas to your collection',
        Icon: Star,
        check: collectionStats.total >= 25,
      },
      {
        id: 'all_types',
        title: 'Type Master',
        description: 'Try all 7 tea types',
        Icon: Sparkles,
        check: collectionStats.uniqueTypes >= 7,
      },
      {
        id: 'passionate',
        title: 'Tea Passionate',
        description: 'Add 100 teas to your collection',
        Icon: Heart,
        check: collectionStats.total >= 100,
      },
    ];

    items.forEach(item => {
      if (item.check) {
        earned.push(item);
      } else {
        locked.push(item);
      }
    });

    return { earned, locked };
  }, [collectionStats, brewStats, brewSessions]);

  // ── Max for bar chart scaling ──
  const maxTypeCount = Math.max(1, ...Object.values(collectionStats.typeCounts));

  // ── Empty State ──
  const hasData = collection.length > 0 || brewSessions.length > 0;



  // ── Share handler ──

  const handleShare = () => {
    // Find favorite type (highest count)
    const topType = TEA_TYPES.reduce((best, type) =>
      collectionStats.typeCounts[type] > (collectionStats.typeCounts[best] || 0) ? type : best
    , TEA_TYPES[0]);

    shareInsights({
      totalTeas: collectionStats.total,
      uniqueBrands: collectionStats.uniqueBrands,
      uniqueTypes: collectionStats.uniqueTypes,
      totalBrews: brewStats.totalBrews,
      favoriteType: collectionStats.typeCounts[topType] > 0 ? TEA_TYPE_LABELS[topType] : null,
    });
  };

  // ── Render ──

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Tea Insights</Text>
        {hasData ? (
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Share your tea insights"
          >
            <Share2 size={22} color={theme.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!hasData ? (
          // Empty state
          <View style={styles.emptyState}>
            <Leaf size={64} color={theme.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
              Your tea journey starts here
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
              Add teas to your collection and brew some cups to see your personal tea insights
            </Text>
          </View>
        ) : (
          <>
            {/* ── Collection Overview ── */}
            {collection.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Collection</Text>
                <View style={[styles.statsRow, {
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                }]}>
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.text.primary }]}>{collectionStats.total}</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Teas</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.text.primary }]}>{collectionStats.uniqueBrands}</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Brands</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.text.primary }]}>{collectionStats.uniqueTypes}/7</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Types</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── Tea Type Breakdown ── */}
            {collection.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Tea Types</Text>
                <View style={[styles.card, {
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                }]}>
                  {TEA_TYPES
                    .sort((a, b) => collectionStats.typeCounts[b] - collectionStats.typeCounts[a])
                    .map(type => {
                      const count = collectionStats.typeCounts[type];
                      const barWidth = count > 0 ? Math.max(8, (count / maxTypeCount) * 100) : 0;
                      const typeColor = getTeaTypeColor ? getTeaTypeColor(type)?.primary : theme.accent.primary;

                      return (
                        <View key={type} style={styles.barRow}>
                          <Text style={[styles.barLabel, { color: theme.text.primary }]}>
                            {TEA_TYPE_LABELS[type]}
                          </Text>
                          <View style={styles.barContainer}>
                            <View
                              style={[styles.bar, {
                                width: `${barWidth}%`,
                                backgroundColor: typeColor || theme.accent.primary,
                                opacity: count > 0 ? 1 : 0.15,
                              }]}
                            />
                          </View>
                          <Text style={[styles.barCount, { color: theme.text.secondary }]}>
                            {count}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              </View>
            )}

            {/* ── Flavor Fingerprint ── */}
            {collectionStats.allFlavorNotes.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Your Flavor Fingerprint</Text>
                <View style={[styles.card, styles.radarCard, {
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                }]}>
                  <FlavorRadar
                    flavorNotes={collectionStats.allFlavorNotes}
                    size={240}
                  />
                </View>
              </View>
            )}

            {/* ── Brewing Stats ── */}
            {brewSessions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Brewing</Text>
                <View style={[styles.statsRow, {
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                }]}>
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.text.primary }]}>{brewStats.totalBrews}</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Total Brews</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.text.primary }]}>{brewStats.uniqueTeas}</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Unique Teas</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.text.primary }]}>{formatSteepTime(brewStats.avgSteepTime)}</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Avg Steep</Text>
                  </View>
                </View>

                {/* Most Brewed */}
                {mostBrewed.length > 0 && (
                  <View style={[styles.card, {
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    marginTop: spacing.md,
                  }]}>
                    <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Most Brewed</Text>
                    {mostBrewed.map((item, index) => (
                      <TouchableOpacity
                        key={item.teaId}
                        style={[styles.mostBrewedRow, index < mostBrewed.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.border.light,
                        }]}
                        onPress={() => {
                          if (item.tea) {
                            navigation.navigate('TeaDetail', { tea: item.tea });
                          }
                        }}
                        activeOpacity={item.tea ? 0.7 : 1}
                      >
                        <Text style={[styles.mostBrewedRank, { color: theme.accent.primary }]}>
                          {index + 1}
                        </Text>
                        <View style={styles.mostBrewedInfo}>
                          <Text style={[styles.mostBrewedName, { color: theme.text.primary }]} numberOfLines={1}>
                            {item.tea?.name || 'Unknown Tea'}
                          </Text>
                          <Text style={[styles.mostBrewedBrand, { color: theme.text.secondary }]} numberOfLines={1}>
                            {item.tea?.brand_name || ''}
                          </Text>
                        </View>
                        <Text style={[styles.mostBrewedCount, { color: theme.text.secondary }]}>
                          {item.count}×
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Milestones ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Milestones</Text>
              <View style={[styles.card, {
                backgroundColor: theme.background.secondary,
                borderColor: theme.border.medium,
              }]}>
                {milestones.earned.map((m, i) => (
                  <View
                    key={m.id}
                    style={[styles.milestoneRow, i < milestones.earned.length + milestones.locked.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border.light,
                    }]}
                  >
                    <View style={[styles.milestoneIcon, { backgroundColor: theme.accent.primary + '20' }]}>
                      <m.Icon size={20} color={theme.accent.primary} />
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={[styles.milestoneName, { color: theme.text.primary }]}>{m.title}</Text>
                      <Text style={[styles.milestoneDesc, { color: theme.text.secondary }]}>{m.description}</Text>
                    </View>
                    <Text style={[styles.milestoneCheck, { color: theme.accent.primary }]}>✓</Text>
                  </View>
                ))}
                {milestones.locked.map((m, i) => (
                  <View
                    key={m.id}
                    style={[styles.milestoneRow, styles.milestoneLocked,
                      i < milestones.locked.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border.light,
                      }
                    ]}
                  >
                    <View style={[styles.milestoneIcon, { backgroundColor: theme.border.light }]}>
                      <m.Icon size={20} color={theme.text.tertiary} />
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={[styles.milestoneName, { color: theme.text.tertiary }]}>{m.title}</Text>
                      <Text style={[styles.milestoneDesc, { color: theme.text.tertiary }]}>{m.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom padding */}
            <View style={{ height: spacing.xxl }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.headerPaddingTop,
    paddingBottom: spacing.headerPaddingBottom,
  },
  headerTitle: {
    ...typography.headingLarge,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.headingMedium,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Sections
  section: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sectionSpacing,
  },
  sectionTitle: {
    ...typography.bodySmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Stats row (matches ProfileScreen)
  statsRow: {
    flexDirection: 'row',
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    borderWidth: 1,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  statNumber: {
    ...typography.headingMedium,
  },
  statLabel: {
    ...typography.caption,
  },
  // Card
  card: {
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    borderWidth: 1,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  radarCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  // Bar chart
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barLabel: {
    ...typography.bodySmall,
    width: 60,
  },
  barContainer: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  bar: {
    height: '100%',
    borderRadius: 8,
    minWidth: 4,
  },
  barCount: {
    ...typography.bodySmall,
    width: 28,
    textAlign: 'right',
  },
  // Most brewed
  mostBrewedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mostBrewedRank: {
    ...typography.headingMedium,
    width: 28,
  },
  mostBrewedInfo: {
    flex: 1,
    marginLeft: 4,
  },
  mostBrewedName: {
    ...typography.body,
    fontWeight: '500',
  },
  mostBrewedBrand: {
    ...typography.caption,
    marginTop: 2,
  },
  mostBrewedCount: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  // Milestones
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  milestoneLocked: {
    opacity: 0.5,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  milestoneName: {
    ...typography.body,
    fontWeight: '600',
  },
  milestoneDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  milestoneCheck: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
