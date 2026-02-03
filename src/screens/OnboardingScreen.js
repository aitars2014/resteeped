import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Coffee, 
  Search, 
  Clock, 
  Star, 
  BookmarkCheck, 
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { Button } from '../components';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    icon: Coffee,
    iconColor: '#8B4513',
    gradientColors: ['#F5E6D3', '#E8D5C4'],
    title: 'Welcome to Resteeped',
    subtitle: 'Your personal tea companion',
    description: 'Discover new teas, track what you\'ve tried, and brew the perfect cup every time.',
  },
  {
    id: '2',
    icon: Search,
    iconColor: '#2E8B57',
    gradientColors: ['#E8F5E9', '#C8E6C9'],
    title: 'Explore & Discover',
    subtitle: 'Find your next favorite',
    description: 'Browse hundreds of teas from trusted shops. Filter by type, rating, or flavor notes.',
  },
  {
    id: '3',
    icon: Clock,
    iconColor: '#4169E1',
    gradientColors: ['#E3F2FD', '#BBDEFB'],
    title: 'Perfect Every Brew',
    subtitle: 'Built-in steeping timer',
    description: 'Each tea has recommended temperatures and steep times. We\'ll notify you when it\'s ready.',
  },
  {
    id: '4',
    icon: BookmarkCheck,
    iconColor: '#9C27B0',
    gradientColors: ['#F3E5F5', '#E1BEE7'],
    title: 'Build Your Collection',
    subtitle: 'Track & rate your teas',
    description: 'Save teas to try, rate the ones you love, and add personal tasting notes.',
  },
  {
    id: '5',
    icon: Star,
    iconColor: '#FF9800',
    gradientColors: ['#FFF3E0', '#FFE0B2'],
    title: 'Ready to Steep?',
    subtitle: 'Let\'s get started',
    description: 'Dive into the world of tea. Your perfect cup is just a few taps away.',
  },
];

const ONBOARDING_COMPLETE_KEY = '@resteeped:onboarding_complete';

export const OnboardingScreen = ({ navigation, onComplete }) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (e) {
      console.log('Error saving onboarding state:', e);
    }
    
    if (onComplete) {
      onComplete();
    } else {
      navigation.replace('Main');
    }
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ 
        index: currentIndex + 1,
        animated: true 
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const renderSlide = ({ item, index }) => {
    const Icon = item.icon;
    const isFirstSlide = index === 0;
    
    return (
      <View style={styles.slide}>
        {isFirstSlide ? (
          <Image 
            source={require('../../assets/resteeped-logo.png')} 
            style={styles.welcomeLogo}
            resizeMode="contain"
          />
        ) : (
          <LinearGradient
            colors={item.gradientColors}
            style={styles.iconContainer}
          >
            <Icon size={64} color={item.iconColor} strokeWidth={1.5} />
          </LinearGradient>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text.primary }]}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: theme.accent.primary }]}>{item.subtitle}</Text>
          <Text style={[styles.description, { color: theme.text.secondary }]}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {ONBOARDING_SLIDES.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { 
                  width: dotWidth, 
                  opacity,
                  backgroundColor: theme.accent.primary,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.text.secondary }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {renderPagination()}
        
        <View style={styles.buttonContainer}>
          <Button
            title={isLastSlide ? "Get Started" : "Next"}
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// Helper to check if onboarding is complete
export const isOnboardingComplete = async () => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch (e) {
    return false;
  }
};

// Helper to reset onboarding (for testing)
export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch (e) {
    console.log('Error resetting onboarding:', e);
  }
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
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  welcomeLogo: {
    width: width * 0.7,
    height: 140,
    marginBottom: spacing.xxl,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.headingLarge,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  bottomSection: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  nextButton: {
    width: '100%',
    maxWidth: 320,
  },
});

export default OnboardingScreen;
