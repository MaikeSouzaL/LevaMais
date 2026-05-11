import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import IntroScreen from "../screens/(public)/IntroScreen";
import SingnIn from "../screens/(public)/SignInScreen";
import SingnUp from "../screens/(public)/SignUpScreen";
import SelectProfileScreen from "../screens/(public)/SelectProfileScreen";
import ForgotPasswordScreen from "../screens/(public)/ForgotPasswordScreen";
import VerifyCodeScreen from "../screens/(public)/VerifyCodeScreen";
import NewPasswordScreen from "../screens/(public)/NewPasswordScreen";
import TermsScreen from "../screens/(public)/TermsScreen";
import NotificationPermissionScreen from "../screens/(public)/NotificationPermissionScreen";
import PhoneVerificationScreen from "../screens/(public)/PhoneVerificationScreen";
import GooglePhonePromptScreen from "../screens/(public)/GooglePhonePromptScreen";
import DriverIntroScreen from "../screens/(public)/DriverIntroScreen";
import DriverCategoryScreen from "../screens/(public)/DriverCategoryScreen";
import DriverDocumentsScreen from "../screens/(public)/DriverDocumentsScreen";
import DriverSelfieScreen from "../screens/(public)/DriverSelfieScreen";
import DriverAnalysisScreen from "@/screens/(public)/Analysis";  
// import Terms from "../screens/(public)/TermsScreen";
// import Notificacoes from "../screens/ScreenClient/Notificacao/Notificacoes";
// import EsqueciSenhaScreen from "../screens/(public)/esqueciSenhaScreen/EsqueciSenhaScreen";
// import VerificarCodigoScreen from "../screens/(public)/verificarCodigoScreen/verificarCodigoScreen";
// import PerfilScreen from "../screens/(public)/PerfilScreen";
// import NovaSenhaScreen from "../screens/(public)/novaSenhaScreen/novaSenhaScreen";
// import TermsScreen from "../screens/(public)/TermsScreen";

const { Navigator, Screen } = createNativeStackNavigator();

export default function AuthRoutes() {
  return (
    <Navigator
      screenOptions={{ 
        headerShown: false,
        animation: "slide_from_right" 
      }}
      initialRouteName="IntroScreen"
    >
      <Screen name="IntroScreen" component={IntroScreen} />
      <Screen name="SignIn" component={SingnIn} />
      <Screen name="SignUp" component={SingnUp} />
      <Screen name="GooglePhonePrompt" component={GooglePhonePromptScreen} />
      <Screen name="SelectProfile" component={SelectProfileScreen} />
      <Screen name="DriverIntro" component={DriverIntroScreen} />
      <Screen name="DriverCategory" component={DriverCategoryScreen} />
      <Screen name="DriverDocuments" component={DriverDocumentsScreen} />
      <Screen name="DriverSelfie" component={DriverSelfieScreen} />
      <Screen name="DriverAnalysis" component={DriverAnalysisScreen} />
      <Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Screen name="NewPassword" component={NewPasswordScreen} />
      <Screen name="Terms" component={TermsScreen} />
      <Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Screen
        name="NotificationPermission"
        component={NotificationPermissionScreen}
      />
      {/* <Screen name="PerfilScreen" component={PerfilScreen} /> */}
    </Navigator>
  );
}
