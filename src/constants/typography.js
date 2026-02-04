// Resteeped Design System - Typography
// Editorial style: Serif headlines, clean sans-serif body
// Using cross-platform serif (Georgia) for editorial feel

import { Platform } from 'react-native';

// Font families
export const fonts = {
  // Editorial serif for headlines - sophisticated, magazine-like
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  // Clean sans-serif for body text
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};

export const typography = {
  // Editorial Headlines - Serif
  displayLarge: {
    fontFamily: fonts.serif,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily: fonts.serif,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  headingLarge: {
    fontFamily: fonts.serif,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  headingMedium: {
    fontFamily: fonts.serif,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.1,
  },
  headingSmall: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  
  // Body Text - Sans-serif
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  
  // UI Elements
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  
  // Buttons
  buttonLarge: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  
  // Labels & Tags
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.5,
  },
};

// Pre-built text style combinations
export const textStyles = {
  // Hero section title
  hero: {
    ...typography.displayLarge,
  },
  // Section titles
  sectionTitle: {
    ...typography.headingMedium,
  },
  // Card titles
  cardTitle: {
    ...typography.headingSmall,
  },
  // Subtle labels above content
  eyebrow: {
    ...typography.overline,
    opacity: 0.7,
  },
};
