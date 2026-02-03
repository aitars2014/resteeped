import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Star, MapPin, Globe, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { StarRating } from '../components';
import { useCompanies } from '../hooks';

export const TeaShopsScreen = ({ navigation }) => {
  const { companies, loading, refreshCompanies } = useCompanies();

  const renderShopCard = ({ item: company }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => navigation.navigate('CompanyProfile', { company })}
      activeOpacity={0.7}
    >
      <View style={styles.shopContent}>
        {/* Logo or Placeholder */}
        <View style={styles.logoContainer}>
          {company.logo_url ? (
            <Image source={{ uri: company.logo_url }} style={styles.logo} />
          ) : (
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.secondary]}
              style={styles.logoPlaceholder}
            >
              <Text style={styles.logoText}>
                {company.name.charAt(0)}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Info */}
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>{company.name}</Text>
          
          {company.headquarters_city && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.text.secondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {company.headquarters_city}
                {company.headquarters_state && `, ${company.headquarters_state}`}
              </Text>
            </View>
          )}
          
          <View style={styles.statsRow}>
            {company.avg_rating > 0 && (
              <View style={styles.ratingBadge}>
                <Star size={12} color={colors.rating.star} fill={colors.rating.star} />
                <Text style={styles.ratingText}>{company.avg_rating.toFixed(1)}</Text>
              </View>
            )}
            {company.tea_count > 0 && (
              <Text style={styles.teaCount}>{company.tea_count} teas</Text>
            )}
          </View>

          {company.short_description && (
            <Text style={styles.description} numberOfLines={2}>
              {company.short_description}
            </Text>
          )}
        </View>

        <ChevronRight size={20} color={colors.text.secondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No shops yet</Text>
      <Text style={styles.emptySubtitle}>Tea shops will appear here once added</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tea Shops</Text>
        <View style={styles.headerRight}>
          <Text style={styles.countBadge}>{companies.length}</Text>
        </View>
      </View>

      <FlatList
        data={companies}
        renderItem={renderShopCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshCompanies}
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
    color: colors.text.primary,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  countBadge: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.screenHorizontal,
    paddingBottom: 100,
  },
  shopCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    marginBottom: spacing.cardGap,
    overflow: 'hidden',
  },
  shopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.cardPadding,
  },
  logoContainer: {
    marginRight: spacing.md,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    ...typography.headingMedium,
    color: colors.text.inverse,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
  },
  teaCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

export default TeaShopsScreen;
