import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { MotiView } from 'moti';
import { ShieldAlert, Phone, MapPin, Share2, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { driverColors, driverRadius } from '@/theme/driverTheme';

interface SOSButtonProps {
  /** ID da corrida atual */
  rideId?: string;
  /** Endereço atual para compartilhar */
  currentAddress?: string;
  /** Nome do motorista */
  driverName?: string;
  /** Placa do veículo */
  vehiclePlate?: string;
  /** Callback para quando SOS é ativado */
  onSosActivated?: () => void;
}

const EMERGENCY_NUMBERS = [
  { id: 'police', label: 'Polícia', number: '190', color: '#3b82f6', icon: 'phone' },
  { id: 'ambulance', label: 'SAMU', number: '192', color: '#ef4444', icon: 'phone' },
  { id: 'fire', label: 'Bombeiros', number: '193', color: '#f97316', icon: 'phone' },
];

/**
 * SOSButton — Botão de emergência flutuante estilo Uber.
 *
 * Comportamento:
 * 1. Toque rápido: abre modal de emergência com ligações rápidas + compartilhar localização
 * 2. Pressionar longo (futuro): chamada direta para emergência
 */
export function SOSButton({ rideId, currentAddress, driverName, vehiclePlate, onSosActivated }: SOSButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCallEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`);
    onSosActivated?.();
  };

  const handleShareLocation = async () => {
    try {
      let locationText = '';
      try {
        const pos = await Location.getLastKnownPositionAsync();
        if (pos?.coords) {
          locationText = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        }
      } catch {}

      const message = [
        '🚨 ALERTA DE EMERGÊNCIA — Leva Mais',
        '',
        driverName ? `Motorista: ${driverName}` : '',
        vehiclePlate ? `Veículo: ${vehiclePlate}` : '',
        rideId ? `Corrida: ${rideId}` : '',
        currentAddress ? `Endereço: ${currentAddress}` : '',
        locationText ? `\nLocalização: ${locationText}` : '',
      ].filter(Boolean).join('\n');

      await (await import('react-native')).Share.share({ message });
      onSosActivated?.();
    } catch {}
  };

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
        accessibilityLabel="Botão de emergência SOS"
        accessibilityRole="button"
      >
        <View style={styles.floatingInner}>
          <ShieldAlert size={22} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={() => setIsOpen(false)}
        activeOpacity={1}
      >
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} />
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <MotiView
        from={{ opacity: 0, scale: 0.9, translateY: 30 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        style={styles.modal}
      >
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => setIsOpen(false)}>
          <X size={20} color="#fff" />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={styles.sosIcon}>
            <ShieldAlert size={36} color="#ef4444" />
          </View>
          <Text style={styles.sosTitle}>Emergência</Text>
          <Text style={styles.sosSubtitle}>Toque em um número para ligar</Text>
        </View>

        {/* Emergency Numbers */}
        <View style={styles.numbersRow}>
          {EMERGENCY_NUMBERS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.numberCard, { borderColor: item.color + '40', backgroundColor: item.color + '15' }]}
              onPress={() => handleCallEmergency(item.number)}
              activeOpacity={0.7}
            >
              <Phone size={24} color={item.color} />
              <Text style={[styles.numberLabel, { color: item.color }]}>{item.label}</Text>
              <Text style={styles.numberValue}>{item.number}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Share Location */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareLocation} activeOpacity={0.8}>
          <Share2 size={18} color="#FBBF24" />
          <Text style={styles.shareText}>Compartilhar localização</Text>
        </TouchableOpacity>

        {/* Info */}
        {driverName && (
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Motorista: {driverName}</Text>
            {vehiclePlate && <Text style={styles.infoText}> | Placa: {vehiclePlate}</Text>}
          </View>
        )}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    right: 16,
    bottom: 280,
    zIndex: 100,
  },
  floatingInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: '#0D1F35',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239,68,68,0.3)',
    marginBottom: 16,
  },
  sosTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  sosSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  numbersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  numberCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  numberLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  numberValue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
    marginBottom: 16,
  },
  shareText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  infoText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SOSButton;
