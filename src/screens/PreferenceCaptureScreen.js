import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Coffee, Leaf, TreeDeciduous, Sprout, Mountain, Flower2,
  Zap, ZapOff, Sun, Moon,
  Cherry, Trees, Citrus, Nut, Flame, Candy, Sparkles,
} from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme, useAuth } from '../context';
import { Button } from '../components';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const { width } = Dimensions.get('window');

const TEA_TYPE_OPTIONS = [
  { id: 'black', label: 'Black', Icon: Coffee, color: '#8B4513' },
  { id: 'green', label: 'Green', Icon: Leaf, color: '#2E8B57' },
  { id: 'oolong', label: 'Oolong', Icon: TreeDeciduous, color: '#B8860B' },
  { id: 'white', label: 'White', Icon: Sprout, color: '#9CAF88' },
  { id: 'puerh', label: "Pu'erh", Icon: Mountain, color: '#654321' },
  { id: 'yellow', label: 'Yellow', Icon: Sun, color: '#DAA520' },
  { id: 'herbal', label: 'Herbal', Icon: Flower2, color: '#9C27B0' },
];

const CAFFEINE_OPTIONS = [
  { id: 'high', label: 'Full caffeine', sublabel: 'Black, pu\'erh, matcha', Icon: Zap, color: '#FF9800' },
  { id: 'moderate', label: 'Some caffeine', sublabel: 'Green, oolong, white', Icon: Sun, color: '#FFC107' },
  { id: 'low', label: 'Low / decaf', sublabel: 'Light & gentle', Icon: Moon, color: '#7986CB' },
  { id: 'none', label: 'Caffeine-free', sublabel: 'Herbal & rooibos', Icon: ZapOff, color: '#66BB6A' },
];

const FLAVOR_OPTIONS = [
  { id: 'floral', label: 'Floral', Icon: Flower2, color: '#E91E63' },
  { id: 'earthy', label: 'Earthy', Icon: Trees, color: '#795548' },
  { id: 'fruity', label: 'Fruity', Icon: Cherry, color: '#F44336' },
  { id: 'citrus', label: 'Citrus', Icon: Citrus, color: '#FF9800' },
  { id: 'nutty', label: 'Nutty', Icon: Nut, color: '#8D6E63' },
  { id: 'smoky', label: 'Smoky', Icon: Flame, color: '#607D8B' },
  { id: 'sweet', label: 'Sweet', Icon: Candy, color: '#FF7043' },
  { id: 'spicy', label: 'Spicy', Icon: Sparkles, color: '#D32F2F' },
];

const STEPS = [
  {
    id: 'tea_types',
    title: 'What teas do you enjoy?',
    subtitle: 'Select all that interest you',
    multiSelect: true,
    options: TEA_TYPE_OPTIONS,
  },
  {
    id: 'caffeine',
    title: 'Caffeine preference?',
    subtitle: 'We\'ll prioritize accordingly',
    multiSelect: false,
    options: CAFFEINE_OPTIONS,
  },
  {
    id: 'flavors',
    title: 'Flavors you love',
    subtitle: 'Pick your favorites',
    multiSelect: true,
    options: FLAVOR_OPTIONS,
  },
];

export const PreferenceCaptureScreen = ({ navigation, onComplete }) => {
  const { theme } = useTheme();
  const { updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    tea_types: [],
    caffeine: null,
    flavors: [],
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const toggleSelection = (optionId) => {
    setSelections(prev => {
      if (step.multiSelect) {
        const key = step.id;
        const current = prev[key];
        const updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [key]: updated };
      } else {
        return { ...prev, [step.id]: optionId };
      }
    });
  };

  const isSelected = (optionId) => {
    if (step.multiSelect) {
      return selections[step.id].includes(optionId);
    }
    return selections[step.id] === optionId;
  };

  const canProceed = () => {
    if (step.multiSelect) {
      return selections[step.id].length > 0;
    }
    return selections[step.id] !== null;
  };

  const animateTransition = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = async () => {
    if (!isLastStep) {
      animateTransition(() => setCurrentStep(prev => prev + 1));
      return;
    }

    // Save preferences
    try {
      await updateProfile({
        preferred_tea_types: selections.tea_types,
        caffeine_preference: selections.caffeine,
        preferred_flavors: selections.flavors,
        onboarding_completed_at: new Date().toISOString(),
      });

      trackEvent('onboarding_preferences_saved', {
        tea_types: selections.tea_types,
        caffeine: selections.caffeine,
        flavors: selections.flavors,
      });
    } catch (e) {
      console.error('Error saving preferences:', e);
    }

    if (onComplete) {
      onComplete();
    } else {
      navigation.replace('Main');
    }
  };

  const handleSkip = async () => {
    trackEvent('onboarding_preferences_skipped', {
      step: step.id,
    });

    try {
      await updateProfile({
        onboarding_completed_at: new Date().toISOString(),
      });
    } catch (e) {
      // Non-blocking
    }

    if (onComplete) {
      onComplete();
    } else {
      navigation.replace('Main');
    }
  };

  const renderOption = (option) => {
    const selected = isSelected(option.id);
    const Icon = option.Icon;
    const isListLayout = !step.multiSelect;

    return (
      <TouchableOpacity
        key={option.id}
        style={[
          isListLayout ? styles.optionRow : styles.optionCard,
          { 
            backgroundColor: selected ? `${option.color}18` : theme.background.secondary,
            borderColor: selected ? option.color : theme.border,
            borderWidth: selected ? 2 : 1,
          },
        ]}
        onPress={() => toggleSelection(option.id)}
        activeOpacity={0.7}
        accessibilityRole={step.multiSelect ? "checkbox" : "radio"}
        accessibilityState={{ checked: selected }}
        accessibilityLabel={option.label}
      >
        <View style={[
          isListLayout ? styles.optionIconSmall : styles.optionIcon,
          { backgroundColor: selected ? `${option.color}25` : `${option.color}12` },
        ]}>
          <Icon size={isListLayout ? 22 : 28} color={option.color} strokeWidth={1.5} />
        </View>
        <View style={isListLayout ? styles.optionTextRow : undefined}>
          <Text style={[
            styles.optionLabel,
            { color: selected ? theme.text.primary : theme.text.secondary },
            selected && { fontWeight: '600' },
            isListLayout && { textAlign: 'left' },
          ]}>
            {option.label}
          </Text>
          {option.sublabel && (
            <Text style={[styles.optionSublabel, { color: theme.text.tertiary }, isListLayout && { textAlign: 'left' }]}>
              {option.sublabel}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: theme.text.secondary }]}>Skip</Text>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {STEPS.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              {
                backgroundColor: idx <= currentStep ? theme.accent.primary : theme.border,
                flex: idx <= currentStep ? 2 : 1,
              },
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>{step.title}</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{step.subtitle}</Text>

        <View style={[
          styles.optionsGrid,
          !step.multiSelect && styles.optionsList,
        ]}>
          {step.options.map(renderOption)}
        </View>
      </Animated.View>

      {/* Bottom */}
      <View style={styles.bottomSection}>
        <Button
          title={isLastStep ? "Let's Go ☕" : "Next"}
          onPress={handleNext}
          variant="primary"
          disabled={!canProceed()}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.screenHorizontal,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    ...typography.body,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xl,
    gap: 6,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.headingLarge,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionsList: {
    flexDirection: 'column',
  },
  optionCard: {
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    width: (width - spacing.screenHorizontal * 2 - 24) / 3,
    minHeight: 100,
    justifyContent: 'center',
  },
  optionRow: {
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 14,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionIconSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextRow: {
    flex: 1,
  },
  optionLabel: {
    ...typography.caption,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionSublabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  bottomSection: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
  },
  nextButton: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
});

export default PreferenceCaptureScreen;
