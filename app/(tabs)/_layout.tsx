import { Tabs } from "expo-router";
import { Home, Heart, ShoppingBag, Package, User } from "lucide-react-native";
import React, { useRef, useEffect } from "react";
import { Animated } from "react-native";
import Colors from "@/constants/colors";
import { useCart } from "@/providers/CartProvider";

function AnimatedCartIcon({ color, size, itemCount }: { color: string; size: number; itemCount: number }) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(itemCount);

  useEffect(() => {
    if (itemCount !== prevCount.current && itemCount > 0) {
      prevCount.current = itemCount;
      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: 1.3, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    } else {
      prevCount.current = itemCount;
    }
  }, [itemCount, bounceAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
      <ShoppingBag size={size} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { totalItems } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <AnimatedCartIcon color={color} size={size} itemCount={totalItems} />
          ),
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            color: Colors.white,
            fontSize: 10,
            fontWeight: "700",
          },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
