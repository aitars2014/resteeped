// Expert Brewing Guides - Default brewing parameters and tips by tea type
// These can be overridden by specific tea data if available

export const BREWING_GUIDES = {
  black: {
    waterTemp: { fahrenheit: 212, celsius: 100 },
    steepTime: { min: 3, max: 5 },
    leafAmount: '1 tsp per 8oz',
    infusions: 1,
    waterType: 'Filtered water works great',
    tips: [
      'Use freshly boiled water for best extraction',
      'Don\'t overbrew - can become bitter past 5 minutes',
      'Great with milk and honey',
      'Works well for iced tea when brewed strong',
    ],
    bestTimeOfDay: 'Morning or early afternoon',
    caffeineNote: 'High caffeine - good morning pick-me-up',
  },
  green: {
    waterTemp: { fahrenheit: 175, celsius: 80 },
    steepTime: { min: 1, max: 3 },
    leafAmount: '1 tsp per 8oz',
    infusions: 3,
    waterType: 'Spring water or filtered - avoid distilled',
    tips: [
      'Never use boiling water - it will burn the leaves',
      'Let boiling water cool for 2-3 minutes',
      'Can be re-steeped 2-3 times',
      'Excellent cold brewed overnight',
      'Japanese greens prefer cooler temps (160°F)',
    ],
    bestTimeOfDay: 'Any time - lighter caffeine',
    caffeineNote: 'Moderate caffeine with calming L-theanine',
  },
  oolong: {
    waterTemp: { fahrenheit: 195, celsius: 90 },
    steepTime: { min: 2, max: 4 },
    leafAmount: '1 tsp per 6oz',
    infusions: 5,
    waterType: 'Spring water preferred',
    tips: [
      'Perfect for gongfu style brewing',
      'Each steeping reveals different flavors',
      'Lighter oolongs prefer cooler water (185°F)',
      'Darker/roasted oolongs can handle higher temps',
      'Use a gaiwan or small teapot for best results',
    ],
    bestTimeOfDay: 'Afternoon',
    caffeineNote: 'Moderate caffeine - varies by oxidation',
  },
  white: {
    waterTemp: { fahrenheit: 175, celsius: 80 },
    steepTime: { min: 2, max: 5 },
    leafAmount: '2 tsp per 8oz (leaves are fluffy)',
    infusions: 3,
    waterType: 'Best with spring water',
    tips: [
      'The most delicate tea - handle with care',
      'Lower temps preserve the subtle flavors',
      'Use more leaves than you think - they\'re light',
      'Excellent for meditation and relaxation',
      'Makes a beautiful iced tea',
    ],
    bestTimeOfDay: 'Afternoon or evening',
    caffeineNote: 'Lower caffeine - gentle energy',
  },
  puerh: {
    waterTemp: { fahrenheit: 212, celsius: 100 },
    steepTime: { min: 0.5, max: 2 },
    leafAmount: '1 tsp per 6oz',
    infusions: 10,
    waterType: 'Boiling water is fine',
    tips: [
      'Rinse the leaves first - quick wash, discard water',
      'Start with short steeps (30 seconds)',
      'Increase steep time gradually with each infusion',
      'Can be steeped 10+ times',
      'Aged pu\'erh develops complex earthy flavors',
      'Store properly - needs air circulation',
    ],
    bestTimeOfDay: 'After meals - aids digestion',
    caffeineNote: 'Moderate caffeine - smooth energy',
  },
  yellow: {
    waterTemp: { fahrenheit: 170, celsius: 77 },
    steepTime: { min: 2, max: 5 },
    leafAmount: '2 tsp per 8oz',
    infusions: 3,
    waterType: 'Filtered spring water',
    tips: [
      'Similar to green tea but more mellow',
      'The "sealed yellowing" process gives it a unique sweet flavor',
      'Lower temperature preserves delicate character',
      'Slightly warmer than green tea is fine',
      'Re-steep for evolving flavors',
      'One of the rarest tea types - savor it',
    ],
    bestTimeOfDay: 'Morning or early afternoon',
    caffeineNote: 'Moderate caffeine - gentle and smooth',
  },
  herbal: {
    waterTemp: { fahrenheit: 212, celsius: 100 },
    steepTime: { min: 5, max: 10 },
    leafAmount: '1-2 tsp per 8oz',
    infusions: 1,
    waterType: 'Any filtered water',
    tips: [
      'Caffeine-free - perfect for evening',
      'Longer steeping = stronger flavor',
      'Cover while steeping to trap essential oils',
      'Can\'t really over-steep most herbals',
      'Great hot or iced',
      'Mix with honey for added flavor',
    ],
    bestTimeOfDay: 'Anytime, especially evening',
    caffeineNote: 'Naturally caffeine-free',
  },
};

// Get brewing guide for a tea, merging defaults with tea-specific data
export const getBrewingGuide = (tea) => {
  const teaType = tea?.teaType?.toLowerCase() || 'black';
  const defaults = BREWING_GUIDES[teaType] || BREWING_GUIDES.black;
  
  // Merge tea-specific data with defaults
  return {
    ...defaults,
    waterTemp: tea?.steepTempF 
      ? { fahrenheit: tea.steepTempF, celsius: Math.round((tea.steepTempF - 32) * 5/9) }
      : defaults.waterTemp,
    steepTime: {
      min: tea?.steepTimeMin || defaults.steepTime.min,
      max: tea?.steepTimeMax || defaults.steepTime.max,
    },
    leafAmount: tea?.leafAmount || defaults.leafAmount,
    infusions: tea?.infusions || defaults.infusions,
  };
};

// Get a random tip for a tea type
export const getRandomTip = (teaType) => {
  const guide = BREWING_GUIDES[teaType?.toLowerCase()] || BREWING_GUIDES.black;
  const tips = guide.tips;
  return tips[Math.floor(Math.random() * tips.length)];
};
