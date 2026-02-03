import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  icon = null,
  style = {},
}) => {
  const { theme } = useTheme();
  const isPrimary = variant === 'primary';
  
  const dynamicStyles = {
    primary: {
      backgroundColor: theme.accent.primary,
      shadowColor: theme.shadow?.primaryButton || theme.accent.primary,
    },
    secondary: {
      borderColor: theme.text.primary,
    },
    disabled: {
      backgroundColor: theme.accent.secondary,
      borderColor: theme.text.secondary,
    },
    primaryText: { color: theme.text.inverse },
    secondaryText: { color: theme.text.primary },
    disabledText: { color: theme.text.secondary },
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? [styles.primary, dynamicStyles.primary] : [styles.secondary, dynamicStyles.secondary],
        disabled && [styles.disabled, dynamicStyles.disabled],
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[
          styles.text,
          isPrimary ? dynamicStyles.primaryText : dynamicStyles.secondaryText,
          disabled && dynamicStyles.disabledText,
        ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: spacing.buttonBorderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    height: spacing.buttonHeightPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    backgroundColor: 'transparent',
    height: spacing.buttonHeightSecondary,
    borderWidth: 2,
  },
  disabled: {
    // Colors applied dynamically
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    ...typography.buttonLarge,
  },
});
