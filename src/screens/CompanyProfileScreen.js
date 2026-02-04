import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  MapPin,
  ExternalLink,
  Instagram,
  Award,
  Package,
  MessageSquare,
} from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { Button, StarRating, TeaCard, WriteCompanyReviewModal } from '../components';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';
import { useCompanyReviews } from '../hooks';

const CompanyProfileScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { companyId, company: passedCompany } = route.params || {};
  const { user, isDevMode } = useAuth();
  
  const [company, setCompany] = useState(passedCompany || null);
  const [topTeas, setTopTeas] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!passedCompany);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Get the company reviews hook for submitting reviews
  const { submitReview, userReview, refreshReviews } = useCompanyReviews(companyId || passedCompany?.id);

  useEffect(() => {
    if (companyId && !passedCompany) {
      fetchCompany();
    }
    if (companyId || passedCompany?.id) {
      fetchTopTeas();
      fetchReviews();
    }
  }, [companyId, passedCompany]);

  const fetchCompany = async () => {
    if (!isSupabaseConfigured() || isDevMode) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      setCompany(data);
    } catch (err) {
      console.error('Error fetching company:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopTeas = async () => {
    if (!isSupabaseConfigured() || isDevMode) return;
    
    const id = companyId || passedCompany?.id;
    try {
      const { data, error } = await supabase
        .from('teas')
        .select('*')
        .eq('company_id', id)
        .order('avg_rating', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setTopTeas(data || []);
    } catch (err) {
      console.error('Error fetching top teas:', err);
    }
  };

  const fetchReviews = async () => {
    if (!isSupabaseConfigured() || isDevMode) return;
    
    const id = companyId || passedCompany?.id;
    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select(`
          *,
          profile:profiles(username, display_name, avatar_url)
        `)
        .eq('company_id', id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const openWebsite = () => {
    if (company?.website_url) {
      Linking.openURL(company.website_url);
    }
  };

  const openInstagram = () => {
    if (company?.instagram_handle) {
      Linking.openURL(`https://instagram.com/${company.instagram_handle}`);
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
    const { error } = await submitReview(reviewData);
    if (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
      return;
    }
    setShowReviewModal(false);
    fetchReviews(); // Refresh the reviews list
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
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
        {/* Header */}
        <View style={styles.header}>
          {/* Always show gradient banner for visual appeal */}
          <LinearGradient
            colors={[
              company.primary_color || theme.accent.primary,
              company.primary_color 
                ? `${company.primary_color}88` 
                : `${theme.accent.primary}88`,
              theme.background.secondary,
            ]}
            locations={[0, 0.6, 1]}
            style={styles.banner}
          />
          {company.banner_url && (
            <Image source={{ uri: company.banner_url }} style={styles.bannerImage} />
          )}
          
          <SafeAreaView style={styles.headerOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={28} color={theme.text.inverse} />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={[styles.logoContainer, { borderColor: theme.background.primary, backgroundColor: theme.background.primary }]}>
            {company.logo_url ? (
              <Image 
                source={{ uri: company.logo_url }} 
                style={[styles.logo, { borderColor: theme.background.primary }]} 
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: theme.background.secondary, borderColor: theme.background.primary }]}>
                <Text style={[styles.logoPlaceholderText, { color: theme.text.secondary }]}>
                  {company.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
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

          {/* Stats Row */}
          <View style={[styles.statsRow, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: theme.text.primary }]}>{company.tea_count || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Teas</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: theme.text.primary }]}>{company.founded_year || '—'}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Founded</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: theme.text.primary }]}>
                {company.price_range?.charAt(0).toUpperCase() + company.price_range?.slice(1) || '—'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Price Range</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              title="Visit Website"
              onPress={openWebsite}
              icon={<ExternalLink size={16} color={theme.text.inverse} />}
              style={styles.actionButton}
            />
            {company.instagram_handle && (
              <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.background.secondary }]} onPress={openInstagram}>
                <Instagram size={20} color={theme.accent.primary} />
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

        {/* Shipping Info */}
        <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Shipping</Text>
          <View style={styles.shippingInfo}>
            <Package size={16} color={theme.text.secondary} />
            <Text style={[styles.shippingText, { color: theme.text.secondary }]}>
              {company.ships_internationally 
                ? 'Ships internationally' 
                : 'Domestic shipping only'}
            </Text>
          </View>
          {company.free_shipping_minimum && (
            <Text style={[styles.shippingNote, { color: theme.text.secondary }]}>
              Free shipping on orders over ${company.free_shipping_minimum}
            </Text>
          )}
        </View>

        {/* Top Rated Teas */}
        {topTeas.length > 0 && (
          <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Top Rated Teas</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Discovery', { companyId: company.id })}
              >
                <Text style={[styles.seeAllText, { color: theme.accent.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topTeas.map((tea) => (
                <TeaCard
                  key={tea.id}
                  tea={tea}
                  onPress={() => navigation.navigate('TeaDetail', { tea })}
                  style={styles.teaCard}
                  compact
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Reviews {company.rating_count > 0 && `(${company.rating_count})`}
            </Text>
            <TouchableOpacity style={styles.writeReviewButton} onPress={handleWriteReview}>
              <MessageSquare size={16} color={theme.accent.primary} />
              <Text style={[styles.writeReviewText, { color: theme.accent.primary }]}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.background.secondary }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewerName, { color: theme.text.primary }]}>
                    {review.profile?.display_name || 'Anonymous'}
                  </Text>
                  <StarRating rating={review.rating} size={14} />
                </View>
                {review.review_text && (
                  <Text style={[styles.reviewText, { color: theme.text.secondary }]}>{review.review_text}</Text>
                )}
              </View>
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
    height: 200,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
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
  logoContainer: {
    position: 'absolute',
    bottom: -40,
    left: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 3,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    ...typography.h1,
  },
  infoSection: {
    paddingTop: 50,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
  },
  statLabel: {
    ...typography.caption,
  },
  statDivider: {
    width: 1,
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
  seeAllText: {
    ...typography.caption,
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
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shippingText: {
    ...typography.body,
    marginLeft: spacing.xs,
  },
  shippingNote: {
    ...typography.caption,
    marginLeft: 24,
  },
  teaCard: {
    width: 160,
    marginRight: spacing.sm,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  writeReviewText: {
    ...typography.caption,
  },
  reviewCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewerName: {
    ...typography.bodyBold,
  },
  reviewText: {
    ...typography.body,
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
