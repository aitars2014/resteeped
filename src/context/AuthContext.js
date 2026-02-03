import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

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

  useEffect(() => {
    // If dev mode is active and user wants to skip auth
    if (DEV_MODE) {
      console.log('🔧 Dev mode available - use signInWithGoogle() to activate fake user');
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
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

  const signInWithGoogle = async () => {
    // Dev mode: instantly sign in with fake user
    if (DEV_MODE) {
      console.log('🔧 Dev mode: signing in with fake user');
      setUser(DEV_USER);
      setProfile(DEV_PROFILE);
      setIsDevMode(true);
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
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
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
    signInWithGoogle,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
