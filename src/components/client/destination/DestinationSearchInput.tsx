import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { MapPin, Search, X, Navigation, History } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "@/theme";
import googlePlacesService, {
  PlaceAutocompleteResult,
  PlaceDetails,
} from "@/services/googlePlaces.service";

interface DestinationSearchInputProps {
  originText: string;
  destinationText: string;
  onDestinationChange: (txt: string) => void;
  onSelectDestination: (details: PlaceDetails) => void;
}

export const DestinationSearchInput = ({
  originText = "Local atual",
  destinationText,
  onDestinationChange,
  onSelectDestination,
}: DestinationSearchInputProps) => {
  const [results, setResults] = useState<PlaceAutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDrop, setShowDrop] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const trimmed = destinationText.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setShowDrop(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setShowDrop(true);
      try {
        const r = await googlePlacesService.searchPlaces(trimmed);
        setResults(r);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [destinationText]);

  const handleSelect = async (item: PlaceAutocompleteResult) => {
    try {
      setLoading(true);
      setShowDrop(false);
      Keyboard.dismiss();
      const details = await googlePlacesService.getPlaceDetails(item.placeId);
      if (details) {
        onDestinationChange(details.formattedAddress);
        onSelectDestination(details);
      }
    } catch (e) {
      console.log("Search input select error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 500, delay: 100 }}
      style={styles.wrapper}
    >
      <BlurView intensity={50} tint="dark" style={styles.glassPanel}>
        {/* Origin Display Row */}
        <View style={styles.row}>
          <View style={styles.indicatorWrapper}>
            <View style={[styles.dot, styles.originDot]} />
            <View style={styles.dashedLine} />
          </View>
          
          <View style={styles.inputWrapper}>
            <TextInput
              value={originText}
              editable={false}
              style={[styles.input, styles.inputDisabled]}
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <Navigation size={16} color={colors.primary[400]} style={styles.endIcon} />
          </View>
        </View>

        {/* Destination Input Row */}
        <View style={[styles.row, { marginTop: spacing.sm }]}>
          <View style={styles.indicatorWrapper}>
            <MapPin size={18} color={colors.error || "#ef4444"} style={{ marginTop: 4 }} />
          </View>

          <View style={[styles.inputWrapper, styles.activeInput]}>
            <TextInput
              ref={searchInputRef}
              value={destinationText}
              onChangeText={onDestinationChange}
              placeholder="Para onde vamos?"
              placeholderTextColor={colors.text.secondary}
              style={styles.input}
              autoFocus
              returnKeyType="search"
            />
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary[500]} style={styles.endIcon} />
            ) : destinationText.length > 0 ? (
              <TouchableOpacity onPress={() => onDestinationChange("")} style={styles.endIcon}>
                <X size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            ) : (
              <Search size={16} color={colors.text.secondary} style={styles.endIcon} />
            )}
          </View>
        </View>
      </BlurView>

      {/* Dropdown Results */}
      <AnimatePresence>
        {showDrop && results.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: -10, height: 0 }}
            animate={{ opacity: 1, translateY: 0, height: 300 }}
            exit={{ opacity: 0, height: 0 }}
            style={styles.dropdownContainer}
          >
            <BlurView intensity={80} tint="dark" style={styles.resultsBlur}>
              <FlatList
                data={results}
                keyExtractor={(item) => item.placeId}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    style={styles.resultItem}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyIconWrapper}>
                      <History size={16} color={colors.text.tertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mainText} numberOfLines={1}>{item.mainText}</Text>
                      <Text style={styles.subText} numberOfLines={1}>{item.secondaryText}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </BlurView>
          </MotiView>
        )}
      </AnimatePresence>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    zIndex: 90,
  },
  glassPanel: {
    borderRadius: borderRadius.xl,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: spacing.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorWrapper: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  originDot: {
    backgroundColor: colors.primary[500],
  },
  dashedLine: {
    width: 1,
    flex: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 4,
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  activeInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.2)",
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.sm,
    height: "100%",
    padding: 0,
  },
  inputDisabled: {
    color: "rgba(255,255,255,0.6)",
  },
  endIcon: {
    marginLeft: spacing.sm,
  },
  dropdownContainer: {
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: borderRadius.xl,
  },
  resultsBlur: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  historyIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  mainText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  subText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    marginHorizontal: spacing.md,
  }
});
