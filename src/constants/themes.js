// Resteeped Design System - Themes
// Light and Dark mode color schemes

export const lightTheme = {
  background: {
    primary: '#F5F1E8',    // Warm cream
    secondary: '#FAF9F6',  // Off-white
    tertiary: '#FFFFFF',   // Pure white
  },
  text: {
    primary: '#2C3E50',    // Charcoal
    secondary: '#7F8C8D',  // Medium gray
    tertiary: '#95A5A6',   // Light gray
    inverse: '#FFFFFF',
  },
  accent: {
    primary: '#2D5016',    // Forest green
    secondary: '#7CB89D',  // Sage green
    tertiary: '#A8D5BA',   // Light sage
  },
  status: {
    error: '#C0392B',
    success: '#27AE60',
    warning: '#F39C12',
    info: '#3498DB',
  },
  rating: {
    star: '#F4A460',
    starEmpty: '#D4D4D8',
  },
  teaType: {
    black: { primary: '#8B4513', gradient: '#D2691E' },
    green: { primary: '#7CB89D', gradient: '#A8D5BA' },
    oolong: { primary: '#E8952D', gradient: '#F4A460' },
    white: { primary: '#D4D4D8', gradient: '#F0F0F5' },
    puerh: { primary: '#6B4423', gradient: '#8B6F47' },
    herbal: { primary: '#B565A7', gradient: '#D4A5C7' },
  },
  shadow: {
    card: 'rgba(0, 0, 0, 0.08)',
    searchBar: 'rgba(0, 0, 0, 0.06)',
    primaryButton: 'rgba(45, 80, 22, 0.30)',
    elevated: 'rgba(0, 0, 0, 0.12)',
  },
  border: {
    light: 'rgba(44, 62, 80, 0.12)',
    medium: 'rgba(44, 62, 80, 0.25)',
  },
};

export const darkTheme = {
  background: {
    primary: '#1A1A1A',    // Deep charcoal
    secondary: '#252525',  // Slightly lighter
    tertiary: '#2F2F2F',   // Card backgrounds
  },
  text: {
    primary: '#F5F1E8',    // Warm cream (inverted from light)
    secondary: '#A0A0A0',  // Medium gray
    tertiary: '#707070',   // Darker gray
    inverse: '#1A1A1A',
  },
  accent: {
    primary: '#7CB89D',    // Sage green (brighter for dark mode)
    secondary: '#A8D5BA',  // Light sage
    tertiary: '#2D5016',   // Forest green (muted in dark)
  },
  status: {
    error: '#E74C3C',
    success: '#2ECC71',
    warning: '#F1C40F',
    info: '#5DADE2',
  },
  rating: {
    star: '#F4A460',
    starEmpty: '#4A4A4A',
  },
  teaType: {
    black: { primary: '#D2691E', gradient: '#8B4513' },
    green: { primary: '#A8D5BA', gradient: '#7CB89D' },
    oolong: { primary: '#F4A460', gradient: '#E8952D' },
    white: { primary: '#E8E8E8', gradient: '#C8C8C8' },
    puerh: { primary: '#A08060', gradient: '#6B4423' },
    herbal: { primary: '#D4A5C7', gradient: '#B565A7' },
  },
  shadow: {
    card: 'rgba(0, 0, 0, 0.3)',
    searchBar: 'rgba(0, 0, 0, 0.2)',
    primaryButton: 'rgba(124, 184, 157, 0.30)',
    elevated: 'rgba(0, 0, 0, 0.4)',
  },
  border: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
  },
};

export const getTeaTypeColor = (teaType, theme) => {
  const type = teaType?.toLowerCase();
  return theme.teaType[type] || theme.teaType.black;
};
