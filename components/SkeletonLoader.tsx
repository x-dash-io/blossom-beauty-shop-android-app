import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

function useShimmer() {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.75, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

function Block({ w, h, r = 8, style }: { w?: number; h: number; r?: number; style?: object }) {
  return (
    <View
      style={[
        { height: h, borderRadius: r, backgroundColor: Colors.border },
        w !== undefined ? { width: w } : undefined,
        style,
      ]}
    />
  );
}

function CardShape() {
  return (
    <View style={styles.card}>
      <View style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Block w={50} h={10} r={4} />
        <Block h={13} r={4} />
        <Block w={40} h={10} r={4} />
        <Block w={60} h={15} r={4} />
      </View>
    </View>
  );
}

export function HomeContentSkeleton() {
  const opacity = useShimmer();
  return (
    <Animated.View style={{ opacity }}>
      <View style={styles.bannerWrap}>
        <Block h={140} r={16} />
      </View>
      <View style={styles.sectionWrap}>
        <Block w={130} h={18} r={6} />
      </View>
      <View style={styles.categoryRow}>
        {[1, 2, 3, 4].map(i => (
          <Block key={i} w={72} h={92} r={14} />
        ))}
      </View>
      <View style={styles.sectionWrap}>
        <Block w={80} h={18} r={6} />
      </View>
      <View style={styles.gridRow}>
        {[1, 2].map(i => (
          <View key={i} style={{ width: CARD_WIDTH }}>
            <CardShape />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  const opacity = useShimmer();
  return (
    <Animated.View style={{ opacity }}>
      <View style={styles.gridRow}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={{ width: CARD_WIDTH }}>
            <CardShape />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export function OrdersScreenSkeleton() {
  const opacity = useShimmer();
  return (
    <Animated.View style={{ opacity, paddingHorizontal: 16, gap: 12 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={{ gap: 4 }}>
              <Block w={120} h={14} r={4} />
              <Block w={80} h={12} r={4} />
            </View>
            <Block w={72} h={22} r={10} />
          </View>
          <View style={styles.orderBody}>
            <View style={styles.orderImages}>
              {[1, 2, 3].map(j => (
                <Block
                  key={j}
                  w={40}
                  h={40}
                  r={10}
                  style={j > 1 ? { marginLeft: -12 } : undefined}
                />
              ))}
            </View>
            <View style={styles.orderTotal}>
              <Block w={50} h={11} r={4} />
              <Block w={60} h={16} r={4} />
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },
  cardInfo: {
    padding: 10,
    gap: 6,
  },
  bannerWrap: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionWrap: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  orderBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderImages: {
    flexDirection: 'row',
    flex: 1,
  },
  orderTotal: {
    alignItems: 'flex-end',
    gap: 4,
    marginRight: 8,
  },
});
