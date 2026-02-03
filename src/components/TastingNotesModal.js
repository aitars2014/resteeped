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
import { X, Lightbulb } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { Button } from './Button';
import { StarRating } from './StarRating';

const FLAVOR_SUGGESTIONS = [
  'Malty', 'Floral', 'Grassy', 'Earthy', 'Smoky', 
  'Sweet', 'Bitter', 'Astringent', 'Fruity', 'Nutty',
  'Honey', 'Citrus', 'Vegetal', 'Mineral', 'Creamy',
  'Spicy', 'Woody', 'Roasted', 'Fresh', 'Rich',
];

export const TastingNotesModal = ({
  visible,
  onClose,
  onSave,
  teaName,
  initialNotes = '',
  initialRating = 0,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [rating, setRating] = useState(initialRating);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (visible) {
      setNotes(initialNotes);
      setRating(initialRating);
    }
  }, [visible, initialNotes, initialRating]);

  const handleSave = () => {
    onSave({ notes: notes.trim(), rating });
    onClose();
  };

  const addFlavorTag = (flavor) => {
    const current = notes.trim();
    if (current.toLowerCase().includes(flavor.toLowerCase())) return;
    
    const separator = current ? ', ' : '';
    setNotes(`${current}${separator}${flavor}`);
  };

  const hasChanges = notes !== initialNotes || rating !== initialRating;

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
              <Text style={styles.title}>Tasting Notes</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tea Name */}
              <Text style={styles.teaName}>{teaName}</Text>

              {/* Your Rating */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your Rating</Text>
                <View style={styles.ratingContainer}>
                  <StarRating 
                    rating={rating} 
                    size={32} 
                    interactive 
                    onRate={setRating}
                  />
                  {rating > 0 && (
                    <Text style={styles.ratingText}>{rating}/5</Text>
                  )}
                </View>
              </View>

              {/* Notes Input */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.sectionLabel}>Your Notes</Text>
                  <TouchableOpacity 
                    style={styles.suggestionsToggle}
                    onPress={() => setShowSuggestions(!showSuggestions)}
                  >
                    <Lightbulb size={16} color={colors.accent.primary} />
                    <Text style={styles.suggestionsToggleText}>
                      {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.notesInput}
                  placeholder="How does this tea taste to you? What do you notice about the aroma, flavor, and finish?"
                  placeholderTextColor={colors.text.secondary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Flavor Suggestions */}
              {showSuggestions && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Quick Add Flavors</Text>
                  <View style={styles.suggestionsGrid}>
                    {FLAVOR_SUGGESTIONS.map(flavor => (
                      <TouchableOpacity
                        key={flavor}
                        style={[
                          styles.suggestionPill,
                          notes.toLowerCase().includes(flavor.toLowerCase()) && 
                            styles.suggestionPillActive
                        ]}
                        onPress={() => addFlavorTag(flavor)}
                      >
                        <Text style={[
                          styles.suggestionText,
                          notes.toLowerCase().includes(flavor.toLowerCase()) && 
                            styles.suggestionTextActive
                        ]}>
                          {flavor}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Tips */}
              <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>💡 Tasting Tips</Text>
                <Text style={styles.tipsText}>
                  • Note the aroma before your first sip{'\n'}
                  • Pay attention to how the flavor evolves{'\n'}
                  • Describe the finish (short, medium, long){'\n'}
                  • Record steeping variations that work well
                </Text>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
              <Button
                title={hasChanges ? "Save Notes" : "Close"}
                onPress={hasChanges ? handleSave : onClose}
                variant="primary"
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
  teaName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.accent.primary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  ratingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  suggestionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionsToggleText: {
    ...typography.caption,
    color: colors.accent.primary,
  },
  notesInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  suggestionPillActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  suggestionText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  suggestionTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipsTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tipsText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
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
});

export default TastingNotesModal;
