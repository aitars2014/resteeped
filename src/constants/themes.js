// Resteeped Design System - Themes
// Light and Dark mode color schemes
// Editorial aesthetic: warm, sophisticated, magazine-inspired

export const lightTheme = {
  background: {
    primary: '#FAF8F5',    // Warm off-white (paper-like)
    secondary: '#FFFFFF',  // Pure white
    tertiary: '#F5F1E8',   // Warm cream
    elevated: '#FFFFFF',   // Elevated surfaces
  },
  text: {
    primary: '#1A1A1A',    // Near black (better readability)
    secondary: '#666666',  // Medium gray
    tertiary: '#999999',   // Light gray
    inverse: '#FFFFFF',
    muted: '#B3B3B3',      // Very subtle text
  },
  accent: {
    primary: '#2D5016',    // Forest green
    secondary: '#7CB89D',  // Sage green
    tertiary: '#A8D5BA',   // Light sage
    warm: '#C4956A',       // Warm amber/tea color
    warmLight: '#E8D4BC',  // Light amber
  },
  // Editorial highlight colors
  editorial: {
    highlight: '#FFF8E7',  // Warm highlight background
    pullQuote: '#2D5016',  // Pull quote accent
    divider: '#E8E4DC',    // Subtle divider
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
    strong: 'rgba(44, 62, 80, 0.35)',
  },
  // Tab bar specific
  tabBar: {
    background: '#FAF9F6',
    border: 'rgba(44, 62, 80, 0.12)',
    active: '#2D5016',
    inactive: '#7F8C8D',
  },
};

export const darkTheme = {
  background: {
    primary: '#0D0D0D',    // Deep black (OLED friendly)
    secondary: '#1A1A1A',  // Elevated surfaces
    tertiary: '#252525',   // Card backgrounds
    elevated: '#2A2A2A',   // Highest elevation
  },
  text: {
    primary: '#FAFAFA',    // Slightly warm white
    secondary: '#A0A0A0',  // Medium gray
    tertiary: '#707070',   // Subtle gray
    inverse: '#0D0D0D',
    muted: '#505050',      // Very subtle text
  },
  accent: {
    primary: '#A8D5BA',    // Softer sage green for dark mode
    secondary: '#7CB89D',  // Sage
    tertiary: '#5A9A7A',   // Muted green
    warm: '#D4A574',       // Warm amber/tea (brighter for dark)
    warmLight: '#8B7355',  // Muted warm
  },
  // Editorial highlight colors
  editorial: {
    highlight: '#1F1A14',  // Warm dark highlight
    pullQuote: '#A8D5BA',  // Pull quote accent
    divider: '#2A2520',    // Warm subtle divider
  },
  status: {
    error: '#FF6B6B',
    success: '#51CF66',
    warning: '#FFD43B',
    info: '#74C0FC',
  },
  rating: {
    star: '#FFB347',       // Brighter orange
    starEmpty: '#4A4A4A',
  },
  teaType: {
    black: { primary: '#E8A060', gradient: '#C07830' },
    green: { primary: '#A8D5BA', gradient: '#7CB89D' },
    oolong: { primary: '#FFB860', gradient: '#E89030' },
    white: { primary: '#E8E8E8', gradient: '#C8C8C8' },
    puerh: { primary: '#C0A080', gradient: '#8B6F47' },
    herbal: { primary: '#E0B0D8', gradient: '#C080B0' },
  },
  shadow: {
    card: 'rgba(0, 0, 0, 0.4)',
    searchBar: 'rgba(0, 0, 0, 0.3)',
    primaryButton: 'rgba(143, 212, 176, 0.25)',
    elevated: 'rgba(0, 0, 0, 0.5)',
  },
  border: {
    light: 'rgba(255, 255, 255, 0.15)',
    medium: 'rgba(255, 255, 255, 0.25)',
    strong: 'rgba(255, 255, 255, 0.35)',
  },
  // Tab bar specific
  tabBar: {
    background: '#1E1E1E',
    border: 'rgba(255, 255, 255, 0.15)',
    active: '#8FD4B0',
    inactive: '#808080',
  },
};

export const getTeaTypeColor = (teaType, theme) => {
  const type = teaType?.toLowerCase();
  return theme.teaType[type] || theme.teaType.black;
};
