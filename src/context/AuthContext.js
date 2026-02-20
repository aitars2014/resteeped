import React, { createContext, useContext, useState, useEffect, Platform } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { trackEvent, identifyUser, resetUser, AnalyticsEvents } from '../utils/analytics';
import Purchases from 'react-native-purchases';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// =============================================================================
// DEV MODE: Set to true to bypass Google Auth and use a fake local user
// This allows testing user features without configuring OAuth
// =============================================================================
const DEV_MODE = __DEV__ && true; // Only active in development builds

const DEV_USER = {
  id: 'dev-user-00000000-0000-0000-0000-000000000001',
  email: 'taylor@resteeped.dev',
  user_metadata: {
    full_name: 'Taylor (Dev)',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=taylor',
  },
};

const DEV_PROFILE = {
  id: 'dev-user-00000000-0000-0000-0000-000000000001',
  username: 'taylor_dev',
  display_name: 'Taylor (Dev)',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=taylor',
  teas_tried_count: 12,
  reviews_count: 5,
  created_at: new Date().toISOString(),
};
// =============================================================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  useEffect(() => {
    // Check if Apple auth is available (iOS 13+)
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
    }

    // If dev mode is active and user wants to skip auth
    if (DEV_MODE) {
      console.log('🔧 Dev mode available - use signInWithGoogle() to activate fake user');
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Check for existing session with timeout
    const sessionTimeout = setTimeout(() => {
      console.warn('Auth session check timed out after 10s');
      setLoading(false);
      setInitialized(true);
    }, 10000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(sessionTimeout);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
          // Identify user in RevenueCat
          Purchases.logIn(session.user.id).then(() => {
            if (session.user.email) Purchases.setEmail(session.user.email);
          }).catch(e => console.warn('RevenueCat logIn failed:', e));
        }
        setLoading(false);
        setInitialized(true);
      })
      .catch((error) => {
        clearTimeout(sessionTimeout);
        console.error('Auth session check failed:', error);
        setLoading(false);
        setInitialized(true);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          // Identify user in RevenueCat for subscription tracking
          try {
            await Purchases.logIn(session.user.id);
            if (session.user.email) {
              await Purchases.setEmail(session.user.email);
            }
          } catch (e) {
            console.warn('RevenueCat logIn failed:', e);
          }
        } else {
          setProfile(null);
          // Reset RevenueCat to anonymous user on sign out
          try {
            await Purchases.logOut();
          } catch (e) {
            console.warn('RevenueCat logOut failed:', e);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signInWithApple = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return { error: { message: 'Supabase not configured' } };
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Sign in with Supabase using the Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      // Track sign in
      if (data?.user) {
        const isNewUser = new Date(data.user.created_at) > new Date(Date.now() - 60000);
        trackEvent(isNewUser ? AnalyticsEvents.SIGN_UP : AnalyticsEvents.SIGN_IN, { method: 'apple' });
        identifyUser(data.user.id, { email: data.user.email });
      }

      return { data, error: null };
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled the sign-in flow
        return { data: null, error: null };
      }
      console.error('Apple sign in error:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    // Dev mode: instantly sign in with fake user
    if (DEV_MODE) {
      console.log('🔧 Dev mode: signing in with fake user');
      setUser(DEV_USER);
      setProfile(DEV_PROFILE);
      setIsDevMode(true);
      trackEvent(AnalyticsEvents.SIGN_IN, { method: 'dev_mode' });
      return { data: { user: DEV_USER }, error: null };
    }

    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return { error: { message: 'Supabase not configured' } };
    }

    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const url = result.url;
          const params = new URLSearchParams(url.split('#')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = 
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            
            if (sessionError) throw sessionError;
            
            // Track sign in and identify user
            if (sessionData?.user) {
              const isNewUser = new Date(sessionData.user.created_at) > new Date(Date.now() - 60000);
              trackEvent(isNewUser ? AnalyticsEvents.SIGN_UP : AnalyticsEvents.SIGN_IN, { method: 'google' });
              identifyUser(sessionData.user.id, { email: sessionData.user.email });
            }
            
            return { data: sessionData, error: null };
          }
        }
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    // Dev mode: just clear local state
    if (isDevMode) {
      console.log('🔧 Dev mode: signing out fake user');
      setUser(null);
      setProfile(null);
      setIsDevMode(false);
      trackEvent(AnalyticsEvents.SIGN_OUT);
      resetUser();
      return { error: null };
    }

    if (!isSupabaseConfigured()) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      trackEvent(AnalyticsEvents.SIGN_OUT);
      resetUser();
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: 'Not logged in' } };
    
    // Dev mode: update local state only
    if (isDevMode) {
      setProfile(prev => ({ ...prev, ...updates }));
      return { data: { ...profile, ...updates }, error: null };
    }

    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const deleteAccount = async () => {
    if (!user || isDevMode) {
      setUser(null);
      setProfile(null);
      return { error: null };
    }

    if (!isSupabaseConfigured()) {
      return { error: { message: 'Not configured' } };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Deletion failed');

      // Clear local state
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      resetUser();
      return { error: null };
    } catch (error) {
      console.error('Account deletion error:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    initialized,
    isConfigured: isSupabaseConfigured(),
    isDevMode,
    appleAuthAvailable,
    signInWithApple,
    signInWithGoogle,
    signOut,
    deleteAccount,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
