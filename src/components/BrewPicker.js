import React, { useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';
import { Coffee, Search, Shuffle, X } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme, useCollection } from '../context';

const OPTIONS = [
  {
    key: 'collection',
    Icon: Coffee,
    label: 'From my collection',
    subtitle: 'A tea you already love',
    emptySubtitle: 'Add teas to your collection first',
  },
  {
    key: 'discover',
    Icon: Search,
    label: 'Help me find something',
    subtitle: 'Describe what you\'re in the mood for',
  },
  {
    key: 'surprise',
    Icon: Shuffle,
    label: 'Surprise me',
    subtitle: 'We\'ll pick something great',
  },
];

export const BrewPicker = forwardRef(({ onSelectCollection, onSelectDiscover, onSelectSurprise }, ref) => {
  const { theme } = useTheme();
  const { collection } = useCollection();
  const [visible, setVisible] = useState(false);
  const hasCollection = collection.length > 0;

  // Expose open/close via ref (snapToIndex(0) = open, close() = close)
  useImperativeHandle(ref, () => ({
    snapToIndex: (index) => {
      if (index >= 0) setVisible(true);
    },
    close: () => setVisible(false),
  }));

  const handlePress = (key) => {
    setVisible(false);
    if (key === 'collection') {
      if (hasCollection) {
        onSelectCollection?.();
      } else {
        onSelectDiscover?.();
      }
    } else if (key === 'discover') {
      onSelectDiscover?.();
    } else if (key === 'surprise') {
      onSelectSurprise?.();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <View />
      </Pressable>
      <View style={[styles.sheet, { backgroundColor: theme.background.primary }]}>  
        <View style={[styles.handle, { backgroundColor: theme.text.tertiary }]} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text.primary }]}>What should I brew?</Text>
          {OPTIONS.map((option) => {
            const { key, Icon, label, subtitle, emptySubtitle } = option;
            const isDisabled = key === 'collection' && !hasCollection;
            const displaySubtitle = isDisabled ? emptySubtitle : subtitle;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionCard,
                  { backgroundColor: theme.background.secondary, borderColor: theme.border.light },
                  isDisabled && styles.optionDisabled,
                ]}
                onPress={() => handlePress(key)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.accent.primary + '15' }]}>
                  <Icon size={22} color={isDisabled ? theme.text.tertiary : theme.accent.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: isDisabled ? theme.text.tertiary : theme.text.primary }]}>
                    {label}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: isDisabled ? theme.text.tertiary : theme.text.secondary }]}>
                    {displaySubtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.headingSmall,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    ...typography.caption,
  },
});

export default BrewPicker;
