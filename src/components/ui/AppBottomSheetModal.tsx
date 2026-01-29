import React, { forwardRef, useMemo } from "react";
import type { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

export type AppBottomSheetModalRef = BottomSheetModal;

type CommonProps = {
  /** Use ref to call present()/dismiss(). */
  snapPoints: Array<string | number>;
  enablePanDownToClose?: boolean;
  enableHandlePanningGesture?: boolean;
  enableContentPanningGesture?: boolean;
  onDismiss?: () => void;

  backgroundColor?: string;
  handleIndicatorColor?: string;

  /** Adds padding at bottom; useful when there are fixed buttons */
  contentPaddingBottom?: number;
  contentPaddingHorizontal?: number;
  contentPaddingTop?: number;

  /** Backdrop is typically used in modals */
  backdropEnabled?: boolean;
  backdropPressBehavior?: "none" | "close" | "collapse";

  style?: StyleProp<ViewStyle>;
};

type ViewModeProps = {
  type?: "view";
  children: ReactNode;
  scrollProps?: never;
};

type ScrollModeProps = {
  type: "scroll";
  children: ReactNode;
  scrollProps?: Omit<
    React.ComponentProps<typeof BottomSheetScrollView>,
    "children"
  >;
};

type Props = CommonProps & (ViewModeProps | ScrollModeProps);

export const AppBottomSheetModal = forwardRef<AppBottomSheetModalRef, Props>(
  (
    {
      snapPoints,
      enablePanDownToClose = true,
      enableHandlePanningGesture,
      enableContentPanningGesture,
      onDismiss,
      backgroundColor = "#111816",
      handleIndicatorColor = "rgba(255,255,255,0.2)",
      contentPaddingBottom = 24,
      contentPaddingHorizontal = 16,
      contentPaddingTop = 8,
      backdropEnabled = true,
      backdropPressBehavior = "close",
      style,
      type = "view",
      children,
      scrollProps,
    },
    ref,
  ) => {
    const memoSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    const renderBackdrop = (props: BottomSheetBackdropProps) => {
      if (!backdropEnabled) return null;
      return (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={backdropPressBehavior}
        />
      );
    };

    const contentStyle = {
      flexGrow: 1,
      paddingBottom: contentPaddingBottom,
      paddingHorizontal: contentPaddingHorizontal,
      paddingTop: contentPaddingTop,
    } as const;

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={memoSnapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableHandlePanningGesture={enableHandlePanningGesture}
        enableContentPanningGesture={enableContentPanningGesture}
        onDismiss={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor }}
        handleIndicatorStyle={{ backgroundColor: handleIndicatorColor }}
        style={style}
      >
        {type === "scroll" ? (
          <BottomSheetScrollView
            {...scrollProps}
            contentContainerStyle={[
              contentStyle,
              scrollProps?.contentContainerStyle,
            ]}
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={contentStyle}>{children}</BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

AppBottomSheetModal.displayName = "AppBottomSheetModal";
