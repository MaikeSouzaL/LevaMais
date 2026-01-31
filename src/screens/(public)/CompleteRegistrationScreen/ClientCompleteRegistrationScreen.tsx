import React, { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import Step1Data from "./Step1Data";
import Step2Address from "./Step2Address";
import Step3Preferences from "./Step3Preferences";
import type { RegistrationData } from "../../../types/registration";

type Step = 1 | 2 | 3;

type CompleteRegistrationParams = {
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
  token?: string;
};

export default function ClientCompleteRegistrationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as CompleteRegistrationParams | undefined;

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [registrationData, setRegistrationData] = useState<RegistrationData>(
    () => {
      if (!params?.user) {
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
        userType: "client",
        acceptedTerms: params.user.acceptedTerms,
        city: params.user.city,
        googleId: params.user.googleId,
        profilePhoto: params.user.profilePhoto,
      };
    },
  );

  function updateRegistrationData(data: Partial<RegistrationData>) {
    setRegistrationData((prev) => ({ ...prev, ...data, userType: "client" }));
  }

  function handleNext() {
    if (currentStep < 3) setCurrentStep((prev) => (prev + 1) as Step);
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
    else navigation.goBack();
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
              // Step3Preferences salva e atualiza o Zustand
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
