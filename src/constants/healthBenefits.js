// Health Benefits Data - Derived from tea type
// Note: These are general wellness properties commonly associated with tea types
// Not medical advice!

export const HEALTH_BENEFITS = {
  black: {
    caffeineLevel: 'high', // 40-70mg per cup
    caffeineRange: '40-70mg',
    antioxidants: 'high',
    antioxidantTypes: ['Theaflavins', 'Thearubigins'],
    benefits: [
      { icon: '❤️', title: 'Heart Health', description: 'May support cardiovascular function' },
      { icon: '🧠', title: 'Mental Alertness', description: 'Caffeine provides natural energy boost' },
      { icon: '🦠', title: 'Gut Health', description: 'Polyphenols may support healthy gut bacteria' },
      { icon: '💪', title: 'Energy', description: 'Natural caffeine for sustained energy' },
    ],
    compounds: [
      { name: 'Caffeine', amount: 'High' },
      { name: 'L-Theanine', amount: 'Moderate' },
      { name: 'Polyphenols', amount: 'High' },
    ],
  },
  green: {
    caffeineLevel: 'moderate',
    caffeineRange: '25-50mg',
    antioxidants: 'very-high',
    antioxidantTypes: ['EGCG', 'Catechins'],
    benefits: [
      { icon: '🧬', title: 'Antioxidant Rich', description: 'High in EGCG, a powerful antioxidant' },
      { icon: '🧠', title: 'Brain Function', description: 'L-theanine + caffeine for calm focus' },
      { icon: '🔥', title: 'Metabolism', description: 'May support healthy metabolism' },
      { icon: '😌', title: 'Relaxation', description: 'L-theanine promotes calm alertness' },
    ],
    compounds: [
      { name: 'EGCG', amount: 'Very High' },
      { name: 'L-Theanine', amount: 'High' },
      { name: 'Caffeine', amount: 'Moderate' },
      { name: 'Catechins', amount: 'Very High' },
    ],
  },
  oolong: {
    caffeineLevel: 'moderate',
    caffeineRange: '30-50mg',
    antioxidants: 'high',
    antioxidantTypes: ['Theaflavins', 'Catechins', 'EGCG'],
    benefits: [
      { icon: '⚖️', title: 'Weight Management', description: 'May support healthy weight goals' },
      { icon: '🧠', title: 'Mental Clarity', description: 'Balanced caffeine and L-theanine' },
      { icon: '🦷', title: 'Dental Health', description: 'Fluoride content supports teeth' },
      { icon: '💆', title: 'Stress Relief', description: 'Calming properties from L-theanine' },
    ],
    compounds: [
      { name: 'Caffeine', amount: 'Moderate' },
      { name: 'L-Theanine', amount: 'Moderate-High' },
      { name: 'Polyphenols', amount: 'High' },
    ],
  },
  white: {
    caffeineLevel: 'low',
    caffeineRange: '15-30mg',
    antioxidants: 'very-high',
    antioxidantTypes: ['Catechins', 'EGCG', 'Polyphenols'],
    benefits: [
      { icon: '✨', title: 'Skin Health', description: 'Antioxidants may support skin health' },
      { icon: '🧬', title: 'Antioxidant Rich', description: 'Highest antioxidant content of all teas' },
      { icon: '😴', title: 'Gentle Energy', description: 'Low caffeine for gentle alertness' },
      { icon: '🛡️', title: 'Immune Support', description: 'Catechins may support immunity' },
    ],
    compounds: [
      { name: 'Catechins', amount: 'Very High' },
      { name: 'EGCG', amount: 'High' },
      { name: 'Caffeine', amount: 'Low' },
      { name: 'Amino Acids', amount: 'High' },
    ],
  },
  puerh: {
    caffeineLevel: 'moderate',
    caffeineRange: '30-70mg',
    antioxidants: 'high',
    antioxidantTypes: ['Statins', 'Lovastatin', 'Polyphenols'],
    benefits: [
      { icon: '🍽️', title: 'Digestion', description: 'Traditionally used to aid digestion' },
      { icon: '❤️', title: 'Cholesterol', description: 'May support healthy cholesterol levels' },
      { icon: '🧹', title: 'Cleansing', description: 'Often used in cleansing routines' },
      { icon: '🦠', title: 'Gut Microbiome', description: 'Fermentation creates beneficial bacteria' },
    ],
    compounds: [
      { name: 'Statins', amount: 'Moderate (aged)' },
      { name: 'Caffeine', amount: 'Moderate' },
      { name: 'Probiotics', amount: 'Present (aged)' },
      { name: 'Polyphenols', amount: 'High' },
    ],
  },
  herbal: {
    caffeineLevel: 'none',
    caffeineRange: '0mg',
    antioxidants: 'varies',
    antioxidantTypes: ['Varies by herb'],
    benefits: [
      { icon: '😴', title: 'Sleep Support', description: 'Chamomile & lavender promote relaxation' },
      { icon: '🌿', title: 'Caffeine-Free', description: 'Enjoy any time without sleep impact' },
      { icon: '💆', title: 'Stress Relief', description: 'Many herbs have calming properties' },
      { icon: '🌡️', title: 'Soothing', description: 'Peppermint & ginger soothe the stomach' },
    ],
    compounds: [
      { name: 'Caffeine', amount: 'None' },
      { name: 'Varies', amount: 'Depends on blend' },
    ],
    note: 'Benefits vary widely based on specific herbs used',
  },
};

// Get health benefits for a tea
export const getHealthBenefits = (tea) => {
  const teaType = tea?.teaType?.toLowerCase() || 'black';
  return HEALTH_BENEFITS[teaType] || HEALTH_BENEFITS.black;
};

// Get caffeine level description
export const getCaffeineDescription = (level) => {
  const descriptions = {
    none: 'Caffeine Free',
    low: 'Low Caffeine',
    moderate: 'Moderate Caffeine',
    high: 'High Caffeine',
  };
  return descriptions[level] || descriptions.moderate;
};

// Get antioxidant level color
export const getAntioxidantColor = (level, theme) => {
  const colors = {
    'very-high': theme.status.success,
    high: theme.accent.primary,
    moderate: theme.accent.secondary,
    low: theme.text.secondary,
    varies: theme.text.tertiary,
  };
  return colors[level] || colors.moderate;
};
