import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../context';
import { typography, spacing } from '../constants';
import { Button } from '../components';
import { RatingSlider } from './RatingSlider';

export const PostBrewReviewModal = ({ 
  visible, 
  onClose, 
  onSave, 
  teaName,
  brewMethod,
  steepTimeSeconds,
  temperatureF,
}) => {
  const { theme } = useTheme();
  const [rating, setRating] = useState(3.5);
  const [notes, setNotes] = useState('');

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatTimeLong = (s) => {
    if (s >= 3600) {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return formatTime(s);
  };

  const handleSave = () => {
    onSave({ rating, notes: notes.trim() || null });
    setRating(3.5);
    setNotes('');
  };

  const handleSkip = () => {
    onClose();
    setRating(3.5);
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleSkip}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.modal, { backgroundColor: theme.background.primary }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text.primary }]}>How was your brew?</Text>
            <TouchableOpacity onPress={handleSkip}>
              <X size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Brew summary */}
          <View style={[styles.summary, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
            {teaName && (
              <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={1}>{teaName}</Text>
            )}
            <View style={styles.summaryRow}>
              {brewMethod && (
                <Text style={[styles.summaryItem, { color: theme.text.secondary }]}>
                  {brewMethod}
                </Text>
              )}
              {steepTimeSeconds && (
                <Text style={[styles.summaryItem, { color: theme.text.secondary }]}>
                  ⏱ {formatTimeLong(steepTimeSeconds)}
                </Text>
              )}
              {temperatureF && (
                <Text style={[styles.summaryItem, { color: theme.text.secondary }]}>
                  🌡️ {temperatureF}°F
                </Text>
              )}
            </View>
          </View>

          {/* Rating slider */}
          <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Rating</Text>
          <RatingSlider value={rating} onValueChange={setRating} size="small" />

          {/* Notes */}
          <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Tasting Notes</Text>
          <TextInput
            style={[styles.notesInput, { 
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.light,
              color: theme.text.primary,
            }]}
            placeholder="Smooth, slightly floral, nice body..."
            placeholderTextColor={theme.text.tertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={[styles.skipText, { color: theme.text.secondary }]}>Skip</Text>
            </TouchableOpacity>
            <Button title="Save Review" onPress={handleSave} variant="primary" style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { ...typography.headingSmall },
  summary: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  teaName: { ...typography.body, fontWeight: '600', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  summaryItem: { ...typography.bodySmall },
  sectionLabel: { ...typography.bodySmall, fontWeight: '600', marginBottom: 4, marginLeft: 4 },
  notesInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, ...typography.body, marginBottom: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipButton: { paddingVertical: 14, paddingHorizontal: 20 },
  skipText: { ...typography.body, fontWeight: '500' },
});
