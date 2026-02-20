import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { useAuth } from './AuthContext';

// RevenueCat API keys - loaded from environment variables
// Set EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY in .env
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Product identifiers - must match what you create in App Store Connect / Google Play Console
export const PRODUCTS = {
  MONTHLY: 'resteeped_premium_monthly',    // $2.99/mo
  YEARLY: 'resteeped_premium_yearly',       // $19.99/yr
};

// Free tier limits
export const FREE_TIER_LIMITS = {
  MAX_COLLECTION_SIZE: 10,
};

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Owner emails that always get premium (app owner accounts)
const OWNER_EMAILS = ['pratt.taylor@gmail.com'];

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Owner override — always premium
  const isOwner = user?.email && OWNER_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    // Add overall timeout for RevenueCat initialization (10 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('RevenueCat initialization timed out')), 10000)
    );

    try {
      // Check if keys are configured
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
      
      if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.startsWith('test_')) {
        console.log('RevenueCat not configured - running in free mode');
        setIsLoading(false);
        return;
      }
      
      // Race against timeout
      await Promise.race([
        (async () => {
          await Purchases.configure({ apiKey });
          setIsConfigured(true);
          
          // Get initial customer info
          const info = await Purchases.getCustomerInfo();
          updateCustomerInfo(info);
          
          // Get offerings
          const offerings = await Purchases.getOfferings();
          setOfferings(offerings);
          
          // Listen for customer info updates
          Purchases.addCustomerInfoUpdateListener(updateCustomerInfo);
        })(),
        timeoutPromise
      ]);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
      // Still allow app to function without subscriptions
      setIsLoading(false);
    }
  };

  const updateCustomerInfo = (info) => {
    setCustomerInfo(info);
    // Check if user has active "premium" entitlement
    const premiumEntitlement = info?.entitlements?.active?.premium;
    setIsPremium(!!premiumEntitlement);
  };

  const purchasePackage = async (pkg) => {
    if (!isConfigured) {
      Alert.alert(
        'Not Available',
        'Subscriptions are not yet configured. Please check back later!'
      );
      return { success: false };
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      updateCustomerInfo(customerInfo);
      return { success: true };
    } catch (error) {
      if (error.userCancelled) {
        return { success: false, cancelled: true };
      }
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', error.message);
      return { success: false, error };
    }
  };

  const restorePurchases = async () => {
    if (!isConfigured) {
      Alert.alert(
        'Not Available',
        'Subscriptions are not yet configured.'
      );
      return { success: false };
    }

    try {
      const info = await Purchases.restorePurchases();
      updateCustomerInfo(info);
      
      if (info?.entitlements?.active?.premium) {
        Alert.alert('Success', 'Your premium subscription has been restored!');
        return { success: true };
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription for your account.');
        return { success: false };
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', error.message);
      return { success: false, error };
    }
  };

  // Effective premium status (owner override OR paid subscription)
  const effectivePremium = isOwner || isPremium;

  // Helper to check if user can add more teas
  const canAddToCollection = (currentCollectionSize) => {
    if (effectivePremium) return true;
    return currentCollectionSize < FREE_TIER_LIMITS.MAX_COLLECTION_SIZE;
  };

  // Get remaining free slots
  const getRemainingFreeSlots = (currentCollectionSize) => {
    if (effectivePremium) return Infinity;
    return Math.max(0, FREE_TIER_LIMITS.MAX_COLLECTION_SIZE - currentCollectionSize);
  };

  const value = {
    isConfigured,
    isPremium: effectivePremium,
    offerings,
    customerInfo,
    isLoading,
    purchasePackage,
    restorePurchases,
    canAddToCollection,
    getRemainingFreeSlots,
    FREE_TIER_LIMITS,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
