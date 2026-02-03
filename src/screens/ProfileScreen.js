import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { User, Settings, LogOut, ChevronRight, Coffee, Star, Bookmark, Clock } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { Button } from '../components';
import { useAuth, useCollection } from '../context';
import { useBrewHistory } from '../hooks';

export const ProfileScreen = ({ navigation }) => {
  const { user, profile, loading, signInWithGoogle, signOut, isConfigured } = useAuth();
  const { collection } = useCollection();
  const { brewSessions, todayBrewCount, weekBrewCount } = useBrewHistory();
  
  const handleSignIn = async () => {
    if (!isConfigured) {
      Alert.alert(
        'Coming Soon',
        'Sign in will be available once the backend is connected. For now, enjoy browsing and using the timer!',
      );
      return;
    }
    
    const { error } = await signInWithGoogle();
    if (error) {
      Alert.alert('Sign In Error', error.message);
    }
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
            }
          }
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  const triedCount = collection.filter(item => item.status === 'tried').length;
  const wantCount = collection.filter(item => item.status === 'want_to_try').length;
  
  const renderLoggedOut = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.authContainer}>
        <View style={styles.avatarPlaceholder}>
          <Coffee size={48} color={colors.accent.primary} />
        </View>
        <Text style={styles.authTitle}>Welcome to Resteeped</Text>
        <Text style={styles.authSubtitle}>
          Sign in to save your tea collection, track what you've tried, and sync across devices.
        </Text>
        <Button 
          title="Sign in with Google"
          onPress={handleSignIn}
          variant="primary"
          style={styles.authButton}
        />
      </View>
      
      {/* Show brew stats even when logged out */}
      {brewSessions.length > 0 && (
        <TouchableOpacity 
          style={styles.statsSection}
          onPress={() => navigation.navigate('BrewHistory')}
          activeOpacity={0.7}
        >
          <View style={styles.statsSectionHeader}>
            <Text style={styles.statsSectionTitle}>Your Brew Activity</Text>
            <View style={styles.viewHistoryLink}>
              <Text style={styles.viewHistoryText}>View History</Text>
              <ChevronRight size={16} color={colors.accent.primary} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Coffee size={24} color={colors.accent.primary} />
              <Text style={styles.statNumber}>{todayBrewCount}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Clock size={24} color={colors.accent.primary} />
              <Text style={styles.statNumber}>{weekBrewCount}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Star size={24} color={colors.accent.primary} />
              <Text style={styles.statNumber}>{brewSessions.length}</Text>
              <Text style={styles.statLabel}>All Time</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      
      <Text style={styles.browseNote}>
        Keep browsing — you can explore teas and use the brew timer without an account.
      </Text>
    </ScrollView>
  );
  
  const renderLoggedIn = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={32} color={colors.text.inverse} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.username}>
            {profile?.display_name || profile?.username || 'Tea Lover'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>
      
      {/* Collection Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>My Collection</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Star size={24} color={colors.accent.primary} />
            <Text style={styles.statNumber}>{triedCount}</Text>
            <Text style={styles.statLabel}>Tried</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Bookmark size={24} color={colors.accent.primary} />
            <Text style={styles.statNumber}>{wantCount}</Text>
            <Text style={styles.statLabel}>Want to Try</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profile?.reviews_count || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
      </View>
      
      {/* Brew Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>Brew Activity</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Coffee size={24} color={colors.accent.primary} />
            <Text style={styles.statNumber}>{todayBrewCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{weekBrewCount}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{brewSessions.length}</Text>
            <Text style={styles.statLabel}>All Time</Text>
          </View>
        </View>
      </View>
      
      {/* Menu */}
      <View style={styles.menuSection}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('BrewHistory')}
        >
          <Coffee size={20} color={colors.accent.primary} />
          <Text style={styles.menuItemText}>Brew History</Text>
          <ChevronRight size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Settings size={20} color={colors.text.secondary} />
          <Text style={styles.menuItemText}>Settings</Text>
          <ChevronRight size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={handleSignOut}
        >
          <LogOut size={20} color={colors.status.error} />
          <Text style={[styles.menuItemText, styles.logoutText]}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      {user ? renderLoggedIn() : renderLoggedOut()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Resteeped v1.0.0</Text>
        <Text style={styles.footerSubtext}>Made with 🍵 for tea lovers</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.headerPaddingTop,
    paddingBottom: spacing.headerPaddingBottom,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },
  authContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  authTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  authSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  authButton: {
    minWidth: 250,
  },
  browseNote: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  email: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  statsSection: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sectionSpacing,
  },
  statsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsSectionTitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewHistoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewHistoryText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginVertical: 4,
  },
  statNumber: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  menuSection: {
    marginHorizontal: spacing.screenHorizontal,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    marginBottom: spacing.sectionSpacing,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.listItemPadding,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  logoutText: {
    color: colors.status.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  footerSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
