import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { TeaLeaf } from './icons';

export const EditorialTastingNote = ({ note, attribution }) => {
  const { theme } = useTheme();

  if (!note) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary, borderColor: theme.border.medium }]}>
      <View style={styles.header}>
        <TeaLeaf size={18} color={theme.accent.primary} style={{ marginRight: spacing.xs }} />
        <Text style={[styles.title, { color: theme.text.primary }]}>Brew Notes</Text>
      </View>
      <Text style={[styles.noteText, { color: theme.text.secondary }]}>
        {note}
      </Text>
      {attribution && (
        <Text style={[styles.attribution, { color: theme.text.tertiary }]}>
          {attribution}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  attribution: {
    fontSize: 12,
    marginTop: spacing.sm,
  },
});
