import React, { forwardRef, useMemo } from "react";
import type { ReactNode } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

export type AppBottomSheetRef = BottomSheet;

type CommonProps = {
  /** Use -1 for hidden, 0..n for visible */
  index?: number;
  snapPoints: Array<string | number>;
  enablePanDownToClose?: boolean;
  enableHandlePanningGesture?: boolean;
  enableContentPanningGesture?: boolean;
  onClose?: () => void;

  backgroundColor?: string;
  handleIndicatorColor?: string;

  /** Adds padding at bottom; useful when there are fixed buttons */
  contentPaddingBottom?: number;
  contentPaddingHorizontal?: number;
  contentPaddingTop?: number;

  /** Optional custom backdrop; by default it shows from index 0 */
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

export const AppBottomSheet = forwardRef<AppBottomSheetRef, Props>(
  (
    {
      index = 0,
      snapPoints,
      enablePanDownToClose = false,
      enableHandlePanningGesture,
      enableContentPanningGesture,
      onClose,
      backgroundColor = "#111816",
      handleIndicatorColor = "rgba(255,255,255,0.2)",
      contentPaddingBottom = 24,
      contentPaddingHorizontal = 16,
      contentPaddingTop = 8,
      backdropEnabled = false,
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
      flex: 1,
      paddingBottom: contentPaddingBottom,
      paddingHorizontal: contentPaddingHorizontal,
      paddingTop: contentPaddingTop,
    } as const;

    return (
      <BottomSheet
        ref={ref}
        index={index}
        snapPoints={memoSnapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableHandlePanningGesture={enableHandlePanningGesture}
        enableContentPanningGesture={enableContentPanningGesture}
        onClose={onClose}
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
      </BottomSheet>
    );
  },
);

AppBottomSheet.displayName = "AppBottomSheet";
