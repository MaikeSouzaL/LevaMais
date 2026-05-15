import React, { useEffect } from "react";
import { Marker } from "react-native-maps";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedProps,
  useDerivedValue,
} from "react-native-reanimated";
import { RoutePulseIndicator } from "./RoutePulseIndicator";
import { View } from "react-native";
import { useAuthStore } from "@/context/authStore";

// Enables Native Reanimated drive directly into Native Map Prop 'coordinate'
const AnimatedMarker = Animated.createAnimatedComponent(Marker);

interface AnimatedRoutePathProps {
  coordinates: Array<{ latitude: number; longitude: number }>;
}

export const AnimatedRoutePath = ({ coordinates }: AnimatedRoutePathProps) => {
  const enableMapAnimation = useAuthStore((s) => s.userData?.enableMapAnimation);

  // Mirror coordinates array to the UI thread robustly to prevent stale closure displacement
  const sharedCoords = useSharedValue(coordinates);
  const progress = useSharedValue(0);

  // Short-circuit instantly if animation disabled by database preference flag!
  if (enableMapAnimation === false) return null;

  useEffect(() => {
    if (coordinates && coordinates.length >= 2) {
      sharedCoords.value = [...coordinates];
    }
  }, [coordinates]);

  useEffect(() => {
    if (!coordinates || coordinates.length < 2) return;

    // Set animation cycle: infinite loop traversing the 0 -> 1 fractional domain
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: 12000, // 12s duration for consistent cinematic crawl across route
        easing: Easing.linear,
      }),
      -1, // Loop forever
      false // Don't reverse
    );

    return () => {
      progress.value = 0;
    };
  }, [coordinates]);

  // --- Main Particle interpolation ---
  const animatedProps = useAnimatedProps(() => {
    const coords = sharedCoords.value;
    if (!coords || coords.length < 2) {
      return { coordinate: { latitude: 0, longitude: 0 } };
    }
    
    const count = coords.length;
    const rawIndex = progress.value * (count - 1);
    const index = Math.floor(rawIndex);
    const frac = rawIndex - index;

    const current = coords[index] || coords[count - 1];
    const next = coords[Math.min(index + 1, count - 1)] || current;

    return {
      coordinate: {
        latitude: current.latitude + (next.latitude - current.latitude) * frac,
        longitude: current.longitude + (next.longitude - current.longitude) * frac,
      },
    };
  }, [coordinates]); // Explicitly bind the update tracker

  // --- Trail Particle: -2% delay slightly behind main ---
  const trailProps = useAnimatedProps(() => {
    const coords = sharedCoords.value;
    if (!coords || coords.length < 2) return { coordinate: { latitude: 0, longitude: 0 } };
    
    let backVal = progress.value - 0.02;
    if (backVal < 0) backVal = 0; 

    const count = coords.length;
    const rawIndex = backVal * (count - 1);
    const index = Math.floor(rawIndex);
    const frac = rawIndex - index;

    const current = coords[index] || coords[count - 1];
    const next = coords[Math.min(index + 1, count - 1)] || current;

    return {
      coordinate: {
        latitude: current.latitude + (next.latitude - current.latitude) * frac,
        longitude: current.longitude + (next.longitude - current.longitude) * frac,
      },
    };
  }, [coordinates]);

  if (!coordinates || coordinates.length < 2) return null;

  return (
    <>
      {/* The Soft Fade Trail Indicator */}
      <AnimatedMarker
        coordinate={sharedCoords.value[0]}
        animatedProps={trailProps}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={true}
        zIndex={21}
      >
        <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ opacity: 0.35, transform: [{ scale: 0.75 }] }}>
            <RoutePulseIndicator />
          </Animated.View>
        </View>
      </AnimatedMarker>

      {/* The Main Active Particle */}
      <AnimatedMarker
        coordinate={sharedCoords.value[0]}
        animatedProps={animatedProps}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={true}
        zIndex={22}
      >
        <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <RoutePulseIndicator />
        </View>
      </AnimatedMarker>
    </>
  );
};
