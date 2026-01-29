import {
  Animated,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import slides from "./dataSlide";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import theme from "../../../theme";

export default function IntroScreen() {
  const [slideAtual, setSlideAtual] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();

  const soundRef = useRef<Audio.Sound | null>(null);

  const stopAndUnload = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
  };

  const startBackgroundMusic = async () => {
    try {
      if (soundRef.current) return;

      // Evita que outras mídias continuem tocando em background
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("../../../assets/sound/Welcome.mp3"),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 0.5,
        },
      );

      soundRef.current = sound;
    } catch (e) {
      console.log("Falha ao tocar Welcome.mp3", e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // ao focar, toca a música
      startBackgroundMusic();

      // ao desfocar, para
      return () => {
        stopAndUnload();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      callback();
      fadeIn();
    });
  };

  const handleNext = async () => {
    if (slideAtual === slides.length - 1) {
      // Salvar que o usuário já visualizou a intro
      await AsyncStorage.setItem("@leva_mais:intro_viewed", "true");
      navigation.navigate("SignIn");
    } else {
      fadeOut(() => setSlideAtual(slideAtual + 1));
    }
  };

  const handlePrev = () => {
    if (slideAtual > 0) {
      fadeOut(() => setSlideAtual(slideAtual - 1));
    }
  };

  return (
    <View className="flex-1 bg-brand-dark">
      <ImageBackground
        source={slides[slideAtual].image}
        className="flex-1 justify-end"
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", theme.COLORS.BRAND_DARK]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "90%", // Gradiente ocupa 90% da altura para suavizar bem
          }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }} // Ajuste para controlar onde o preto fica sólido
        />

        <View className="flex-1">
          {/* Espaço vazio para deixar a imagem aparecer */}
        </View>

        {/* Container de conteúdo com fundo sólido removido e integrado ao gradiente visualmente */}
        <View className="px-6 pb-10 items-center">
          <Animated.View
            style={{ opacity: fadeAnim }}
            className="items-center w-full"
          >
            <Text className="text-3xl font-bold text-center text-white mb-4 tracking-tight drop-shadow-md">
              {slides[slideAtual].title}
            </Text>
            <Text className="text-base font-regular text-gray-300 text-center leading-relaxed px-6 mb-10 drop-shadow-sm">
              {slides[slideAtual].description}
            </Text>
          </Animated.View>

          {/* Dots Indicator */}
          <View className="flex-row justify-center items-center mb-8">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`
                    h-2 rounded-full mx-1 transition-all duration-300
                    ${index === slideAtual ? "w-8 bg-brand-light" : "w-2 bg-gray-500"}
                  `}
              />
            ))}
          </View>

          {/* Buttons Container */}
          <View className="flex-row items-center justify-between w-full gap-4">
            <TouchableOpacity
              className={`
                  flex-1 py-4 rounded-xl items-center border border-gray-500
                  ${slideAtual === 0 ? "opacity-0" : "opacity-100"}
                `}
              onPress={handlePrev}
              disabled={slideAtual === 0}
            >
              <Text className="text-gray-200 font-bold text-base">Voltar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center bg-brand-light shadow-lg shadow-brand-light/20"
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text className="text-brand-dark font-bold text-base">
                {slideAtual === slides.length - 1 ? "Começar" : "Próximo"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
