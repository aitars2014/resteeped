import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { StarRating } from './StarRating';

export const ReviewCard = ({ review }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={16} color={colors.text.inverse} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.username}>
            {review.profile?.display_name || review.profile?.username || 'Tea Lover'}
          </Text>
          <Text style={styles.date}>{formatDate(review.created_at)}</Text>
        </View>
        <StarRating rating={review.rating} size={14} />
      </View>
      
      {review.review_text && (
        <Text style={styles.reviewText}>{review.review_text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    marginBottom: spacing.elementSpacing,
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
    backgroundColor: colors.accent.secondary,
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
    color: colors.text.primary,
  },
  date: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  reviewText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
});
