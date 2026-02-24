import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Star, 
  Bookmark, 
  MessageSquare,
  Calendar,
  Coffee,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';
import { typography, spacing } from '../constants';
import { Avatar, TeaCard, StarRating } from '../components';
import { haptics } from '../utils';

// Demo data for mock users
const MOCK_USER_DATA = {
  'user-sarah-001': {
    name: 'Sarah',
    joinDate: '2025-08-15',
    bio: 'Tea enthusiast from Portland. Love exploring oolongs and pu-erh.',
    favoriteTeas: ['oolong', 'puerh'],
    stats: { teasTried: 47, reviews: 12, collections: 3 },
  },
  'user-mike-002': {
    name: 'Mike',
    joinDate: '2025-11-02',
    bio: 'Coffee convert turned tea lover. Always looking for bold flavors.',
    favoriteTeas: ['black', 'chai'],
    stats: { teasTried: 23, reviews: 8, collections: 2 },
  },
  'user-emma-003': {
    name: 'Emma',
    joinDate: '2025-06-20',
    bio: 'Wellness-focused tea drinker. Herbal infusions are my jam!',
    favoriteTeas: ['herbal', 'green'],
    stats: { teasTried: 62, reviews: 28, collections: 5 },
  },
  'user-james-004': {
    name: 'James',
    joinDate: '2025-09-10',
    bio: 'Gongfu practitioner. Building my teaware collection one piece at a time.',
    favoriteTeas: ['puerh', 'oolong'],
    stats: { teasTried: 89, reviews: 34, collections: 4 },
  },
  'user-lily-005': {
    name: 'Lily',
    joinDate: '2025-12-01',
    bio: 'New to specialty tea but loving the journey!',
    favoriteTeas: ['green', 'white'],
    stats: { teasTried: 15, reviews: 5, collections: 1 },
  },
  'user-david-006': {
    name: 'David',
    joinDate: '2025-04-15',
    bio: 'Tea sommelier in training. Ask me about Darjeeling!',
    favoriteTeas: ['black', 'oolong'],
    stats: { teasTried: 156, reviews: 67, collections: 8 },
  },
  'user-amy-007': {
    name: 'Amy',
    joinDate: '2025-07-22',
    bio: 'Matcha obsessed. Also love a good jasmine green.',
    favoriteTeas: ['green', 'white'],
    stats: { teasTried: 34, reviews: 11, collections: 2 },
  },
};

// Demo reviews for users
const generateMockReviews = (userId) => {
  const reviews = [
    { id: 1, teaName: 'Dragon Well', rating: 5, text: 'Incredible nutty flavor. One of my favorites!' },
    { id: 2, teaName: 'Earl Grey Supreme', rating: 4, text: 'Perfect bergamot balance. Great afternoon tea.' },
    { id: 3, teaName: 'Aged Pu-erh 2018', rating: 5, text: 'Deep, earthy, complex. Worth every penny.' },
  ];
  return reviews.slice(0, Math.floor(Math.random() * 3) + 1);
};

export default function UserProfileScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { userId, userName } = route.params;
  const styles = createStyles(theme);
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    trackEvent(AnalyticsEvents.PROFILE_VIEWED, { user_id: userId });
  }, [userId]);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      const data = MOCK_USER_DATA[userId] || {
        name: userName || 'Tea Lover',
        joinDate: '2025-01-01',
        bio: 'A fellow tea enthusiast.',
        favoriteTeas: ['black', 'green'],
        stats: { teasTried: 10, reviews: 3, collections: 1 },
      };
      setUserData(data);
      setReviews(generateMockReviews(userId));
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [userId, userName]);

  const handleBack = () => {
    haptics.light();
    navigation.goBack();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]} accessibilityRole="header">Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader} accessible={true} accessibilityLabel={`${userData.name}'s profile, joined ${formatDate(userData.joinDate)}`}>
          <Avatar 
            userId={userId} 
            name={userData.name} 
            size={96}
            avatarStyle="notionists"
          />
          <Text style={[styles.userName, { color: theme.text.primary }]}>
            {userData.name}
          </Text>
          <View style={styles.joinDate}>
            <Calendar size={14} color={theme.text.tertiary} accessibilityElementsHidden={true} />
            <Text style={[styles.joinDateText, { color: theme.text.tertiary }]}>
              Joined {formatDate(userData.joinDate)}
            </Text>
          </View>
          {userData.bio && (
            <Text style={[styles.bio, { color: theme.text.secondary }]}>
              {userData.bio}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View 
          style={[styles.statsContainer, { backgroundColor: theme.background.secondary }]}
          accessible={true}
          accessibilityLabel={`Statistics: ${userData.stats.teasTried} teas tried, ${userData.stats.reviews} reviews, ${userData.stats.collections} lists`}
        >
          <View style={styles.statItem}>
            <Coffee size={20} color={theme.accent.primary} accessibilityElementsHidden={true} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>
              {userData.stats.teasTried}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>Teas Tried</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} accessibilityElementsHidden={true} />
          <View style={styles.statItem}>
            <MessageSquare size={20} color={theme.accent.primary} accessibilityElementsHidden={true} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>
              {userData.stats.reviews}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>Reviews</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} accessibilityElementsHidden={true} />
          <View style={styles.statItem}>
            <Bookmark size={20} color={theme.accent.primary} accessibilityElementsHidden={true} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>
              {userData.stats.collections}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>Lists</Text>
          </View>
        </View>

        {/* Favorite Tea Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]} accessibilityRole="header">
            Favorite Types
          </Text>
          <View 
            style={styles.teaTypes}
            accessible={true}
            accessibilityLabel={`Favorite tea types: ${userData.favoriteTeas.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}`}
          >
            {userData.favoriteTeas.map((type, idx) => (
              <View 
                key={idx}
                style={[styles.teaTypeBadge, { backgroundColor: theme.accent.primary + '20' }]}
              >
                <Text style={[styles.teaTypeText, { color: theme.accent.primary }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]} accessibilityRole="header">
              Recent Reviews
            </Text>
            {reviews.map((review) => (
              <View 
                key={review.id}
                style={[styles.reviewCard, { backgroundColor: theme.background.secondary }]}
                accessible={true}
                accessibilityLabel={`Review for ${review.teaName}, ${review.rating} stars: ${review.text}`}
              >
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewTeaName, { color: theme.text.primary }]}>
                    {review.teaName}
                  </Text>
                  <StarRating rating={review.rating} size={14} showNumber={false} />
                </View>
                <Text style={[styles.reviewText, { color: theme.text.secondary }]}>
                  "{review.text}"
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headingSmall,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  userName: {
    ...typography.displayMedium,
    marginTop: spacing.md,
  },
  joinDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  joinDateText: {
    fontSize: 13,
  },
  bio: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statDivider: {
    width: 1,
    marginHorizontal: spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.headingSmall,
    marginBottom: spacing.md,
  },
  teaTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  teaTypeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  teaTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewCard: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewTeaName: {
    fontSize: 15,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
