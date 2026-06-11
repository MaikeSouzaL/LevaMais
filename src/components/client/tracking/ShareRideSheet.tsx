import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Share, Platform, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Share2, Copy, MessageCircle, X, Users, Link2 } from 'lucide-react-native';
import rideService from '@/services/ride.service';
import { driverColors, driverRadius } from '@/theme/driverTheme';

interface ShareRideSheetProps {
  rideId: string;
  driverName?: string;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * ShareRideSheet — Modal de compartilhamento de corrida ao vivo.
 *
 * Gera um link público de rastreamento com token temporário e oferece:
 * - Compartilhar via WhatsApp
 * - Compartilhar nativo (Share sheet)
 * - Copiar link
 */
export function ShareRideSheet({ rideId, driverName, isVisible, onClose }: ShareRideSheetProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const generateShareUrl = async () => {
    if (shareUrl) return shareUrl;
    setLoadingUrl(true);
    try {
      // Gera token público via backend
      const result = await rideService.generateShareToken(rideId);
      const url = result?.shareUrl || `https://levamais.app/track/${rideId}?token=${result?.token || 'public'}`;
      setShareUrl(url);
      return url;
    } catch {
      // Fallback: URL simples
      const fallback = `https://levamais.app/track/${rideId}`;
      setShareUrl(fallback);
      return fallback;
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleShare = async () => {
    const url = await generateShareUrl();
    const message = [
      '📍 Estou em uma corrida no Leva Mais!',
      driverName ? `🚗 Motorista: ${driverName}` : '',
      '',
      `Acompanhe em tempo real: ${url}`,
      '',
      'Baixe o app Leva Mais!',
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message });
    } catch {}
  };

  const handleCopyLink = async () => {
    const url = await generateShareUrl();
    // Clipboard is available via expo
    try {
      // expo-clipboard é dependência opcional; importação dinâmica tolerante a ausência de tipos.
      const Clipboard: any = await import('expo-clipboard' as any);
      await (Clipboard.default || Clipboard).setStringAsync(url);
      Alert.alert('Link copiado!', 'O link foi copiado para a área de transferência.');
    } catch {
      Alert.alert('Link', url);
    }
  };

  const handleWhatsApp = async () => {
    const url = await generateShareUrl();
    const text = encodeURIComponent(
      `📍 Estou em uma corrida no Leva Mais!${driverName ? `\n🚗 Motorista: ${driverName}` : ''}\n\nAcompanhe: ${url}`
    );
    const { Linking } = await import('react-native');
    Linking.openURL(`whatsapp://send?text=${text}`);
  };

  if (!isVisible) return null;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={styles.overlay}
    >
      {/* Backdrop */}
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      </TouchableOpacity>

      {/* Sheet */}
      <MotiView
        from={{ opacity: 0, translateY: 200 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 180 }}
        style={styles.sheet}
      >
        {/* Handle */}
        <View style={styles.handle} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={styles.title}>Compartilhar corrida</Text>
            <Text style={styles.subtitle}>Amigos e família podem acompanhar em tempo real</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Share Options */}
        <View style={styles.optionsGrid}>
          <TouchableOpacity style={styles.optionCard} onPress={handleWhatsApp} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: '#25D366' + '20' }]}>
              <MessageCircle size={28} color="#25D366" />
            </View>
            <Text style={styles.optionLabel}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleShare} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: driverColors.accentBg }]}>
              <Share2 size={28} color={driverColors.accent} />
            </View>
            <Text style={styles.optionLabel}>Compartilhar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleCopyLink} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: 'rgba(96,165,250,0.12)' }]}>
              <Link2 size={28} color="#60a5fa" />
            </View>
            <Text style={styles.optionLabel}>Copiar link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleShare} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Users size={28} color="rgba(255,255,255,0.7)" />
            </View>
            <Text style={styles.optionLabel}>Contatos</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy note */}
        <Text style={styles.privacyNote}>
          🔒 O link expira automaticamente quando a corrida terminar. Apenas pessoas com o link podem ver sua localização.
        </Text>
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: driverColors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 44,
    paddingHorizontal: 22,
    borderTopWidth: 1.5,
    borderTopColor: driverColors.border,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: driverColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: driverColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    width: '47%',
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    gap: 10,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    color: driverColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  privacyNote: {
    color: driverColors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
});

export default ShareRideSheet;
