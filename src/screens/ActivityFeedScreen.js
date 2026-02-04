import React, { useState, useCallback, useEffect } from 'react';
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

// Generate mock activities for demo
const generateMockActivities = (teas, reviews) => {
  const activities = [];
  const mockUsers = [
    { id: 'user-sarah-001', name: 'Sarah' },
    { id: 'user-mike-002', name: 'Mike' },
    { id: 'user-emma-003', name: 'Emma' },
    { id: 'user-james-004', name: 'James' },
    { id: 'user-lily-005', name: 'Lily' },
    { id: 'user-david-006', name: 'David' },
    { id: 'user-amy-007', name: 'Amy' },
  ];
  
  // Add reviews as activities
  reviews.forEach((review, idx) => {
    const tea = teas.find(t => t.id === review.tea_id);
    if (tea) {
      activities.push({
        id: `review-${review.id}`,
        type: ACTIVITY_TYPES.REVIEW,
        user: mockUsers[idx % mockUsers.length],
        tea,
        rating: review.rating,
        reviewText: review.review_text,
        timestamp: new Date(review.created_at),
      });
    }
  });
  
  // Generate some mock collection adds
  const recentTeas = [...teas].sort(() => Math.random() - 0.5).slice(0, 5);
  recentTeas.forEach((tea, idx) => {
    activities.push({
      id: `collection-${tea.id}-${idx}`,
      type: ACTIVITY_TYPES.COLLECTION_ADD,
      user: mockUsers[(idx + 3) % mockUsers.length],
      tea,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3), // Last 3 days
    });
  });
  
  // Generate some mock brew sessions
  const brewedTeas = [...teas].sort(() => Math.random() - 0.5).slice(0, 4);
  brewedTeas.forEach((tea, idx) => {
    activities.push({
      id: `brew-${tea.id}-${idx}`,
      type: ACTIVITY_TYPES.BREW,
      user: mockUsers[(idx + 5) % mockUsers.length],
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
            >
              <Image 
                source={activity.tea.imageUrl ? { uri: activity.tea.imageUrl } : getPlaceholderImage(activity.tea.teaType)}
                style={[styles.teaImage, { borderColor: teaColor.primary }]}
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
              <ChevronRight size={18} color={theme.text.tertiary} />
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
            >
              <Image 
                source={activity.tea.imageUrl ? { uri: activity.tea.imageUrl } : getPlaceholderImage(activity.tea.teaType)}
                style={[styles.teaImage, { borderColor: teaColor.primary }]}
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
              <Bookmark size={18} color={theme.accent.primary} fill={theme.accent.primary} />
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
            >
              <Image 
                source={activity.tea.imageUrl ? { uri: activity.tea.imageUrl } : getPlaceholderImage(activity.tea.teaType)}
                style={[styles.teaImage, { borderColor: teaColor.primary }]}
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
              <View style={[styles.brewBadge, { backgroundColor: teaColor.primary + '20' }]}>
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

export const ActivityFeedScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { teas } = useTeas();
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Load activities
  const loadActivities = useCallback(async (pageNum = 1, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    }
    
    try {
      // In a real app, this would fetch from Supabase
      // For now, generate mock activities based on teas and reviews
      let allReviews = [];
      
      if (isSupabaseConfigured()) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        allReviews = reviews || [];
      }
      
      const mockActivities = generateMockActivities(teas, allReviews);
      
      // Simulate pagination
      const pageSize = 10;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      const pageActivities = mockActivities.slice(start, end);
      
      if (refresh || pageNum === 1) {
        setActivities(pageActivities);
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
      <Text style={styles.emptyEmoji}>🍵</Text>
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
  emptyEmoji: {
    fontSize: 48,
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
