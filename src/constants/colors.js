// Resteeped Design System - Colors
// Based on PRD v2 - Hybrid aesthetic (minimalist + sophisticated)

export const colors = {
  background: {
    primary: '#F5F1E8',    // Warm cream
    secondary: '#FAF9F6',  // Off-white
  },
  text: {
    primary: '#2C3E50',    // Charcoal
    secondary: '#7F8C8D',  // Medium gray
    inverse: '#FFFFFF',
  },
  accent: {
    primary: '#2D5016',    // Forest green
    secondary: '#7CB89D',  // Sage green
  },
  status: {
    error: '#C0392B',      // Muted red
    success: '#27AE60',    // Soft green
  },
  rating: {
    star: '#F4A460',       // Amber/gold for stars
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
    light: 'rgba(44, 62, 80, 0.15)',
    medium: 'rgba(44, 62, 80, 0.30)',
  },
};

export const getTeaTypeColor = (teaType) => {
  const type = teaType?.toLowerCase();
  return colors.teaType[type] || colors.teaType.black;
};
