import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export const DeliveryOfferSkeleton = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBar = ({ style }: { style?: any }) => (
    <Animated.View style={[{ opacity }, style]} />
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <SkeletonBar style={styles.labelBar} />
          <SkeletonBar style={styles.badgeBar} />
        </View>
        <View style={styles.valueRow}>
          <SkeletonBar style={styles.roundBtn} />
          <SkeletonBar style={styles.valueBar} />
          <SkeletonBar style={styles.roundBtn} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    marginHorizontal: 24,
  },
  card: {
    backgroundColor: "rgba(17, 37, 62, 0.8)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  labelBar: {
    backgroundColor: "#334155",
    borderRadius: 999,
    height: 12,
    width: 96,
  },
  badgeBar: {
    backgroundColor: "#334155",
    borderRadius: 999,
    height: 20,
    width: 80,
  },
  valueRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 8,
  },
  roundBtn: {
    backgroundColor: "#334155",
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  valueBar: {
    backgroundColor: "#334155",
    borderRadius: 12,
    height: 48,
    width: 112,
  },
});
