import React, { useCallback, useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Mic } from 'lucide-react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useTheme } from '../context';

/**
 * A mic button that starts native speech-to-text recognition and appends
 * transcribed text via the onTranscript callback.
 *
 * Props:
 *   inputRef     – React ref to the TextInput (used as fallback focus)
 *   onTranscript – (text: string) => void — called with final transcript
 *   style        – optional extra style for the container
 *   size         – icon size (default 18)
 */
export const VoiceInputHint = ({ inputRef, onTranscript, style, size = 18 }) => {
  const { theme } = useTheme();
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript && event.isFinal && onTranscript) {
      onTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    // Don't alert on "no-speech" — user just didn't say anything
    if (event.error !== 'no-speech') {
      console.warn('Speech recognition error:', event.error, event.message);
    }
  });

  const handlePress = useCallback(async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      return;
    }

    // Request permissions
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow microphone and speech recognition access to use voice input.',
      );
      return;
    }

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        requiresOnDeviceRecognition: false,
      });
      setIsListening(true);
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      // Fallback: focus the input so user can use keyboard dictation
      if (inputRef?.current) {
        inputRef.current.focus();
      }
    }
  }, [isListening, inputRef]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.button,
        { backgroundColor: isListening ? theme.accent.primary : theme.background.secondary },
        style,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
      accessibilityRole="button"
    >
      <Mic size={size} color={isListening ? '#FFFFFF' : theme.accent.primary} />
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
