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
  /** Default: false */
  hideHeader?: boolean;
  children: React.ReactNode;
};

export function DriverScreen({
  title,
  headerRight,
  padded = true,
  scroll = false,
  hideHeader = false,
  children,
}: DriverScreenProps) {
  // If we are hiding our custom header, we assume a standard navigator header is visible,
  // in which case we do not need safe area padding at the top edge.
  const safeAreaEdges: Array<'top' | 'bottom' | 'left' | 'right'> = hideHeader
    ? ['bottom', 'left', 'right']
    : ['top', 'bottom', 'left', 'right'];

  return (
    <SafeAreaView edges={safeAreaEdges} style={{ flex: 1, backgroundColor: "#091A2F" }}>
      {!hideHeader && <DriverHeader title={title} right={headerRight} />}
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
        <View style={{ flex: 1, padding: padded ? 16 : 0, gap: padded ? 12 : 0 }}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

