import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Thermometer, Clock, MapPin, Star, Check, MessageSquare } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { Button, TeaTypeBadge, StarRating, FactCard, ReviewCard, WriteReviewModal } from '../components';
import { useAuth, useCollection } from '../context';
import { useReviews, useCompanies } from '../hooks';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.32;

export const TeaDetailScreen = ({ route, navigation }) => {
  const { tea } = route.params;
  const teaColor = getTeaTypeColor(tea.teaType);
  
  const { user } = useAuth();
  const { isInCollection, addToCollection, removeFromCollection, getCollectionItem } = useCollection();
  const { reviews, userReview, submitReview, reviewCount, averageRating, loading: reviewsLoading } = useReviews(tea.id);
  const { companies } = useCompanies();
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  
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
      await addToCollection(tea.id, 'want_to_try');
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
          {tea.imageUrl ? (
            <Image 
              source={{ uri: tea.imageUrl }} 
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[teaColor.primary, teaColor.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            />
          )}
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
    marginBottom: spacing.sectionSpacing,
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
});
