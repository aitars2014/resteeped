import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 140;
const CARD_HEIGHT = 180;

/**
 * Simple deterministic hash for daily rotation.
 */
const hashString = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
};

/**
 * Rotate an array starting from a deterministic offset based on the date,
 * so the row shows different teas each day.
 */
const dailyRotate = (arr, category) => {
  if (arr.length <= 1) return arr;
  const today = new Date().toISOString().split('T')[0];
  const offset = hashString(today + ':' + category) % arr.length;
  return [...arr.slice(offset), ...arr.slice(0, offset)];
};

const MiniTeaCard = ({ tea, onPress, teaColor, theme }) => (
  <TouchableOpacity style={styles.miniCard} onPress={() => onPress(tea)} activeOpacity={0.8}>
    {tea.imageUrl ? (
      <Image source={{ uri: tea.imageUrl }} style={styles.miniImage} resizeMode="cover" />
    ) : (
      <LinearGradient
        colors={[teaColor.primary, teaColor.gradient]}
        style={styles.miniImage}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    )}
    <View style={styles.miniInfo}>
      <Text style={[styles.miniName, { color: theme.text.primary }]} numberOfLines={2}>
        {tea.name}
      </Text>
      <Text style={[styles.miniBrand, { color: theme.text.secondary }]} numberOfLines={1}>
        {tea.brandName}
      </Text>
    </View>
  </TouchableOpacity>
);

export const TeaCategoryRow = ({ title, teas, teaType, onTeaPress, onSeeAll, theme: _unused }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const teaColor = getTeaTypeColor(teaType);

  // Filter teas for this category, prioritize ones with images, rotate daily
  const displayTeas = useMemo(() => {
    const categoryTeas = teas.filter(t => t.teaType === teaType);
    // Prioritize teas with images
    const withImages = categoryTeas.filter(t => t.imageUrl);
    const withoutImages = categoryTeas.filter(t => !t.imageUrl);
    const ordered = [...withImages, ...withoutImages];
    return dailyRotate(ordered, teaType).slice(0, 20); // Show up to 20 in the row
  }, [teas, teaType]);

  if (displayTeas.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: teaColor.primary }]} />
          <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
        </View>
        <TouchableOpacity style={styles.seeAll} onPress={onSeeAll}>
          <Text style={[styles.seeAllText, { color: theme.accent.primary }]}>See All</Text>
          <ChevronRight size={16} color={theme.accent.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={displayTeas}
        renderItem={({ item }) => (
          <MiniTeaCard tea={item} onPress={onTeaPress} teaColor={teaColor} theme={theme} />
        )}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    ...typography.headingSmall,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.sm,
  },
  miniCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  miniInfo: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  miniName: {
    ...typography.bodySmall,
    fontWeight: '600',
    lineHeight: 18,
  },
  miniBrand: {
    ...typography.caption,
    marginTop: 2,
  },
});

export default TeaCategoryRow;
