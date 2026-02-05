import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../constants';

const CATEGORY_LABELS = {
  gaiwan: 'Gaiwan',
  teapot: 'Teapot',
  cup: 'Cup',
  pitcher: 'Pitcher',
  tea_tray: 'Tea Tray',
  tea_pet: 'Tea Pet',
  tea_tools: 'Tools',
  canister: 'Canister',
  travel_set: 'Travel Set',
  kettle: 'Kettle',
  other: 'Other',
};

const MATERIAL_LABELS = {
  porcelain: 'Porcelain',
  yixing_clay: 'Yixing Clay',
  jianshui_clay: 'Jianshui',
  glass: 'Glass',
  cast_iron: 'Cast Iron',
  silver: 'Silver',
  ceramic: 'Ceramic',
  stoneware: 'Stoneware',
  bamboo: 'Bamboo',
  wood: 'Wood',
  other: 'Other',
};

export const TeawareCard = ({ item, onPress, style, compact = false }) => {
  const { theme } = useTheme();

  const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category;
  const getMaterialLabel = (material) => MATERIAL_LABELS[material] || material;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        },
        compact && styles.compactCard,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${getCategoryLabel(item.category)}`}
    >
      {/* Image */}
      <View style={[styles.imageContainer, compact && styles.compactImage]}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: theme.background.tertiary }]}>
            <Text style={styles.placeholderEmoji}>🫖</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[styles.content, compact && styles.compactContent]}>
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: theme.accent.primary + '20' }]}>
          <Text style={[styles.categoryText, { color: theme.accent.primary }]}>
            {getCategoryLabel(item.category)}
          </Text>
        </View>

        {/* Name */}
        <Text 
          style={[styles.name, { color: theme.text.primary }]} 
          numberOfLines={compact ? 2 : 3}
        >
          {item.name}
        </Text>

        {/* Material & Capacity */}
        <Text style={[styles.details, { color: theme.text.secondary }]} numberOfLines={1}>
          {getMaterialLabel(item.material)}
          {item.capacity_ml && ` • ${item.capacity_ml}ml`}
        </Text>

        {/* Price */}
        {item.price_usd && (
          <Text style={[styles.price, { color: theme.accent.primary }]}>
            ${item.price_usd}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    width: 180,
  },
  compactCard: {
    width: 160,
  },
  imageContainer: {
    height: 140,
    width: '100%',
  },
  compactImage: {
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  content: {
    padding: spacing.sm,
  },
  compactContent: {
    padding: spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  details: {
    ...typography.caption,
    marginBottom: 4,
  },
  price: {
    ...typography.body,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default TeawareCard;
