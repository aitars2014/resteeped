import React, { useCallback } from 'react';
import { TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useTheme } from '../context';

/**
 * A mic button that focuses the associated TextInput and shows a hint
 * about using the device's built-in dictation feature.
 *
 * Props:
 *   inputRef  – React ref to the TextInput to focus
 *   style     – optional extra style for the container
 *   size      – icon size (default 18)
 */
export const VoiceInputHint = ({ inputRef, style, size = 18 }) => {
  const { theme } = useTheme();

  const handlePress = useCallback(() => {
    // Focus the input so the keyboard appears
    if (inputRef?.current) {
      inputRef.current.focus();
    }

    const message = Platform.OS === 'ios'
      ? 'Tap the microphone 🎤 button on your keyboard to dictate your text.'
      : 'Tap the microphone 🎤 on your Google keyboard to use voice typing.';

    Alert.alert('Voice-to-Text', message);
  }, [inputRef]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, { backgroundColor: theme.background.secondary }, style]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="Voice input hint"
      accessibilityRole="button"
    >
      <Mic size={size} color={theme.accent.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
