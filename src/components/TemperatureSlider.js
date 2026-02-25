import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { useTheme } from '../context';
import { typography } from '../constants';

const SLIDER_WIDTH = Dimensions.get('window').width - 80;
const THUMB_SIZE = 28;

const getTempColor = (temp, minTemp, maxTemp) => {
  const ratio = (temp - minTemp) / (maxTemp - minTemp);
  if (ratio < 0.3) return '#4A90D9'; // blue - cold
  if (ratio < 0.6) return '#F5A623'; // yellow - warm
  return '#D0021B'; // red - hot
};

export const TemperatureSlider = ({ 
  value = 200, 
  onValueChange, 
  minTemp = 100, 
  maxTemp = 212,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const trackRef = useRef(null);
  const trackLeftX = useRef(0);
  const currentValue = useRef(value);

  const clamp = (val) => Math.round(Math.min(maxTemp, Math.max(minTemp, val)));

  const positionToValue = useCallback((x) => {
    const ratio = Math.max(0, Math.min(1, x / SLIDER_WIDTH));
    return clamp(minTemp + ratio * (maxTemp - minTemp));
  }, [minTemp, maxTemp]);

  const valueToPosition = (val) => {
    return ((val - minTemp) / (maxTemp - minTemp)) * SLIDER_WIDTH;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderTerminationRequest: () => false, // prevent ScrollView from stealing
      onPanResponderGrant: (evt) => {
        trackRef.current?.measure((_x, _y, _w, _h, pageX) => {
          trackLeftX.current = pageX;
          const x = evt.nativeEvent.pageX - pageX;
          const newVal = positionToValue(x);
          currentValue.current = newVal;
          onValueChange?.(newVal);
        });
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.pageX - trackLeftX.current;
        const newVal = positionToValue(x);
        if (newVal !== currentValue.current) {
          currentValue.current = newVal;
          onValueChange?.(newVal);
        }
      },
    })
  ).current;

  const thumbLeft = valueToPosition(value);
  const tempColor = getTempColor(value, minTemp, maxTemp);

  return (
    <View style={[styles.container, disabled && { opacity: 0.5 }]}>
      <View style={styles.labelRow}>
        <Text style={[styles.tempValue, { color: tempColor }]}>{value}°F</Text>
        <Text style={[styles.tempCelsius, { color: theme.text.secondary }]}>
          ({Math.round((value - 32) * 5 / 9)}°C)
        </Text>
      </View>
      <View 
        style={styles.sliderContainer}
        {...panResponder.panHandlers}
      >
        {/* Track */}
        <View ref={trackRef} style={[styles.track, { backgroundColor: theme.border.light }]}>
          <View 
            style={[styles.trackFill, { 
              width: thumbLeft, 
              backgroundColor: tempColor,
            }]} 
          />
        </View>
        {/* Thumb */}
        <View style={[styles.thumb, { 
          left: thumbLeft - THUMB_SIZE / 2,
          backgroundColor: tempColor,
          borderColor: theme.background.primary,
        }]} />
      </View>
      <View style={styles.rangeLabels}>
        <Text style={[styles.rangeText, { color: theme.text.tertiary }]}>{minTemp}°F</Text>
        <Text style={[styles.rangeText, { color: theme.text.tertiary }]}>{maxTemp}°F</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40,
    marginVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  tempValue: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tempCelsius: {
    ...typography.bodySmall,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    width: SLIDER_WIDTH,
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeText: {
    ...typography.caption,
    fontSize: 11,
  },
});
