import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';

// Caffeine levels by tea type (approximate mg per 8oz serving)
const CAFFEINE_BY_TYPE = {
  black: { level: 'high', mg: '40-70', bars: 4 },
  oolong: { level: 'medium-high', mg: '30-50', bars: 3 },
  green: { level: 'medium', mg: '25-45', bars: 3 },
  white: { level: 'low-medium', mg: '15-30', bars: 2 },
  puerh: { level: 'medium-high', mg: '30-70', bars: 3 },
  herbal: { level: 'none', mg: '0', bars: 0 },
};

const LEVEL_COLORS = {
  0: colors.text.secondary,
  1: '#7CB89D',  // Low - green
  2: '#A8D5BA',  // Low-medium - light green
  3: '#F4A460',  // Medium - amber
  4: '#E8952D',  // High - orange
};

export const CaffeineIndicator = ({ 
  teaType, 
  customLevel,  // Override for specific teas
  showLabel = true,
  size = 'medium',  // 'small', 'medium', 'large'
}) => {
  const teaInfo = CAFFEINE_BY_TYPE[teaType?.toLowerCase()] || CAFFEINE_BY_TYPE.black;
  const bars = customLevel?.bars ?? teaInfo.bars;
  const label = customLevel?.level ?? teaInfo.level;
  const mg = customLevel?.mg ?? teaInfo.mg;
  
  const sizes = {
    small: { barWidth: 3, barHeight: 10, gap: 2, iconSize: 12 },
    medium: { barWidth: 4, barHeight: 14, gap: 3, iconSize: 14 },
    large: { barWidth: 5, barHeight: 18, gap: 4, iconSize: 16 },
  };
  
  const { barWidth, barHeight, gap, iconSize } = sizes[size];
  
  const renderBars = () => {
    return (
      <View style={[styles.barsContainer, { gap }]}>
        {[1, 2, 3, 4].map((barNum) => {
          const isActive = barNum <= bars;
          const barColor = isActive ? LEVEL_COLORS[bars] : colors.border.light;
          const height = barHeight * (0.5 + (barNum * 0.125));
          
          return (
            <View
              key={barNum}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height,
                  backgroundColor: barColor,
                  borderRadius: barWidth / 2,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  if (bars === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.caffeineLabel, size === 'small' && styles.smallLabel]}>
          Caffeine-free
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Zap size={iconSize} color={LEVEL_COLORS[bars]} />
      {renderBars()}
      {showLabel && (
        <Text style={[styles.caffeineLabel, size === 'small' && styles.smallLabel]}>
          {label} ({mg}mg)
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    // Dynamic styles applied inline
  },
  caffeineLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  smallLabel: {
    fontSize: 10,
  },
});

export default CaffeineIndicator;
