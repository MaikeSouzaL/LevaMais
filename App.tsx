import "./global.css";
import { StatusBar, Platform, View } from "react-native";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";
import { useEffect, useState } from "react";
import * as NavigationBar from "expo-navigation-bar";
import Loading from "./src/components/Loading";
import SplashScreen from "./src/components/SplashScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import Routes from "./src/routes";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  // Mecanismo de segurança (Failsafe): Força a liberação do app após timeout máximo
  // Isso garante que mesmo se uma fonte falhar em baixar, o App não trave eternamente!
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setForceReady(true), 5000); // 5 segundos failsafe
    return () => clearTimeout(timer);
  }, []);

  // Esconder barra de navegação do Android globalmente
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
    }
  }, []);

  // Renderizar o Splash Screen como barreira inicial
  if (splashVisible) {
    return (
      <SplashScreen 
        durationMs={3500} 
        onFinish={() => {
          // Apenas remove a splash se as fontes já estiverem prontas ou timeout atingido
          if (fontsLoaded || forceReady) {
            setSplashVisible(false);
          } else {
            // Tenta novamente em breve
            setTimeout(() => setSplashVisible(false), 500);
          }
        }} 
      />
    );
  }

  // Fallback secundário - Libera o app se as fontes carregarem OU se atingir o failsafe
  if (!fontsLoaded && !forceReady) return <Loading />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <NavigationContainer>
          <BottomSheetModalProvider>
            <Routes />
            <Toast />
          </BottomSheetModalProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
