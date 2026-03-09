import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { ChevronLeft, Bell, BellOff, Coffee, Leaf, Sun, ShoppingBag } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme, useAuth } from '../context';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationSettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
    isPermissionGranted,
    permissionStatus,
    preferences,
    updatePreference,
    requestPermissions,
    loading,
  } = useNotifications();

  const handleEnableNotifications = async () => {
    if (permissionStatus === 'denied') {
      // Permission was previously denied — need to go to Settings
      Alert.alert(
        'Notifications Disabled',
        'You previously denied notification permissions. To enable them, go to Settings > Resteeped > Notifications.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const status = await requestPermissions();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Notifications help you discover new teas and maintain your brewing routine. You can enable them anytime in Settings.',
      );
    }
  };

  const renderNotificationOption = ({ icon: Icon, title, description, prefKey }) => (
    <View
      style={[styles.optionRow, { borderBottomColor: theme.border.light }]}
      accessible={true}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityState={{ checked: preferences[prefKey] }}
    >
      <Icon size={20} color={theme.accent.primary} />
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[styles.optionDescription, { color: theme.text.secondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={preferences[prefKey]}
        onValueChange={(value) => updatePreference(prefKey, value)}
        trackColor={{ false: theme.border.medium, true: theme.accent.primary }}
        thumbColor={theme.text.inverse}
        disabled={!isPermissionGranted}
        accessibilityLabel={`Toggle ${title}`}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Permission Banner */}
        {!isPermissionGranted && (
          <TouchableOpacity
            style={[styles.permissionBanner, {
              backgroundColor: theme.accent.primary + '15',
              borderColor: theme.accent.primary,
            }]}
            onPress={handleEnableNotifications}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Enable notifications"
          >
            <BellOff size={24} color={theme.accent.primary} />
            <View style={styles.permissionContent}>
              <Text style={[styles.permissionTitle, { color: theme.text.primary }]}>
                Notifications are off
              </Text>
              <Text style={[styles.permissionDescription, { color: theme.text.secondary }]}>
                Tap to enable notifications for tea suggestions, brew reminders, and more.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Not logged in notice */}
        {!user && (
          <View style={[styles.noticeCard, {
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.medium,
          }]}>
            <Text style={[styles.noticeText, { color: theme.text.secondary }]}>
              Sign in to save your notification preferences across devices.
            </Text>
          </View>
        )}

        {/* Notification Categories */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
          NOTIFICATION TYPES
        </Text>
        <View style={[styles.section, {
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.medium,
        }]}>
          {renderNotificationOption({
            icon: Sun,
            title: 'Daily Tea Suggestion',
            description: 'A personalized tea recommendation each morning based on your collection and preferences.',
            prefKey: 'dailySuggestion',
          })}
          {renderNotificationOption({
            icon: Coffee,
            title: 'Brew Reminders',
            description: "A gentle nudge when it's been a few days since your last steep.",
            prefKey: 'brewReminder',
          })}
          {renderNotificationOption({
            icon: ShoppingBag,
            title: 'New Teas from Brands',
            description: 'Get notified when brands in your collection add new teas.',
            prefKey: 'newTeasFromBrands',
          })}
          {renderNotificationOption({
            icon: Leaf,
            title: 'Seasonal Highlights',
            description: 'Spring first flush arrivals, autumn oolongs, and other seasonal picks.',
            prefKey: 'seasonalPrompts',
          })}
        </View>

        <Text style={[styles.footnote, { color: theme.text.tertiary || theme.text.secondary }]}>
          Brew timer notifications are always enabled when you start a timer — they're not affected by these settings.
        </Text>
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  permissionContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  permissionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  permissionDescription: {
    ...typography.caption,
  },
  noticeCard: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: {
    ...typography.caption,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.md + spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionContent: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  optionTitle: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    ...typography.caption,
    lineHeight: 16,
  },
  footnote: {
    ...typography.caption,
    marginHorizontal: spacing.md + spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    lineHeight: 16,
  },
});

export default NotificationSettingsScreen;
