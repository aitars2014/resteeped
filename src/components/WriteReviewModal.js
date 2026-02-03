import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { Button } from './Button';
import { StarRating } from './StarRating';

export const WriteReviewModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  teaName,
  initialRating = 0,
  initialText = '',
}) => {
  const [rating, setRating] = useState(initialRating);
  const [reviewText, setReviewText] = useState(initialText);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setSubmitting(true);
    await onSubmit({ rating, reviewText });
    setSubmitting(false);
    setRating(0);
    setReviewText('');
  };

  const handleClose = () => {
    setRating(initialRating);
    setReviewText(initialText);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={styles.modal}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Write a Review</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <X size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Tea Name */}
              <Text style={styles.teaName} numberOfLines={2}>{teaName}</Text>

              {/* Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.label}>Your Rating</Text>
                <StarRating 
                  rating={rating} 
                  size={36} 
                  onRate={setRating}
                />
                {rating === 0 && (
                  <Text style={styles.ratingHint}>Tap a star to rate</Text>
                )}
              </View>

              {/* Review Text */}
              <View style={styles.textSection}>
                <Text style={styles.label}>Your Review (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="What did you think of this tea?"
                  placeholderTextColor={colors.text.secondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <Button
                title={submitting ? "Submitting..." : "Submit Review"}
                onPress={handleSubmit}
                variant="primary"
                disabled={rating === 0 || submitting}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.screenHorizontal,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  teaName: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sectionSpacing,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: spacing.sectionSpacing,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  ratingHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 8,
  },
  textSection: {
    marginBottom: spacing.sectionSpacing,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    ...typography.body,
    color: colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});
