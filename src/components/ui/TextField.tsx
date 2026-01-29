import React from "react";
import { View, Text, TextInput } from "react-native";

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
};

export default function TextField(props: TextFieldProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
        {props.label}
      </Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        keyboardType={props.keyboardType}
        multiline={props.multiline}
        style={{
          color: "#fff",
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: 12,
          minHeight: props.multiline ? 96 : 46,
          textAlignVertical: props.multiline ? "top" : "auto",
        }}
      />
    </View>
  );
}
