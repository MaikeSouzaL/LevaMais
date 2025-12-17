import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import theme from "../../../theme";
import Step1Data from "./Step1Data";
import Step2Address from "./Step2Address";
import Step3Preferences from "./Step3Preferences";
import type { RegistrationData } from "../../../types/registration";

type Step = 1 | 2 | 3;

interface CompleteRegistrationParams {
  user: {
    _id?: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    city?: string;
    userType?: string;
    googleId?: string;
    profilePhoto?: string;
    acceptedTerms: boolean;
  };
  userType: "client" | "driver";
}

export default function CompleteRegistrationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const params = route.params as CompleteRegistrationParams | undefined;
  const [registrationData, setRegistrationData] = useState<RegistrationData>(
    () => {
      if (!params) {
        // Fallback caso não tenha params
        return {
          name: "",
          email: "",
          phone: "",
          documentType: "cpf",
          password: "",
          userType: "client",
          acceptedTerms: false,
        };
      }
      return {
        name: params.user.name || "",
        email: params.user.email || "",
        phone: params.user.phone || "",
        documentType: "cpf",
        password: params.user.password,
        userType: params.userType || "client",
        acceptedTerms: params.user.acceptedTerms,
        city: params.user.city, // Preservar cidade se existir
      };
    }
  );

  function updateRegistrationData(data: Partial<RegistrationData>) {
    setRegistrationData((prev) => {
      const updated = { ...prev, ...data };
      console.log("updateRegistrationData - Dados atualizados:", updated);
      return updated;
    });
  }

  function handleNext() {
    if (currentStep < 3) {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) as Step;
        console.log(`Navegando do step ${prev} para o step ${nextStep}`);
        return nextStep;
      });
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      navigation.goBack();
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 1:
        return (
          <Step1Data
            data={registrationData}
            onUpdate={updateRegistrationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <Step2Address
            data={registrationData}
            onUpdate={updateRegistrationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3Preferences
            data={registrationData}
            onUpdate={updateRegistrationData}
            onFinish={() => {
              // O Step3Preferences já salva no banco e atualiza o Zustand
              // O Routes/index.tsx redireciona automaticamente para DrawerClienteRoutes
              // quando userType === "client" e isAuthenticated === true
            }}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {renderStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
