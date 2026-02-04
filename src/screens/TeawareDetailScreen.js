import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  ExternalLink, 
  Droplets, 
  Ruler, 
  DollarSign,
  Tag,
  User,
  MapPin,
  Leaf,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../constants';
import { Button } from '../components';
import { haptics } from '../utils';

const { width } = Dimensions.get('window');

// Format category for display
const formatCategory = (category) => {
  if (!category) return 'Teaware';
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

// Format material for display
const formatMaterial = (material) => {
  if (!material) return null;
  return material
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

// Get color for material type
const getMaterialColor = (material) => {
  const colors = {
    'yixing_clay': '#8B4513',
    'jianshui_clay': '#654321',
    'porcelain': '#F5F5F5',
    'glass': '#87CEEB',
    'cast_iron': '#2F4F4F',
    'ceramic': '#DEB887',
    'stoneware': '#A0522D',
    'silver': '#C0C0C0',
    'bamboo': '#8FBC8F',
  };
  return colors[material] || '#888';
};

export default function TeawareDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { teaware } = route.params;
  const styles = createStyles(theme);

  const handleBuyPress = () => {
    haptics.medium();
    if (teaware.product_url) {
      Linking.openURL(teaware.product_url);
    }
  };

  const handleBack = () => {
    haptics.light();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        {teaware.image_url ? (
          <Image
            source={{ uri: teaware.image_url }}
            style={styles.image}
            resizeMode="cover"
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={`Photo of ${teaware.name}`}
          />
        ) : (
          <LinearGradient
            colors={[getMaterialColor(teaware.material), theme.background.secondary]}
            style={styles.imagePlaceholder}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={`${teaware.name} placeholder image`}
          >
            <Text style={styles.placeholderEmoji} accessibilityElementsHidden={true}>🫖</Text>
          </LinearGradient>
        )}
        
        {/* Back Button */}
        <SafeAreaView edges={['top']} style={styles.headerOverlay}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.background.primary + 'DD' }]}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Price Badge */}
        {teaware.price_usd && (
          <View 
            style={[styles.priceBadge, { backgroundColor: theme.accent.primary }]}
            accessible={true}
            accessibilityLabel={`Price: $${teaware.price_usd.toFixed(2)}`}
          >
            <Text style={styles.priceText}>${teaware.price_usd.toFixed(2)}</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Category & Material */}
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: theme.background.secondary }]}>
            <Tag size={14} color={theme.text.secondary} />
            <Text style={[styles.badgeText, { color: theme.text.secondary }]}>
              {formatCategory(teaware.category)}
            </Text>
          </View>
          {teaware.material && (
            <View style={[styles.badge, { backgroundColor: theme.background.secondary }]}>
              <View style={[styles.materialDot, { backgroundColor: getMaterialColor(teaware.material) }]} />
              <Text style={[styles.badgeText, { color: theme.text.secondary }]}>
                {formatMaterial(teaware.material)}
              </Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={[styles.name, { color: theme.text.primary }]} accessibilityRole="header">
          {teaware.name}
        </Text>

        {/* Clay Type (if applicable) */}
        {teaware.clay_type && (
          <Text style={[styles.clayType, { color: theme.accent.warm }]}>
            {teaware.clay_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Clay
          </Text>
        )}

        {/* Description */}
        {teaware.description && (
          <Text style={[styles.description, { color: theme.text.secondary }]}>
            {teaware.description}
          </Text>
        )}

        {/* Specs */}
        <View style={styles.specs} accessibilityRole="list" accessibilityLabel="Specifications">
          {teaware.capacity_ml && (
            <View 
              style={[styles.specItem, { backgroundColor: theme.background.secondary }]}
              accessible={true}
              accessibilityLabel={`Capacity: ${teaware.capacity_ml} milliliters`}
            >
              <Droplets size={20} color={theme.accent.primary} accessibilityElementsHidden={true} />
              <Text style={[styles.specValue, { color: theme.text.primary }]}>
                {teaware.capacity_ml}ml
              </Text>
              <Text style={[styles.specLabel, { color: theme.text.tertiary }]}>
                Capacity
              </Text>
            </View>
          )}
          
          {teaware.dimensions_cm && (
            <View 
              style={[styles.specItem, { backgroundColor: theme.background.secondary }]}
              accessible={true}
              accessibilityLabel={`Dimensions: ${teaware.dimensions_cm}`}
            >
              <Ruler size={20} color={theme.accent.primary} accessibilityElementsHidden={true} />
              <Text style={[styles.specValue, { color: theme.text.primary }]}>
                {teaware.dimensions_cm}
              </Text>
              <Text style={[styles.specLabel, { color: theme.text.tertiary }]}>
                Dimensions
              </Text>
            </View>
          )}
        </View>

        {/* Artisan */}
        {teaware.artisan_name && (
          <View style={[styles.infoRow, { borderColor: theme.border.light }]}>
            <User size={18} color={theme.text.tertiary} />
            <Text style={[styles.infoLabel, { color: theme.text.tertiary }]}>Artisan</Text>
            <Text style={[styles.infoValue, { color: theme.text.primary }]}>
              {teaware.artisan_name}
            </Text>
          </View>
        )}

        {/* Origin */}
        {teaware.origin_region && (
          <View style={[styles.infoRow, { borderColor: theme.border.light }]}>
            <MapPin size={18} color={theme.text.tertiary} />
            <Text style={[styles.infoLabel, { color: theme.text.tertiary }]}>Origin</Text>
            <Text style={[styles.infoValue, { color: theme.text.primary }]}>
              {teaware.origin_region}
            </Text>
          </View>
        )}

        {/* Recommended Teas */}
        {teaware.recommended_teas && teaware.recommended_teas.length > 0 && (
          <View style={styles.recommendedSection}>
            <View style={styles.recommendedHeader}>
              <Leaf size={18} color={theme.accent.primary} />
              <Text style={[styles.recommendedTitle, { color: theme.text.primary }]}>
                Best For
              </Text>
            </View>
            <View style={styles.recommendedTeas}>
              {teaware.recommended_teas.map((tea, idx) => (
                <View 
                  key={idx} 
                  style={[styles.teaTag, { backgroundColor: theme.background.secondary }]}
                >
                  <Text style={[styles.teaTagText, { color: theme.text.secondary }]}>
                    {tea.charAt(0).toUpperCase() + tea.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Buy Button */}
        {teaware.product_url && (
          <Button
            title="View on Store"
            onPress={handleBuyPress}
            variant="primary"
            icon={<ExternalLink size={18} color="#fff" />}
            style={styles.buyButton}
          />
        )}

        {/* Stock Status */}
        <Text 
          style={[styles.stockStatus, { 
            color: teaware.in_stock ? theme.status.success : theme.text.tertiary 
          }]}
          accessible={true}
          accessibilityLabel={teaware.in_stock ? 'In Stock' : 'Out of Stock'}
        >
          {teaware.in_stock ? '● In Stock' : '○ Out of Stock'}
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    margin: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  priceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  materialDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    ...typography.displayMedium,
    marginBottom: spacing.xs,
  },
  clayType: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  specs: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    gap: spacing.xs,
  },
  specValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  specLabel: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  recommendedSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendedTeas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  teaTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  teaTagText: {
    fontSize: 14,
  },
  buyButton: {
    marginTop: spacing.md,
  },
  stockStatus: {
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 14,
  },
});
