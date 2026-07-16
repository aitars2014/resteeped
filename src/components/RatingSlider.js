import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { useTheme } from '../context';
import { haptics } from '../utils/haptics';
import {
  MAX_TEA_RATING,
  TEA_RATING_STEP,
  clampTeaRating,
  getTeaRatingFillColor,
  getTeaRatingGuidance,
} from '../utils/ratingScale';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const RatingSlider = ({
  value = 0,
  onValueChange,
  onInteractionStart,
  onInteractionEnd,
  size = 'medium',
}) => {
  const { theme } = useTheme();
  const [controlHeight, setControlHeight] = useState(0);
  const [controlWidth, setControlWidth] = useState(0);
  const lastValue = useRef(clampTeaRating(value));
  const controlRef = useRef(null);
  const controlTopY = useRef(0);
  const interactionActive = useRef(false);
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  const beginInteraction = useCallback(() => {
    if (interactionActive.current) return;
    interactionActive.current = true;
    onInteractionStart?.();
  }, [onInteractionStart]);

  const endInteraction = useCallback(() => {
    if (!interactionActive.current) return;
    interactionActive.current = false;
    onInteractionEnd?.();
  }, [onInteractionEnd]);

  useEffect(() => {
    lastValue.current = clampTeaRating(value);
  }, [value]);

  const cupHeight = size === 'medium' ? 164 : 128;
  const cupWidth = size === 'medium' ? 210 : 172;
  const fontSize = size === 'medium' ? 44 : 34;
  const fillPercent = clamp(value / MAX_TEA_RATING, 0, 1) * 100;
  const guidance = getTeaRatingGuidance(value);
  const teaFillColor = getTeaRatingFillColor(value);

  const positionToValue = useCallback((pageY) => {
    const height = controlHeight || cupHeight;
    const y = clamp(pageY - controlTopY.current, 0, height);
    const ratio = 1 - (y / height);
    return clampTeaRating(ratio * MAX_TEA_RATING);
  }, [controlHeight, cupHeight]);

  const updateValue = useCallback((newValue) => {
    if (newValue !== lastValue.current) {
      lastValue.current = newValue;
      haptics.selection();
      onValueChangeRef.current?.(newValue);
    }
  }, []);

  const measureAndUpdate = useCallback((pageY) => {
    controlRef.current?.measure((_x, _y, _width, _height, _pageX, measuredPageY) => {
      controlTopY.current = measuredPageY;
      updateValue(positionToValue(pageY));
    });
  }, [positionToValue, updateValue]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        beginInteraction();
        measureAndUpdate(evt.nativeEvent.pageY);
      },
      onPanResponderMove: (evt) => {
        updateValue(positionToValue(evt.nativeEvent.pageY));
      },
      onPanResponderRelease: endInteraction,
      onPanResponderTerminate: endInteraction,
    }),
  [beginInteraction, endInteraction, measureAndUpdate, positionToValue, updateValue]);

  const handleAccessibilityAction = (event) => {
    const currentValue = clampTeaRating(value);
    if (event.nativeEvent.actionName === 'increment') {
      updateValue(clampTeaRating(currentValue + TEA_RATING_STEP));
    }
    if (event.nativeEvent.actionName === 'decrement') {
      updateValue(clampTeaRating(currentValue - TEA_RATING_STEP));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color: theme.text.primary, fontSize }]}>
          {clampTeaRating(value).toFixed(1)}
        </Text>
        <View style={styles.valueMeta}>
          <Text style={[styles.outOfText, { color: theme.text.secondary }]}>/ 5</Text>
          <Text style={[styles.ratingLabel, { color: theme.accent.primary }]}>
            {guidance.label}
          </Text>
        </View>
      </View>

      <View style={styles.cupStage}>
        <View
          ref={controlRef}
          style={[
            styles.cupHitArea,
            {
              width: cupWidth,
              height: cupHeight,
            },
          ]}
          onLayout={(evt) => {
            setControlWidth(evt.nativeEvent.layout.width);
            setControlHeight(evt.nativeEvent.layout.height);
          }}
          {...panResponder.panHandlers}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Rating, ${clampTeaRating(value).toFixed(1)} out of 5, ${guidance.label}`}
          accessibilityHint="Drag up or down on the tea cup to choose a rating in tenths"
          accessibilityActions={[
            { name: 'increment', label: 'Increase rating' },
            { name: 'decrement', label: 'Decrease rating' },
          ]}
          onAccessibilityAction={handleAccessibilityAction}
        >
          <View
            style={[
              styles.cupHandle,
              {
                borderColor: theme.border.medium,
                backgroundColor: theme.background.primary,
              },
            ]}
          />
          <View
            style={[
              styles.cupBowl,
              {
                borderColor: theme.border.medium,
                backgroundColor: theme.background.secondary,
              },
            ]}
          >
            <View
              style={[
                styles.teaFill,
                {
                  height: `${fillPercent}%`,
                  backgroundColor: teaFillColor,
                },
              ]}
            >
              <View style={[styles.teaSurface, { backgroundColor: teaFillColor }]} />
            </View>
            <View style={[styles.cupHighlight, { backgroundColor: theme.background.primary }]} />
          </View>
          <View
            style={[
              styles.cupRim,
              {
                width: controlWidth ? controlWidth * 0.84 : cupWidth * 0.84,
                borderColor: theme.border.medium,
                backgroundColor: theme.background.primary,
              },
            ]}
          />
        </View>

        <View style={styles.scaleColumn} pointerEvents="none">
          <Text style={[styles.scaleText, { color: theme.text.tertiary }]}>5.0</Text>
          <View style={[styles.scaleLine, { backgroundColor: theme.border.light }]} />
          <Text style={[styles.scaleText, { color: theme.text.tertiary }]}>2.5</Text>
          <View style={[styles.scaleLine, { backgroundColor: theme.border.light }]} />
          <Text style={[styles.scaleText, { color: theme.text.tertiary }]}>0.0</Text>
        </View>
      </View>

      <View style={[styles.guidanceCard, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
        <Text style={[styles.guidanceText, { color: theme.text.secondary }]}>
          {guidance.description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  valueText: {
    fontWeight: '700',
    lineHeight: 48,
  },
  valueMeta: {
    marginLeft: 8,
  },
  outOfText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  cupStage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cupHitArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingBottom: 6,
  },
  cupBowl: {
    width: '76%',
    height: '82%',
    borderWidth: 2,
    borderTopWidth: 3,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  cupRim: {
    position: 'absolute',
    top: 0,
    height: 20,
    borderWidth: 2,
    borderRadius: 100,
  },
  cupHandle: {
    position: 'absolute',
    right: 10,
    top: '31%',
    width: '19%',
    height: '34%',
    borderWidth: 3,
    borderLeftWidth: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  teaFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 0,
  },
  teaSurface: {
    position: 'absolute',
    top: -7,
    left: -8,
    right: -8,
    height: 14,
    borderRadius: 100,
    opacity: 0.9,
  },
  cupHighlight: {
    position: 'absolute',
    top: 24,
    left: 18,
    width: 14,
    height: 58,
    borderRadius: 8,
    opacity: 0.22,
  },
  scaleColumn: {
    height: 128,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  scaleLine: {
    width: 1,
    flex: 1,
    marginVertical: 5,
  },
  scaleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guidanceCard: {
    alignSelf: 'stretch',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  guidanceText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
