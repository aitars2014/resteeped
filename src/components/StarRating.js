import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../constants';

export const StarRating = ({ 
  rating, 
  size = 16, 
  onRate = null,
  showEmpty = true,
  maxStars = 5,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const renderStar = (index) => {
    const isFilled = index < fullStars || (index === fullStars && hasHalfStar);
    const StarComponent = (
      <Star
        key={index}
        size={size}
        color={isFilled ? colors.rating.star : colors.rating.starEmpty}
        fill={isFilled ? colors.rating.star : 'transparent'}
      />
    );
    
    if (onRate) {
      return (
        <TouchableOpacity 
          key={index} 
          onPress={() => onRate(index + 1)}
          style={styles.starButton}
        >
          {StarComponent}
        </TouchableOpacity>
      );
    }
    
    return StarComponent;
  };
  
  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
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
});
