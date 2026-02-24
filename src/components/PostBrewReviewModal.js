import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, PanResponder, Dimensions,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { useTheme } from '../context';
import { typography, spacing } from '../constants';
import { Button } from '../components';

const SLIDER_WIDTH = Dimensions.get('window').width - 100;
const THUMB_SIZE = 28;

const RatingSlider = ({ value, onValueChange }) => {
  const { theme } = useTheme();
  const currentValue = useRef(value);

  const clamp = (val) => Math.round(Math.min(50, Math.max(1, val))) / 10;

  const positionToValue = (x) => {
    const ratio = Math.max(0, Math.min(1, x / SLIDER_WIDTH));
    return clamp(Math.round((0.1 + ratio * 4.9) * 10));
  };

  const valueToPosition = (val) => ((val - 0.1) / 4.9) * SLIDER_WIDTH;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const newVal = positionToValue(evt.nativeEvent.locationX);
        currentValue.current = newVal;
        onValueChange?.(newVal);
      },
      onPanResponderMove: (evt, gs) => {
        const startPos = valueToPosition(currentValue.current);
        const newVal = positionToValue(startPos + gs.dx);
        if (newVal !== currentValue.current) {
          currentValue.current = newVal;
          onValueChange?.(newVal);
        }
      },
    })
  ).current;

  const thumbLeft = valueToPosition(value);
  const ratingColor = value < 2 ? '#D0021B' : value < 3.5 ? '#F5A623' : '#7ED321';

  return (
    <View style={ratingStyles.container}>
      <View style={ratingStyles.labelRow}>
        <Star size={20} color={ratingColor} fill={ratingColor} />
        <Text style={[ratingStyles.value, { color: ratingColor }]}>{value.toFixed(1)}</Text>
      </View>
      <View style={ratingStyles.sliderContainer} {...panResponder.panHandlers}>
        <View style={[ratingStyles.track, { backgroundColor: theme.border.light }]}>
          <View style={[ratingStyles.fill, { width: thumbLeft, backgroundColor: ratingColor }]} />
        </View>
        <View style={[ratingStyles.thumb, { 
          left: thumbLeft - THUMB_SIZE / 2, 
          backgroundColor: ratingColor,
          borderColor: theme.background.primary,
        }]} />
      </View>
      <View style={ratingStyles.labels}>
        <Text style={[ratingStyles.labelText, { color: theme.text.tertiary }]}>0.1</Text>
        <Text style={[ratingStyles.labelText, { color: theme.text.tertiary }]}>5.0</Text>
      </View>
    </View>
  );
};

const ratingStyles = StyleSheet.create({
  container: { marginVertical: 8, paddingHorizontal: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 },
  value: { fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sliderContainer: { height: 40, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, width: SLIDER_WIDTH },
  fill: { height: 6, borderRadius: 3 },
  thumb: {
    position: 'absolute', width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2,
    borderWidth: 3, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  labelText: { fontSize: 11 },
});

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
          <RatingSlider value={rating} onValueChange={setRating} />

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
