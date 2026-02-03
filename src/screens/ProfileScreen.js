import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { User, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { Button } from '../components';

export const ProfileScreen = ({ navigation }) => {
  // Placeholder - will be replaced with Supabase auth
  const isLoggedIn = false;
  const user = null;
  
  const renderLoggedOut = () => (
    <View style={styles.authContainer}>
      <View style={styles.avatarPlaceholder}>
        <User size={48} color={colors.text.secondary} />
      </View>
      <Text style={styles.authTitle}>Sign in to save your collection</Text>
      <Text style={styles.authSubtitle}>
        Track your teas, save reviews, and sync across devices
      </Text>
      <Button 
        title="Sign in with Google"
        onPress={() => {/* TODO: Implement Google auth */}}
        variant="primary"
        style={styles.authButton}
      />
    </View>
  );
  
  const renderLoggedIn = () => (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={32} color={colors.text.inverse} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{user?.username || 'Tea Lover'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Teas tried</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>
      
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Settings size={20} color={colors.text.secondary} />
          <Text style={styles.menuItemText}>Settings</Text>
          <ChevronRight size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
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
      
      {isLoggedIn ? renderLoggedIn() : renderLoggedOut()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Resteeped v1.0.0</Text>
        <Text style={styles.footerText}>Made with 🍵 for tea lovers</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  },
  authButton: {
    minWidth: 250,
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
});
