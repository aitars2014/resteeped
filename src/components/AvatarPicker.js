import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../constants';
import Avatar from './Avatar';
import { haptics } from '../utils';

const { width } = Dimensions.get('window');

// All DiceBear avatar styles with display names
const AVATAR_STYLES = [
  { id: 'notionists', name: 'Notion', description: 'Clean illustrated faces' },
  { id: 'avataaars', name: 'Cartoon', description: 'Fun cartoon characters' },
  { id: 'lorelei', name: 'Portrait', description: 'Artistic portraits' },
  { id: 'micah', name: 'Micah', description: 'Colorful illustrations' },
  { id: 'adventurer', name: 'Adventurer', description: 'Adventurous characters' },
  { id: 'big-ears', name: 'Big Ears', description: 'Cute big-eared faces' },
  { id: 'big-smile', name: 'Big Smile', description: 'Happy smiling faces' },
  { id: 'bottts', name: 'Robots', description: 'Friendly robot avatars' },
  { id: 'fun-emoji', name: 'Emoji', description: 'Fun emoji faces' },
  { id: 'personas', name: 'Personas', description: 'Stylized personas' },
  { id: 'pixel-art', name: 'Pixel Art', description: '8-bit style avatars' },
  { id: 'thumbs', name: 'Thumbs', description: 'Thumbs up characters' },
  { id: 'open-peeps', name: 'Open Peeps', description: 'Hand-drawn peeps' },
  { id: 'croodles', name: 'Croodles', description: 'Playful doodles' },
  { id: 'miniavs', name: 'Mini', description: 'Minimalist avatars' },
  { id: 'identicon', name: 'Identicon', description: 'GitHub-style patterns' },
  { id: 'shapes', name: 'Shapes', description: 'Abstract shapes' },
  { id: 'initials', name: 'Initials', description: 'Letter monogram' },
];

// Generate variation seeds for a style
const generateVariationSeeds = (userId, count = 12) => {
  const seeds = [null]; // null means use default userId
  for (let i = 1; i < count; i++) {
    seeds.push(`${userId}-var-${i}`);
  }
  return seeds;
};

export default function AvatarPicker({ 
  visible, 
  onClose, 
  onSelect, 
  currentStyle,
  currentSeed,
  userId,
  userName,
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Step 1: style selection, Step 2: variation selection
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState(currentStyle || 'notionists');
  const [selectedSeed, setSelectedSeed] = useState(currentSeed);
  const [variationSeeds, setVariationSeeds] = useState([]);

  // Sync state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedStyle(currentStyle || 'notionists');
      setSelectedSeed(currentSeed);
      setStep(1);
    }
  }, [visible, currentStyle, currentSeed]);

  // Generate variation seeds when style is selected
  useEffect(() => {
    if (userId) {
      setVariationSeeds(generateVariationSeeds(userId, 12));
    }
  }, [userId]);

  const handleStyleSelect = (styleId) => {
    haptics.selection();
    setSelectedStyle(styleId);
    setSelectedSeed(null); // Reset seed when changing style
    setStep(2); // Move to variation selection
  };

  const handleVariationSelect = (seed) => {
    haptics.selection();
    setSelectedSeed(seed);
  };

  const handleBack = () => {
    haptics.selection();
    setStep(1);
  };

  const handleConfirm = () => {
    haptics.success();
    onSelect(selectedStyle, selectedSeed);
    onClose();
  };

  const renderStyleSelection = () => (
    <>
      {/* Preview */}
      <View style={styles.previewSection}>
        <Avatar 
          userId={userId}
          name={userName}
          size={120}
          avatarStyle={selectedStyle}
          avatarSeed={selectedSeed}
        />
        <Text style={[styles.previewName, { color: theme.text.primary }]}>
          {userName || 'Your Avatar'}
        </Text>
        <Text style={[styles.previewHint, { color: theme.text.secondary }]}>
          Tap a style to see variations
        </Text>
      </View>

      {/* Style Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {AVATAR_STYLES.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.styleCard,
              { backgroundColor: theme.background.secondary },
              selectedStyle === style.id && { 
                borderColor: theme.accent.primary,
                borderWidth: 2,
              }
            ]}
            onPress={() => handleStyleSelect(style.id)}
          >
            <Avatar 
              userId={userId}
              name={userName}
              size={64}
              avatarStyle={style.id}
            />
            <Text style={[styles.styleName, { color: theme.text.primary }]}>
              {style.name}
            </Text>
            <Text style={[styles.styleDesc, { color: theme.text.tertiary }]} numberOfLines={1}>
              {style.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  const renderVariationSelection = () => (
    <>
      {/* Preview */}
      <View style={styles.previewSection}>
        <Avatar 
          userId={userId}
          name={userName}
          size={120}
          avatarStyle={selectedStyle}
          avatarSeed={selectedSeed}
        />
        <Text style={[styles.previewName, { color: theme.text.primary }]}>
          {userName || 'Your Avatar'}
        </Text>
        <Text style={[styles.previewStyle, { color: theme.text.secondary }]}>
          {AVATAR_STYLES.find(s => s.id === selectedStyle)?.name || selectedStyle}
        </Text>
      </View>

      {/* Variation Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.variationGrid}
        showsVerticalScrollIndicator={false}
      >
        {variationSeeds.map((seed, index) => (
          <TouchableOpacity
            key={seed || 'default'}
            style={[
              styles.variationCard,
              { backgroundColor: theme.background.secondary },
              selectedSeed === seed && { 
                borderColor: theme.accent.primary,
                borderWidth: 2,
              }
            ]}
            onPress={() => handleVariationSelect(seed)}
          >
            <Avatar 
              userId={userId}
              name={userName}
              size={72}
              avatarStyle={selectedStyle}
              avatarSeed={seed}
            />
            {selectedSeed === seed && (
              <View style={[styles.selectedBadge, { backgroundColor: theme.accent.primary }]}>
                <Check size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          {step === 2 ? (
            <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
              <ChevronLeft size={24} color={theme.text.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text.primary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: theme.text.primary }]}>
            {step === 1 ? 'Choose Style' : 'Choose Variation'}
          </Text>
          {step === 2 ? (
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Check size={24} color={theme.accent.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmButton} />
          )}
        </View>

        {step === 1 ? renderStyleSelection() : renderVariationSelection()}
      </SafeAreaView>
    </Modal>
  );
}

// Export styles list for use elsewhere
export { AVATAR_STYLES };

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.headingSmall,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light,
  },
  previewName: {
    ...typography.headingMedium,
    marginTop: spacing.md,
  },
  previewStyle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  previewHint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  styleCard: {
    width: (width - spacing.md * 3) / 2,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    position: 'relative',
  },
  styleName: {
    ...typography.label,
    marginTop: spacing.sm,
  },
  styleDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  variationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  variationCard: {
    width: (width - spacing.md * 2 - spacing.sm * 3) / 4,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
