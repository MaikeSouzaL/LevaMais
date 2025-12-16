import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import IntroScreen from "../screens/(public)/IntroScreen";
import SingnIn from "../screens/(public)/SignInScreen";
import SingnUp from "../screens/(public)/SignUpScreen";
// import Terms from "../screens/(public)/TermsScreen";
// import theme from "../theme";
// import Notificacoes from "../screens/ScreenClient/Notificacao/Notificacoes";
// import EsqueciSenhaScreen from "../screens/(public)/esqueciSenhaScreen/EsqueciSenhaScreen";
// import VerificarCodigoScreen from "../screens/(public)/verificarCodigoScreen/verificarCodigoScreen";
// import PerfilScreen from "../screens/(public)/PerfilScreen";
// import NovaSenhaScreen from "../screens/(public)/novaSenhaScreen/novaSenhaScreen";
// import TermsScreen from "../screens/(public)/TermsScreen";

const { Navigator, Screen } = createNativeStackNavigator();

export default function AuthRoutes() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="IntroScreen" component={IntroScreen} />
      <Screen name="SignIn" component={SingnIn} />
      <Screen
        name="SignUp"
        component={SingnUp}
      />
      {/* <Screen name="PerfilScreen" component={PerfilScreen} />
      <Screen name="EsqueciSenhaScreen" component={EsqueciSenhaScreen} />
      <Screen name="NovaSenhaScreen" component={NovaSenhaScreen} />
      <Screen name="VerificarCodigoScreen" component={VerificarCodigoScreen} />
      <Screen name="TermsScreen" component={TermsScreen} /> */}
    </Navigator>
  );
}
