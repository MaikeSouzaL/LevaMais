import "./global.css";
import { StatusBar } from "react-native";
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import Loading from "./src/components/Loading";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import Routes from "./src/routes";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function App() {
  const [fontsLoaded] = useFonts({ 
    Roboto_400Regular, 
    Roboto_700Bold 
  });

  if (!fontsLoaded) return <Loading />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <NavigationContainer>
          <SafeAreaView className="flex-1 bg-brand-dark">
              <BottomSheetModalProvider>
                <Routes />
                <Toast />
              </BottomSheetModalProvider>
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
