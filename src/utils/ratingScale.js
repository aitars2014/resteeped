export const MIN_TEA_RATING = 0;
export const MAX_TEA_RATING = 5;
export const TEA_RATING_STEP = 0.1;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const clampTeaRating = (value) => {
  const rounded = Math.round(value / TEA_RATING_STEP) * TEA_RATING_STEP;
  return Number(clamp(rounded, MIN_TEA_RATING, MAX_TEA_RATING).toFixed(1));
};

export const getTeaRatingGuidance = (rating) => {
  if (rating <= 0) {
    return {
      label: 'Not rated',
      description: 'Drag through the cup to rate this tea.',
    };
  }
  if (rating < 1.5) {
    return {
      label: 'Not for me',
      description: 'Actively disliked, would not drink again.',
    };
  }
  if (rating < 2.5) {
    return {
      label: 'Disappointing',
      description: 'Drinkable, but flawed or not worth revisiting.',
    };
  }
  if (rating < 3.3) {
    return {
      label: 'Fine',
      description: 'An okay cup, but no strong pull to return.',
    };
  }
  if (rating < 3.8) {
    return {
      label: 'Good',
      description: 'Enjoyable and worth drinking again.',
    };
  }
  if (rating < 4.3) {
    return {
      label: 'Great',
      description: 'Would recommend and keep in rotation.',
    };
  }
  if (rating < 4.8) {
    return {
      label: 'Excellent',
      description: 'Memorable, polished, and among the better teas of its type.',
    };
  }
  return {
    label: 'Exceptional',
    description: 'A personal favorite and benchmark-level cup.',
  };
};

export const getTeaRatingFillColor = (rating) => {
  if (rating <= 0) return '#E7D7B8';
  if (rating < 1.5) return '#D9BE7C';
  if (rating < 2.5) return '#CD9850';
  if (rating < 3.8) return '#B76F36';
  if (rating < 4.5) return '#93572B';
  return '#6F3F1F';
};
