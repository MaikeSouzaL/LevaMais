import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View, Text, Image, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Star, Car, Calendar, Camera, ChevronRight, ShieldCheck, Edit3 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import SectionCard from '../../../components/ui/SectionCard';
import TextField from '../../../components/ui/TextField';
import ActionButton from '../../../components/ui/ActionButton';
import userService from '../../../services/user.service';
import { DriverScreen } from './components/DriverScreen';
import { useAuthStore } from '../../../context/authStore';
import GlassCard from '@/components/driver/cards/GlassCard';
import MetricCard from '@/components/driver/cards/MetricCard';
import ProgressBar from '@/components/driver/feedback/ProgressBar';
import { driverColors, driverTypography, driverRadius, driverSpacing } from '@/theme/driverTheme';

export default function DriverProfileScreen() {
  const navigation = useNavigation<any>();
  const cachedUser = useAuthStore((s) => s.userData);
  const updateAuthCache = useAuthStore((s) => s.updateUserData);

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [name, setName] = useState(cachedUser?.name || cachedUser?.nome || '');
  const [phone, setPhone] = useState(cachedUser?.phone || cachedUser?.telefone || '');
  const [city, setCity] = useState(cachedUser?.city || cachedUser?.cidade || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(cachedUser?.fotoPerfil || null);
  const [driverData, setDriverData] = useState<any>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const canSave = useMemo(() => name.trim().length >= 2, [name]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const u = await userService.getProfile();
        if (!mounted) return;
        const resolvedName = u?.name || u?.nome || name;
        const resolvedPhone = u?.phone || u?.telefone || phone;
        const resolvedCity = u?.city || u?.cidade || city;
        const photoUrl = u?.profilePhoto || u?.driverDocuments?.selfie || profilePhoto || undefined;
        setName(resolvedName);
        setPhone(resolvedPhone);
        setCity(resolvedCity);
        setProfilePhoto(photoUrl ?? null);
        setDriverData(u || {});

        updateAuthCache({
          name: resolvedName, nome: resolvedName,
          telefone: resolvedPhone, cidade: resolvedCity, fotoPerfil: photoUrl,
        });
      } catch (e: any) {
        console.error('[Profile] Erro ao carregar:', e);
        Toast.show({ type: 'error', text1: 'Falha ao carregar', text2: e?.message });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function pickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'info', text1: 'Permissão negada', text2: 'Precisamos de acesso à galeria.' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setUploadingPhoto(true);
      const remoteUrl = await userService.uploadProfilePhoto(result.assets[0].uri);
      setProfilePhoto(remoteUrl);
      Toast.show({ type: 'success', text1: 'Foto atualizada!' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Falha no upload', text2: e?.message });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function save() {
    if (!canSave) return;
    setLoading(true);
    try {
      const updated = await userService.updateProfile({ name: name.trim(), phone: phone.trim(), city: city.trim() });
      updateAuthCache({
        name: updated?.name || name.trim(), nome: updated?.name || name.trim(),
        telefone: updated?.phone || phone.trim(), cidade: updated?.city || city.trim(),
      });
      Toast.show({ type: 'success', text1: 'Perfil atualizado' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Erro ao salvar', text2: e?.message });
    } finally { setLoading(false); }
  }

  const isVerified = driverData.driverStatus === 'approved';
  const rating = driverData.ratingStats?.averageStars || 5;
  const totalRatings = driverData.ratingStats?.totalRatings || 0;
  const totalRides = driverData.completedRides || 0;
  const memberSince = driverData.createdAt
    ? new Date(driverData.createdAt).getFullYear()
    : new Date().getFullYear();

  const toggleSection = (key: string) => setExpandedSection(prev => prev === key ? null : key);

  return (
    <DriverScreen title="Perfil" hideHeader={true} scroll={true}>
      {/* ── Header with blur map bg ── */}
      <View style={styles.headerBg}>
        {/* Avatar */}
        <TouchableOpacity activeOpacity={0.85} onPress={pickImage} disabled={uploadingPhoto} style={styles.avatarOuter}>
          {uploadingPhoto ? (
            <ActivityIndicator color={driverColors.accent} size="large" />
          ) : profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
          ) : (
            <MaterialIcons name="person" size={56} color={driverColors.textMuted} />
          )}
          <View style={styles.cameraBadge}>
            <Camera size={13} color={driverColors.bg} />
          </View>
        </TouchableOpacity>

        {/* Name + Verification */}
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{name || 'Motorista'}</Text>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={driverColors.accent} />
            </View>
          )}
        </View>
        <Text style={styles.userSubtitle}>Motorista parceiro LevaMais</Text>

        {/* Metrics */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <MetricCard
            icon={<Star size={14} color="#FBBF24" fill="#FBBF24" />}
            label="Avaliação"
            value={rating.toFixed(1)}
            accent="yellow"
          />
          <MetricCard
            icon={<Car size={14} color={driverColors.accent} />}
            label="Corridas"
            value={totalRides}
            accent="green"
          />
          <MetricCard
            icon={<Calendar size={14} color={driverColors.info} />}
            label="Desde"
            value={memberSince}
            accent="blue"
          />
        </View>
      </View>

      {/* ── Sections (accordion) ── */}
      <View style={{ paddingHorizontal: driverSpacing.lg, marginTop: 20, gap: 12 }}>
        {/* Informações Pessoais */}
        <GlassCard variant="default" padding="md" onPress={() => toggleSection('personal')}>
          <View style={sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color={driverColors.accent} />
            <Text style={sectionTitle}>Informações Pessoais</Text>
            <MaterialIcons name={expandedSection === 'personal' ? 'expand-less' : 'expand-more'} size={24} color={driverColors.textMuted} />
          </View>
          {expandedSection === 'personal' && (
            <MotiView from={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 12, gap: 10 }}>
              <TextField label="Nome" value={name} onChangeText={setName} />
              <TextField label="Telefone" value={phone} onChangeText={setPhone} />
              <TextField label="Cidade" value={city} onChangeText={setCity} />
            </MotiView>
          )}
        </GlassCard>

        {/* Documentos */}
        <GlassCard variant="default" padding="md" onPress={() => navigation.navigate('DriverDocuments')}>
          <View style={sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={driverColors.accent} />
            <Text style={sectionTitle}>Documentos</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: isVerified ? driverColors.accent : driverColors.warning, fontSize: 11, fontWeight: '700' }}>
                {isVerified ? 'Verificado' : 'Pendente'}
              </Text>
              <MaterialIcons name="chevron-right" size={22} color={driverColors.textMuted} />
            </View>
          </View>
        </GlassCard>

        {/* Veículos */}
        <GlassCard variant="default" padding="md" onPress={() => navigation.navigate('DriverVehicle')}>
          <View style={sectionHeader}>
            <Ionicons name="car-outline" size={20} color={driverColors.accent} />
            <Text style={sectionTitle}>Veículos</Text>
            <MaterialIcons name="chevron-right" size={22} color={driverColors.textMuted} />
          </View>
        </GlassCard>

        {/* Pagamentos e Conta */}
        <GlassCard variant="default" padding="md" onPress={() => navigation.navigate('DriverPayouts')}>
          <View style={sectionHeader}>
            <Ionicons name="wallet-outline" size={20} color={driverColors.accent} />
            <Text style={sectionTitle}>Pagamentos e Conta</Text>
            <MaterialIcons name="chevron-right" size={22} color={driverColors.textMuted} />
          </View>
        </GlassCard>

        {/* Preferências */}
        <GlassCard variant="default" padding="md" onPress={() => navigation.navigate('DriverWorkPreferences')}>
          <View style={sectionHeader}>
            <Ionicons name="options-outline" size={20} color={driverColors.accent} />
            <Text style={sectionTitle}>Preferências de Trabalho</Text>
            <MaterialIcons name="chevron-right" size={22} color={driverColors.textMuted} />
          </View>
        </GlassCard>

        {/* Avaliações */}
        <GlassCard variant="default" padding="md" onPress={() => navigation.navigate('DriverRatings')}>
          <View style={sectionHeader}>
            <Star size={18} color={driverColors.accent} />
            <Text style={sectionTitle}>Avaliações ({totalRatings})</Text>
            <MaterialIcons name="chevron-right" size={22} color={driverColors.textMuted} />
          </View>
        </GlassCard>
      </View>

      {/* Save Button */}
      <View style={{ paddingHorizontal: driverSpacing.lg, marginTop: 20, marginBottom: 40 }}>
        <ActionButton title={loading ? 'Salvando...' : 'Salvar alterações'} variant="primary" onPress={save} disabled={!canSave || loading} />
      </View>
    </DriverScreen>
  );
}

const sectionHeader: any = { flexDirection: 'row', alignItems: 'center', gap: 10 };
const sectionTitle: any = { flex: 1, color: driverColors.text, fontSize: 14, fontWeight: '800' };

const styles = StyleSheet.create({
  headerBg: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: driverSpacing.lg,
  },
  avatarOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: driverColors.accent,
    backgroundColor: driverColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: driverColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarImage: {
    width: '100%', height: '100%', borderRadius: 50,
  },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: driverColors.accent,
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: driverColors.bg,
  },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
  },
  userName: {
    color: driverColors.text, fontSize: 20, fontWeight: '900',
  },
  verifiedBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: driverColors.accentBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: driverColors.accentBorder,
  },
  userSubtitle: {
    color: driverColors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  sectionTitle: {
    flex: 1, color: driverColors.text, fontSize: 14, fontWeight: '800',
  },
});
