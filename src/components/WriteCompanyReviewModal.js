import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { X, Star, Truck, Headphones, DollarSign, Award } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { Button } from './Button';
import { StarRating } from './StarRating';

const RATING_CATEGORIES = [
  { id: 'quality', label: 'Tea Quality', icon: Award, description: 'Freshness and quality of the teas' },
  { id: 'shipping', label: 'Shipping', icon: Truck, description: 'Speed and packaging quality' },
  { id: 'service', label: 'Customer Service', icon: Headphones, description: 'Responsiveness and helpfulness' },
  { id: 'value', label: 'Value for Price', icon: DollarSign, description: 'Bang for your buck' },
];

export const WriteCompanyReviewModal = ({
  visible,
  onClose,
  onSubmit,
  companyName,
  initialRating = 0,
  initialText = '',
  initialCategoryRatings = {},
}) => {
  const [overallRating, setOverallRating] = useState(initialRating);
  const [reviewText, setReviewText] = useState(initialText);
  const [categoryRatings, setCategoryRatings] = useState({
    quality: 0,
    shipping: 0,
    service: 0,
    value: 0,
    ...initialCategoryRatings,
  });
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    if (visible) {
      setOverallRating(initialRating);
      setReviewText(initialText);
      setCategoryRatings({
        quality: 0,
        shipping: 0,
        service: 0,
        value: 0,
        ...initialCategoryRatings,
      });
    }
  }, [visible, initialRating, initialText, initialCategoryRatings]);

  const handleSubmit = () => {
    if (overallRating === 0) return;
    
    onSubmit({
      rating: overallRating,
      reviewText: reviewText.trim(),
      qualityRating: categoryRatings.quality || null,
      shippingRating: categoryRatings.shipping || null,
      serviceRating: categoryRatings.service || null,
      valueRating: categoryRatings.value || null,
    });
  };

  const setCategoryRating = (category, rating) => {
    setCategoryRatings(prev => ({ ...prev, [category]: rating }));
  };

  const renderCategoryRating = ({ id, label, icon: Icon, description }) => (
    <View key={id} style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryLabel}>
          <Icon size={18} color={colors.accent.primary} />
          <Text style={styles.categoryLabelText}>{label}</Text>
        </View>
        <StarRating 
          rating={categoryRatings[id]} 
          size={20} 
          onRate={(r) => setCategoryRating(id, r)}
        />
      </View>
      <Text style={styles.categoryDescription}>{description}</Text>
    </View>
  );

  const isValid = overallRating > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.title}>Review Shop</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Company Name */}
              <Text style={styles.companyName}>{companyName}</Text>

              {/* Overall Rating */}
              <View style={styles.overallRatingSection}>
                <Text style={styles.sectionLabel}>Overall Rating *</Text>
                <View style={styles.overallRatingContainer}>
                  <StarRating 
                    rating={overallRating} 
                    size={36} 
                    onRate={setOverallRating}
                  />
                  {overallRating > 0 && (
                    <Text style={styles.ratingText}>{overallRating}/5</Text>
                  )}
                </View>
              </View>

              {/* Category Ratings (optional) */}
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.categoryToggle}
                  onPress={() => setShowCategories(!showCategories)}
                >
                  <Text style={styles.sectionLabel}>Detailed Ratings (Optional)</Text>
                  <Text style={styles.toggleText}>
                    {showCategories ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
                
                {showCategories && (
                  <View style={styles.categoriesContainer}>
                    {RATING_CATEGORIES.map(renderCategoryRating)}
                  </View>
                )}
              </View>

              {/* Review Text */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your Review</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Share your experience with this tea shop. What did you order? How was the quality? Would you recommend them?"
                  placeholderTextColor={colors.text.secondary}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              <View style={{ height: 120 }} />
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
              <Button
                title={initialRating > 0 ? "Update Review" : "Submit Review"}
                onPress={handleSubmit}
                variant="primary"
                disabled={!isValid}
                style={!isValid && styles.disabledButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  companyName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.accent.primary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  overallRatingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  overallRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingText: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  categoryToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  toggleText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  categoriesContainer: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  categoryItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabelText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.primary,
  },
  categoryDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  reviewInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.screenHorizontal,
    paddingBottom: 34,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default WriteCompanyReviewModal;
