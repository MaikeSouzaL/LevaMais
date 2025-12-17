import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import theme from "../../theme";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = "weak" | "medium" | "strong" | "very-strong";

interface PasswordRequirements {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

function calculatePasswordStrength(
  password: string
): { level: StrengthLevel; requirements: PasswordRequirements } {
  const requirements: PasswordRequirements = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;

  let level: StrengthLevel = "weak";

  if (password.length === 0) {
    level = "weak";
  } else if (password.length < 6) {
    level = "weak";
  } else if (password.length < 8 || metRequirements < 3) {
    level = "weak";
  } else if (metRequirements === 3) {
    level = "medium";
  } else if (metRequirements === 4) {
    level = "strong";
  } else if (metRequirements === 5 && password.length >= 8) {
    level = "very-strong";
  }

  return { level, requirements };
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const { level, requirements } = calculatePasswordStrength(password);

  const strengthConfig = {
    weak: {
      color: "#ef4444",
      label: "Fraca",
      width: "25%",
    },
    medium: {
      color: "#f59e0b",
      label: "Média",
      width: "50%",
    },
    strong: {
      color: "#3b82f6",
      label: "Forte",
      width: "75%",
    },
    "very-strong": {
      color: "#10b981",
      label: "Muito Forte",
      width: "100%",
    },
  };

  const config = strengthConfig[level];

  if (password.length === 0) {
    return null;
  }

  return (
    <View className="mt-3">
      {/* Barra de força */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-400 text-xs font-semibold">
            Força da senha
          </Text>
          <Text
            className="text-xs font-bold"
            style={{ color: config.color }}
          >
            {config.label}
          </Text>
        </View>
        <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: config.color,
              width: config.width,
            }}
          />
        </View>
      </View>

      {/* Requisitos */}
      <View>
        <Text className="text-gray-400 text-xs font-semibold mb-2">
          Requisitos:
        </Text>
        <View>
          <View className="mb-1.5">
            <RequirementItem
              met={requirements.hasMinLength}
              text="Pelo menos 8 caracteres"
            />
          </View>
          <View className="mb-1.5">
            <RequirementItem
              met={requirements.hasUpperCase}
              text="Uma letra maiúscula"
            />
          </View>
          <View className="mb-1.5">
            <RequirementItem
              met={requirements.hasLowerCase}
              text="Uma letra minúscula"
            />
          </View>
          <View className="mb-1.5">
            <RequirementItem met={requirements.hasNumber} text="Um número" />
          </View>
          <View className="mb-1.5">
            <RequirementItem
              met={requirements.hasSpecialChar}
              text="Um caractere especial (!@#$%...)"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function RequirementItem({
  met,
  text,
}: {
  met: boolean;
  text: string;
}) {
  return (
    <View className="flex-row items-center">
      <View
        className={`w-4 h-4 rounded-full items-center justify-center mr-2 ${
          met ? "bg-brand-light" : "border-2 border-gray-600"
        }`}
      >
        {met && (
          <Feather name="check" size={12} color={theme.COLORS.WHITE} />
        )}
      </View>
      <Text
        className={`text-xs ${
          met ? "text-gray-300" : "text-gray-500"
        }`}
      >
        {text}
      </Text>
    </View>
  );
}

