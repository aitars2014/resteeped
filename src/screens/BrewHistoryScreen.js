import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Coffee, Clock, Thermometer, Award } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { TeaTypeBadge } from '../components';
import { useBrewHistory } from '../hooks';

const BrewHistoryScreen = ({ navigation }) => {
  const { 
    brewSessions, 
    loading, 
    refreshBrewHistory,
    todayBrewCount,
    weekBrewCount,
    getMostBrewedTeas,
    getBrewStats,
    getBrewsByDate,
  } = useBrewHistory();

  const stats = getBrewStats();
  const mostBrewed = getMostBrewedTeas(3);
  const brewsByDate = getBrewsByDate();

  // Convert brewsByDate to sections for SectionList
  const sections = Object.entries(brewsByDate)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .map(([date, brews]) => ({
      title: formatDateHeader(date),
      data: brews,
    }));

  function formatDateHeader(dateString) {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const renderStatsCard = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Your Brewing Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalBrews}</Text>
          <Text style={styles.statLabel}>Total Brews</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayBrewCount}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{weekBrewCount}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.uniqueTeas}</Text>
          <Text style={styles.statLabel}>Unique Teas</Text>
        </View>
      </View>

      {stats.avgSteepTime > 0 && (
        <View style={styles.avgSteepTime}>
          <Clock size={16} color={colors.text.secondary} />
          <Text style={styles.avgSteepText}>
            Average steep time: {formatTime(stats.avgSteepTime)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderMostBrewed = () => {
    if (mostBrewed.length === 0) return null;

    return (
      <View style={styles.mostBrewedSection}>
        <View style={styles.sectionHeader}>
          <Award size={18} color={colors.accent.primary} />
          <Text style={styles.sectionTitle}>Most Brewed</Text>
        </View>
        {mostBrewed.map(({ teaId, count, tea }, index) => (
          <TouchableOpacity
            key={teaId}
            style={styles.mostBrewedItem}
            onPress={() => tea && navigation.navigate('TeaDetail', { tea })}
            disabled={!tea}
          >
            <View style={styles.mostBrewedRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.mostBrewedInfo}>
              <Text style={styles.mostBrewedName} numberOfLines={1}>
                {tea?.name || 'Unknown Tea'}
              </Text>
              {tea?.tea_type && (
                <TeaTypeBadge teaType={tea.tea_type} size="small" />
              )}
            </View>
            <Text style={styles.mostBrewedCount}>{count} brews</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderBrewSession = ({ item }) => {
    const tea = item.tea;
    const teaColor = tea?.tea_type ? getTeaTypeColor(tea.tea_type) : null;

    return (
      <TouchableOpacity
        style={styles.brewItem}
        onPress={() => tea && navigation.navigate('TeaDetail', { tea })}
        disabled={!tea}
      >
        <View 
          style={[
            styles.brewColorBar, 
            { backgroundColor: teaColor?.primary || colors.text.secondary }
          ]} 
        />
        <View style={styles.brewContent}>
          <View style={styles.brewMain}>
            <Text style={styles.brewTeaName} numberOfLines={1}>
              {tea?.name || 'Quick Brew'}
            </Text>
            <Text style={styles.brewTime}>{formatTimestamp(item.created_at)}</Text>
          </View>
          <View style={styles.brewDetails}>
            <View style={styles.brewDetail}>
              <Clock size={12} color={colors.text.secondary} />
              <Text style={styles.brewDetailText}>
                {formatTime(item.steep_time_seconds)}
              </Text>
            </View>
            {item.temperature_f && (
              <View style={styles.brewDetail}>
                <Thermometer size={12} color={colors.text.secondary} />
                <Text style={styles.brewDetailText}>{item.temperature_f}°F</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      <Text style={styles.sectionHeaderCount}>{section.data.length} brews</Text>
    </View>
  );

  const renderHeader = () => (
    <>
      {renderStatsCard()}
      {renderMostBrewed()}
      {sections.length > 0 && (
        <View style={styles.historyHeader}>
          <Coffee size={18} color={colors.accent.primary} />
          <Text style={styles.sectionTitle}>Brew History</Text>
        </View>
      )}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Coffee size={64} color={colors.text.secondary} />
      <Text style={styles.emptyTitle}>No brews yet</Text>
      <Text style={styles.emptySubtitle}>
        Start brewing teas to build your history!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Brew History</Text>
        <View style={{ width: 40 }} />
      </View>

      <SectionList
        sections={sections}
        renderItem={renderBrewSession}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={brewSessions.length === 0 ? renderEmpty : null}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshBrewHistory}
            tintColor={colors.accent.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.headingSmall,
    color: colors.text.primary,
  },
  listContent: {
    paddingBottom: 20,
  },
  statsSection: {
    padding: spacing.screenHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 4,
  },
  avgSteepTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  avgSteepText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  mostBrewedSection: {
    padding: spacing.screenHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  mostBrewedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  mostBrewedRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankNumber: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  mostBrewedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mostBrewedName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  mostBrewedCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionHeaderText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionHeaderCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  brewItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  brewColorBar: {
    width: 4,
  },
  brewContent: {
    flex: 1,
    padding: spacing.sm,
  },
  brewMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brewTeaName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  brewTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  brewDetails: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  brewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brewDetailText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.screenHorizontal,
  },
  emptyTitle: {
    ...typography.headingSmall,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default BrewHistoryScreen;
