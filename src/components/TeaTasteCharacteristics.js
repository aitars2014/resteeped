import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { buildTeaTasteProfile } from '../utils/teaTasteProfile';

const THUMB_WIDTH = 74;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const CharacteristicBar = ({ axis, theme }) => {
  const displayValue = clamp(axis.value, 0.1, 0.9);
  const leftActive = axis.value < 0.28;
  const rightActive = axis.value > 0.72;

  return (
    <View
      style={[
        styles.bar,
        {
          borderColor: theme.border.medium,
          backgroundColor: theme.background.primary,
        },
      ]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`${axis.left} to ${axis.right}`}
      accessibilityValue={{ text: `${Math.round(axis.value * 100)} percent toward ${axis.right}` }}
    >
      <Text
        style={[
          styles.edgeLabel,
          { color: leftActive ? theme.text.primary : theme.text.secondary },
          leftActive && styles.activeLabel,
        ]}
        numberOfLines={1}
      >
        {axis.left}
      </Text>
      <View
        style={[
          styles.thumb,
          {
            left: `${displayValue * 100}%`,
            backgroundColor: theme.accent.primary,
          },
        ]}
      />
      <Text
        style={[
          styles.edgeLabel,
          styles.rightLabel,
          { color: rightActive ? theme.text.primary : theme.text.secondary },
          rightActive && styles.activeLabel,
        ]}
        numberOfLines={1}
      >
        {axis.right}
      </Text>
    </View>
  );
};

export const TeaTasteCharacteristics = ({ tea }) => {
  const { theme } = useTheme();
  const tasteProfile = useMemo(() => buildTeaTasteProfile(tea), [tea]);

  if (!tasteProfile.hasProfile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Taste Characteristics</Text>
        <Text style={[styles.source, { color: theme.text.tertiary }]}>Catalog notes</Text>
      </View>
      <View style={styles.bars}>
        {tasteProfile.axes.map(axis => (
          <CharacteristicBar key={axis.id} axis={axis} theme={theme} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sectionSpacing,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    flexShrink: 1,
  },
  source: {
    ...typography.caption,
    fontWeight: '500',
  },
  bars: {
    gap: 10,
  },
  bar: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  edgeLabel: {
    ...typography.bodySmall,
    position: 'absolute',
    left: spacing.md,
    right: '50%',
    zIndex: 2,
  },
  rightLabel: {
    left: '50%',
    right: spacing.md,
    textAlign: 'right',
  },
  activeLabel: {
    fontWeight: '700',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_WIDTH,
    height: 24,
    borderRadius: 12,
    marginLeft: -(THUMB_WIDTH / 2),
  },
});

export default TeaTasteCharacteristics;
