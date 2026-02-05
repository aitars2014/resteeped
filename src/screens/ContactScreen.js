import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, ChevronDown, Send } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';

// Formspree CLI-deployed form endpoint
const FORMSPREE_PROJECT_ID = '2930500323560652342';
const FORMSPREE_FORM_KEY = 'contactForm';

const CONTACT_TOPICS = [
  { id: 'bug', label: 'Bug Report / Feature Request', requiresEmail: false },
  { id: 'feedback', label: 'Feedback', requiresEmail: false },
  { id: 'tea_shop', label: 'Tea Shops to Add', requiresEmail: false },
  { id: 'sponsorship', label: 'Sponsorship Opportunities', requiresEmail: true },
];

export const ContactScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTopic = CONTACT_TOPICS.find(t => t.id === selectedTopic);
  const requiresEmail = currentTopic?.requiresEmail || false;

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedTopic) {
      Alert.alert('Missing Topic', 'Please select a topic for your message.');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Missing Message', 'Please enter your message.');
      return;
    }

    if (requiresEmail && !email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address for sponsorship inquiries.');
      return;
    }

    if (requiresEmail && !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`https://formspree.io/p/${FORMSPREE_PROJECT_ID}/f/${FORMSPREE_FORM_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          topic: currentTopic.label,
          message: message.trim(),
          email: email.trim() || 'Not provided',
          _subject: `[Resteeped] ${currentTopic.label}`,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Message Sent!',
          'Thanks for reaching out. We\'ll get back to you soon.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send your message. Please try again or email us directly at tea@resteeped.com'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTopicPicker = () => (
    <View style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <TouchableOpacity 
        style={styles.pickerDismiss} 
        onPress={() => setShowTopicPicker(false)}
        activeOpacity={1}
      />
      <View style={[styles.pickerContainer, { backgroundColor: theme.background.primary }]}>
        <Text style={[styles.pickerTitle, { color: theme.text.primary }]}>Select Topic</Text>
        {CONTACT_TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[
              styles.pickerItem,
              { borderBottomColor: theme.border.light },
              selectedTopic === topic.id && { backgroundColor: theme.background.secondary },
            ]}
            onPress={() => {
              setSelectedTopic(topic.id);
              setShowTopicPicker(false);
              // Clear email if switching to non-email topic
              if (!topic.requiresEmail) {
                setEmail('');
              }
            }}
          >
            <Text style={[
              styles.pickerItemText,
              { color: theme.text.primary },
              selectedTopic === topic.id && { color: theme.accent.primary, fontWeight: '600' },
            ]}>
              {topic.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.pickerCancel, { backgroundColor: theme.background.secondary }]}
          onPress={() => setShowTopicPicker(false)}
        >
          <Text style={[styles.pickerCancelText, { color: theme.text.secondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={28} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Contact Us</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.description, { color: theme.text.secondary }]}>
            Have feedback, found a bug, or interested in partnering with us? We'd love to hear from you.
          </Text>

          {/* Topic Selector */}
          <Text style={[styles.label, { color: theme.text.primary }]}>Topic *</Text>
          <TouchableOpacity
            style={[styles.selector, { 
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.medium,
            }]}
            onPress={() => setShowTopicPicker(true)}
          >
            <Text style={[
              styles.selectorText,
              { color: currentTopic ? theme.text.primary : theme.text.tertiary },
            ]}>
              {currentTopic?.label || 'Select a topic...'}
            </Text>
            <ChevronDown size={20} color={theme.text.secondary} />
          </TouchableOpacity>

          {/* Email (conditional) */}
          {requiresEmail && (
            <>
              <Text style={[styles.label, { color: theme.text.primary }]}>Email *</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                  color: theme.text.primary,
                }]}
                placeholder="your@email.com"
                placeholderTextColor={theme.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

          {/* Message */}
          <Text style={[styles.label, { color: theme.text.primary }]}>Message *</Text>
          <TextInput
            style={[styles.textArea, {
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.medium,
              color: theme.text.primary,
            }]}
            placeholder={
              selectedTopic === 'tea_shop' 
                ? "Which tea shop would you like us to add? Include the shop name and website if possible."
                : selectedTopic === 'sponsorship'
                ? "Tell us about your tea shop and what you're interested in (e.g., Tea of the Day, Featured Shop placement)."
                : "What's on your mind?"
            }
            placeholderTextColor={theme.text.tertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.accent.primary },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.directEmail, { color: theme.text.tertiary }]}>
            Or email us directly at tea@resteeped.com
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Topic Picker Modal */}
      {showTopicPicker && renderTopicPicker()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  description: {
    ...typography.body,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  selectorText: {
    ...typography.body,
    flex: 1,
  },
  input: {
    ...typography.body,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  textArea: {
    ...typography.body,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.xl,
    minHeight: 150,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  directEmail: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  // Picker styles
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  pickerDismiss: {
    flex: 1,
  },
  pickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pickerTitle: {
    ...typography.h3,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerItem: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    ...typography.body,
  },
  pickerCancel: {
    margin: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  pickerCancelText: {
    ...typography.body,
    fontWeight: '600',
  },
});

export default ContactScreen;
