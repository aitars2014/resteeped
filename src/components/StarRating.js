import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../context';
import { haptics } from '../utils/haptics';

export const StarRating = ({ 
  rating = 0, 
  size = 16, 
  onRate = null,
  showEmpty = true,
  showNumber = false,
  maxStars = 5,
}) => {
  const { theme } = useTheme();
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  // Handle star press with haptic feedback
  const handleRate = useCallback((starIndex) => {
    haptics.selection(); // Light haptic on each star
    onRate?.(starIndex);
  }, [onRate]);
  
  const renderStar = (index) => {
    const isFilled = index < fullStars || (index === fullStars && hasHalfStar);
    const StarComponent = (
      <Star
        key={index}
        size={size}
        color={isFilled ? theme.rating.star : theme.rating.starEmpty}
        fill={isFilled ? theme.rating.star : 'transparent'}
      />
    );
    
    if (onRate) {
      return (
        <TouchableOpacity 
          key={index} 
          onPress={() => handleRate(index + 1)}
          style={styles.starButton}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${index + 1} star${index === 0 ? '' : 's'}`}
          accessibilityHint="Double tap to select this rating"
        >
          {StarComponent}
        </TouchableOpacity>
      );
    }
    
    return StarComponent;
  };
  
  const accessibilityLabel = onRate 
    ? `Rating selector, currently ${rating > 0 ? `${rating.toFixed(1)} stars` : 'no rating'}`
    : rating > 0 
      ? `Rated ${rating.toFixed(1)} out of ${maxStars} stars` 
      : 'No rating yet';
  
  return (
    <View 
      style={styles.container}
      accessible={!onRate}
      accessibilityRole={onRate ? undefined : "text"}
      accessibilityLabel={onRate ? undefined : accessibilityLabel}
    >
      {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
      {showNumber && rating > 0 && (
        <Text 
          style={[styles.ratingNumber, { color: theme.text.secondary }]}
          accessibilityElementsHidden
        >
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  ratingNumber: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
});
