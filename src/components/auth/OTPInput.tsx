import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { borderRadius } from '../../theme/dimensions';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  cellCount?: number;
}

export function OTPInput({ value, onChange, cellCount = 6 }: OTPInputProps) {
  const ref = useBlurOnFulfill({ value, cellCount });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue: onChange,
  });

  return (
    <View style={styles.root}>
      <CodeField
        ref={ref}
        {...props}
        value={value}
        onChangeText={onChange}
        cellCount={cellCount}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        renderCell={({ index, symbol, isFocused }) => (
          <MotiView
            key={index}
            onLayout={getCellOnLayoutHandler(index)}
            animate={{
              borderColor: isFocused 
                ? colors.primary[500] 
                : symbol 
                  ? colors.text.tertiary 
                  : colors.border.light,
              scale: isFocused ? 1.05 : 1,
              backgroundColor: isFocused 
                ? colors.background.tertiary 
                : colors.background.secondary,
            }}
            transition={{ type: 'timing', duration: 150 }}
            style={styles.cell}
          >
            <Text style={[styles.cellText, isFocused && { color: colors.primary[500] }]}>
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
            
            {/* Subtle inner glow when focused */}
            {isFocused && (
              <MotiView 
                from={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: colors.primary[500], borderRadius: borderRadius.lg }
                ]}
              />
            )}
          </MotiView>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    marginBottom: 32,
  },
  codeFieldRoot: {
    justifyContent: 'center',
    gap: 8,
  },
  cell: {
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cellText: {
    color: colors.text.primary,
    fontSize: 24,
    fontFamily: fonts.bold,
    textAlign: 'center',
    fontWeight: '800',
  },
});
