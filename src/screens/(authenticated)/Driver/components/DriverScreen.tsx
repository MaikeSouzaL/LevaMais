import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DriverHeader from "./DriverHeader";

export type DriverScreenProps = {
  title: string;
  headerRight?: React.ReactNode;
  /** Default: true */
  padded?: boolean;
  /** Default: false */
  scroll?: boolean;
  children: React.ReactNode;
};

export function DriverScreen({
  title,
  headerRight,
  padded = true,
  scroll = false,
  children,
}: DriverScreenProps) {
  const content = (
    <View style={{ padding: padded ? 16 : 0, gap: padded ? 12 : 0 }}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader title={title} right={headerRight} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={{
            padding: padded ? 16 : 0,
            gap: padded ? 12 : 0,
          }}
        >
          {children}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
