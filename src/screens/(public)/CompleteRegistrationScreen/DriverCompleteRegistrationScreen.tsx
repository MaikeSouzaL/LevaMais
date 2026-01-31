import React, { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import Step1Data from "./Step1Data";
import Step2Vehicle from "./Step2Vehicle";
import Step3DriverLocation from "./Step3DriverLocation";
import type { RegistrationData } from "../../../types/registration";

type Step = 1 | 2 | 3;

type CompleteRegistrationDriverParams = {
  user?: {
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
  selectedProfile?: string;
};

export default function DriverCompleteRegistrationScreen() {
  const navigation = useNavigation();

  const route = useRoute();
  const { user } = (route.params ?? {}) as CompleteRegistrationDriverParams;

  const [currentStep, setCurrentStep] = useState<Step>(1);

  const [registrationData, setRegistrationData] = useState<RegistrationData>(
    () => ({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      documentType: "cpf",
      password: user?.password ?? "",
      userType: "driver",
      acceptedTerms: user?.acceptedTerms ?? false,
      city: user?.city,
      googleId: user?.googleId,
      profilePhoto: user?.profilePhoto,
    }),
  );

  function updateRegistrationData(data: Partial<RegistrationData>) {
    setRegistrationData((prev) => ({
      ...prev,
      ...data,
      userType: "driver",
    }));
  }

  console.log("Registration Data:", JSON.stringify(registrationData, null, 2));

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
          <Step2Vehicle
            data={registrationData}
            onUpdate={updateRegistrationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3DriverLocation
            data={registrationData}
            onUpdate={updateRegistrationData}
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
