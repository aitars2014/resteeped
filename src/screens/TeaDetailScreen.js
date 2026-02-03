import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  FlatList,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Thermometer, Clock, MapPin, Star, Check, MessageSquare, NotebookPen, ExternalLink, ShoppingCart, Share2 } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor, getPlaceholderImage } from '../constants';
import { Button, TeaTypeBadge, StarRating, FactCard, ReviewCard, WriteReviewModal, TastingNotesModal, TeaCard, CaffeineIndicator, FlavorRadar } from '../components';
import { shareTea } from '../utils/sharing';
import { useAuth, useCollection } from '../context';
import { useReviews, useCompanies, useTeas } from '../hooks';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.32;

export const TeaDetailScreen = ({ route, navigation }) => {
  const { tea } = route.params;
  const teaColor = getTeaTypeColor(tea.teaType);
  
  const { user } = useAuth();
  const { isInCollection, addToCollection, removeFromCollection, getCollectionItem, updateInCollection } = useCollection();
  const { reviews, userReview, submitReview, reviewCount, averageRating, loading: reviewsLoading } = useReviews(tea.id);
  const { companies } = useCompanies();
  const { teas } = useTeas();
  
  // Find similar teas (same type, excluding current tea)
  const similarTeas = useMemo(() => {
    return teas
      .filter(t => t.id !== tea.id && t.teaType === tea.teaType)
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, 6);
  }, [teas, tea.id, tea.teaType]);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTastingNotes, setShowTastingNotes] = useState(false);
  
  // Find company by brand name or company_id
  const company = tea.companyId 
    ? companies.find(c => c.id === tea.companyId)
    : companies.find(c => c.name === tea.brandName);
  
  const inCollection = isInCollection(tea.id);
  const collectionItem = getCollectionItem(tea.id);
  
  const handleToggleCollection = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to save teas to your collection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }
    
    if (inCollection) {
      await removeFromCollection(tea.id);
    } else {
      await addToCollection(tea.id, 'want_to_try', tea);
    }
  };
  
  const handleWriteReview = () => {
    if (!user) {
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
  
  const handleSubmitReview = async ({ rating, reviewText }) => {
    const { error } = await submitReview({ rating, reviewText });
    if (error) {
      Alert.alert('Error', 'Could not submit review. Please try again.');
    } else {
      setShowReviewModal(false);
    }
  };
  
  const handleBrewTea = () => {
    navigation.navigate('Timer', { 
      screen: 'TimerHome',
      params: { tea } 
    });
  };
  
  const handleSaveTastingNotes = async ({ notes, rating }) => {
    const updates = { notes };
    if (rating > 0) {
      updates.user_rating = rating;
      updates.status = 'tried';
      updates.tried_at = new Date().toISOString();
    }
    await updateInCollection(tea.id, updates);
    setShowTastingNotes(false);
  };
  
  const handleBuyTea = async () => {
    const url = tea.productUrl || tea.product_url;
    if (url) {
      try {
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert('Error', 'Could not open the product page.');
      }
    } else if (company?.website_url) {
      // Fallback to company website
      try {
        await Linking.openURL(company.website_url);
      } catch (error) {
        Alert.alert('Error', 'Could not open the shop website.');
      }
    }
  };
  
  // Check if tea is available (has product URL or is not marked discontinued)
  const isAvailable = !tea.discontinued && (tea.productUrl || tea.product_url || company?.website_url);
  
  const formatSteepTime = () => {
    if (tea.steepTimeMin && tea.steepTimeMax) {
      return `${tea.steepTimeMin}-${tea.steepTimeMax} min`;
    }
    return tea.steepTimeMin ? `${tea.steepTimeMin} min` : '—';
  };
  
  const displayRating = reviewCount > 0 ? averageRating : (tea.avgRating || 0);
  const displayCount = reviewCount > 0 ? reviewCount : (tea.ratingCount || 0);
  
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image 
            source={tea.imageUrl ? { uri: tea.imageUrl } : getPlaceholderImage(tea.teaType)} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
            style={styles.heroOverlay}
          />
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => shareTea(tea)}
          >
            <Share2 size={20} color={colors.text.primary} />
          </TouchableOpacity>
          
          {inCollection && (
            <View style={styles.collectionBadge}>
              <Check size={16} color={colors.text.inverse} />
            </View>
          )}
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.teaName}>{tea.name}</Text>
          <TouchableOpacity 
            onPress={() => company && navigation.navigate('CompanyProfile', { company })}
            disabled={!company}
          >
            <Text style={[styles.brandName, company && styles.brandNameTappable]}>
              {tea.brandName}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.badgeRow}>
            <TeaTypeBadge teaType={tea.teaType} size="large" />
            <View style={styles.ratingPill}>
              <Star size={14} color={colors.rating.star} fill={colors.rating.star} />
              <Text style={styles.ratingText}>
                {displayRating.toFixed(1)} ({displayCount})
              </Text>
            </View>
          </View>
          
          {/* Quick Facts Row */}
          <View style={styles.quickFacts}>
            {tea.steepTempF && (
              <View style={styles.quickFact}>
                <Thermometer size={18} color={colors.accent.primary} />
                <Text style={styles.quickFactText}>{tea.steepTempF}°F</Text>
              </View>
            )}
            {tea.steepTimeMin && (
              <View style={styles.quickFact}>
                <Clock size={18} color={colors.accent.primary} />
                <Text style={styles.quickFactText}>{formatSteepTime()}</Text>
              </View>
            )}
            {tea.origin && (
              <View style={styles.quickFact}>
                <MapPin size={18} color={colors.accent.primary} />
                <Text style={styles.quickFactText} numberOfLines={1}>{tea.origin}</Text>
              </View>
            )}
          </View>
          
          {/* Caffeine Level */}
          <View style={styles.caffeineRow}>
            <CaffeineIndicator teaType={tea.teaType} size="medium" />
          </View>
          
          {/* Description */}
          {tea.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{tea.description}</Text>
            </View>
          )}
          
          {/* Flavor Notes */}
          {tea.flavorNotes && tea.flavorNotes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flavor Notes</Text>
              <View style={styles.flavorTags}>
                {tea.flavorNotes.map((note, index) => (
                  <View key={index} style={styles.flavorTag}>
                    <Text style={styles.flavorTagText}>{note}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Flavor Profile Radar */}
          {tea.flavorNotes && tea.flavorNotes.length >= 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flavor Profile</Text>
              <View style={styles.radarContainer}>
                <FlavorRadar flavorNotes={tea.flavorNotes} size={220} />
              </View>
            </View>
          )}
          
          {/* Personal Tasting Notes (only if in collection) */}
          {inCollection && (
            <View style={styles.section}>
              <View style={styles.tastingNotesHeader}>
                <Text style={styles.sectionTitle}>My Tasting Notes</Text>
                <TouchableOpacity 
                  onPress={() => setShowTastingNotes(true)} 
                  style={styles.editNotesButton}
                >
                  <NotebookPen size={16} color={colors.accent.primary} />
                  <Text style={styles.editNotesText}>
                    {collectionItem?.notes ? 'Edit' : 'Add Notes'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {collectionItem?.user_rating > 0 && (
                <View style={styles.myRating}>
                  <Text style={styles.myRatingLabel}>My Rating:</Text>
                  <StarRating rating={collectionItem.user_rating} size={18} />
                </View>
              )}
              
              {collectionItem?.notes ? (
                <TouchableOpacity 
                  style={styles.notesCard}
                  onPress={() => setShowTastingNotes(true)}
                >
                  <Text style={styles.notesText}>{collectionItem.notes}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.addNotesPrompt}
                  onPress={() => setShowTastingNotes(true)}
                >
                  <NotebookPen size={24} color={colors.text.secondary} />
                  <Text style={styles.addNotesText}>
                    Tap to add your tasting notes
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>
                Reviews {reviewCount > 0 && `(${reviewCount})`}
              </Text>
              <TouchableOpacity onPress={handleWriteReview} style={styles.writeReviewButton}>
                <MessageSquare size={16} color={colors.accent.primary} />
                <Text style={styles.writeReviewText}>
                  {userReview ? 'Edit Review' : 'Write Review'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <View style={styles.noReviews}>
                <Text style={styles.noReviewsText}>
                  No reviews yet. Be the first to review this tea!
                </Text>
              </View>
            )}
            
            {reviews.length > 3 && (
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See all {reviews.length} reviews</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Buy This Tea */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buy This Tea</Text>
            {isAvailable ? (
              <TouchableOpacity 
                style={styles.buyCard}
                onPress={handleBuyTea}
                activeOpacity={0.7}
              >
                <View style={styles.buyCardContent}>
                  <View style={styles.buyIconContainer}>
                    <ShoppingCart size={24} color={colors.accent.primary} />
                  </View>
                  <View style={styles.buyCardText}>
                    <Text style={styles.buyCardTitle}>
                      Available at {tea.brandName}
                    </Text>
                    <Text style={styles.buyCardSubtitle}>
                      Tap to visit their website
                    </Text>
                  </View>
                  <ExternalLink size={20} color={colors.text.secondary} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.unavailableCard}>
                <Text style={styles.unavailableText}>
                  This tea is currently not available for purchase
                </Text>
              </View>
            )}
          </View>
          
          {/* You Might Also Like */}
          {similarTeas.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>You Might Also Like</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarTeaList}
              >
                {similarTeas.map((similarTea) => (
                  <View key={similarTea.id} style={styles.similarTeaCard}>
                    <TeaCard 
                      tea={similarTea}
                      onPress={() => navigation.push('TeaDetail', { tea: similarTea })}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          <View style={{ height: 140 }} />
        </View>
      </ScrollView>
      
      {/* Sticky Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button 
          title={inCollection ? "In My Collection ✓" : "Add to My Teas"}
          onPress={handleToggleCollection}
          variant="primary"
          style={[styles.button, inCollection && styles.inCollectionButton]}
        />
        <Button 
          title="Brew This Tea"
          onPress={handleBrewTea}
          variant="secondary"
          style={styles.button}
        />
      </View>
      
      {/* Review Modal */}
      <WriteReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        teaName={tea.name}
        initialRating={userReview?.rating || 0}
        initialText={userReview?.review_text || ''}
      />
      
      {/* Tasting Notes Modal */}
      <TastingNotesModal
        visible={showTastingNotes}
        onClose={() => setShowTastingNotes(false)}
        onSave={handleSaveTastingNotes}
        teaName={tea.name}
        initialNotes={collectionItem?.notes || ''}
        initialRating={collectionItem?.user_rating || 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow.elevated,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  collectionBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sectionSpacing,
  },
  teaName: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: 4,
  },
  brandName: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  brandNameTappable: {
    color: colors.accent.primary,
    textDecorationLine: 'underline',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.sectionSpacing,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
  },
  quickFacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: spacing.md,
  },
  quickFact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickFactText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  caffeineRow: {
    marginBottom: spacing.sectionSpacing,
  },
  radarContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  section: {
    marginBottom: spacing.sectionSpacing,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  flavorTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flavorTag: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  flavorTagText: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  tastingNotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editNotesText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  myRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  myRatingLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  notesCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  notesText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  addNotesPrompt: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  addNotesText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  writeReviewText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  noReviews: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    alignItems: 'center',
  },
  noReviewsText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: 10,
  },
  button: {
    width: '100%',
  },
  inCollectionButton: {
    backgroundColor: colors.accent.secondary,
  },
  buyCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
  },
  buyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.cardPadding,
  },
  buyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  buyCardText: {
    flex: 1,
  },
  buyCardTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  buyCardSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  unavailableCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    alignItems: 'center',
  },
  unavailableText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  similarTeaList: {
    paddingRight: spacing.screenHorizontal,
    gap: spacing.cardGap,
  },
  similarTeaCard: {
    width: 160,
  },
});
