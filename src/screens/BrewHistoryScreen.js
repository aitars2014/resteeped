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
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { TeaTypeBadge } from '../components';
import { useBrewHistory } from '../hooks';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const BrewHistoryScreen = ({ navigation }) => {
  const { theme, getTeaTypeColor } = useTheme();
  React.useEffect(() => { trackEvent(AnalyticsEvents.BREW_HISTORY_VIEWED); }, []);
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
    <View style={[styles.statsSection, { borderBottomColor: theme.border.light }]}>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Your Brewing Stats</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.statNumber, { color: theme.accent.primary }]}>{stats.totalBrews}</Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Total Brews</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.statNumber, { color: theme.accent.primary }]}>{todayBrewCount}</Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.statNumber, { color: theme.accent.primary }]}>{weekBrewCount}</Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>This Week</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.statNumber, { color: theme.accent.primary }]}>{stats.uniqueTeas}</Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Unique Teas</Text>
        </View>
      </View>

      {stats.avgSteepTime > 0 && (
        <View style={[styles.avgSteepTime, { borderTopColor: theme.border.light }]}>
          <Clock size={16} color={theme.text.secondary} />
          <Text style={[styles.avgSteepText, { color: theme.text.secondary }]}>
            Average steep time: {formatTime(stats.avgSteepTime)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderMostBrewed = () => {
    if (mostBrewed.length === 0) return null;

    return (
      <View style={[styles.mostBrewedSection, { borderBottomColor: theme.border.light }]}>
        <View style={styles.sectionHeader}>
          <Award size={18} color={theme.accent.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Most Brewed</Text>
        </View>
        {mostBrewed.map(({ teaId, count, tea }, index) => (
          <TouchableOpacity
            key={teaId}
            style={[styles.mostBrewedItem, { backgroundColor: theme.background.secondary }]}
            onPress={() => tea && navigation.navigate('TeaDetail', { tea })}
            disabled={!tea}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Number ${index + 1}: ${tea?.name || 'Unknown Tea'}, brewed ${count} times`}
            accessibilityHint={tea ? "View tea details" : undefined}
            accessibilityState={{ disabled: !tea }}
          >
            <View style={[styles.mostBrewedRank, { backgroundColor: theme.accent.primary }]} accessibilityElementsHidden={true}>
              <Text style={[styles.rankNumber, { color: theme.text.inverse }]}>{index + 1}</Text>
            </View>
            <View style={styles.mostBrewedInfo}>
              <Text style={[styles.mostBrewedName, { color: theme.text.primary }]} numberOfLines={1}>
                {tea?.name || 'Unknown Tea'}
              </Text>
              {tea?.tea_type && (
                <TeaTypeBadge teaType={tea.tea_type} size="small" />
              )}
            </View>
            <Text style={[styles.mostBrewedCount, { color: theme.text.secondary }]}>{count} brews</Text>
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
        style={[styles.brewItem, { backgroundColor: theme.background.secondary }]}
        onPress={() => tea && navigation.navigate('TeaDetail', { tea })}
        disabled={!tea}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${tea?.name || 'Quick Brew'}, steeped for ${formatTime(item.steep_time_seconds)}${item.temperature_f ? ` at ${item.temperature_f} degrees` : ''}, at ${formatTimestamp(item.created_at)}`}
        accessibilityHint={tea ? "View tea details" : undefined}
        accessibilityState={{ disabled: !tea }}
      >
        <View 
          style={[
            styles.brewColorBar, 
            { backgroundColor: teaColor?.primary || theme.text.secondary }
          ]} 
          accessibilityElementsHidden={true}
        />
        <View style={styles.brewContent}>
          <View style={styles.brewMain}>
            <Text style={[styles.brewTeaName, { color: theme.text.primary }]} numberOfLines={1}>
              {tea?.name || 'Quick Brew'}
            </Text>
            <Text style={[styles.brewTime, { color: theme.text.secondary }]}>{formatTimestamp(item.created_at)}</Text>
          </View>
          <View style={styles.brewDetails}>
            <View style={styles.brewDetail}>
              <Clock size={12} color={theme.text.secondary} />
              <Text style={[styles.brewDetailText, { color: theme.text.secondary }]}>
                {formatTime(item.steep_time_seconds)}
              </Text>
            </View>
            {item.temperature_f && (
              <View style={styles.brewDetail}>
                <Thermometer size={12} color={theme.text.secondary} />
                <Text style={[styles.brewDetailText, { color: theme.text.secondary }]}>{item.temperature_f}°F</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionHeaderText, { color: theme.text.primary }]}>{section.title}</Text>
      <Text style={[styles.sectionHeaderCount, { color: theme.text.secondary }]}>{section.data.length} brews</Text>
    </View>
  );

  const renderHeader = () => (
    <>
      {renderStatsCard()}
      {renderMostBrewed()}
      {sections.length > 0 && (
        <View style={styles.historyHeader}>
          <Coffee size={18} color={theme.accent.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Brew History</Text>
        </View>
      )}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Coffee size={64} color={theme.text.secondary} accessibilityElementsHidden={true} />
      <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No brews yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
        Start brewing teas to build your history!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]} accessibilityRole="header">Brew History</Text>
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
            tintColor={theme.accent.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.headingSmall,
  },
  listContent: {
    paddingBottom: 20,
  },
  statsSection: {
    padding: spacing.screenHorizontal,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
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
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
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
  },
  avgSteepText: {
    ...typography.bodySmall,
  },
  mostBrewedSection: {
    padding: spacing.screenHorizontal,
    borderBottomWidth: 1,
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
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  mostBrewedRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankNumber: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  mostBrewedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mostBrewedName: {
    ...typography.body,
    flex: 1,
  },
  mostBrewedCount: {
    ...typography.caption,
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
  },
  sectionHeaderCount: {
    ...typography.caption,
  },
  brewItem: {
    flexDirection: 'row',
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
    flex: 1,
    marginRight: spacing.sm,
  },
  brewTime: {
    ...typography.caption,
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
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.screenHorizontal,
  },
  emptyTitle: {
    ...typography.headingSmall,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default BrewHistoryScreen;
