import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Droplets, Thermometer, Clock, Leaf } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { getPlaceholderImage } from '../constants';
import { useTheme } from '../context';
import { BREWING_GUIDES } from '../constants/brewingGuides';
import { HEALTH_BENEFITS } from '../constants/healthBenefits';
import { haptics } from '../utils/haptics';

// Instagram Story dimensions (9:16 aspect ratio)
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

// Gradient palettes per tea type — bold, Wrapped-inspired
const TEA_GRADIENTS = {
  black: ['#1A0A00', '#4A1C0A', '#8B4513', '#D2691E'],
  green: ['#0A1A0A', '#1B4332', '#2D6A4F', '#52B788'],
  oolong: ['#1A0F00', '#6B3A0A', '#C66A1D', '#F4A460'],
  white: ['#1A1A2E', '#3D3D5C', '#8E8EA0', '#D4D4E8'],
  puerh: ['#0D0A07', '#2C1810', '#5C3A28', '#8B6F47'],
  herbal: ['#1A0A1A', '#4A1A4A', '#8B3A8B', '#D4A5C7'],
  yellow: ['#1A1500', '#4A3D0A', '#8B7A1D', '#DAA520'],
};

// Fun tea facts by type
const TEA_FACTS = {
  black: [
    'Fully oxidized leaves',
    'Most popular tea worldwide',
    'Pairs beautifully with milk',
    'Ages well when stored properly',
  ],
  green: [
    'Minimally oxidized',
    'Rich in antioxidants (EGCG)',
    'Best brewed below boiling',
    'Can be re-steeped 2-3 times',
  ],
  oolong: [
    'Partially oxidized (15-85%)',
    'Hundreds of flavor profiles',
    'Can be steeped many times',
    'Made from mature tea leaves',
  ],
  white: [
    'Least processed tea type',
    'Made from young buds & leaves',
    'Delicate, subtle sweetness',
    'Highest antioxidant content',
  ],
  puerh: [
    'Aged & fermented tea',
    'Improves with age like wine',
    'Often pressed into cakes',
    'Can be decades old',
  ],
  herbal: [
    'Not technically "tea"',
    'Naturally caffeine-free',
    'Made from herbs & botanicals',
    'Enjoyed for thousands of years',
  ],
  yellow: [
    'Rarest of all tea types',
    'Unique "sealed yellowing" step',
    'Smooth, mellow flavor',
    'An ancient Chinese tradition',
  ],
};

/**
 * ShareableTeaCard - Spotify Wrapped-inspired story card
 * Bold gradients, punchy typography, Instagram Story format (9:16)
 */
export const ShareableTeaCard = React.forwardRef(({ 
  tea, 
  style,
  showBranding = true,
  instagramHandle = null,
  brewNotes = null,
}, ref) => {
  const { theme, getTeaTypeColor } = useTheme();
  const viewShotRef = useRef();
  
  const teaType = (tea.teaType || tea.tea_type || 'black').toLowerCase();
  const teaColor = getTeaTypeColor(teaType);
  const gradientColors = TEA_GRADIENTS[teaType] || TEA_GRADIENTS.black;
  const teaName = tea.name || '';
  const brandName = tea.brandName || tea.brand_name || tea.company?.name || '';
  const description = tea.description || '';
  const placeholderImage = getPlaceholderImage(teaType);
  
  // Get brewing guide data
  const guide = BREWING_GUIDES[teaType] || BREWING_GUIDES.black;
  const healthData = HEALTH_BENEFITS[teaType] || HEALTH_BENEFITS.black;
  
  // Pick 2 random facts for this tea type
  const facts = TEA_FACTS[teaType] || TEA_FACTS.black;
  const factIndex = teaName.length % (facts.length - 1); // deterministic based on name
  const selectedFacts = [facts[factIndex], facts[(factIndex + 1) % facts.length]];

  // Capture and share
  const captureAndShare = async () => {
    try {
      haptics.medium();
      const uri = await viewShotRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${teaName}`,
        });
        haptics.success();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      haptics.error();
    }
  };
  


  return (
    <ViewShot 
      ref={ref || viewShotRef} 
      options={{ format: 'png', quality: 1, width: CARD_WIDTH, height: CARD_HEIGHT }}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top section — tea type label */}
        <View style={styles.topSection}>
          <View style={styles.typePill}>
            <Leaf size={26} color="#FFF" />
            <Text style={styles.typeLabel}>
              {teaType.toUpperCase()} TEA
            </Text>
          </View>
        </View>

        {/* Tea image — circular, centered */}
        <View style={styles.imageSection}>
          <View style={styles.imageRing}>
            <View style={styles.imageInnerRing}>
              <Image 
                source={tea.imageUrl || tea.image_url 
                  ? { uri: tea.imageUrl || tea.image_url } 
                  : placeholderImage
                } 
                style={styles.teaImage} 
              />
            </View>
          </View>
        </View>

        {/* Tea name & brand — big, bold */}
        <View style={styles.nameSection}>
          <Text style={styles.teaName} numberOfLines={3}>
            {teaName}
          </Text>
          <Text style={styles.brandName}>
            {brandName.toUpperCase()}
          </Text>
          {instagramHandle && (
            <Text style={styles.instagramHandle}>
              @{instagramHandle}
            </Text>
          )}
        </View>

        {/* Description snippet */}
        {description ? (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText} numberOfLines={3}>
              "{description.slice(0, 150).trim()}{description.length > 150 ? '…' : ''}"
            </Text>
          </View>
        ) : null}

        {/* Quick facts — brewing stats */}
        <View style={styles.factsSection}>
          <View style={styles.factRow}>
            <View style={styles.factItem}>
              <Thermometer size={32} color="rgba(255,255,255,0.7)" />
              <Text style={styles.factValue}>{guide.waterTemp.fahrenheit}°F</Text>
              <Text style={styles.factLabel}>Water Temp</Text>
            </View>
            <View style={styles.factDivider} />
            <View style={styles.factItem}>
              <Clock size={32} color="rgba(255,255,255,0.7)" />
              <Text style={styles.factValue}>{guide.steepTime.min}-{guide.steepTime.max} min</Text>
              <Text style={styles.factLabel}>Steep Time</Text>
            </View>
            <View style={styles.factDivider} />
            <View style={styles.factItem}>
              <Droplets size={32} color="rgba(255,255,255,0.7)" />
              <Text style={styles.factValue}>{healthData.caffeineRange}</Text>
              <Text style={styles.factLabel}>Caffeine</Text>
            </View>
          </View>
        </View>

        {/* Brew notes — user's personal tasting notes */}
        {brewNotes ? (
          <View style={styles.brewNotesSection}>
            <Text style={styles.brewNotesLabel}>TASTING NOTES</Text>
            <Text style={styles.brewNotesText} numberOfLines={3}>
              "{brewNotes.slice(0, 200).trim()}{brewNotes.length > 200 ? '…' : ''}"
            </Text>
          </View>
        ) : null}

        {/* Fun facts pills */}
        <View style={styles.funFactsSection}>
          {selectedFacts.map((fact, i) => (
            <View key={i} style={styles.funFactPill}>
              <Text style={styles.funFactText}>✦ {fact}</Text>
            </View>
          ))}
        </View>

        {/* Branding footer */}
        {showBranding && (
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerQuote}>Good tea is worth remembering</Text>
            <Image 
              source={require('../../assets/resteeped-logo-dark.png')} 
              style={styles.footerLogo}
              resizeMode="contain"
            />
          </View>
        )}
      </LinearGradient>
    </ViewShot>
  );
});

// Expose capture method
ShareableTeaCard.capture = (ref) => ref.current?.capture?.();

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    flex: 1,
    paddingHorizontal: 80,
    paddingTop: 100,
    paddingBottom: 80,
    justifyContent: 'space-between',
  },
  
  // Top section
  topSection: {
    alignItems: 'flex-start',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 50,
    gap: 14,
  },
  typeLabel: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  
  // Image section
  imageSection: {
    alignItems: 'center',
    marginVertical: 50,
  },
  imageRing: {
    width: 420,
    height: 420,
    borderRadius: 210,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  imageInnerRing: {
    width: 396,
    height: 396,
    borderRadius: 198,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  teaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // Name section
  nameSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  teaName: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 82,
    letterSpacing: -1,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 5,
    marginBottom: 12,
    textAlign: 'center',
  },
  instagramHandle: {
    fontSize: 26,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  
  // Description
  descriptionSection: {
    marginBottom: 36,
    paddingHorizontal: 20,
  },
  descriptionText: {
    fontSize: 32,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 46,
  },
  
  // Facts section
  factsSection: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 32,
    padding: 40,
    marginBottom: 32,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  factItem: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  factValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  factLabel: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  factDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  
  // Brew notes
  brewNotesSection: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    padding: 36,
    marginBottom: 32,
    borderLeftWidth: 5,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  brewNotesLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
    marginBottom: 16,
  },
  brewNotesText: {
    fontSize: 30,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 44,
  },
  
  // Fun facts
  funFactsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  funFactPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  funFactText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  footerDivider: {
    width: 80,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  footerQuote: {
    fontSize: 28,
    fontStyle: 'italic',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  footerLogo: {
    width: 320,
    height: 80,
    opacity: 0.85,
  },
});

export default ShareableTeaCard;
