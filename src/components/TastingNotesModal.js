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
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
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
  const { theme } = useTheme();
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
          <Pressable 
            style={[styles.container, { backgroundColor: theme.background.primary }]} 
            onPress={e => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.text.primary }]}>Tasting Notes</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tea Name */}
              <Text style={[styles.teaName, { color: theme.accent.primary }]}>{teaName}</Text>

              {/* Your Rating */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Your Rating</Text>
                <View style={styles.ratingContainer}>
                  <StarRating 
                    rating={rating} 
                    size={32} 
                    interactive 
                    onRate={setRating}
                  />
                  {rating > 0 && (
                    <Text style={[styles.ratingText, { color: theme.text.secondary }]}>{rating}/5</Text>
                  )}
                </View>
              </View>

              {/* Notes Input */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Your Notes</Text>
                  <TouchableOpacity 
                    style={styles.suggestionsToggle}
                    onPress={() => setShowSuggestions(!showSuggestions)}
                  >
                    <Lightbulb size={16} color={theme.accent.primary} />
                    <Text style={[styles.suggestionsToggleText, { color: theme.accent.primary }]}>
                      {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={[styles.notesInput, { 
                    backgroundColor: theme.background.secondary,
                    color: theme.text.primary,
                    borderColor: theme.border.light,
                  }]}
                  placeholder="How does this tea taste to you? What do you notice about the aroma, flavor, and finish?"
                  placeholderTextColor={theme.text.secondary}
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
                  <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Quick Add Flavors</Text>
                  <View style={styles.suggestionsGrid}>
                    {FLAVOR_SUGGESTIONS.map(flavor => {
                      const isActive = notes.toLowerCase().includes(flavor.toLowerCase());
                      return (
                        <TouchableOpacity
                          key={flavor}
                          style={[
                            styles.suggestionPill,
                            { 
                              backgroundColor: isActive ? theme.accent.primary : theme.background.secondary,
                              borderColor: isActive ? theme.accent.primary : theme.border.light,
                            }
                          ]}
                          onPress={() => addFlavorTag(flavor)}
                        >
                          <Text style={[
                            styles.suggestionText,
                            { color: isActive ? theme.text.inverse : theme.text.primary },
                            isActive && { fontWeight: '600' },
                          ]}>
                            {flavor}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Tips */}
              <View style={[styles.tipsSection, { backgroundColor: theme.background.secondary }]}>
                <Text style={[styles.tipsTitle, { color: theme.text.primary }]}>💡 Tasting Tips</Text>
                <Text style={[styles.tipsText, { color: theme.text.secondary }]}>
                  • Note the aroma before your first sip{'\n'}
                  • Pay attention to how the flavor evolves{'\n'}
                  • Describe the finish (short, medium, long){'\n'}
                  • Record steeping variations that work well
                </Text>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Save Button */}
            <View style={[styles.footer, { 
              backgroundColor: theme.background.primary,
              borderTopColor: theme.border.light,
            }]}>
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
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  teaName: {
    ...typography.body,
    fontWeight: '600',
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
  },
  suggestionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionsToggleText: {
    ...typography.caption,
  },
  notesInput: {
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    minHeight: 120,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  suggestionText: {
    ...typography.caption,
  },
  tipsSection: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipsTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipsText: {
    ...typography.caption,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.screenHorizontal,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
});

export default TastingNotesModal;
