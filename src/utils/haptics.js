/**
 * Haptic Feedback Utilities
 * Provides consistent haptic feedback throughout the app
 * 
 * Usage:
 *   import { haptics } from '../utils/haptics';
 *   haptics.light();    // Light tap
 *   haptics.medium();   // Medium tap
 *   haptics.success();  // Success feedback
 *   haptics.warning();  // Warning feedback
 *   haptics.error();    // Error feedback
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Only run haptics on iOS/Android
const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light impact - subtle feedback
 * Use for: Button taps, selection changes, toggles
 */
export const light = () => {
  if (!isHapticsSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Medium impact - noticeable feedback
 * Use for: Card taps, navigation, adding to collection
 */
export const medium = () => {
  if (!isHapticsSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Heavy impact - strong feedback
 * Use for: Important actions, confirmation dialogs, timer complete
 */
export const heavy = () => {
  if (!isHapticsSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Selection feedback - very light
 * Use for: Scrolling through picker, selecting options
 */
export const selection = () => {
  if (!isHapticsSupported) return;
  Haptics.selectionAsync();
};

/**
 * Success notification
 * Use for: Task complete, save successful, timer finished
 */
export const success = () => {
  if (!isHapticsSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Warning notification
 * Use for: Approaching limit, low inventory
 */
export const warning = () => {
  if (!isHapticsSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Error notification
 * Use for: Action failed, validation error
 */
export const error = () => {
  if (!isHapticsSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Soft impact (iOS only, falls back to light on Android)
 * Use for: Soft interactions, subtle acknowledgments
 */
export const soft = () => {
  if (!isHapticsSupported) return;
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  } else {
    light();
  }
};

/**
 * Rigid impact (iOS only, falls back to medium on Android)
 * Use for: Rigid/crisp interactions
 */
export const rigid = () => {
  if (!isHapticsSupported) return;
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  } else {
    medium();
  }
};

// Export as object for convenient import
export const haptics = {
  light,
  medium,
  heavy,
  selection,
  success,
  warning,
  error,
  soft,
  rigid,
};

export default haptics;
