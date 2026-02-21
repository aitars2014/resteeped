import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  FlatList,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft, Thermometer, Clock, MapPin, Star, Check, MessageSquare, NotebookPen, ExternalLink, ShoppingCart, Share2, Crown, Bookmark, Coffee } from 'lucide-react-native';
import { typography, spacing, getPlaceholderImage } from '../constants';
import { Button, TeaTypeBadge, StarRating, FactCard, ReviewCard, WriteReviewModal, TastingNotesModal, TeaCard, CaffeineIndicator, FlavorRadar, BrewingGuide, HealthBenefits, EditorialTastingNote } from '../components';
import { shareTea } from '../utils/sharing';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';
import { useAuth, useCollection, useTheme, useSubscription } from '../context';
import { useReviews, useCompanies, useTeas, useTastingNotes } from '../hooks';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.32;

export const TeaDetailScreen = ({ route, navigation }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const { tea } = route.params;
  const teaColor = getTeaTypeColor(tea.teaType || tea.tea_type);
  const styles = createStyles(theme);
  
  const { user } = useAuth();
  const { isInCollection, addToCollection, removeFromCollection, getCollectionItem, updateInCollection, collection } = useCollection();
  const { canAddToCollection, isPremium } = useSubscription();
  const { reviews, userReview, submitReview, reviewCount, averageRating, loading: reviewsLoading } = useReviews(tea.id);
  const { tastingNote } = useTastingNotes(tea.id);
  const { companies } = useCompanies();
  const { teas, getTeaDetails } = useTeas();
  
  // Fetch full tea details (description, steep params, flavor notes) on-demand
  const [fullTea, setFullTea] = useState(tea);
  useEffect(() => {
    let cancelled = false;
    getTeaDetails(tea.id).then(details => {
      if (!cancelled && details) setFullTea(details);
    });
    return () => { cancelled = true; };
  }, [tea.id, getTeaDetails]);
  
  // Find similar teas (same type, excluding current tea)
  const similarTeas = useMemo(() => {
    return teas
      .filter(t => t.id !== tea.id && t.teaType === tea.teaType)
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, 6);
  }, [teas, tea.id, tea.teaType]);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTastingNotes, setShowTastingNotes] = useState(false);
  
  // Track tea view
  useEffect(() => {
    trackEvent(AnalyticsEvents.TEA_VIEWED, {
      tea_id: tea.id,
      tea_name: tea.name,
      tea_type: tea.teaType || tea.tea_type,
      brand: tea.brandName || tea.brand_name,
    });
  }, [tea.id]);
  
  // Find company by brand name or company_id
  const company = (tea.companyId || tea.company_id)
    ? companies.find(c => c.id === (tea.companyId || tea.company_id))
    : companies.find(c => c.name === (tea.brandName || tea.brand_name));
  
  const inCollection = isInCollection(tea.id);
  const collectionItem = getCollectionItem(tea.id);
  
  const addTeaWithStatus = async (status) => {
    try {
      const result = await addToCollection(tea.id, status, tea);
      if (result?.error) {
        Alert.alert('Error', `Could not add to collection: ${result.error.message || JSON.stringify(result.error)}`);
        console.error('Add to collection failed:', result.error);
      }
    } catch (err) {
      Alert.alert('Unexpected Error', err.message || String(err));
      console.error('addTeaWithStatus error:', err);
    }
  };

  const handleSaveTea = async () => {
    try {
      if (!user) {
        Alert.alert(
          'Sign In Required',
          'Create an account to save teas to your collection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => navigation.navigate('Profile') },
          ]
        );
        return;
      }
      
      if (inCollection) {
        // Already saved — show manage options
        const currentStatus = collectionItem?.status || 'want_to_try';
        const buttons = [];
        if (currentStatus !== 'tried') {
          buttons.push({ text: 'Mark as Tried', onPress: () => updateInCollection(tea.id, { status: 'tried', tried_at: new Date().toISOString() }) });
        }
        buttons.push({ text: 'Remove', style: 'destructive', onPress: () => removeFromCollection(tea.id) });
        buttons.push({ text: 'Cancel', style: 'cancel' });
        Alert.alert(
          currentStatus === 'tried' ? 'Tried' : 'Saved',
          'What would you like to do?',
          buttons
        );
      } else {
        // One-tap save — no dialog
        if (!canAddToCollection(collection.length)) {
          Alert.alert(
            'Collection Full',
            'Free accounts can save up to 10 teas. Upgrade to Premium for unlimited teas in your collection!',
            [
              { text: 'Maybe Later', style: 'cancel' },
              { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
            ]
          );
          return;
        }
        await addTeaWithStatus('want_to_try');
      }
    } catch (err) {
      Alert.alert('Unexpected Error', err.message || String(err));
      console.error('handleSaveTea error:', err);
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
    const { error, moderation } = await submitReview({ rating, reviewText });
    if (error) {
      Alert.alert('Error', 'Could not submit review. Please try again.');
    } else {
      trackEvent(AnalyticsEvents.REVIEW_SUBMITTED, {
        tea_id: tea.id,
        tea_name: tea.name,
        rating,
        has_text: !!reviewText,
      });
      setShowReviewModal(false);
      
      // Show moderation message if review was flagged
      if (moderation) {
        setTimeout(() => {
          Alert.alert(
            'Review Under Review',
            moderation.message || 'Your review has been submitted and is pending moderation. It will appear once approved.',
            [{ text: 'OK' }]
          );
        }, 300);
      }
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
    let productUrl = tea.productUrl || tea.product_url;
    const companyUrl = company?.website_url;
    const brandName = tea.brandName || tea.brand_name || 'this tea';
    
    // Guard against malformed URLs with undefined slugs
    if (productUrl && productUrl.includes('/undefined')) {
      productUrl = null;
    }
    
    // Try product URL first, then company website, then search
    const url = productUrl || companyUrl || `https://www.google.com/search?q=${encodeURIComponent(brandName + ' ' + tea.name + ' tea')}`;
    
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      // Fallback to Linking if in-app browser fails
      try {
        await Linking.openURL(url);
      } catch (e) {
        Alert.alert('Error', 'Could not open the link.');
      }
    }
  };
  
  // Always show buy option if we have a brand name (we can at least search for it)
  const brandName = tea.brandName || tea.brand_name;
  const hasDirectLink = tea.productUrl || tea.product_url || company?.website_url;
  
  const formatSteepTime = () => {
    if (fullTea.steepTimeMin && fullTea.steepTimeMax) {
      return `${fullTea.steepTimeMin}-${fullTea.steepTimeMax} min`;
    }
    return fullTea.steepTimeMin ? `${fullTea.steepTimeMin} min` : '—';
  };
  
  const displayRating = reviewCount > 0 ? averageRating : (tea.avgRating || 0);
  const displayCount = reviewCount > 0 ? reviewCount : (tea.ratingCount || 0);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image 
            source={(tea.imageUrl || tea.image_url) ? { uri: tea.imageUrl || tea.image_url } : getPlaceholderImage(tea.teaType || tea.tea_type)} 
            style={styles.heroImage}
            resizeMode="cover"
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={`Photo of ${tea.name}`}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
            style={styles.heroOverlay}
          />
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => shareTea(tea)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share this tea"
          >
            <Share2 size={20} color={theme.text.primary} />
          </TouchableOpacity>
          
          {inCollection && (
            <View style={styles.collectionBadge}>
              <Check size={16} color={theme.text.inverse} />
            </View>
          )}
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text 
            style={styles.teaName}
            accessible={true}
            accessibilityRole="header"
          >
            {tea.name}
          </Text>
          <TouchableOpacity 
            onPress={() => company && navigation.navigate('CompanyProfile', { company })}
            disabled={!company}
            accessible={true}
            accessibilityRole={company ? "link" : "text"}
            accessibilityLabel={company ? `View ${tea.brandName} profile` : tea.brandName}
            accessibilityHint={company ? "Double tap to view company profile" : undefined}
          >
            <Text style={[styles.brandName, company && styles.brandNameTappable]}>
              {fullTea.brandName || fullTea.brand_name || tea.brandName || tea.brand_name}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.badgeRow}>
            <TeaTypeBadge teaType={tea.teaType} size="large" />
            <View style={styles.ratingPill}>
              <Star size={14} color={theme.rating.star} fill={theme.rating.star} />
              <Text style={styles.ratingText}>
                {displayRating.toFixed(1)} ({displayCount})
              </Text>
            </View>
          </View>
          
          {/* Quick Facts Row */}
          <View style={styles.quickFacts}>
            {fullTea.steepTempF && (
              <View style={styles.quickFact}>
                <Thermometer size={18} color={theme.accent.primary} />
                <Text style={styles.quickFactText}>{fullTea.steepTempF}°F</Text>
              </View>
            )}
            {fullTea.steepTimeMin && (
              <View style={styles.quickFact}>
                <Clock size={18} color={theme.accent.primary} />
                <Text style={styles.quickFactText}>{formatSteepTime()}</Text>
              </View>
            )}
            {tea.origin && (
              <View style={styles.quickFact}>
                <MapPin size={18} color={theme.accent.primary} />
                <Text style={styles.quickFactText} numberOfLines={1}>{tea.origin}</Text>
              </View>
            )}
          </View>
          
          {/* Caffeine Level */}
          <View style={styles.caffeineRow}>
            <CaffeineIndicator teaType={tea.teaType || tea.tea_type} size="medium" />
          </View>
          
          {/* Expert Brewing Guide */}
          <BrewingGuide tea={tea} />
          
          {/* Health Benefits */}
          <HealthBenefits tea={tea} />
          
          {/* Description */}
          {fullTea.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{fullTea.description}</Text>
            </View>
          )}
          
          {/* Flavor Notes */}
          {fullTea.flavorNotes && fullTea.flavorNotes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flavor Notes</Text>
              <View style={styles.flavorTags}>
                {fullTea.flavorNotes.map((note, index) => (
                  <View key={index} style={styles.flavorTag}>
                    <Text style={styles.flavorTagText}>{note}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Flavor Profile Radar - Premium Feature */}
          {fullTea.flavorNotes && fullTea.flavorNotes.length >= 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flavor Profile</Text>
              {isPremium ? (
                <View style={styles.radarContainer}>
                  <FlavorRadar flavorNotes={fullTea.flavorNotes} size={220} />
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.premiumLockCard, { backgroundColor: theme.background.secondary }]}
                  onPress={() => navigation.navigate('Paywall')}
                >
                  <Crown size={32} color={theme.accent.primary} />
                  <Text style={[styles.premiumLockTitle, { color: theme.text.primary }]}>
                    Unlock Flavor Profiles
                  </Text>
                  <Text style={[styles.premiumLockText, { color: theme.text.secondary }]}>
                    Upgrade to Premium to see detailed flavor radar charts
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Personal Tasting Notes (only if in collection) - Premium Feature */}
          {inCollection && (
            <View style={styles.section}>
              <View style={styles.tastingNotesHeader}>
                <Text style={styles.sectionTitle}>My Tasting Notes</Text>
                {isPremium && (
                  <TouchableOpacity 
                    onPress={() => setShowTastingNotes(true)} 
                    style={styles.editNotesButton}
                  >
                    <NotebookPen size={16} color={theme.accent.primary} />
                    <Text style={styles.editNotesText}>
                      {collectionItem?.notes ? 'Edit' : 'Add Notes'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {isPremium ? (
                <>
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
                      <NotebookPen size={24} color={theme.text.secondary} />
                      <Text style={styles.addNotesText}>
                        Tap to add your tasting notes
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.premiumLockCard, { backgroundColor: theme.background.secondary }]}
                  onPress={() => navigation.navigate('Paywall')}
                >
                  <Crown size={32} color={theme.accent.primary} />
                  <Text style={[styles.premiumLockTitle, { color: theme.text.primary }]}>
                    Unlock Tasting Notes
                  </Text>
                  <Text style={[styles.premiumLockText, { color: theme.text.secondary }]}>
                    Upgrade to Premium to add personal notes and ratings
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Editorial Tasting Notes */}
          {tastingNote && (
            <View style={styles.section}>
              <EditorialTastingNote
                note={tastingNote.note_text}
                attribution={tastingNote.source_attribution}
              />
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>
                Reviews {reviewCount > 0 && `(${reviewCount})`}
              </Text>
              <TouchableOpacity onPress={handleWriteReview} style={styles.writeReviewButton}>
                <MessageSquare size={16} color={theme.accent.primary} />
                <Text style={styles.writeReviewText}>
                  {userReview ? 'Edit Review' : 'Write Review'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* App reviews first */}
            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  isOwnReview={user && review.user_id === user.id}
                />
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
            
            {/* External reviews link */}
            {tea.ratingCount > 0 && tea.url && (
              <TouchableOpacity 
                style={styles.externalReviewsLink}
                onPress={() => Linking.openURL(tea.url).catch(() => {})}
              >
                <ExternalLink size={16} color={theme.text.secondary} />
                <Text style={styles.externalReviewsText}>
                  View {tea.ratingCount} reviews on {tea.brandName}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Buy This Tea */}
          {brandName && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buy This Tea</Text>
              <TouchableOpacity 
                style={styles.buyCard}
                onPress={handleBuyTea}
                activeOpacity={0.7}
              >
                <View style={styles.buyCardContent}>
                  <View style={styles.buyIconContainer}>
                    <ShoppingCart size={24} color={theme.accent.primary} />
                  </View>
                  <View style={styles.buyCardText}>
                    <Text style={styles.buyCardTitle}>
                      {hasDirectLink ? `Available at ${brandName}` : `Find at ${brandName}`}
                    </Text>
                    <Text style={styles.buyCardSubtitle}>
                      {hasDirectLink ? 'Tap to visit their website' : 'Tap to search online'}
                    </Text>
                  </View>
                  <ExternalLink size={20} color={theme.text.secondary} />
                </View>
              </TouchableOpacity>
            </View>
          )}
          
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
        <View style={styles.buttonRow}>
          <Button 
            title={inCollection 
              ? (collectionItem?.status === 'tried' ? "Tried" : "Saved") 
              : "Save"}
            onPress={handleSaveTea}
            variant={inCollection ? "primary" : "secondary"}
            icon={<Bookmark size={18} color={inCollection ? theme.text.inverse : theme.text.primary} fill={inCollection ? theme.text.inverse : 'none'} />}
            style={[styles.actionButton, !inCollection && { backgroundColor: theme.background.secondary, height: 56 }, inCollection && { height: 56 }]}
          />
          <Button 
            title="Steep"
            onPress={handleBrewTea}
            variant="primary"
            icon={<Coffee size={18} color={theme.text.inverse} />}
            style={styles.actionButton}
          />
        </View>
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

const createStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
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
    backgroundColor: theme.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sectionSpacing,
  },
  teaName: {
    ...typography.headingMedium,
    color: theme.text.primary,
    marginBottom: 4,
  },
  brandName: {
    ...typography.bodySmall,
    color: theme.text.secondary,
    marginBottom: 12,
  },
  brandNameTappable: {
    color: theme.accent.primary,
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
    backgroundColor: theme.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    ...typography.bodySmall,
    color: theme.text.primary,
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
    color: theme.text.primary,
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
    backgroundColor: theme.background.secondary,
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
    color: theme.text.primary,
    marginBottom: 12,
  },
  description: {
    ...typography.body,
    color: theme.text.secondary,
    lineHeight: 24,
  },
  flavorTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flavorTag: {
    backgroundColor: theme.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  flavorTagText: {
    ...typography.caption,
    color: theme.text.secondary,
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
    color: theme.accent.primary,
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
    color: theme.text.secondary,
  },
  notesCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  notesText: {
    ...typography.body,
    color: theme.text.primary,
    lineHeight: 22,
  },
  addNotesPrompt: {
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border.light,
    borderStyle: 'dashed',
  },
  addNotesText: {
    ...typography.bodySmall,
    color: theme.text.secondary,
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
    color: theme.accent.primary,
    fontWeight: '500',
  },
  noReviews: {
    backgroundColor: theme.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  noReviewsText: {
    ...typography.body,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: theme.accent.primary,
    fontWeight: '500',
  },
  externalReviewsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border.light,
  },
  externalReviewsText: {
    ...typography.bodySmall,
    color: theme.text.secondary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background.primary,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: theme.border.medium,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  buyCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border.light,
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
    backgroundColor: theme.accent.primary + '20',
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
    color: theme.text.primary,
    marginBottom: 2,
  },
  buyCardSubtitle: {
    ...typography.caption,
    color: theme.text.secondary,
  },
  unavailableCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  unavailableText: {
    ...typography.body,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  similarTeaList: {
    paddingRight: spacing.screenHorizontal,
    gap: spacing.cardGap,
  },
  similarTeaCard: {
    width: 160,
  },
  premiumLockCard: {
    padding: spacing.lg,
    borderRadius: spacing.cardBorderRadius,
    alignItems: 'center',
    gap: spacing.sm,
  },
  premiumLockTitle: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  premiumLockText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
