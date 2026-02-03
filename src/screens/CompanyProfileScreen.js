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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  MapPin,
  Globe,
  Star,
  ExternalLink,
  Instagram,
  Award,
  Package,
  MessageSquare,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { Button, StarRating, TeaCard } from '../components';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';

const CompanyProfileScreen = ({ route, navigation }) => {
  const { companyId, company: passedCompany } = route.params || {};
  const { user, isDevMode } = useAuth();
  
  const [company, setCompany] = useState(passedCompany || null);
  const [topTeas, setTopTeas] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!passedCompany);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Company not found</Text>
      </View>
    );
  }

  const locationString = [
    company.headquarters_city,
    company.headquarters_state,
    company.headquarters_country,
  ].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {company.banner_url ? (
            <Image source={{ uri: company.banner_url }} style={styles.banner} />
          ) : (
            <LinearGradient
              colors={[company.primary_color || colors.accent.primary, colors.background.secondary]}
              style={styles.banner}
            />
          )}
          
          <SafeAreaView style={styles.headerOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={28} color={colors.text.primary} />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.logoContainer}>
            {company.logo_url ? (
              <Image source={{ uri: company.logo_url }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoPlaceholderText}>
                  {company.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.infoSection}>
          <Text style={styles.companyName}>{company.name}</Text>
          
          {company.short_description && (
            <Text style={styles.shortDescription}>{company.short_description}</Text>
          )}

          {/* Rating */}
          <View style={styles.ratingRow}>
            <StarRating rating={company.avg_rating || 0} size={18} />
            <Text style={styles.ratingText}>
              {company.avg_rating?.toFixed(1) || '0.0'} ({company.rating_count || 0} reviews)
            </Text>
          </View>

          {/* Location */}
          {locationString && (
            <View style={styles.metaRow}>
              <MapPin size={16} color={colors.text.secondary} />
              <Text style={styles.metaText}>{locationString}</Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{company.tea_count || 0}</Text>
              <Text style={styles.statLabel}>Teas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{company.founded_year || '—'}</Text>
              <Text style={styles.statLabel}>Founded</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {company.price_range?.charAt(0).toUpperCase() + company.price_range?.slice(1) || '—'}
              </Text>
              <Text style={styles.statLabel}>Price Range</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              title="Visit Website"
              onPress={openWebsite}
              icon={<ExternalLink size={16} color={colors.text.inverse} />}
              style={styles.actionButton}
            />
            {company.instagram_handle && (
              <TouchableOpacity style={styles.socialButton} onPress={openInstagram}>
                <Instagram size={20} color={colors.accent.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Description */}
        {company.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{company.description}</Text>
          </View>
        )}

        {/* Specialties */}
        {company.specialty?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.tagContainer}>
              {company.specialty.map((spec, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {company.certifications?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.tagContainer}>
              {company.certifications.map((cert, idx) => (
                <View key={idx} style={[styles.tag, styles.certTag]}>
                  <Award size={12} color={colors.status.success} style={{ marginRight: 4 }} />
                  <Text style={[styles.tagText, styles.certTagText]}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Shipping Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping</Text>
          <View style={styles.shippingInfo}>
            <Package size={16} color={colors.text.secondary} />
            <Text style={styles.shippingText}>
              {company.ships_internationally 
                ? 'Ships internationally' 
                : 'Domestic shipping only'}
            </Text>
          </View>
          {company.free_shipping_minimum && (
            <Text style={styles.shippingNote}>
              Free shipping on orders over ${company.free_shipping_minimum}
            </Text>
          )}
        </View>

        {/* Top Rated Teas */}
        {topTeas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Rated Teas</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Discovery', { companyId: company.id })}
              >
                <Text style={styles.seeAllText}>See All</Text>
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Reviews {company.rating_count > 0 && `(${company.rating_count})`}
            </Text>
            <TouchableOpacity style={styles.writeReviewButton}>
              <MessageSquare size={16} color={colors.accent.primary} />
              <Text style={styles.writeReviewText}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>
                    {review.profile?.display_name || 'Anonymous'}
                  </Text>
                  <StarRating rating={review.rating} size={14} />
                </View>
                {review.review_text && (
                  <Text style={styles.reviewText}>{review.review_text}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to review {company.name}!
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  header: {
    height: 200,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
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
    borderColor: colors.background.primary,
  },
  logoPlaceholder: {
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    ...typography.h1,
    color: colors.text.secondary,
  },
  infoSection: {
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  companyName: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  shortDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
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
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.accent.primary,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
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
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
  },
  tagText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  certTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.success + '20',
  },
  certTagText: {
    color: colors.status.success,
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shippingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  shippingNote: {
    ...typography.caption,
    color: colors.text.secondary,
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
    color: colors.accent.primary,
  },
  reviewCard: {
    backgroundColor: colors.background.secondary,
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
    color: colors.text.primary,
  },
  reviewText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  noReviews: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noReviewsText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default CompanyProfileScreen;
