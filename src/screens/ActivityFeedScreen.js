import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Star, 
  Bookmark, 
  MessageSquare,
  Clock,
  Coffee,
  ChevronRight,
  Heart,
  RefreshCw,
} from 'lucide-react-native';
import { typography, spacing, getPlaceholderImage } from '../constants';
import { StarRating, TeaTypeBadge, Avatar } from '../components';
import { useTheme, useAuth } from '../context';
import { useReviews, useTeas, useBrewHistory } from '../hooks';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const { width } = Dimensions.get('window');

// Activity types
const ACTIVITY_TYPES = {
  REVIEW: 'review',
  RATING: 'rating',
  COLLECTION_ADD: 'collection_add',
  BREW: 'brew',
};

// Diverse mock users for realistic activity feed
const MOCK_USERS = [
  // Common Western names
  { id: 'user-sarah-001', name: 'Sarah M.' },
  { id: 'user-mike-002', name: 'Mike T.' },
  { id: 'user-emma-003', name: 'Emma L.' },
  { id: 'user-james-004', name: 'James K.' },
  { id: 'user-lily-005', name: 'Lily Chen' },
  { id: 'user-david-006', name: 'David R.' },
  { id: 'user-amy-007', name: 'Amy W.' },
  // More diverse names
  { id: 'user-priya-008', name: 'Priya S.' },
  { id: 'user-marcus-009', name: 'Marcus J.' },
  { id: 'user-yuki-010', name: 'Yuki N.' },
  { id: 'user-olivia-011', name: 'Olivia P.' },
  { id: 'user-chen-012', name: 'Wei Chen' },
  { id: 'user-sofia-013', name: 'Sofia G.' },
  { id: 'user-alex-014', name: 'Alex K.' },
  { id: 'user-maya-015', name: 'Maya R.' },
  { id: 'user-tom-016', name: 'Tom H.' },
  { id: 'user-nina-017', name: 'Nina V.' },
  { id: 'user-raj-018', name: 'Raj P.' },
  { id: 'user-chloe-019', name: 'Chloe B.' },
  { id: 'user-kenji-020', name: 'Kenji M.' },
  { id: 'user-anna-021', name: 'Anna S.' },
  { id: 'user-lucas-022', name: 'Lucas F.' },
  { id: 'user-mei-023', name: 'Mei Lin' },
  { id: 'user-ben-024', name: 'Ben C.' },
  { id: 'user-zoe-025', name: 'Zoe A.' },
  { id: 'user-omar-026', name: 'Omar H.' },
  { id: 'user-grace-027', name: 'Grace T.' },
  { id: 'user-ian-028', name: 'Ian M.' },
  { id: 'user-hannah-029', name: 'Hannah J.' },
  { id: 'user-leo-030', name: 'Leo K.' },
];

// Get a deterministic but varied mock user based on a seed
const getMockUser = (seed) => {
  const index = Math.abs(hashCode(seed)) % MOCK_USERS.length;
  return MOCK_USERS[index];
};

// Simple hash function for consistent user assignment
const hashCode = (str) => {
  if (!str) return 0;
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

// Generate mock activities for demo
const generateMockActivities = (teas, reviews, realActivities = []) => {
  const activities = [...realActivities]; // Start with real activities
  
  // Add reviews as activities (use real user if available, otherwise mock)
  reviews.forEach((review) => {
    const tea = teas.find(t => t.id === review.tea_id);
    if (tea) {
      // Check if this review has a real user
      const isRealUser = review.user_id && review.profiles;
      const user = isRealUser 
        ? { id: review.user_id, name: review.profiles?.display_name || 'Tea Lover', isReal: true }
        : getMockUser(review.id || `review-${tea.id}`);
      
      activities.push({
        id: `review-${review.id}`,
        type: ACTIVITY_TYPES.REVIEW,
        user,
        tea,
        rating: review.rating,
        reviewText: review.review_text,
        timestamp: new Date(review.created_at),
      });
    }
  });
  
  // Generate mock collection adds with varied users
  const recentTeas = [...teas].sort(() => Math.random() - 0.5).slice(0, 8);
  recentTeas.forEach((tea, idx) => {
    activities.push({
      id: `collection-${tea.id}-${Date.now()}-${idx}`,
      type: ACTIVITY_TYPES.COLLECTION_ADD,
      user: getMockUser(`collection-${tea.id}-${idx}`),
      tea,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3), // Last 3 days
    });
  });
  
  // Generate mock brew sessions with varied users
  const brewedTeas = [...teas].sort(() => Math.random() - 0.5).slice(0, 6);
  brewedTeas.forEach((tea, idx) => {
    activities.push({
      id: `brew-${tea.id}-${Date.now()}-${idx}`,
      type: ACTIVITY_TYPES.BREW,
      user: getMockUser(`brew-${tea.id}-${idx}`),
      tea,
      steepTime: Math.floor(Math.random() * 4 + 2),
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 2), // Last 2 days
    });
  });
  
  // Sort by timestamp (newest first)
  activities.sort((a, b) => b.timestamp - a.timestamp);
  
  return activities;
};

// Format relative time
const formatRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Activity Card Component
const ActivityCard = ({ activity, theme, onTeaPress, onUserPress }) => {
  const teaColor = activity.tea?.teaType ? 
    theme.teaType[activity.tea.teaType?.toLowerCase()] || theme.teaType.black 
    : theme.teaType.black;
  
  const renderActivityContent = () => {
    switch (activity.type) {
      case ACTIVITY_TYPES.REVIEW:
        return (
          <>
            <View style={styles.activityHeader}>
              <TouchableOpacity 
                style={styles.userTouchable}
                onPress={() => onUserPress(activity.user.id, activity.user.name)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`View ${activity.user.name}'s profile`}
              >
                <Avatar userId={activity.user.id} name={activity.user.name} size={40} />
                <View style={styles.activityHeaderText}>
                  <Text style={[styles.userName, { color: theme.text.primary }]}>
                    {activity.user.name}
                  </Text>
                  <Text style={[styles.activityAction, { color: theme.text.secondary }]}>
                    reviewed a tea
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.timestamp, { color: theme.text.tertiary }]}>
                {formatRelativeTime(activity.timestamp)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.teaPreview, { backgroundColor: theme.background.secondary }]}
              onPress={() => onTeaPress(activity.tea)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`View ${activity.tea.name} by ${activity.tea.brandName}`}
            >
              <Image 
                source={activity.tea.imageUrl ? { uri: activity.tea.imageUrl } : getPlaceholderImage(activity.tea.teaType)}
                style={[styles.teaImage, { borderColor: teaColor.primary }]}
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`Photo of ${activity.tea.name}`}
              />
              <View style={styles.teaInfo}>
                <TeaTypeBadge teaType={activity.tea.teaType} size="small" />
                <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={1}>
                  {activity.tea.name}
                </Text>
                <Text style={[styles.brandName, { color: theme.text.secondary }]}>
                  {activity.tea.brandName}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.text.tertiary} accessibilityElementsHidden={true} />
            </TouchableOpacity>
            
            <View style={styles.reviewContent}>
              <StarRating rating={activity.rating} size={16} />
              {activity.reviewText && (
                <Text style={[styles.reviewText, { color: theme.text.secondary }]} numberOfLines={3}>
                  "{activity.reviewText}"
                </Text>
              )}
            </View>
          </>
        );
        
      case ACTIVITY_TYPES.COLLECTION_ADD:
        return (
          <>
            <View style={styles.activityHeader}>
              <TouchableOpacity 
                style={styles.userTouchable}
                onPress={() => onUserPress(activity.user.id, activity.user.name)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`View ${activity.user.name}'s profile`}
              >
                <Avatar userId={activity.user.id} name={activity.user.name} size={40} />
                <View style={styles.activityHeaderText}>
                  <Text style={[styles.userName, { color: theme.text.primary }]}>
                    {activity.user.name}
                  </Text>
                  <Text style={[styles.activityAction, { color: theme.text.secondary }]}>
                    added to their collection
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.timestamp, { color: theme.text.tertiary }]}>
                {formatRelativeTime(activity.timestamp)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.teaPreview, { backgroundColor: theme.background.secondary }]}
              onPress={() => onTeaPress(activity.tea)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`View ${activity.tea.name} by ${activity.tea.brandName}`}
            >
              <Image 
                source={activity.tea.imageUrl ? { uri: activity.tea.imageUrl } : getPlaceholderImage(activity.tea.teaType)}
                style={[styles.teaImage, { borderColor: teaColor.primary }]}
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`Photo of ${activity.tea.name}`}
              />
              <View style={styles.teaInfo}>
                <TeaTypeBadge teaType={activity.tea.teaType} size="small" />
                <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={1}>
                  {activity.tea.name}
                </Text>
                <Text style={[styles.brandName, { color: theme.text.secondary }]}>
                  {activity.tea.brandName}
                </Text>
              </View>
              <Bookmark size={18} color={theme.accent.primary} fill={theme.accent.primary} accessibilityElementsHidden={true} />
            </TouchableOpacity>
          </>
        );
        
      case ACTIVITY_TYPES.BREW:
        return (
          <>
            <View style={styles.activityHeader}>
              <TouchableOpacity 
                style={styles.userTouchable}
                onPress={() => onUserPress(activity.user.id, activity.user.name)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`View ${activity.user.name}'s profile`}
              >
                <Avatar userId={activity.user.id} name={activity.user.name} size={40} />
                <View style={styles.activityHeaderText}>
                  <Text style={[styles.userName, { color: theme.text.primary }]}>
                    {activity.user.name}
                  </Text>
                  <Text style={[styles.activityAction, { color: theme.text.secondary }]}>
                    brewed a cup
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.timestamp, { color: theme.text.tertiary }]}>
                {formatRelativeTime(activity.timestamp)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.teaPreview, { backgroundColor: theme.background.secondary }]}
              onPress={() => onTeaPress(activity.tea)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`View ${activity.tea.name} by ${activity.tea.brandName}, steeped for ${activity.steepTime} minutes`}
            >
              <Image 
                source={activity.tea.imageUrl ? { uri: activity.tea.imageUrl } : getPlaceholderImage(activity.tea.teaType)}
                style={[styles.teaImage, { borderColor: teaColor.primary }]}
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`Photo of ${activity.tea.name}`}
              />
              <View style={styles.teaInfo}>
                <TeaTypeBadge teaType={activity.tea.teaType} size="small" />
                <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={1}>
                  {activity.tea.name}
                </Text>
                <Text style={[styles.brandName, { color: theme.text.secondary }]}>
                  {activity.tea.brandName}
                </Text>
              </View>
              <View style={[styles.brewBadge, { backgroundColor: teaColor.primary + '20' }]} accessibilityElementsHidden={true}>
                <Coffee size={14} color={teaColor.primary} />
                <Text style={[styles.brewTime, { color: teaColor.primary }]}>
                  {activity.steepTime} min
                </Text>
              </View>
            </TouchableOpacity>
          </>
        );
        
      default:
        return null;
    }
  };
  
  const getActivityIcon = () => {
    switch (activity.type) {
      case ACTIVITY_TYPES.REVIEW:
        return <MessageSquare size={14} color={theme.text.secondary} />;
      case ACTIVITY_TYPES.COLLECTION_ADD:
        return <Bookmark size={14} color={theme.text.secondary} />;
      case ACTIVITY_TYPES.BREW:
        return <Coffee size={14} color={theme.text.secondary} />;
      default:
        return null;
    }
  };
  
  return (
    <View style={[styles.activityCard, { 
      backgroundColor: theme.background.primary,
      borderColor: theme.border.light,
    }]}>
      {renderActivityContent()}
    </View>
  );
};

const FEED_CACHE_KEY = '@resteeped_activity_feed_cache';
const FEED_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

export const ActivityFeedScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { teas } = useTeas();
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const cacheLoaded = useRef(false);
  
  // Load cached feed immediately on mount
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (data && Array.isArray(data) && data.length > 0) {
            // Restore timestamps as Date objects
            const restored = data.map(a => ({ ...a, timestamp: new Date(a.timestamp) }));
            setActivities(restored);
            // If cache is fresh enough, skip loading state
            if (Date.now() - timestamp < FEED_CACHE_MAX_AGE) {
              setLoading(false);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load feed cache:', e);
      } finally {
        cacheLoaded.current = true;
      }
    };
    loadCache();
  }, []);

  // Save feed to cache
  const saveCache = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify({
        data: data.slice(0, 20), // Cache first 20 items
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Failed to save feed cache:', e);
    }
  }, []);

  // Load activities
  const loadActivities = useCallback(async (pageNum = 1, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    }
    
    // Timeout helper to prevent Supabase queries from hanging
    const withTimeout = (promise, ms = 6000) => 
      Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), ms))]);
    
    try {
      // Fetch real activities from Supabase — all queries in parallel
      let allReviews = [];
      let realActivities = [];
      
      if (isSupabaseConfigured()) {
        const [reviewsResult, brewsResult, addsResult] = await Promise.allSettled([
          // Reviews
          withTimeout(supabase
            .from('reviews')
            .select('*, profiles:user_id(id, display_name, avatar_url, is_private)')
            .order('created_at', { ascending: false })
            .limit(20)),
          // Brew sessions
          withTimeout(supabase
            .from('brew_sessions')
            .select('*, profiles:user_id(id, display_name, avatar_url, is_private), tea:tea_id(id, name, tea_type, brand_name, image_url)')
            .order('created_at', { ascending: false })
            .limit(10)),
          // Collection adds
          withTimeout(supabase
            .from('user_teas')
            .select('*, profiles:user_id(id, display_name, avatar_url, is_private), tea:tea_id(id, name, tea_type, brand_name, image_url)')
            .order('added_at', { ascending: false })
            .limit(10)),
        ]);

        // Process reviews
        if (reviewsResult.status === 'fulfilled') {
          const { data: reviews, error: reviewsError } = reviewsResult.value;
          if (reviewsError) {
            // Fallback without profile join
            try {
              const { data: fallbackReviews } = await withTimeout(supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20));
              allReviews = fallbackReviews || [];
            } catch {}
          } else {
            allReviews = (reviews || []).filter(r => !r.profiles?.is_private);
          }
        }

        // Process brew sessions
        if (brewsResult.status === 'fulfilled') {
          const { data: recentBrews, error: brewsError } = brewsResult.value;
          if (brewsError) console.log('Brew sessions query error:', brewsError.message);
          (recentBrews || []).filter(b => !b.profiles?.is_private).forEach(brew => {
            if (brew.tea) {
              const isRealUser = brew.profiles?.display_name;
              realActivities.push({
                id: `brew-real-${brew.id}`,
                type: ACTIVITY_TYPES.BREW,
                user: isRealUser
                  ? { id: brew.user_id, name: brew.profiles.display_name, isReal: true }
                  : getMockUser(`brew-${brew.id}`),
                tea: {
                  id: brew.tea.id,
                  name: brew.tea.name,
                  teaType: brew.tea.tea_type,
                  brandName: brew.tea.brand_name,
                  imageUrl: brew.tea.image_url,
                },
                steepTime: brew.steep_time_seconds ? Math.round(brew.steep_time_seconds / 60) : null,
                timestamp: new Date(brew.created_at),
              });
            }
          });
        }

        // Process collection adds
        if (addsResult.status === 'fulfilled') {
          const { data: recentAdds, error: addsError } = addsResult.value;
          if (addsError) console.log('User teas query error:', addsError.message);
          (recentAdds || []).filter(a => !a.profiles?.is_private).forEach(add => {
            if (add.tea) {
              const isRealUser = add.profiles?.display_name;
              realActivities.push({
                id: `collection-real-${add.id}`,
                type: ACTIVITY_TYPES.COLLECTION_ADD,
                user: isRealUser
                  ? { id: add.user_id, name: add.profiles.display_name, isReal: true }
                  : getMockUser(`add-${add.id}`),
                tea: {
                  id: add.tea.id,
                  name: add.tea.name,
                  teaType: add.tea.tea_type,
                  brandName: add.tea.brand_name,
                  imageUrl: add.tea.image_url,
                },
                timestamp: new Date(add.added_at),
              });
            }
          });
        }
      }
      
      // If we have real activities, use them; otherwise generate mock data with variety
      const mockActivities = generateMockActivities(teas, allReviews, realActivities);
      
      // Simulate pagination
      const pageSize = 10;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      const pageActivities = mockActivities.slice(start, end);
      
      if (refresh || pageNum === 1) {
        setActivities(pageActivities);
        saveCache(mockActivities); // Cache full list for fast restore
      } else {
        setActivities(prev => [...prev, ...pageActivities]);
      }
      
      setHasMore(end < mockActivities.length);
      setPage(pageNum);
      
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teas]);
  
  useEffect(() => {
    if (teas.length > 0) {
      loadActivities(1);
    } else {
      // If teas haven't loaded, still clear loading state after a timeout
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [teas, loadActivities]);
  
  const handleRefresh = () => {
    loadActivities(1, true);
  };
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadActivities(page + 1);
    }
  };
  
  const handleTeaPress = (tea) => {
    navigation.navigate('TeaDetail', { tea });
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.background.secondary }]}>
        <Coffee size={40} color={theme.text.secondary} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No activity yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
        Activity from the tea community will appear here
      </Text>
    </View>
  );
  
  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.accent.primary} />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <View style={styles.headerLeft}>
          <Users size={24} color={theme.accent.primary} />
          <Text style={[styles.title, { color: theme.text.primary }]}>Community</Text>
        </View>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: theme.background.secondary }]}
          onPress={handleRefresh}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Refresh activity feed"
        >
          <RefreshCw size={18} color={theme.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {/* Feed description */}
      <View style={[styles.feedDescription, { backgroundColor: theme.background.secondary }]}>
        <Text style={[styles.feedDescriptionText, { color: theme.text.secondary }]}>
          See what other tea lovers are brewing, rating, and adding to their collections
        </Text>
      </View>
      
      {loading && activities.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent.primary} />
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
            Loading community activity...
          </Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={({ item }) => (
            <ActivityCard 
              activity={item} 
              theme={theme} 
              onTeaPress={handleTeaPress}
              onUserPress={(userId, userName) => navigation.navigate('UserProfile', { userId, userName })}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    ...typography.headingSmall,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedDescription: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.sm,
  },
  feedDescriptionText: {
    ...typography.caption,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.body,
  },
  listContent: {
    padding: spacing.screenHorizontal,
    paddingBottom: 100,
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    fontSize: 32,
    marginRight: 10,
  },
  userTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  activityHeaderText: {
    flex: 1,
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
  },
  activityAction: {
    ...typography.caption,
  },
  timestamp: {
    ...typography.caption,
  },
  teaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  teaImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 2,
  },
  teaInfo: {
    flex: 1,
    gap: 2,
  },
  teaName: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginTop: 2,
  },
  brandName: {
    ...typography.caption,
  },
  reviewContent: {
    gap: 8,
    marginTop: 4,
  },
  reviewText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  brewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  brewTime: {
    ...typography.caption,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.headingMedium,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default ActivityFeedScreen;
