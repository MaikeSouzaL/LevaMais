import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

import IntroScreen from "../screens/(public)/IntroScreen";
import SingnIn from "../screens/(public)/SignInScreen";
import SingnUp from "../screens/(public)/SignUpScreen";
import SelectProfileScreen from "../screens/(public)/SelectProfileScreen";
import CompleteRegistrationScreen from "../screens/(public)/CompleteRegistrationScreen";
import ForgotPasswordScreen from "../screens/(public)/ForgotPasswordScreen";
import VerifyCodeScreen from "../screens/(public)/VerifyCodeScreen";
import NewPasswordScreen from "../screens/(public)/NewPasswordScreen";
import TermsScreen from "../screens/(public)/TermsScreen";
import NotificationPermissionScreen from "../screens/(public)/NotificationPermissionScreen";
import theme from "../theme";
// import Terms from "../screens/(public)/TermsScreen";
// import Notificacoes from "../screens/ScreenClient/Notificacao/Notificacoes";
// import EsqueciSenhaScreen from "../screens/(public)/esqueciSenhaScreen/EsqueciSenhaScreen";
// import VerificarCodigoScreen from "../screens/(public)/verificarCodigoScreen/verificarCodigoScreen";
// import PerfilScreen from "../screens/(public)/PerfilScreen";
// import NovaSenhaScreen from "../screens/(public)/novaSenhaScreen/novaSenhaScreen";
// import TermsScreen from "../screens/(public)/TermsScreen";

const { Navigator, Screen } = createNativeStackNavigator();

export default function AuthRoutes() {
  const [hasViewedIntro, setHasViewedIntro] = useState<boolean | null>(null);
  const [initialRoute, setInitialRoute] = useState<string>("IntroScreen");

  useEffect(() => {
    async function checkIntroStatus() {
      try {
        const introViewed = await AsyncStorage.getItem(
          "@leva_mais:intro_viewed"
        );
        if (introViewed === "true") {
          setHasViewedIntro(true);
          setInitialRoute("SignIn");
        } else {
          setHasViewedIntro(false);
          setInitialRoute("IntroScreen");
        }
      } catch (error) {
        console.error("Erro ao verificar status da intro:", error);
        setHasViewedIntro(false);
        setInitialRoute("IntroScreen");
      }
    }

    checkIntroStatus();
  }, []);

  // Mostrar loading enquanto verifica
  if (hasViewedIntro === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.COLORS.BRAND_DARK,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.COLORS.BRAND_LIGHT} />
      </View>
    );
  }

  return (
    <Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <Screen name="IntroScreen" component={IntroScreen} />
      <Screen name="SignIn" component={SingnIn} />
      <Screen name="SignUp" component={SingnUp} />
      <Screen name="SelectProfile" component={SelectProfileScreen} />
      <Screen
        name="CompleteRegistration"
        component={CompleteRegistrationScreen}
      />
      <Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Screen name="NewPassword" component={NewPasswordScreen} />
      <Screen name="Terms" component={TermsScreen} />
      <Screen
        name="NotificationPermission"
        component={NotificationPermissionScreen}
      />
      {/* <Screen name="PerfilScreen" component={PerfilScreen} /> */}
    </Navigator>
  );
}
