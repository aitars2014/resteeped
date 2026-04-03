import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../context';
import { typography, spacing } from '../constants';
import { Button } from '../components';
import { RatingSlider } from './RatingSlider';
import haptics from '../utils/haptics';

const MOOD_TAGS = [
  { label: 'Morning ritual', emoji: '🌅' },
  { label: 'Afternoon break', emoji: '☀️' },
  { label: 'Evening wind-down', emoji: '🌙' },
  { label: 'With food', emoji: '🍽️' },
  { label: 'Reading', emoji: '📖' },
  { label: 'Working', emoji: '💻' },
  { label: 'Relaxing', emoji: '🧘' },
  { label: 'Social', emoji: '👥' },
];

const FLAVOR_TAGS = [
  { label: 'Floral', emoji: '🌸' },
  { label: 'Fruity', emoji: '🍑' },
  { label: 'Sweet', emoji: '🍯' },
  { label: 'Earthy', emoji: '🌿' },
  { label: 'Smoky', emoji: '🔥' },
  { label: 'Umami', emoji: '🍵' },
  { label: 'Nutty', emoji: '🥜' },
  { label: 'Creamy', emoji: '🥛' },
  { label: 'Astringent', emoji: '🍋' },
  { label: 'Woody', emoji: '🪵' },
  { label: 'Spicy', emoji: '🌶️' },
  { label: 'Grassy', emoji: '🌾' },
  { label: 'Malty', emoji: '🍞' },
  { label: 'Mineral', emoji: '💎' },
];

export const PostBrewReviewModal = ({ 
  visible, 
  onClose, 
  onSave, 
  teaName,
  brewMethod,
  steepTimeSeconds,
  temperatureF,
  initialInfusion = 1,
}) => {
  const { theme } = useTheme();
  const [rating, setRating] = useState(3.5);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [infusion, setInfusion] = useState(initialInfusion);
  const showInfusion = brewMethod === 'Gongfu' || initialInfusion > 1;

  const toggleTag = (label) => {
    haptics.selection();
    setSelectedTags(prev => 
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const toggleMood = (label) => {
    haptics.selection();
    setSelectedMood(prev => prev === label ? null : label);
  };

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
    const allNotes = [
      selectedMood ? `[${selectedMood}]` : null,
      selectedTags.length > 0 ? selectedTags.join(', ') : null,
      notes.trim() || null,
    ].filter(Boolean).join(' — ');
    onSave({ rating, notes: allNotes || null, brewMethod, steepTimeSeconds, temperatureF, infusionNumber: showInfusion ? infusion : null });
    setRating(3.5);
    setNotes('');
    setSelectedTags([]);
    setSelectedMood(null);
    setInfusion(initialInfusion);
  };

  const handleSkip = () => {
    onClose();
    setRating(3.5);
    setNotes('');
    setSelectedTags([]);
    setSelectedMood(null);
    setInfusion(initialInfusion);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleSkip}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.modal, { backgroundColor: theme.background.primary }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
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

          {/* Infusion counter — only for gongfu */}
          {showInfusion && (
            <View style={[styles.infusionRow, { borderColor: theme.border.light }]}>
              <Text style={[styles.infusionLabel, { color: theme.text.secondary }]}>Infusion</Text>
              <View style={styles.infusionStepper}>
                <TouchableOpacity
                  onPress={() => { if (infusion > 1) { haptics.selection(); setInfusion(n => n - 1); } }}
                  style={[styles.stepperBtn, { borderColor: theme.border.light, opacity: infusion <= 1 ? 0.3 : 1 }]}
                  disabled={infusion <= 1}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.text.primary }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.infusionNum, { color: theme.text.primary }]}>#{infusion}</Text>
                <TouchableOpacity
                  onPress={() => { haptics.selection(); setInfusion(n => n + 1); }}
                  style={[styles.stepperBtn, { borderColor: theme.border.light }]}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.text.primary }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Mood Tags */}
          <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Moment</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsContainer}
            style={styles.moodScroll}
          >
            {MOOD_TAGS.map(tag => {
              const isSelected = selectedMood === tag.label;
              return (
                <TouchableOpacity
                  key={tag.label}
                  style={[
                    styles.tag,
                    { 
                      borderColor: isSelected ? theme.accent.primary : theme.border.light,
                      backgroundColor: isSelected ? (theme.accent.primary + '18') : theme.background.secondary,
                    },
                  ]}
                  onPress={() => toggleMood(tag.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                  <Text style={[styles.tagLabel, { color: isSelected ? theme.accent.primary : theme.text.secondary }]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rating slider */}
          <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Rating</Text>
          <RatingSlider value={rating} onValueChange={setRating} size="small" />

          {/* Flavor Tags */}
          <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Flavor Profile</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsContainer}
            style={styles.tagsScroll}
          >
            {FLAVOR_TAGS.map(tag => {
              const isSelected = selectedTags.includes(tag.label);
              return (
                <TouchableOpacity
                  key={tag.label}
                  style={[
                    styles.tag,
                    { 
                      borderColor: isSelected ? theme.accent.primary : theme.border.light,
                      backgroundColor: isSelected ? (theme.accent.primary + '18') : theme.background.secondary,
                    },
                  ]}
                  onPress={() => toggleTag(tag.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                  <Text style={[styles.tagLabel, { color: isSelected ? theme.accent.primary : theme.text.secondary }]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { ...typography.headingSmall },
  summary: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  teaName: { ...typography.body, fontWeight: '600', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  summaryItem: { ...typography.bodySmall },
  sectionLabel: { ...typography.bodySmall, fontWeight: '600', marginBottom: 4, marginLeft: 4 },
  notesInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, ...typography.body, marginBottom: 20 },
  moodScroll: { marginBottom: 16, marginHorizontal: -20 },
  tagsScroll: { marginBottom: 16, marginHorizontal: -20 },
  tagsContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  tagEmoji: { fontSize: 14 },
  tagLabel: { ...typography.bodySmall, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipButton: { paddingVertical: 14, paddingHorizontal: 20 },
  skipText: { ...typography.body, fontWeight: '500' },
  infusionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16 },
  infusionLabel: { ...typography.bodySmall, fontWeight: '600' },
  infusionStepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  infusionNum: { ...typography.body, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { ...typography.body, fontWeight: '600', lineHeight: 20 },
});
