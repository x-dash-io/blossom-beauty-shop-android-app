import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageZoomModalProps {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageZoomModal({ visible, images, initialIndex, onClose }: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const isZoomed = useRef(false);
  const lastTap = useRef(0);
  const panOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      isZoomed.current = false;
      panOffset.current = { x: 0, y: 0 };
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  }, [visible, initialIndex, scale, translateX, translateY]);

  const toggleZoom = useCallback(() => {
    if (isZoomed.current) {
      isZoomed.current = false;
      panOffset.current = { x: 0, y: 0 };
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
      ]).start();
    } else {
      isZoomed.current = true;
      Animated.spring(scale, { toValue: 2.5, useNativeDriver: true, friction: 7 }).start();
    }
  }, [scale, translateX, translateY]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleZoom();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }, [toggleZoom]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => {
      return isZoomed.current && (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5);
    },
    onPanResponderMove: (_, gs) => {
      translateX.setValue(panOffset.current.x + gs.dx);
      translateY.setValue(panOffset.current.y + gs.dy);
    },
    onPanResponderRelease: (_, gs) => {
      panOffset.current = {
        x: panOffset.current.x + gs.dx,
        y: panOffset.current.y + gs.dy,
      };
    },
  }), [translateX, translateY]);

  const goToImage = useCallback((index: number) => {
    isZoomed.current = false;
    panOffset.current = { x: 0, y: 0 };
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    setCurrentIndex(index);
  }, [scale, translateX, translateY]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={zStyles.container}>
        <View style={zStyles.header}>
          <Pressable onPress={onClose} style={zStyles.closeBtn} testID="zoom-close">
            <X size={22} color="#fff" />
          </Pressable>
          {images.length > 1 && (
            <Text style={zStyles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>
          )}
        </View>

        <Animated.View
          style={[
            zStyles.imageWrapper,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={handleTap}>
            <Image
              source={images[currentIndex]}
              style={zStyles.image}
              contentFit="contain"
              transition={200}
            />
          </Pressable>
        </Animated.View>

        {images.length > 1 && (
          <View style={zStyles.navigation} pointerEvents="box-none">
            {currentIndex > 0 ? (
              <Pressable onPress={() => goToImage(currentIndex - 1)} style={zStyles.navButton}>
                <ChevronLeft size={24} color="#fff" />
              </Pressable>
            ) : (
              <View />
            )}
            {currentIndex < images.length - 1 ? (
              <Pressable onPress={() => goToImage(currentIndex + 1)} style={zStyles.navButton}>
                <ChevronRight size={24} color="#fff" />
              </Pressable>
            ) : (
              <View />
            )}
          </View>
        )}

        <Text style={zStyles.hint}>Double-tap to zoom</Text>

        {images.length > 1 && (
          <View style={zStyles.dots}>
            {images.map((_, idx) => (
              <View
                key={idx}
                style={[zStyles.dot, idx === currentIndex && zStyles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const zStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  navigation: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    position: 'absolute',
    bottom: 80,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500' as const,
  },
  dots: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 16,
  },
});
