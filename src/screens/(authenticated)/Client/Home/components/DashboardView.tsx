import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useNavigation } from '@react-navigation/native';

// Services
import favoriteAddressService, { FavoriteAddress } from '@/services/favoriteAddress.service';
import purposeService, { Purpose } from '@/services/purpose.service';
import pricingService, { PricingRule } from '@/services/pricing.service';
import rideService, { Ride } from '@/services/ride.service';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos de Veículos Base (Hardcoded para estrutura visual, mas serviços virão do Backend)
const INITIAL_VEHICLES = [
  { 
    id: 'motorcycle', 
    label: 'Moto', 
    icon: 'motorbike',
    iconLib: MaterialCommunityIcons,
    description: 'Rápido e econômico',
    services: [] as any[]
  },
  { 
    id: 'car', 
    label: 'Carro', 
    icon: 'car',
    iconLib: MaterialCommunityIcons,
    description: 'Conforto para você',
    services: [] as any[]
  },
  { 
    id: 'van', 
    label: 'Van', 
    icon: 'van-utility',
    iconLib: MaterialCommunityIcons,
    description: 'Para grupos ou cargas',
    services: [] as any[]
  },
  { 
    id: 'truck', 
    label: 'Caminhão', 
    icon: 'truck',
    iconLib: MaterialCommunityIcons,
    description: 'Mudanças e Fretes',
    services: [] as any[]
  },
];

type DashboardViewProps = {
  userAddress: string;
  destinationAddress?: string;
  onPressAddress: () => void;
  onPressDestination: () => void;
  onPressMenu: () => void; // NOVO
  onSelectFlow: (vehicleId: string, serviceId: string) => void;
  onSelectFavorite: (fav: FavoriteAddress) => void;
  onDefaultAddressFound?: (address: string) => void; // NOVO
  onPressAddFavorite: () => void;
  cityId?: string;
  refreshTrigger?: number; // Sincronização
};

export const DashboardView = ({ userAddress, destinationAddress, onPressAddress, onPressDestination, onPressMenu, onPressAddFavorite, onSelectFlow, onSelectFavorite, onDefaultAddressFound, cityId, refreshTrigger }: DashboardViewProps) => {
    const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
    const [recentRides, setRecentRides] = useState<Ride[]>([]);
    const [vehiclesData, setVehiclesData] = useState(INITIAL_VEHICLES);
    const [loadingServices, setLoadingServices] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const navigation = useNavigation<any>();

    useEffect(() => {
        loadData();
    }, [cityId, refreshTrigger]); // Recarregar se mudar cidade ou trigger

    const loadData = async () => {
        setLoadingServices(true);
        setErrorMsg(null);
        try {
            // Paralelizar chamadas
            const promises: Promise<any>[] = [
                favoriteAddressService.list(),
                purposeService.getAll(),
                rideService.getHistory({ limit: 3 })
            ];
            
            if (cityId) {
                promises.push(pricingService.getRules(cityId));
            }

            const results = await Promise.all(promises);
            const favList = results[0] as FavoriteAddress[];
            const allPurposes = results[1] as Purpose[];
            const ridesHistory = results[2];
            const pricingRules = (cityId && results.length > 3) ? results[3] as PricingRule[] : [];

            setFavorites(favList);
            setRecentRides(ridesHistory?.rides || []);

            // Check Default Address (Casa ou primeiro da lista)
            const defaultFav = favList.find((f: FavoriteAddress) => f.name?.toLowerCase() === 'casa');
            if (defaultFav && onDefaultAddressFound) {
                onDefaultAddressFound(defaultFav.address || defaultFav.formattedAddress || defaultFav.name);
            }

            // Mapear serviços para dentro dos veículos e associar Preços
            if (allPurposes && Array.isArray(allPurposes)) {
                const updatedVehicles = INITIAL_VEHICLES.map(v => {
                    // Filtrar purposes para este veículo
                    const vehicleServices = allPurposes.filter(p => p.vehicleType === v.id);
                    
                    // Encontrar regra genérica para o veículo (sem purpose específico)
                    const genericRule = pricingRules.find(r => 
                        r.vehicleCategory === v.id && (!r.purposeId || r.purposeId === null)
                    );

                    return {
                        ...v,
                        services: vehicleServices.map(s => {
                            // Tentar encontrar regra específica para este serviço
                            // O purposeId na regra pode ser string ou objeto populado
                            const specificRule = pricingRules.find(r => {
                                const rPurposeId = typeof r.purposeId === 'object' ? r.purposeId?._id : r.purposeId;
                                return r.vehicleCategory === v.id && rPurposeId === s._id;
                            });

                            const ruleToUse = specificRule || genericRule;
                            // Preço Mínimo ou Base
                            const startPrice = ruleToUse ? (ruleToUse.pricing.minimumFee || ruleToUse.pricing.basePrice) : null;

                            return {
                                id: s.id, // slug (ex: 'delivery')
                                label: s.title,
                                icon: getIconName(s.icon), 
                                description: s.subtitle,
                                badges: s.badges,
                                startPrice // Preço "A partir de"
                            };
                        })
                    };
                });
                setVehiclesData(updatedVehicles);
            }

        } catch (e) {
            console.log('Erro ao carregar dados dashboard', e);
            setErrorMsg('Falha na conexão. Tente novamente.');
        } finally {
            setLoadingServices(false);
        }
    };


    // Helper para converter ícones do backend (nomes genéricos ou Lucide) para MaterialCommunityIcons
    const getIconName = (backendIcon: string) => {
        const map: { [key: string]: string } = {
            'Package': 'package-variant',
            'FileText': 'file-document',
            'ShoppingBasket': 'basket',
            'ShoppingCart': 'cart',
            'ShoppingBag': 'shopping',
            'Zap': 'flash',
            'Pill': 'pill',
            'Dog': 'dog',
            'ShieldCheck': 'shield-check',
            'Truck': 'truck',
            'Home': 'home-city',
            'Container': 'truck-trailer', // ou truck-cargo-container
            'Bike': 'bike',
            'Car': 'car',
        };
        return map[backendIcon] || 'star'; // Default icon
    };

    const handleVehiclePress = (vehicle: any) => {
        if (vehicle.services.length === 0) return;
        navigation.navigate('ServiceSelection', { vehicle });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header / Endereço Atual */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onPressMenu} style={styles.menuButton}>
                    <MaterialIcons name="menu" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.greetingBox}>
                     <Text style={styles.greetingTitle}>Vamos lá?</Text>
                </View>

                <View style={styles.locationInputContainer}>
                    {/* Origem */}
                    <TouchableOpacity onPress={onPressAddress} style={styles.inputRow}>
                        <View style={styles.dotOrigin} />
                        <Text style={[styles.inputText, !userAddress && styles.placeholderText]} numberOfLines={1}>
                            {userAddress || "De onde vamos sair?"}
                        </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.connectorLine} />

                    {/* Destino */}
                    <TouchableOpacity onPress={onPressDestination} style={styles.inputRow}>
                        <View style={styles.dotDest} />
                        <Text style={[styles.inputText, !destinationAddress && styles.placeholderText]} numberOfLines={1}>
                            {destinationAddress || "Para onde vamos?"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Grid de Veículos */}
            <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
                {loadingServices ? (
                    <ActivityIndicator size="large" color="#02de95" style={{ marginTop: 40 }} />
                ) : errorMsg ? (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <MaterialIcons name="cloud-off" size={48} color="#666" style={{ marginBottom: 16 }} />
                        <Text style={{ color: '#ccc', marginBottom: 16, textAlign: 'center' }}>
                            {errorMsg}
                        </Text>
                        <TouchableOpacity 
                            onPress={loadData} 
                            style={{ 
                                paddingHorizontal: 24, 
                                paddingVertical: 12, 
                                backgroundColor: 'rgba(2,222,149,0.1)', 
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: '#02de95'
                            }}
                        >
                            <Text style={{ color: '#02de95', fontWeight: 'bold' }}>Tentar Novamente</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {vehiclesData.map((vehicle) => {
                            const hasServices = vehicle.services.length > 0;
                            return (
                                <TouchableOpacity 
                                    key={vehicle.id} 
                                    style={[styles.card, !hasServices && styles.cardDisabled]}
                                    activeOpacity={hasServices ? 0.8 : 1}
                                    onPress={() => handleVehiclePress(vehicle)}
                                    disabled={!hasServices}
                                >
                                    <View style={[styles.iconCircle, !hasServices && { backgroundColor: '#444' }]}>
                                        <vehicle.iconLib name={vehicle.icon as any} size={32} color={hasServices ? "#fff" : "#888"} />
                                    </View>
                                    <Text style={[styles.vehicleLabel, !hasServices && { color: '#666' }]}>{vehicle.label}</Text>
                                    <Text style={[styles.vehicleDesc, !hasServices && { color: '#444' }]}>{vehicle.description}</Text>
                                    {/* Badge de Qtd Serviços */}
                                    {hasServices && (
                                        <View style={styles.badgeCount}>
                                            <Text style={styles.badgeText}>{vehicle.services.length} opções</Text>
                                        </View>
                                    )}
                                    {!hasServices && (
                                        <View style={[styles.badgeCount, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                            <Text style={[styles.badgeText, { color: '#ef4444' }]}>Indisponível</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Favoritos Recentes - Melhorado (Empty State + Lista com Ações) */}
                <View style={styles.favSection}>
                    <Text style={styles.sectionTitle}>Acesso Rápido</Text>
                    
                    {favorites.length === 0 ? (
                        /* Estado Vazio - Card Grande Central */
                        <TouchableOpacity style={styles.emptyFavCard} onPress={onPressAddFavorite}>
                            <View style={styles.emptyFavIconLarge}>
                                <MaterialIcons name="add-location" size={48} color="#02de95" />
                            </View>
                            <Text style={styles.emptyFavTitle}>Adicione seus endereços favoritos</Text>
                            <Text style={styles.emptyFavSubtitle}>
                                Salve Casa, Trabalho e outros locais para acesso rápido
                            </Text>
                            <View style={styles.emptyFavButton}>
                                <MaterialIcons name="add" size={20} color="#fff" />
                                <Text style={styles.emptyFavButtonText}>Adicionar Endereço</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        /* Lista de Favoritos com Botões de Ação */
                        <View style={{ marginTop: 12 }}>
                            {favorites.map((fav, index) => (
                                <View key={fav._id} style={styles.favListItem}>
                                    <TouchableOpacity 
                                        style={styles.favListMain}
                                        onPress={() => onSelectFavorite(fav)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.favListIcon}>
                                            <MaterialIcons name={fav.icon as any || "place"} size={24} color="#02de95" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.favListName}>{fav.name}</Text>
                                            <Text style={styles.favListAddress} numberOfLines={1}>
                                                {fav.address || fav.formattedAddress || 'Sem endereço'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    
                                    {/* Botões de Ação */}
                                    <View style={styles.favListActions}>
                                        <TouchableOpacity 
                                            style={styles.favActionBtn}
                                            onPress={() => {
                                                // Navegar para edição passando os dados já carregados
                                                navigation.navigate('EditFavorite', { 
                                                    favoriteId: fav._id,
                                                    favoriteData: fav 
                                                });
                                            }}
                                        >
                                            <MaterialIcons name="edit" size={20} color="#888" />
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            style={[styles.favActionBtn, { marginLeft: 8 }]}
                                            onPress={async () => {
                                                try {
                                                    await favoriteAddressService.delete(fav._id);
                                                    // Recarregar lista
                                                    loadData();
                                                } catch (e) {
                                                    console.error('Erro ao deletar favorito', e);
                                                }
                                            }}
                                        >
                                            <MaterialIcons name="delete" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            
                            {/* Botão Adicionar Novo Favorito (no final da lista) */}
                            <TouchableOpacity style={styles.addMoreBtn} onPress={onPressAddFavorite}>
                                <MaterialIcons name="add-circle-outline" size={24} color="#02de95" />
                                <Text style={styles.addMoreText}>Adicionar outro endereço</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Histórico Recente */}
                {recentRides.length > 0 && (
                    <View style={styles.historySection}>
                        <Text style={styles.sectionTitle}>Últimas Viagens</Text>
                        <View style={{ marginTop: 12 }}>
                            {recentRides.map((ride) => {
                                const created = (ride as any).created_at || ride.createdAt;
                                const date = created ? format(parseISO(created), "dd 'de' MMM", { locale: ptBR }) : '';
                                return (
                                    <TouchableOpacity key={ride._id} style={styles.historyCard}>
                                        <View style={styles.historyIcon}>
                                            <MaterialCommunityIcons 
                                                name={ride.vehicleType === 'motorcycle' ? 'motorbike' : 'car'} 
                                                size={20} 
                                                color="#aaa" 
                                            />
                                        </View>
                                        <View style={{ flex: 1, marginHorizontal: 12 }}>
                                            <Text style={styles.historyAddress} numberOfLines={1}>
                                                {ride.dropoff?.address || 'Destino desconhecido'}
                                            </Text>
                                            <Text style={styles.historyDate}>{date} • {ride.status === 'completed' ? 'Concluída' : ride.status}</Text>
                                        </View>
                                        <Text style={styles.historyPrice}>
                                            R$ {ride.pricing?.total?.toFixed(2).replace('.', ',')}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Espaço Extra */}
                <View style={{ height: 100 }} />
            </ScrollView>


        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    header: { padding: 24, paddingBottom: 12, paddingTop: 60 }, // Mais padding top para status bar
    
    menuButton: {
        position: 'absolute', top: 20, left: 24, zIndex: 10,
        width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20
    },

    greetingBox: { marginBottom: 20, marginTop: 24 },
    greetingTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },

    gridContainer: { paddingHorizontal: 24 },
    
    locationInputContainer: {
        backgroundColor: '#11253E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        marginTop: 8
    },
    inputRow: { flexDirection: 'row', alignItems: 'center', height: 32 },
    dotOrigin: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#02de95', marginRight: 12 },
    dotDest: { width: 10, height: 10, borderRadius: 2, backgroundColor: '#ef4444', marginRight: 12 },
    connectorLine: { 
        width: 1, height: 16, backgroundColor: '#444', 
        marginLeft: 4.5, marginVertical: 4
    },
    inputText: { color: '#fff', fontSize: 16, flex: 1 },
    placeholderText: { color: '#888' },
    
    badgeMiniText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
    grid: { 
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 
    },
    card: {
        width: '48%', 
        backgroundColor: '#11253E', 
        borderRadius: 16, 
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(2,222,149,0.1)',
        alignItems: 'flex-start',
        elevation: 4
    },
    cardDisabled: {
        opacity: 0.5,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconCircle: {
        width: 48, height: 48, borderRadius: 24, 
        backgroundColor: '#02de95', 
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12
    },
    vehicleLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    vehicleDesc: { color: '#888', fontSize: 12 },
    badgeCount: { 
        marginTop: 8, backgroundColor: 'rgba(255,255,255,0.1)', 
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 
    },
    badgeText: { color: '#aaa', fontSize: 10 },

    favSection: { marginTop: 24 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    
    // Empty State de Favoritos
    emptyFavCard: {
        marginTop: 16,
        backgroundColor: '#11253E',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(2,222,149,0.2)',
        borderStyle: 'dashed'
    },
    emptyFavIconLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(2,222,149,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    emptyFavTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center'
    },
    emptyFavSubtitle: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20
    },
    emptyFavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#02de95',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8
    },
    emptyFavButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
    },

    // Lista de Favoritos (quando tem itens)
    favListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#11253E',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden'
    },
    favListMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16
    },
    favListIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(2,222,149,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    favListName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4
    },
    favListAddress: {
        color: '#888',
        fontSize: 13
    },
    favListActions: {
        flexDirection: 'row',
        paddingRight: 12
    },
    favActionBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    addMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginTop: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(2,222,149,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(2,222,149,0.2)',
        gap: 8
    },
    addMoreText: {
        color: '#02de95',
        fontSize: 14,
        fontWeight: '600'
    },
    
    // Antigos (removidos mas mantendo compatibilidade)
    favCard: {
        marginRight: 12, alignItems: 'center', width: 80
    },
    favIcon: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: '#11253E',
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        borderWidth: 1, borderColor: '#333'
    },
    favLabel: { color: '#ccc', fontSize: 12, textAlign: 'center' },
    
    addFavCard: { marginRight: 12, alignItems: 'center', width: 80 },
    addFavIcon: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(2,222,149,0.1)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        borderStyle: 'dashed', borderWidth: 1, borderColor: '#02de95'
    },

    modalOverlay: { 
        flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' 
    },
    modalContent: {
        backgroundColor: '#11253E', 
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 48,
        maxHeight: '70%'
    },
    modalHeader: { 
        marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    emptyText: { color: '#888', textAlign: 'center', marginTop: 20 },
    
    serviceItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    serviceIconFrame: {
        width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center'
    },
    serviceLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    serviceSub: { color: '#888', fontSize: 12 },
    servicePrice: { color: '#02de95', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
    badgeMini: { 
        marginLeft: 8, backgroundColor: '#02de95', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 
    },

    historySection: { marginTop: 24, marginBottom: 12 },
    historyCard: { 
        flexDirection: 'row', alignItems: 'center', 
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    historyIcon: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center'
    },
    historyAddress: { color: '#fff', fontSize: 14, fontWeight: '500' },
    historyDate: { color: '#666', fontSize: 12, marginTop: 2 },
    historyPrice: { color: '#02de95', fontSize: 14, fontWeight: 'bold' }
});
