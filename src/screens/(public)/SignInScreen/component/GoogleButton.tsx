import React from 'react';
import { TouchableOpacity, Text, Image } from 'react-native';

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
}

export default function GoogleButton({ onPress, loading }: GoogleButtonProps) {
  return (
    <TouchableOpacity
      className="h-14 bg-white rounded-xl flex-row items-center justify-center border border-slate-200 shadow-sm"
      onPress={onPress}
      disabled={loading}
    >
      <Image
        source={{ uri: 'https://www.google.com/favicon.ico' }}
        className="w-6 h-6 mr-3"
      />
      <Text className="text-slate-800 font-semibold text-base">
        {loading ? 'Conectando...' : 'Continuar com Google'}
      </Text>
    </TouchableOpacity>
  );
}