import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { StarRating } from './StarRating';
import { TeaTypeBadge } from './TeaTypeBadge';

export const TeaCard = ({ tea, onPress }) => {
  const teaColor = getTeaTypeColor(tea.teaType);
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: teaColor.primary }]} />
      
      <View style={styles.content}>
        {/* Image area with gradient placeholder */}
        <View style={styles.imageContainer}>
          {tea.imageUrl ? (
            <Image source={{ uri: tea.imageUrl }} style={styles.image} />
          ) : (
            <LinearGradient
              colors={[teaColor.primary, teaColor.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.imagePlaceholder}
            />
          )}
          {/* Tea type badge */}
          <View style={styles.badgeContainer}>
            <TeaTypeBadge teaType={tea.teaType} size="small" />
          </View>
        </View>
        
        {/* Text area */}
        <View style={styles.textArea}>
          <Text style={styles.teaName} numberOfLines={2}>
            {tea.name}
          </Text>
          <Text style={styles.brandName} numberOfLines={1}>
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
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: colors.shadow.card,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
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
  imagePlaceholder: {
    width: '100%',
    height: '100%',
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
    color: colors.text.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  brandName: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 8,
  },
});
