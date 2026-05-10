import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { MotiView } from 'moti';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { fonts, fontSize } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/dimensions';

interface AuthInputProps<T extends FieldValues> extends TextInputProps {
  name: Path<T>;
  control: Control<T>;
  icon?: LucideIcon;
  error?: string;
  label?: string;
}

export function AuthInput<T extends FieldValues>({
  name,
  control,
  icon: Icon,
  error,
  label,
  ...rest
}: AuthInputProps<T>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <MotiView
            animate={{
              borderColor: error 
                ? colors.error 
                : isFocused 
                  ? colors.primary[500] 
                  : colors.border.light,
              backgroundColor: isFocused 
                ? colors.background.tertiary 
                : colors.background.secondary,
            }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.inputWrapper}
          >
            {Icon && (
              <MotiView 
                animate={{ opacity: isFocused ? 1 : 0.6 }}
                style={styles.iconContainer}
              >
                <Icon size={20} color={isFocused ? colors.primary[500] : colors.text.tertiary} />
              </MotiView>
            )}
            
            <TextInput
              style={[styles.input, { paddingLeft: Icon ? 12 : 16 }]}
              placeholderTextColor={colors.text.disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                onBlur();
              }}
              onChangeText={onChange}
              value={value}
              autoCapitalize="none"
              {...rest}
            />
          </MotiView>
        )}
      />
      
      {error && (
        <MotiView 
          from={{ opacity: 0, translateY: -4 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.errorContainer}
        >
          <Text style={styles.errorText}>{error}</Text>
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  inputWrapper: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    paddingRight: 16,
  },
  errorContainer: {
    marginTop: 4,
    paddingLeft: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
});
