import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../context';
import { haptics } from '../utils/haptics';

const SLIDER_WIDTH = Dimensions.get('window').width - 80;
const MIN_VALUE = 0.1;
const MAX_VALUE = 5.0;
const STEP = 0.1;

export const RatingSlider = ({ value = 0, onValueChange, size = 'medium' }) => {
  const { theme } = useTheme();
  const lastValue = useRef(value);
  const sliderRef = useRef(null);

  const clamp = (val) => {
    const rounded = Math.round(val * 10) / 10;
    return Math.max(MIN_VALUE, Math.min(MAX_VALUE, rounded));
  };

  const positionToValue = (x) => {
    const ratio = Math.max(0, Math.min(1, x / SLIDER_WIDTH));
    return clamp(MIN_VALUE + ratio * (MAX_VALUE - MIN_VALUE));
  };

  const valueToPosition = (val) => {
    return ((val - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * SLIDER_WIDTH;
  };

  const handleMove = useCallback((x) => {
    const newValue = positionToValue(x);
    if (newValue !== lastValue.current) {
      lastValue.current = newValue;
      haptics.selection();
      onValueChange?.(newValue);
    }
  }, [onValueChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        handleMove(x);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        handleMove(x);
      },
    })
  ).current;

  const fillWidth = value > 0 ? valueToPosition(value) : 0;
  const displayValue = value > 0 ? value.toFixed(1) : '—';
  const fontSize = size === 'medium' ? 48 : 36;

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = value >= i;
      const halfFilled = !filled && value >= i - 0.5;
      stars.push(
        <Star
          key={i}
          size={size === 'medium' ? 24 : 18}
          color={filled || halfFilled ? theme.rating.star : theme.rating.starEmpty}
          fill={filled || halfFilled ? theme.rating.star : 'transparent'}
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      {/* Large value display */}
      <Text style={[styles.valueText, { color: theme.text.primary, fontSize }]}>
        {displayValue}
      </Text>

      {/* Stars */}
      <View style={styles.starsRow}>{renderStars()}</View>

      {/* Slider track */}
      <View
        style={[styles.track, { backgroundColor: theme.background.secondary }]}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.trackFill,
            { width: fillWidth, backgroundColor: theme.accent.primary },
          ]}
        />
        {value > 0 && (
          <View
            style={[
              styles.thumb,
              {
                left: fillWidth - 12,
                backgroundColor: theme.accent.primary,
                borderColor: theme.background.primary,
              },
            ]}
          />
        )}
      </View>

      {/* Min/Max labels */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.text.secondary }]}>0.1</Text>
        <Text style={[styles.label, { color: theme.text.secondary }]}>5.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  valueText: {
    fontWeight: '700',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  track: {
    width: SLIDER_WIDTH,
    height: 8,
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: -8,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: SLIDER_WIDTH,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
