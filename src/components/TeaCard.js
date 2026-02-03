import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { typography, spacing, getPlaceholderImage } from '../constants';
import { useTheme } from '../context';
import { StarRating } from './StarRating';
import { TeaTypeBadge } from './TeaTypeBadge';

export const TeaCard = ({ tea, onPress }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const teaColor = getTeaTypeColor(tea.teaType);
  const placeholderImage = getPlaceholderImage(tea.teaType);
  
  return (
    <TouchableOpacity 
      style={[styles.card, { 
        backgroundColor: theme.background.secondary,
        shadowColor: theme.shadow?.card || '#000',
      }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: teaColor.primary }]} />
      
      <View style={styles.content}>
        {/* Image area with placeholder fallback */}
        <View style={styles.imageContainer}>
          <Image 
            source={tea.imageUrl ? { uri: tea.imageUrl } : placeholderImage} 
            style={styles.image} 
          />
          {/* Tea type badge */}
          <View style={styles.badgeContainer}>
            <TeaTypeBadge teaType={tea.teaType} size="small" />
          </View>
        </View>
        
        {/* Text area */}
        <View style={styles.textArea}>
          <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={2}>
            {tea.name}
          </Text>
          <Text style={[styles.brandName, { color: theme.text.secondary }]} numberOfLines={1}>
            {tea.brandName}
          </Text>
          <StarRating rating={tea.avgRating} size={12} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  accentBar: {
    width: spacing.accentBarWidth,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 110,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  textArea: {
    padding: spacing.cardPadding,
    paddingTop: 14,
    paddingBottom: 14,
  },
  teaName: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  brandName: {
    ...typography.caption,
    marginBottom: 8,
  },
});
