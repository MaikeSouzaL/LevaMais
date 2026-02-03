/**
 * SearchBar - Barra de busca moderna
 * Baseada no padrão do Uber e 99
 */

import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/theme';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: () => void;
  onClear?: () => void;
  loading?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSubmit,
  onClear,
  loading = false,
  editable = true,
  autoFocus = false,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      {/* Search Icon */}
      <MaterialIcons
        name="search"
        size={24}
        color={colors.text.tertiary}
        style={styles.searchIcon}
      />

      {/* Input */}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        editable={editable}
        autoFocus={autoFocus}
      />

      {/* Loading or Clear Button */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary[500]}
          style={styles.rightIcon}
        />
      ) : value.length > 0 ? (
        <TouchableOpacity
          onPress={onClear || (() => onChangeText(''))}
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name="close"
            size={20}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
    padding: 0,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
});
