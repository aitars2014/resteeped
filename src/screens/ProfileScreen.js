import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { User, Settings, LogOut, ChevronRight, Coffee } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { Button } from '../components';
import { useAuth, useCollection } from '../context';

export const ProfileScreen = ({ navigation }) => {
  const { user, profile, loading, signInWithGoogle, signOut, isConfigured } = useAuth();
  const { collection } = useCollection();
  
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
      <Text style={styles.browseNote}>
        Or keep browsing — you can still explore teas and use the brew timer without an account.
      </Text>
    </View>
  );
  
  const renderLoggedIn = () => (
    <View style={styles.profileContainer}>
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
      
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{triedCount}</Text>
          <Text style={styles.statLabel}>Teas tried</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{wantCount}</Text>
          <Text style={styles.statLabel}>Want to try</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{profile?.reviews_count || 0}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>
      
      <View style={styles.menuSection}>
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
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      {user ? renderLoggedIn() : renderLoggedOut()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Resteeped v1.0.0</Text>
        <Text style={styles.footerText}>Made with 🍵 for tea lovers</Text>
        {!isConfigured && (
          <Text style={styles.footerNote}>Backend not connected — running in demo mode</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: spacing.sectionSpacing,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  authTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  authButton: {
    minWidth: 250,
  },
  browseNote: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  profileContainer: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sectionSpacing,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    marginBottom: spacing.sectionSpacing,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  statNumber: {
    ...typography.headingLarge,
    color: colors.accent.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  menuSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    paddingVertical: spacing.sectionSpacing,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footerNote: {
    ...typography.caption,
    color: colors.accent.secondary,
    marginTop: 8,
  },
});
