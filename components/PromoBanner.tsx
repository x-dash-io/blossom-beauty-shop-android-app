import React, { useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';
import { Banner } from '@/types';
import Colors from '@/constants/colors';

interface PromoBannerProps {
  banner: Banner;
  onPress?: () => void;
}

export default function PromoBanner({ banner, onPress }: PromoBannerProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.banner, { backgroundColor: banner.color }]}
      >
        <View style={styles.textArea}>
          <Text style={styles.title}>{banner.title}</Text>
          <Text style={styles.subtitle}>{banner.subtitle}</Text>
          <View style={styles.shopButton}>
            <Text style={styles.shopButtonText}>Shop Now</Text>
            <ArrowRight size={14} color={Colors.white} />
          </View>
        </View>
        <Image
          source={banner.image}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: 290,
    height: 150,
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    marginRight: 14,
  },
  textArea: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: 10,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  shopButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  image: {
    width: 120,
    height: '100%',
  },
});
