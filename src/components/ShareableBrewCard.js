import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Thermometer, Droplets, Leaf, Coffee } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { haptics } from '../utils/haptics';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

const TEA_GRADIENTS = {
  black: ['#1A0A00', '#4A1C0A', '#8B4513'],
  green: ['#0A1A0A', '#1B4332', '#52B788'],
  oolong: ['#1A0F00', '#6B3A0A', '#C66A1D'],
  white: ['#1A1A2E', '#3D3D5C', '#D4D4E8'],
  puerh: ['#0D0A07', '#2C1810', '#8B6F47'],
  herbal: ['#1A0A1A', '#4A1A4A', '#D4A5C7'],
  yellow: ['#1A1500', '#4A3D0A', '#DAA520'],
};

const TEA_EMOJIS = {
  black: '🫖',
  green: '🍵',
  oolong: '🍂',
  white: '🤍',
  puerh: '🪨',
  herbal: '🌿',
  yellow: '☀️',
};

const formatTime = (seconds) => {
  if (seconds >= 3600) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ShareableBrewCard = forwardRef(({ tea, brewMethod, temperatureF, totalSeconds, currentInfusion, isActive }, ref) => {
  const viewShotRef = useRef();
  const teaType = (tea?.teaType || 'green').toLowerCase();
  const gradient = TEA_GRADIENTS[teaType] || TEA_GRADIENTS.green;
  const emoji = TEA_EMOJIS[teaType] || '🍵';

  useImperativeHandle(ref, () => ({
    capture: async () => {
      try {
        haptics.light();
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `Share your brew session`,
            UTI: 'public.png',
          });
          return { success: true };
        }
      } catch (error) {
        console.error('Brew card share failed:', error);
        return { success: false, error };
      }
    },
  }));

  const methodLabel = brewMethod === 'gongfu' ? 'Gongfu' : brewMethod === 'cold_brew' ? 'Cold Brew' : 'Western';

  return (
    <View style={styles.offscreen} pointerEvents="none">
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1, width: CARD_WIDTH, height: CARD_HEIGHT }}>
        <LinearGradient colors={gradient} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Top branding */}
          <View style={styles.header}>
            <Text style={styles.brandText}>RESTEEPED</Text>
            <Text style={styles.statusText}>{isActive ? '🔴 BREWING NOW' : '✅ JUST BREWED'}</Text>
          </View>

          {/* Center — tea info */}
          <View style={styles.center}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.teaName}>{tea?.name || 'My Tea'}</Text>
            {tea?.brandName && (
              <Text style={styles.brandName}>{tea.brandName}</Text>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{teaType.toUpperCase()}</Text>
            </View>
          </View>

          {/* Brew details */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Clock size={28} color="rgba(255,255,255,0.9)" />
              <Text style={styles.detailText}>{formatTime(totalSeconds)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Thermometer size={28} color="rgba(255,255,255,0.9)" />
              <Text style={styles.detailText}>{temperatureF}°F</Text>
            </View>
            <View style={styles.detailRow}>
              <Coffee size={28} color="rgba(255,255,255,0.9)" />
              <Text style={styles.detailText}>{methodLabel}</Text>
            </View>
            {currentInfusion > 1 && (
              <View style={styles.detailRow}>
                <Droplets size={28} color="rgba(255,255,255,0.9)" />
                <Text style={styles.detailText}>Infusion {currentInfusion}</Text>
              </View>
            )}
          </View>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <Text style={styles.ctaText}>Track your tea journey</Text>
            <View style={styles.appBadge}>
              <Leaf size={20} color="#fff" />
              <Text style={styles.appBadgeText}>Resteeped — Free on the App Store</Text>
            </View>
          </View>
        </LinearGradient>
      </ViewShot>
    </View>
  );
});

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: 80,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  brandText: {
    fontSize: 42,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 12,
  },
  statusText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    letterSpacing: 2,
  },
  center: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 120,
    marginBottom: 32,
  },
  teaName: {
    fontSize: 72,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 84,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    textAlign: 'center',
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 30,
    paddingHorizontal: 36,
    paddingVertical: 12,
    marginTop: 24,
  },
  typeBadgeText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 4,
  },
  details: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 32,
    padding: 48,
    gap: 28,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  detailText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ctaText: {
    fontSize: 30,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  appBadgeText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ShareableBrewCard;
