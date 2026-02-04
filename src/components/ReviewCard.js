import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { StarRating } from './StarRating';

export const ReviewCard = ({ review }) => {
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
  
  return (
    <View 
      style={[styles.card, { backgroundColor: theme.background.secondary }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Review by ${username}, ${review.rating} stars${review.review_text ? `: ${review.review_text}` : ''}`}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.accent.secondary }]}>
          <User size={16} color={theme.text.inverse} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.username, { color: theme.text.primary }]}>
            {username}
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
