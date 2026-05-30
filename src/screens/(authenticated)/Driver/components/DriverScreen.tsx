import React from "react";
import { DriverScreenWrapper, DriverScreenWrapperProps } from "@/components/driver/layout/DriverScreenWrapper";

/**
 * @deprecated Use DriverScreenWrapper from @/components/driver/layout/DriverScreenWrapper directly.
 * Kept for backward compatibility with existing screens.
 */
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
  return (
    <DriverScreenWrapper
      title={title}
      headerRight={headerRight}
      padded={padded}
      scroll={scroll}
      hideHeader={hideHeader}
    >
      {children}
    </DriverScreenWrapper>
  );
}
