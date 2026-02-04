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
import { X, Check } from 'lucide-react-native';
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

export default function AvatarPicker({ 
  visible, 
  onClose, 
  onSelect, 
  currentStyle,
  userId,
  userName,
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedStyle, setSelectedStyle] = useState(currentStyle || 'notionists');

  // Sync selectedStyle when currentStyle prop changes or modal opens
  useEffect(() => {
    if (visible && currentStyle) {
      setSelectedStyle(currentStyle);
    }
  }, [visible, currentStyle]);

  const handleSelect = (styleId) => {
    haptics.selection();
    setSelectedStyle(styleId);
  };

  const handleConfirm = () => {
    haptics.success();
    onSelect(selectedStyle);
    onClose();
  };

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text.primary }]}>
            Choose Avatar Style
          </Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Check size={24} color={theme.accent.primary} />
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <Avatar 
            userId={userId}
            name={userName}
            size={120}
            avatarStyle={selectedStyle}
          />
          <Text style={[styles.previewName, { color: theme.text.primary }]}>
            {userName || 'Your Avatar'}
          </Text>
          <Text style={[styles.previewStyle, { color: theme.text.secondary }]}>
            {AVATAR_STYLES.find(s => s.id === selectedStyle)?.name || selectedStyle}
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
              onPress={() => handleSelect(style.id)}
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
              {selectedStyle === style.id && (
                <View style={[styles.selectedBadge, { backgroundColor: theme.accent.primary }]}>
                  <Check size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  selectedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
