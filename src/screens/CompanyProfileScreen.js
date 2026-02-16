import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  MapPin,
  ExternalLink,
  Instagram,
  Award,
  MessageSquare,
  TrendingUp,
  Star,
  Users,
} from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { Button, StarRating, TeaCard, WriteCompanyReviewModal, CompanyProfileSkeleton, ReviewCard, FilterPills } from '../components';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';
import { useCompanyReviews } from '../hooks';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const SORT_OPTIONS = [
  { key: 'popularity', label: 'Popular', icon: Users },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'rating', label: 'Top Rated', icon: Star },
];

const CompanyProfileScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { companyId, company: passedCompany } = route.params || {};
  const { user, isDevMode } = useAuth();
  
  // Derive effective company ID from params directly
  const effectiveCompanyId = companyId || passedCompany?.id;
  
  // Brand color with fallback
  const brandColor = company?.primary_color || theme.accent.primary;
  
  const [company, setCompany] = useState(passedCompany || null);
  const [allTeas, setAllTeas] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!passedCompany);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTeaType, setSelectedTeaType] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');

  // Get the company reviews hook for submitting reviews
  const { submitReview, userReview, refreshReviews } = useCompanyReviews(effectiveCompanyId);

  // Update company when passedCompany changes (fixes Bug 3 - stale state on reuse)
  useEffect(() => {
    if (passedCompany) {
      setCompany(passedCompany);
    }
  }, [passedCompany?.id]);

  // Fetch data when effectiveCompanyId changes
  useEffect(() => {
    if (!effectiveCompanyId) return;
    
    // Reset state for new company
    setAllTeas([]);
    setReviews([]);
    setSelectedTeaType('all');
    setSortBy('popularity');
    
    if (!passedCompany) {
      fetchCompany();
    }
    fetchAllTeas();
    fetchReviews();
    
    // Track company view
    const companyData = passedCompany || company;
    if (companyData) {
      trackEvent(AnalyticsEvents.COMPANY_VIEWED, {
        company_id: companyData.id,
        company_name: companyData.name,
      });
    }
  }, [effectiveCompanyId]);

  const fetchCompany = async () => {
    if (!isSupabaseConfigured() || isDevMode) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', effectiveCompanyId)
        .single();
      
      if (error) throw error;
      setCompany(data);
    } catch (err) {
      console.error('Error fetching company:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTeas = async () => {
    if (!isSupabaseConfigured() || isDevMode) return;
    
    try {
      const { data, error } = await supabase
        .from('teas')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .order('rating_count', { ascending: false });
      
      if (error) throw error;
      setAllTeas(data || []);
    } catch (err) {
      console.error('Error fetching teas:', err);
    }
  };

  const fetchReviews = async () => {
    if (!isSupabaseConfigured() || isDevMode) return;
    
    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select(`
          *,
          profile:profiles(username, display_name, avatar_url)
        `)
        .eq('company_id', effectiveCompanyId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  // Filter and sort teas
  const filteredTeas = useMemo(() => {
    let teas = [...allTeas];
    
    // Filter by type
    if (selectedTeaType !== 'all') {
      teas = teas.filter(t => (t.tea_type || t.type)?.toLowerCase() === selectedTeaType.toLowerCase());
    }
    
    // Sort
    switch (sortBy) {
      case 'popularity':
        teas.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0));
        break;
      case 'trending':
        teas.sort((a, b) => {
          // Use updated_at or created_at as proxy for recent activity
          const dateA = new Date(a.updated_at || a.created_at || 0);
          const dateB = new Date(b.updated_at || b.created_at || 0);
          return dateB - dateA;
        });
        break;
      case 'rating':
        teas.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
    }
    
    return teas;
  }, [allTeas, selectedTeaType, sortBy]);

  const openWebsite = async () => {
    if (company?.website_url) {
      try {
        await Linking.openURL(company.website_url);
      } catch (e) {
        Alert.alert('Unable to open link', company.website_url);
      }
    }
  };

  const openInstagram = async () => {
    if (company?.instagram_handle) {
      try {
        await Linking.openURL(`https://instagram.com/${company.instagram_handle}`);
      } catch (e) {
        Alert.alert('Unable to open link', `instagram.com/${company.instagram_handle}`);
      }
    }
  };

  const handleWriteReview = () => {
    if (!user && !isDevMode) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to write a review.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (reviewData) => {
    const { error, moderation } = await submitReview(reviewData);
    if (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
      return;
    }
    setShowReviewModal(false);
    fetchReviews();
    
    if (moderation) {
      setTimeout(() => {
        Alert.alert(
          'Review Under Review',
          moderation.message || 'Your review has been submitted and is pending moderation. It will appear once approved.',
          [{ text: 'OK' }]
        );
      }, 300);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <CompanyProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (!company) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background.primary }]}>
        <Text style={[styles.errorText, { color: theme.text.secondary }]}>Company not found</Text>
      </View>
    );
  }

  const locationString = [
    company.headquarters_city,
    company.headquarters_state,
    company.headquarters_country,
  ].filter(Boolean).join(', ');

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - Gradient with centered logo (Bug 4 fix) */}
        <View style={styles.header}>
          <LinearGradient
            colors={[
              company.primary_color || theme.accent.primary,
              company.primary_color 
                ? `${company.primary_color}88` 
                : theme.accent.secondary,
              theme.background.primary,
            ]}
            locations={[0, 0.6, 1]}
            style={styles.banner}
          />
          {/* Centered logo */}
          {company.logo_url && (
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: company.logo_url }} 
                style={styles.centeredLogo}
                resizeMode="contain"
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`${company.name} logo`}
              />
            </View>
          )}
          {/* Overlay gradient for back button readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'transparent']}
            style={styles.headerGradient}
          />
          
          <SafeAreaView style={styles.headerOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={28} color={theme.text.inverse} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Company Info */}
        <View style={[styles.infoSection, { borderBottomColor: theme.border.light }]}>
          <Text style={[styles.companyName, { color: theme.text.primary }]}>{company.name}</Text>
          
          {company.short_description && (
            <Text style={[styles.shortDescription, { color: theme.text.secondary }]}>{company.short_description}</Text>
          )}

          {/* Rating */}
          <View style={styles.ratingRow}>
            <StarRating rating={company.avg_rating || 0} size={18} />
            <Text style={[styles.ratingText, { color: theme.text.secondary }]}>
              {company.avg_rating?.toFixed(1) || '0.0'} ({company.rating_count || 0} reviews)
            </Text>
          </View>

          {/* Location */}
          {locationString && (
            <View style={styles.metaRow}>
              <MapPin size={16} color={theme.text.secondary} />
              <Text style={[styles.metaText, { color: theme.text.secondary }]}>{locationString}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              title="Visit Website"
              onPress={openWebsite}
              icon={<ExternalLink size={16} color={theme.text.inverse} />}
              style={[styles.actionButton, { backgroundColor: brandColor }]}
            />
            {company.instagram_handle && (
              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: theme.background.secondary }]} 
                onPress={openInstagram}
                accessible={true}
                accessibilityRole="link"
                accessibilityLabel={`Visit ${company.name} on Instagram`}
                accessibilityHint="Opens Instagram in browser"
              >
                <Instagram size={20} color={brandColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Description */}
        {company.description && (
          <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>About</Text>
            <Text style={[styles.description, { color: theme.text.secondary }]}>{company.description}</Text>
          </View>
        )}

        {/* Specialties */}
        {company.specialty?.length > 0 && (
          <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Specialties</Text>
            <View style={styles.tagContainer}>
              {company.specialty.map((spec, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: theme.background.secondary }]}>
                  <Text style={[styles.tagText, { color: theme.text.primary }]}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {company.certifications?.length > 0 && (
          <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Certifications</Text>
            <View style={styles.tagContainer}>
              {company.certifications.map((cert, idx) => (
                <View key={idx} style={[styles.tag, styles.certTag, { backgroundColor: theme.status.success + '20' }]}>
                  <Award size={12} color={theme.status.success} style={{ marginRight: 4 }} />
                  <Text style={[styles.tagText, { color: theme.status.success }]}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Teas Section (Bug 2 fix - full list with filters) */}
        <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Teas {allTeas.length > 0 && `(${allTeas.length})`}
          </Text>
          
          {/* Filter pills */}
          <FilterPills selectedType={selectedTeaType} onSelectType={setSelectedTeaType} />
          
          {/* Sort options */}
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortBy === opt.key;
              const IconComp = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.sortPill,
                    { backgroundColor: isActive ? brandColor : theme.background.secondary },
                  ]}
                  onPress={() => setSortBy(opt.key)}
                >
                  <IconComp size={14} color={isActive ? theme.text.inverse : theme.text.secondary} />
                  <Text style={[
                    styles.sortPillText,
                    { color: isActive ? theme.text.inverse : theme.text.secondary },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tea grid */}
          {filteredTeas.length > 0 ? (
            <View style={styles.teaGrid}>
              {filteredTeas.map((tea) => (
                <View key={tea.id} style={styles.teaGridItem}>
                  <TeaCard
                    tea={tea}
                    onPress={() => navigation.navigate('TeaDetail', { tea })}
                    compact
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noTeas}>
              <Text style={[styles.noTeasText, { color: theme.text.secondary }]}>
                {allTeas.length > 0 ? 'No teas match this filter' : 'No teas found'}
              </Text>
            </View>
          )}
        </View>

        {/* Reviews */}
        <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Reviews {company.rating_count > 0 && `(${company.rating_count})`}
            </Text>
            <TouchableOpacity 
              style={styles.writeReviewButton} 
              onPress={handleWriteReview}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Write a review"
              accessibilityHint={`Share your experience with ${company.name}`}
            >
              <MessageSquare size={16} color={brandColor} />
              <Text style={[styles.writeReviewText, { color: brandColor }]}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                isOwnReview={user && review.user_id === user.id}
              />
            ))
          ) : (
            <View style={styles.noReviews}>
              <Text style={[styles.noReviewsText, { color: theme.text.secondary }]}>
                No reviews yet. Be the first to review {company.name}!
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Write Review Modal */}
      <WriteCompanyReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        companyName={company?.name}
        initialRating={userReview?.rating || 0}
        initialText={userReview?.review_text || ''}
        initialCategoryRatings={{
          quality: userReview?.quality_rating || 0,
          shipping: userReview?.shipping_rating || 0,
          service: userReview?.service_rating || 0,
          value: userReview?.value_rating || 0,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
  },
  header: {
    height: 220,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredLogo: {
    width: 220,
    height: 180,
    borderRadius: 20,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
    marginTop: spacing.sm,
  },
  infoSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  companyName: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  shortDescription: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingText: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metaText: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  tagText: {
    ...typography.caption,
  },
  certTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  sortPillText: {
    ...typography.caption,
    fontWeight: '500',
  },
  teaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  teaGridItem: {
    width: '48%',
  },
  noTeas: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noTeasText: {
    ...typography.body,
    textAlign: 'center',
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  writeReviewText: {
    ...typography.caption,
  },
  noReviews: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noReviewsText: {
    ...typography.body,
    textAlign: 'center',
  },
});

export default CompanyProfileScreen;
