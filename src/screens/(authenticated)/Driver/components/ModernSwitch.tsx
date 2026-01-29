import React, { useEffect } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  value: boolean;
  onTrack: () => void;
  isLoading?: boolean;
};

const SWITCH_WIDTH = 140; // Largura do botão
const SWITCH_HEIGHT = 50; // Altura do botão
const KNOB_SIZE = 42; // Tamanho da bolinha
const PADDING = 4; // Espaçamento interno

export function ModernSwitch({ value, onTrack, isLoading }: Props) {
  // 0 = offline, 1 = online
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      mass: 1,
      damping: 15,
      stiffness: 120,
    });
  }, [value]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#e5e7eb", "#02de95"] // Cinza qnd offline, Verde qnd online
    );

    return {
      backgroundColor,
    };
  });

  const animatedKnobStyle = useAnimatedStyle(() => {
    // A bolinha deve ir da esquerda (PADDING) até a direita (LARGURA - TAMANHO - PADDING)
    const translateX = (SWITCH_WIDTH - KNOB_SIZE - PADDING * 2) * progress.value;
    
    return {
      transform: [{ translateX }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
     return {
         opacity: withTiming(1, { duration: 300})
     }
  })


  /* Animation for pulsing effect */
  const pulseOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (value) {
      pulseOpacity.value = 0.6;
      pulseScale.value = 1;

      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 1500 }),
        -1,
        false
      );
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 1500 }),
        -1,
        false
      );
    } else {
      pulseOpacity.value = 0;
      pulseScale.value = 1;
    }
  }, [value]);

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseOpacity.value,
      transform: [{ scale: pulseScale.value }],
      backgroundColor: "#02de95",
    };
  });

  return (
    <Pressable
      onPress={!isLoading ? onTrack : undefined}
      style={[
          styles.container
      ]}
    >
      {/* Pulse Effect Layer */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          styles.pulseLayer,
          animatedPulseStyle
        ]} 
      />

      <Animated.View style={[styles.track, animatedContainerStyle]}>
        
        {/* Texto de fundo que fica "atrás" do switch */}
        <View style={styles.textContainer}>
            <Text style={[styles.statusText, { opacity: value ? 1 : 0.5, color: value ? '#fff': '#6b7280'}]}>
                {value ? "ONLINE" : "OFFLINE"}
            </Text>
        </View>

        {/* Knob (Bolinha) */}
        <Animated.View style={[styles.knob, animatedKnobStyle]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={value ? "#02de95" : "#6b7280"} />
          ) : (
            <MaterialIcons
              name={value ? "check" : "power-settings-new"}
              size={24}
              color={value ? "#02de95" : "#6b7280"}
            />
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
  },
  track: {
    width: "100%",
    height: "100%",
    borderRadius: SWITCH_HEIGHT / 2,
    justifyContent: "center",
    padding: PADDING,
    position: 'relative',
    zIndex: 2,
  },
  pulseLayer: {
    borderRadius: SWITCH_HEIGHT / 2,
    zIndex: 1,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 4,
    position: 'absolute',
    left: PADDING,
  },
  textContainer: {
      position: 'absolute',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: -1
  },
  statusText: {
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 1
  }
});
