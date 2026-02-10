import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { FavoritesProvider } from "@/providers/FavoritesProvider";
import { OrdersProvider } from "@/providers/OrdersProvider";
import { ProductsProvider } from "@/providers/ProductsProvider";
import { ReviewsProvider } from "@/providers/ReviewsProvider";
import { RecentlyViewedProvider } from "@/providers/RecentlyViewedProvider";
import Colors from "@/constants/colors";

const GestureWrapper = Platform.OS === 'web' ? View : GestureHandlerRootView;

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function AuthGate() {
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'forgot-password' || segments[0] === 'onboarding';

    console.log('[AuthGate] State:', { isAuthenticated, hasCompletedOnboarding, segments: segments[0], inAuthGroup });

    if (!hasCompletedOnboarding) {
      router.replace('/onboarding');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="product" />
        <Stack.Screen name="order-detail" />
        <Stack.Screen name="addresses" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="about" />
        <Stack.Screen name="help" />
        <Stack.Screen name="payment-methods" />
        <Stack.Screen
          name="write-review"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: true,
            title: "Checkout",
            headerTintColor: Colors.textPrimary,
            headerStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="mpesa-payment"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="confirmation"
          options={{
            presentation: "modal",
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureWrapper style={{ flex: 1 }}>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <FavoritesProvider>
                <OrdersProvider>
                  <ReviewsProvider>
                    <RecentlyViewedProvider>
                      <RootLayoutNav />
                    </RecentlyViewedProvider>
                  </ReviewsProvider>
                </OrdersProvider>
              </FavoritesProvider>
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </GestureWrapper>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
