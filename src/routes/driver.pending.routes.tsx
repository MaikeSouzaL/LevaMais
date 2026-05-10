import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DriverAnalysisScreen from "@/screens/(public)/Analysis";

const { Navigator, Screen } = createNativeStackNavigator();

export default function DriverPendingRoutes() {
  return (
    <Navigator
      screenOptions={{ headerShown: false, animation: "fade" }}
      initialRouteName="DriverAnalysis"
    >
      <Screen 
        name="DriverAnalysis" 
        component={DriverAnalysisScreen} 
        initialParams={{ isDirectEntry: true }} 
      />
    </Navigator>
  );
}
