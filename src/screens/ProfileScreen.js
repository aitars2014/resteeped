import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { User, LogOut, ChevronRight, Coffee, Star, Bookmark, Clock, Moon, Sun, Download, GitCompare, RotateCcw, MessageSquare, Calendar, Award, Package, Mail, Edit2, Crown } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { typography, spacing } from '../constants';
import { Button, Avatar, AvatarPicker, EditDisplayNameModal } from '../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useCollection, useTheme, useSubscription } from '../context';
import { useBrewHistory } from '../hooks';
import { exportCollectionToJSON, exportCollectionToCSV } from '../utils/exportCollection';
import { resetOnboarding } from './OnboardingScreen';

export const ProfileScreen = ({ navigation }) => {
  const { user, profile, loading, signInWithGoogle, signInWithApple, signOut, updateProfile, isConfigured, appleAuthAvailable } = useAuth();
  const { collection } = useCollection();
  const { brewSessions, todayBrewCount, weekBrewCount } = useBrewHistory();
  const { theme, isDark, themePreference, setThemePreference } = useTheme();
  const { isPremium } = useSubscription();
  
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState('notionists');
  const [avatarSeed, setAvatarSeed] = useState(null);
  const [editNameVisible, setEditNameVisible] = useState(false);

  useEffect(() => {
    // Load saved avatar style and seed
    Promise.all([
      AsyncStorage.getItem('@resteeped:avatar_style'),
      AsyncStorage.getItem('@resteeped:avatar_seed'),
    ]).then(([style, seed]) => {
      if (style) setAvatarStyle(style);
      if (seed) setAvatarSeed(seed);
    });
  }, []);

  const handleAvatarChange = async (style, seed) => {
    setAvatarStyle(style);
    setAvatarSeed(seed);
    await AsyncStorage.setItem('@resteeped:avatar_style', style);
    if (seed) {
      await AsyncStorage.setItem('@resteeped:avatar_seed', seed);
    } else {
      await AsyncStorage.removeItem('@resteeped:avatar_seed');
    }
  };

  const handleDisplayNameChange = async (newName) => {
    const { error } = await updateProfile({ display_name: newName });
    if (error) {
      Alert.alert('Error', 'Failed to update display name. Please try again.');
    }
  };
  
  const handleSignInWithGoogle = async () => {
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

  const handleSignInWithApple = async () => {
    if (!isConfigured) {
      Alert.alert(
        'Coming Soon',
        'Sign in will be available once the backend is connected. For now, enjoy browsing and using the timer!',
      );
      return;
    }
    
    const { error } = await signInWithApple();
    if (error) {
      Alert.alert('Sign In Error', error.message);
    }
  };
  
  const [signingOut, setSigningOut] = useState(false);
  
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: performSignOut,
        },
      ]
    );
  };

  const performSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };
  
  const handleExport = () => {
    Alert.alert(
      'Export Collection',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'JSON',
          onPress: async () => {
            const result = await exportCollectionToJSON(collection, profile);
            if (!result.success) {
              Alert.alert('Export Failed', result.error);
            }
          }
        },
        { 
          text: 'CSV',
          onPress: async () => {
            const result = await exportCollectionToCSV(collection);
            if (!result.success) {
              Alert.alert('Export Failed', result.error);
            }
          }
        },
      ]
    );
  };
  
  const toggleDarkMode = () => {
    if (themePreference === 'dark') {
      setThemePreference('light');
    } else if (themePreference === 'light') {
      setThemePreference('dark');
    } else {
      setThemePreference('dark');
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  const triedCount = collection.filter(item => item.status === 'tried').length;
  const wantCount = collection.filter(item => item.status === 'want_to_try').length;
  
  const renderLoggedOut = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.authContainer}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.background.secondary }]}>
          <Coffee size={48} color={theme.accent.primary} />
        </View>
        <Text style={[styles.authTitle, { color: theme.text.primary }]}>Welcome to Resteeped</Text>
        <Text style={[styles.authSubtitle, { color: theme.text.secondary }]}>
          Sign in to save your tea collection, track what you've tried, and sync across devices.
        </Text>
        
        {/* Sign in with Apple - Required by App Store when offering third-party login */}
        {Platform.OS === 'ios' && appleAuthAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleSignInWithApple}
          />
        )}
        
        <Button 
          title="Sign in with Google"
          onPress={handleSignInWithGoogle}
          variant="secondary"
          style={styles.authButton}
        />
      </View>
      
      {brewSessions.length > 0 && (
        <TouchableOpacity 
          style={styles.statsSection}
          onPress={() => navigation.navigate('BrewHistory')}
          activeOpacity={0.7}
        >
          <View style={styles.statsSectionHeader}>
            <Text style={[styles.statsSectionTitle, { color: theme.text.secondary }]}>Your Brew Activity</Text>
            <View style={styles.viewHistoryLink}>
              <Text style={[styles.viewHistoryText, { color: theme.accent.primary }]}>View History</Text>
              <ChevronRight size={16} color={theme.accent.primary} />
            </View>
          </View>
          <View style={[styles.statsRow, { 
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.medium,
          }]}>
            <View style={styles.stat}>
              <Coffee size={24} color={theme.accent.primary} />
              <Text style={[styles.statNumber, { color: theme.text.primary }]}>{todayBrewCount}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Today</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
            <View style={styles.stat}>
              <Calendar size={24} color={theme.accent.primary} />
              <Text style={[styles.statNumber, { color: theme.text.primary }]}>{weekBrewCount}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>This Week</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
            <View style={styles.stat}>
              <Award size={24} color={theme.accent.primary} />
              <Text style={[styles.statNumber, { color: theme.text.primary }]}>{brewSessions.length}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>All Time</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      
      <Text style={[styles.browseNote, { color: theme.text.secondary }]}>
        Keep browsing — you can explore teas and use the brew timer without an account.
      </Text>
    </ScrollView>
  );
  
  const renderLoggedIn = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <TouchableOpacity 
          onPress={() => setAvatarPickerVisible(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Change avatar"
          accessibilityHint="Double tap to choose a new avatar style"
        >
          <Avatar 
            userId={user?.id}
            name={profile?.display_name || profile?.username}
            imageUrl={profile?.avatar_url}
            size={64}
            avatarStyle={avatarStyle}
            avatarSeed={avatarSeed}
          />
          <View style={[styles.editAvatarBadge, { backgroundColor: theme.accent.primary }]}>
            <Text style={styles.editAvatarText} accessibilityElementsHidden>✏️</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <TouchableOpacity 
            style={styles.displayNameRow}
            onPress={() => setEditNameVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Edit display name"
          >
            <Text style={[styles.username, { color: theme.text.primary }]}>
              {profile?.display_name || profile?.username || 'Tea Lover'}
            </Text>
            <Edit2 size={16} color={theme.text.secondary} style={styles.editIcon} />
          </TouchableOpacity>
          <Text style={[styles.email, { color: theme.text.secondary }]}>{user?.email}</Text>
        </View>
      </View>
      
      {/* Collection Stats */}
      <View style={styles.statsSection}>
        <Text style={[styles.statsSectionTitle, { color: theme.text.secondary }]}>My Collection</Text>
        <View style={[styles.statsRow, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.medium,
        }]}>
          <View style={styles.stat}>
            <Star size={24} color={theme.accent.primary} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>{triedCount}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Tried</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
          <View style={styles.stat}>
            <Bookmark size={24} color={theme.accent.primary} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>{wantCount}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Want to Try</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
          <View style={styles.stat}>
            <MessageSquare size={24} color={theme.accent.primary} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>{profile?.reviews_count || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Reviews</Text>
          </View>
        </View>
      </View>
      
      {/* Brew Stats */}
      <View style={styles.statsSection}>
        <Text style={[styles.statsSectionTitle, { color: theme.text.secondary }]}>Brew Activity</Text>
        <View style={[styles.statsRow, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.medium,
        }]}>
          <View style={styles.stat}>
            <Coffee size={24} color={theme.accent.primary} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>{todayBrewCount}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Today</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
          <View style={styles.stat}>
            <Calendar size={24} color={theme.accent.primary} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>{weekBrewCount}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>This Week</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
          <View style={styles.stat}>
            <Award size={24} color={theme.accent.primary} />
            <Text style={[styles.statNumber, { color: theme.text.primary }]}>{brewSessions.length}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>All Time</Text>
          </View>
        </View>
      </View>

      {/* Premium Banner - Only show for non-premium users */}
      {!isPremium && (
        <TouchableOpacity 
          style={[styles.premiumBanner, { 
            backgroundColor: theme.accent.primary + '15',
            borderColor: theme.accent.primary,
          }]}
          onPress={() => navigation.navigate('Paywall')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to Premium"
          accessibilityHint="Unlock unlimited teas, flavor profiles, and tasting notes"
        >
          <View style={styles.premiumBannerContent}>
            <Crown size={28} color={theme.accent.primary} />
            <View style={styles.premiumBannerText}>
              <Text style={[styles.premiumBannerTitle, { color: theme.text.primary }]}>
                Upgrade to Premium
              </Text>
              <Text style={[styles.premiumBannerSubtitle, { color: theme.text.secondary }]}>
                Unlimited teas, flavor profiles & more
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={theme.accent.primary} />
        </TouchableOpacity>
      )}
      
      {/* Menu */}
      <View style={[styles.menuSection, { 
        backgroundColor: theme.background.secondary,
        borderColor: theme.border.medium,
      }]}>
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: theme.border.light }]}
          onPress={() => navigation.navigate('BrewHistory')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Brew History"
          accessibilityHint="View your brew history"
        >
          <Coffee size={20} color={theme.accent.primary} />
          <Text style={[styles.menuItemText, { color: theme.text.primary }]}>Brew History</Text>
          <ChevronRight size={20} color={theme.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: theme.border.light }]}
          onPress={() => navigation.navigate('CompareTeas', { initialTeas: [] })}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Compare Teas"
          accessibilityHint="Compare different teas side by side"
        >
          <GitCompare size={20} color={theme.accent.primary} />
          <Text style={[styles.menuItemText, { color: theme.text.primary }]}>Compare Teas</Text>
          <ChevronRight size={20} color={theme.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: theme.border.light }]}
          onPress={() => navigation.navigate('Teaware')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="My Teaware"
          accessibilityHint="Browse your teaware collection"
        >
          <Package size={20} color={theme.accent.primary} />
          <Text style={[styles.menuItemText, { color: theme.text.primary }]}>My Teaware</Text>
          <ChevronRight size={20} color={theme.text.secondary} />
        </TouchableOpacity>
        
        {collection.length > 0 && (
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={handleExport}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Export Collection"
            accessibilityHint="Export your tea collection as a file"
          >
            <Download size={20} color={theme.accent.primary} />
            <Text style={[styles.menuItemText, { color: theme.text.primary }]}>Export Collection</Text>
            <ChevronRight size={20} color={theme.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Appearance */}
      <View style={[styles.menuSection, { 
        backgroundColor: theme.background.secondary,
        borderColor: theme.border.medium,
      }]}>
        <View 
          style={[styles.menuItem, { borderBottomColor: theme.border.light }]}
          accessible={true}
          accessibilityRole="switch"
          accessibilityLabel="Dark Mode"
          accessibilityState={{ checked: isDark }}
        >
          {isDark ? (
            <Moon size={20} color={theme.accent.primary} />
          ) : (
            <Sun size={20} color={theme.accent.primary} />
          )}
          <Text style={[styles.menuItemText, { color: theme.text.primary }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleDarkMode}
            trackColor={{ false: theme.border.medium, true: theme.accent.primary }}
            thumbColor={theme.text.inverse}
            accessibilityLabel="Toggle dark mode"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => {
            Alert.alert(
              'Reset Onboarding',
              'This will show the welcome screens again next time you open the app.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reset', 
                  onPress: async () => {
                    await resetOnboarding();
                    Alert.alert('Done', 'Restart the app to see onboarding again.');
                  }
                },
              ]
            );
          }}
        >
          <RotateCcw size={20} color={theme.accent.primary} />
          <Text style={[styles.menuItemText, { color: theme.text.primary }]}>Reset Onboarding</Text>
          <ChevronRight size={20} color={theme.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {/* Support */}
      <View style={[styles.menuSection, { 
        backgroundColor: theme.background.secondary,
        borderColor: theme.border.medium,
      }]}>
        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => navigation.navigate('Contact')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Contact Us"
          accessibilityHint="Send feedback, report bugs, or inquire about sponsorship"
        >
          <Mail size={20} color={theme.accent.primary} />
          <Text style={[styles.menuItemText, { color: theme.text.primary }]}>Contact Us</Text>
          <ChevronRight size={20} color={theme.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {/* Account */}
      <View style={[styles.menuSection, { 
        backgroundColor: theme.background.secondary,
        borderColor: theme.border.medium,
      }]}>
        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemLast, signingOut && styles.menuItemDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={theme.status.error} />
          ) : (
            <LogOut size={20} color={theme.status.error} />
          )}
          <Text style={[styles.menuItemText, { color: theme.status.error }]}>
            {signingOut ? 'Signing out...' : 'Sign out'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Profile</Text>
        </View>
        
        {user ? renderLoggedIn() : renderLoggedOut()}
        
        <View style={[styles.footer, { borderTopColor: theme.border.light }]}>
          <Text style={[styles.footerText, { color: theme.text.secondary }]}>Resteeped v1.0.0</Text>
          <Text style={[styles.footerSubtext, { color: theme.text.tertiary }]}>Made with 🍵 for tea lovers</Text>
        </View>
      </SafeAreaView>

      <AvatarPicker
        visible={avatarPickerVisible}
        onClose={() => setAvatarPickerVisible(false)}
        onSelect={handleAvatarChange}
        currentStyle={avatarStyle}
        currentSeed={avatarSeed}
        userId={user?.id}
        userName={profile?.display_name || profile?.username || 'Tea Lover'}
      />

      <EditDisplayNameModal
        visible={editNameVisible}
        onClose={() => setEditNameVisible(false)}
        onSave={handleDisplayNameChange}
        currentName={profile?.display_name || profile?.username || ''}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  authTitle: {
    ...typography.headingMedium,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  authSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  authButton: {
    minWidth: 250,
  },
  appleButton: {
    width: 250,
    height: 48,
    marginBottom: spacing.sm,
  },
  browseNote: {
    ...typography.bodySmall,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarText: {
    fontSize: 12,
  },
  profileInfo: {
    flex: 1,
  },
  displayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginLeft: 8,
  },
  username: {
    ...typography.headingMedium,
  },
  email: {
    ...typography.bodySmall,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  viewHistoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewHistoryText: {
    ...typography.caption,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    borderWidth: 1,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  statNumber: {
    ...typography.headingMedium,
  },
  statLabel: {
    ...typography.caption,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sectionSpacing,
    padding: spacing.md,
    borderRadius: spacing.cardBorderRadius,
    borderWidth: 1,
  },
  premiumBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumBannerText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  premiumBannerTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  premiumBannerSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  menuSection: {
    marginHorizontal: spacing.screenHorizontal,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    marginBottom: spacing.sectionSpacing,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.listItemPadding,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemText: {
    ...typography.body,
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerText: {
    ...typography.caption,
    fontWeight: '600',
  },
  footerSubtext: {
    ...typography.caption,
  },
});
