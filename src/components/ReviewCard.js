import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User, Clock, AlertCircle } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { StarRating } from './StarRating';

export const ReviewCard = ({ review, isOwnReview = false }) => {
  const { theme } = useTheme();
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const username = review.profile?.display_name || review.profile?.username || 'Tea Lover';
  
  // Check moderation status for user's own review
  const isPending = isOwnReview && review.moderation_status === 'pending';
  const isFlagged = isOwnReview && review.moderation_status === 'flagged';
  const isHidden = isOwnReview && review.is_hidden;
  
  return (
    <View 
      style={[
        styles.card, 
        { backgroundColor: theme.background.secondary },
        (isFlagged || isHidden) && styles.flaggedCard,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Review by ${username}, ${review.rating} stars${review.review_text ? `: ${review.review_text}` : ''}`}
    >
      {/* Moderation Status Banner */}
      {isOwnReview && (isPending || isFlagged || isHidden) && (
        <View style={[styles.moderationBanner, isFlagged ? styles.flaggedBanner : styles.pendingBanner]}>
          {isFlagged ? (
            <AlertCircle size={14} color="#FFA500" />
          ) : (
            <Clock size={14} color="#888" />
          )}
          <Text style={[styles.moderationText, isFlagged && styles.flaggedText]}>
            {isFlagged 
              ? 'Under review — this review is being checked by our team'
              : 'Pending — your review will appear shortly'
            }
          </Text>
        </View>
      )}
      
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.accent.secondary }]}>
          <User size={16} color={theme.text.inverse} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.username, { color: theme.text.primary }]}>
            {username}
            {isOwnReview && <Text style={{ color: theme.text.secondary }}> (You)</Text>}
          </Text>
          <Text style={[styles.date, { color: theme.text.secondary }]}>{formatDate(review.created_at)}</Text>
        </View>
        <StarRating rating={review.rating} size={14} />
      </View>
      
      {review.review_text && (
        <Text style={[styles.reviewText, { color: theme.text.primary }]}>{review.review_text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    marginBottom: spacing.elementSpacing,
  },
  flaggedCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  moderationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  pendingBanner: {
    backgroundColor: 'rgba(136, 136, 136, 0.15)',
  },
  flaggedBanner: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
  },
  moderationText: {
    ...typography.caption,
    color: '#888',
    flex: 1,
  },
  flaggedText: {
    color: '#FFA500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  username: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  date: {
    ...typography.caption,
  },
  reviewText: {
    ...typography.body,
    lineHeight: 22,
  },
});
