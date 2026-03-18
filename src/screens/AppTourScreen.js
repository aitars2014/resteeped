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
import {
  Search,
  Timer,
  MessageCircle,
  BarChart3,
  Share2,
} from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { Button } from '../components';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const { width, height } = Dimensions.get('window');

const TOUR_SLIDES = [
  {
    id: 'search',
    icon: Search,
    iconColor: '#2E8B57',
    accentColor: '#2E8B57',
    title: 'Discover Your Next Tea',
    description: 'Browse thousands of teas by type, flavor, or brand. Filter, search, and explore collections from top shops.',
    screenshot: require('../../assets/onboarding-tour/discover.png'),
  },
  {
    id: 'timer',
    icon: Timer,
    iconColor: '#E67E22',
    accentColor: '#E67E22',
    title: 'Brew Like a Pro',
    description: 'Built-in timers for Western, Gongfu, and Cold Brew styles. Track each steep and add tasting notes as you go.',
    screenshot: require('../../assets/onboarding-tour/timer.png'),
  },
  {
    id: 'teabeard',
    icon: MessageCircle,
    iconColor: '#8B4513',
    accentColor: '#8B4513',
    title: 'Meet Teabeard',
    description: 'Your personal tea sommelier. Describe a mood, flavor, or occasion — Teabeard will find the perfect tea for you.',
    screenshot: require('../../assets/onboarding-tour/teabeard.png'),
  },
  {
    id: 'insights',
    icon: BarChart3,
    iconColor: '#9C27B0',
    accentColor: '#9C27B0',
    title: 'Tea Insights',
    description: 'See your tea journey at a glance — favorite types, brewing habits, flavor profiles, and more.',
    screenshot: require('../../assets/onboarding-tour/insights.png'),
  },
  {
    id: 'sharing',
    icon: Share2,
    iconColor: '#1976D2',
    accentColor: '#1976D2',
    title: 'Share the Love',
    description: 'Share your favorite teas and tasting notes with friends. Spread the word about great tea.',
    screenshot: require('../../assets/onboarding-tour/sharing.png'),
  },
];

export const AppTourScreen = ({ onComplete }) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < TOUR_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete(false);
    }
  };

  const handleSkip = () => {
    handleComplete(true);
  };

  const handleComplete = (skipped) => {
    trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
      tour_completed: !skipped,
      slides_viewed: currentIndex + 1,
      total_slides: TOUR_SLIDES.length,
    });
    onComplete();
  };

  const renderSlide = ({ item, index }) => {
    const Icon = item.icon;

    return (
      <View style={styles.slide}>
        {/* Screenshot */}
        <View style={[styles.screenshotContainer, { borderColor: theme.border.primary }]}>
          <Image
            source={item.screenshot}
            style={styles.screenshot}
            resizeMode="cover"
          />
        </View>

        {/* Feature info */}
        <View style={styles.infoContainer}>
          <View style={[styles.iconBadge, { backgroundColor: item.accentColor + '18' }]}>
            <Icon size={22} color={item.accentColor} strokeWidth={2} />
          </View>
          <Text
            style={[styles.title, { color: theme.text.primary }]}
            accessibilityRole="header"
          >
            {item.title}
          </Text>
          <Text style={[styles.description, { color: theme.text.secondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderPagination = () => (
    <View
      style={styles.pagination}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel={`Feature ${currentIndex + 1} of ${TOUR_SLIDES.length}`}
    >
      {TOUR_SLIDES.map((_, index) => {
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
                backgroundColor: TOUR_SLIDES[currentIndex]?.accentColor || theme.accent.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === TOUR_SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Skip button row */}
      <View style={styles.skipRow}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Skip tour"
          accessibilityHint="Skip to the main app"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.skipText, { color: theme.text.secondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={TOUR_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
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
            title={isLastSlide ? 'Start Exploring' : 'Next'}
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const SCREENSHOT_HEIGHT = height * 0.48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xs,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    ...typography.body,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
  },
  screenshotContainer: {
    width: width * 0.72,
    height: SCREENSHOT_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  screenshot: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headingMedium,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
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
    marginBottom: spacing.lg,
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

export default AppTourScreen;
