import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { X, Check, Crown, Leaf, Sparkles, NotebookPen } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme, useSubscription } from '../context';

const PRIVACY_URL = 'https://resteeped.com/privacy';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const FEATURES = [
  { icon: Leaf, text: 'Unlimited tea collection' },
  { icon: Sparkles, text: 'Flavor profile radar charts' },
  { icon: NotebookPen, text: 'Personal tasting notes & ratings' },
];

export const PaywallScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { offerings, purchasePackage, restorePurchases, isConfigured } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('yearly');

  const currentOffering = offerings?.current;
  const monthlyPackage = currentOffering?.monthly;
  const yearlyPackage = currentOffering?.annual;

  const handlePurchase = async () => {
    const pkg = selectedPackage === 'yearly' ? yearlyPackage : monthlyPackage;
    
    if (!pkg) {
      // Packages not loaded yet - show user-friendly message
      Alert.alert(
        'Unable to Load',
        'Subscription options are temporarily unavailable. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    const result = await purchasePackage(pkg);
    setIsLoading(false);

    if (result.success) {
      navigation.goBack();
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    await restorePurchases();
    setIsLoading(false);
  };

  // If RevenueCat isn't configured yet, show coming soon
  if (!isConfigured) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <X size={24} color={theme.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.comingSoon}>
          <Crown size={64} color={theme.accent.primary} />
          <Text style={[styles.comingSoonTitle, { color: theme.text.primary }]}>
            Premium Coming Soon!
          </Text>
          <Text style={[styles.comingSoonText, { color: theme.text.secondary }]}>
            We're working on premium features. For now, enjoy unlimited access to all features!
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.accent.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <X size={24} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconContainer, { backgroundColor: theme.accent.primary + '20' }]}>
            <Crown size={48} color={theme.accent.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text.primary }]}>
            Upgrade to Premium
          </Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            Unlock unlimited teas and premium features
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: theme.status.success + '20' }]}>
                <Check size={16} color={theme.status.success} />
              </View>
              <Text style={[styles.featureText, { color: theme.text.primary }]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plans}>
          {/* Yearly */}
          <TouchableOpacity
            style={[
              styles.planCard,
              { 
                backgroundColor: theme.background.secondary,
                borderColor: selectedPackage === 'yearly' ? theme.accent.primary : theme.border.medium,
                borderWidth: selectedPackage === 'yearly' ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedPackage('yearly')}
          >
            <View style={[styles.saveBadge, { backgroundColor: theme.status.success }]}>
              <Text style={styles.saveBadgeText}>SAVE 44%</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.text.primary }]}>Yearly</Text>
              <View style={styles.planPricing}>
                <Text style={[styles.planPrice, { color: theme.text.primary }]}>
                  {yearlyPackage?.product?.priceString || '$19.99'}
                </Text>
                <Text style={[styles.planPeriod, { color: theme.text.secondary }]}>/year</Text>
              </View>
            </View>
            <Text style={[styles.planSubtext, { color: theme.text.tertiary }]}>
              Just $1.67/month
            </Text>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            style={[
              styles.planCard,
              { 
                backgroundColor: theme.background.secondary,
                borderColor: selectedPackage === 'monthly' ? theme.accent.primary : theme.border.medium,
                borderWidth: selectedPackage === 'monthly' ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedPackage('monthly')}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.text.primary }]}>Monthly</Text>
              <View style={styles.planPricing}>
                <Text style={[styles.planPrice, { color: theme.text.primary }]}>
                  {monthlyPackage?.product?.priceString || '$2.99'}
                </Text>
                <Text style={[styles.planPeriod, { color: theme.text.secondary }]}>/month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: theme.accent.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Continue
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isLoading}
        >
          <Text style={[styles.restoreText, { color: theme.text.secondary }]}>
            Restore Purchases
          </Text>
        </TouchableOpacity>

        {/* Required subscription disclosure */}
        <View style={styles.subscriptionInfo}>
          <Text style={[styles.subscriptionTitle, { color: theme.text.primary }]}>
            Resteeped Premium
          </Text>
          <Text style={[styles.subscriptionDetails, { color: theme.text.secondary }]}>
            {selectedPackage === 'yearly' 
              ? `Yearly subscription: ${yearlyPackage?.product?.priceString || '$19.99'}/year`
              : `Monthly subscription: ${monthlyPackage?.product?.priceString || '$2.99'}/month`
            }
          </Text>
          <Text style={[styles.subscriptionDetails, { color: theme.text.secondary }]}>
            Includes unlimited tea collection, flavor profiles, and tasting notes.
          </Text>
        </View>

        <Text style={[styles.terms, { color: theme.text.tertiary }]}>
          Payment will be charged to your App Store account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. You can manage or cancel your subscription in your App Store account settings.
        </Text>

        {/* Required legal links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={[styles.legalLink, { color: theme.accent.primary }]}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={[styles.legalSeparator, { color: theme.text.tertiary }]}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={[styles.legalLink, { color: theme.accent.primary }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  features: {
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  plans: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  saveBadge: {
    position: 'absolute',
    top: 12,
    right: -28,
    paddingHorizontal: spacing.xl,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
  },
  saveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    ...typography.h3,
    fontWeight: '600',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    ...typography.h2,
    fontWeight: '700',
  },
  planPeriod: {
    ...typography.body,
    marginLeft: 2,
  },
  planSubtext: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  primaryButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    ...typography.body,
    fontWeight: '600',
  },
  restoreButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  restoreText: {
    ...typography.body,
  },
  subscriptionInfo: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  subscriptionTitle: {
    ...typography.h3,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subscriptionDetails: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  terms: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  legalLink: {
    ...typography.caption,
    fontWeight: '500',
  },
  legalSeparator: {
    marginHorizontal: spacing.sm,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  comingSoonTitle: {
    ...typography.h2,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  comingSoonText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
});

export default PaywallScreen;
