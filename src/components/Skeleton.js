import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context';
import { spacing } from '../constants';

const { width } = Dimensions.get('window');

/**
 * Animated skeleton loading component
 * Shows shimmer effect while content loads
 */
export const Skeleton = ({ 
  width: skeletonWidth = '100%', 
  height = 20, 
  borderRadius = 4,
  style,
}) => {
  const { theme, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);
  
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });
  
  const baseColor = isDark ? '#2A2A2A' : '#E8E8E8';
  const shimmerColor = isDark ? '#3A3A3A' : '#F5F5F5';
  
  return (
    <View 
      style={[
        styles.skeleton, 
        { 
          width: skeletonWidth, 
          height, 
          borderRadius,
          backgroundColor: baseColor,
        },
        style
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] }
        ]}
      >
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Skeleton placeholder for TeaCard
 */
export const TeaCardSkeleton = ({ compact = false }) => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={[
      styles.cardSkeleton,
      compact && styles.cardSkeletonCompact,
      { 
        backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
        borderColor: theme.border.light,
      }
    ]}>
      <Skeleton 
        height={compact ? 120 : 160} 
        borderRadius={0} 
      />
      <View style={styles.cardContent}>
        <Skeleton width={60} height={10} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={18} style={{ marginBottom: 6 }} />
        <Skeleton width="60%" height={14} style={{ marginBottom: 10 }} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
};

/**
 * Skeleton for horizontal tea list
 */
export const TeaListSkeleton = ({ count = 3 }) => {
  return (
    <View style={styles.listSkeleton}>
      {Array.from({ length: count }).map((_, i) => (
        <TeaCardSkeleton key={i} compact />
      ))}
    </View>
  );
};

/**
 * Skeleton for tea detail screen
 */
export const TeaDetailSkeleton = () => {
  const { isDark } = useTheme();
  
  return (
    <View style={[styles.detailSkeleton, { backgroundColor: isDark ? '#121212' : '#FAF8F5' }]}>
      {/* Hero image */}
      <Skeleton height={280} borderRadius={0} />
      
      {/* Content */}
      <View style={styles.detailContent}>
        <Skeleton width={80} height={12} style={{ marginBottom: 12 }} />
        <Skeleton width="85%" height={28} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} style={{ marginBottom: 16 }} />
        <Skeleton width={120} height={20} style={{ marginBottom: 24 }} />
        
        {/* Description */}
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={14} style={{ marginBottom: 24 }} />
        
        {/* Stats */}
        <View style={styles.detailStats}>
          <Skeleton width={100} height={60} borderRadius={12} />
          <Skeleton width={100} height={60} borderRadius={12} />
          <Skeleton width={100} height={60} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton for section header + list
 */
export const SectionSkeleton = () => {
  return (
    <View style={styles.sectionSkeleton}>
      <View style={styles.sectionHeader}>
        <Skeleton width={140} height={20} />
        <Skeleton width={60} height={14} />
      </View>
      <TeaListSkeleton count={3} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  cardSkeleton: {
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardSkeletonCompact: {
    width: width * 0.44,
  },
  cardContent: {
    padding: spacing.cardPadding,
  },
  listSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.cardGap,
  },
  detailSkeleton: {
    flex: 1,
  },
  detailContent: {
    padding: spacing.screenHorizontal,
    paddingTop: 20,
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionSkeleton: {
    marginBottom: spacing.sectionSpacing,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
});

export default Skeleton;
