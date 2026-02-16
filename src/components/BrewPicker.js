import React, { useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Coffee, Search, Shuffle } from 'lucide-react-native';
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

export const BrewPicker = ({ bottomSheetRef, onSelectCollection, onSelectDiscover, onSelectSurprise }) => {
  const { theme } = useTheme();
  const { collection } = useCollection();
  const snapPoints = useMemo(() => ['38%'], []);
  const hasCollection = collection.length > 0;

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handlePress = (key) => {
    if (key === 'collection') {
      if (hasCollection) {
        onSelectCollection?.();
      } else {
        // Navigate to discover when collection empty
        onSelectDiscover?.();
      }
    } else if (key === 'discover') {
      onSelectDiscover?.();
    } else if (key === 'surprise') {
      onSelectSurprise?.();
    }
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.background.primary }}
      handleIndicatorStyle={{ backgroundColor: theme.text.tertiary }}
    >
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
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
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
