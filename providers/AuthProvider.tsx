import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const ONBOARDING_KEY = 'blossom_onboarding_complete';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [onboardingChecked, setOnboardingChecked] = useState<boolean>(false);

  useEffect(() => {
    console.log('[Auth] Initializing auth state...');

    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        console.log('[Auth] Onboarding status:', value);
        setHasCompletedOnboarding(value === 'true');
      } catch (error) {
        console.log('[Auth] Error checking onboarding:', error);
      }
      setOnboardingChecked(true);
    };

    checkOnboarding();

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[Auth] Got session:', currentSession?.user?.email ?? 'none');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log('[Auth] Auth state changed:', _event, newSession?.user?.email);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
      console.log('[Auth] Signing up:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      return data;
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log('[Auth] Signing in:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      console.log('[Auth] Sending password reset to:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  });

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
      console.log('[Auth] Onboarding completed');
    } catch (error) {
      console.log('[Auth] Error saving onboarding:', error);
    }
  }, []);

  const isAuthenticated = !!session?.user;

  return {
    session,
    user,
    isLoading: isLoading || !onboardingChecked,
    isAuthenticated,
    hasCompletedOnboarding,
    completeOnboarding,
    signUp: signUpMutation.mutateAsync,
    signIn: signInMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  };
});
