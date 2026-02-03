import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context';

/**
 * A View component that automatically applies theme background color.
 * Use for screen containers and cards.
 */
export const ThemedView = ({ 
  style, 
  variant = 'primary', // 'primary', 'secondary', 'tertiary'
  children,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const backgroundColor = theme.background[variant] || theme.background.primary;
  
  return (
    <View style={[{ backgroundColor }, style]} {...props}>
      {children}
    </View>
  );
};

/**
 * A card component with themed background and shadow
 */
export const ThemedCard = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        styles.card,
        { 
          backgroundColor: theme.background.secondary,
          shadowColor: theme.shadow?.card || '#000',
        },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});

export default ThemedView;
