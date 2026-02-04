import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Deterministic Avatar Component
 * Uses DiceBear API for consistent, friendly avatars based on user ID
 * Falls back to initials on gradient if image fails
 * 
 * Avatar styles available:
 * - 'bottts' - Friendly robots
 * - 'avataaars' - Cartoon people  
 * - 'lorelei' - Illustrated portraits
 * - 'notionists' - Notion-style avatars
 * - 'thumbs' - Thumbs up characters
 */

// Warm, tea-inspired color palette for fallback gradients
const AVATAR_COLORS = [
  ['#8FD4B0', '#5AAD82'],  // Sage green
  ['#D4A574', '#B8956C'],  // Warm amber
  ['#E8B4B8', '#D4949A'],  // Rose
  ['#A4C4E8', '#7AA8D6'],  // Soft blue
  ['#C4B4D4', '#A494C4'],  // Lavender
  ['#E8D4A4', '#D4C094'],  // Cream gold
  ['#94C4B4', '#74A494'],  // Teal
  ['#D4A494', '#C49484'],  // Terracotta
];

// Simple hash function for consistent color selection
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Avatar({ 
  userId, 
  name, 
  imageUrl,
  size = 48,
  style,
  avatarStyle = 'notionists', // DiceBear style
}) {
  const { theme } = useTheme();
  
  // Generate deterministic avatar URL from DiceBear
  const dicebearUrl = useMemo(() => {
    if (!userId) return null;
    const seed = userId.replace(/-/g, '');
    return `https://api.dicebear.com/7.x/${avatarStyle}/png?seed=${seed}&size=${size * 2}&backgroundColor=transparent`;
  }, [userId, avatarStyle, size]);

  // Get fallback color based on userId or name
  const fallbackColors = useMemo(() => {
    const seed = userId || name || 'default';
    const index = hashCode(seed) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }, [userId, name]);

  const initials = useMemo(() => getInitials(name), [name]);

  const [imageError, setImageError] = React.useState(false);

  // Determine which image to show
  const finalImageUrl = imageUrl || (!imageError ? dicebearUrl : null);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
  };

  const fontSize = size * 0.4;

  // Show image if available and not errored
  if (finalImageUrl && !imageError) {
    return (
      <View 
        style={[containerStyle, style]}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
      >
        <Image
          source={{ uri: finalImageUrl }}
          style={{ width: size, height: size }}
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // Fallback to initials on gradient
  return (
    <View 
      style={[
        containerStyle, 
        { backgroundColor: fallbackColors[0] },
        style
      ]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s avatar, showing initials ${initials}` : 'User avatar'}
    >
      <View style={[styles.initialsContainer, { backgroundColor: fallbackColors[1] }]}>
        <Text style={[styles.initials, { fontSize, color: '#fff' }]} accessibilityElementsHidden>
          {initials}
        </Text>
      </View>
    </View>
  );
}

// Preset sizes for common uses
Avatar.Small = (props) => <Avatar {...props} size={32} />;
Avatar.Medium = (props) => <Avatar {...props} size={48} />;
Avatar.Large = (props) => <Avatar {...props} size={64} />;
Avatar.XLarge = (props) => <Avatar {...props} size={96} />;

const styles = StyleSheet.create({
  initialsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
});
