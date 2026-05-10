import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import theme from '../../theme';

const { width, height } = Dimensions.get('window');

export const BackgroundMap = () => {
  return (
    <View style={StyleSheet.absoluteFill} className="opacity-30">
      <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.COLORS.SURFACE_SECONDARY} stopOpacity="0.2" />
            <Stop offset="50%" stopColor={theme.COLORS.BRAND_MID} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={theme.COLORS.SURFACE_SECONDARY} stopOpacity="0.2" />
          </LinearGradient>
        </Defs>
        
        <G stroke="url(#lineGrad)" strokeWidth="0.5">
          <Path d={`M -20 ${height * 0.2} L ${width * 0.3} ${height * 0.1} L ${width * 0.4} ${height * 0.4} L ${width + 20} ${height * 0.3}`} fill="none" />
          <Path d={`M -50 ${height * 0.4} L ${width * 0.2} ${height * 0.45} L ${width * 0.5} ${height * 0.2} L ${width * 0.8} ${height * 0.5} L ${width + 20} ${height * 0.4}`} fill="none" />
          <Path d={`M ${width * 0.2} -20 L ${width * 0.25} ${height * 0.3} L ${width * 0.1} ${height * 0.6} L ${width * 0.3} ${height * 0.8} L ${width * 0.4} ${height + 20}`} fill="none" />
          <Path d={`M ${width * 0.6} -20 L ${width * 0.55} ${height * 0.4} L ${width * 0.7} ${height * 0.7} L ${width * 0.6} ${height + 20}`} fill="none" />
          <Path d={`M ${width * 0.85} -20 L ${width * 0.9} ${height * 0.3} L ${width * 0.75} ${height * 0.5} L ${width * 0.9} ${height * 0.8} L ${width * 0.8} ${height + 20}`} fill="none" />
          <Path d={`M -20 ${height * 0.65} L ${width * 0.3} ${height * 0.6} L ${width * 0.7} ${height * 0.75} L ${width + 20} ${height * 0.6}`} fill="none" />
          <Path d={`M -20 ${height * 0.85} L ${width * 0.4} ${height * 0.8} L ${width * 0.5} ${height * 0.9} L ${width + 20} ${height * 0.75}`} fill="none" />
        </G>
        
        <Circle cx={width * 0.3} cy={height * 0.1} r="1.5" fill={theme.COLORS.BRAND_MID} opacity={0.4} />
        <Circle cx={width * 0.2} cy={height * 0.45} r="1.5" fill={theme.COLORS.BRAND_MID} opacity={0.4} />
        <Circle cx={width * 0.7} cy={height * 0.75} r="1.5" fill={theme.COLORS.BRAND_MID} opacity={0.4} />
        <Circle cx={width * 0.55} cy={height * 0.4} r="1.5" fill={theme.COLORS.BRAND_MID} opacity={0.4} />
      </Svg>
    </View>
  );
};
