import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '@/theme';

export default function ServiceSelectionScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { vehicle, pickup, dropoff } = route.params || {};

    if (!vehicle) return null;

    const handleSelectService = (serviceId: string) => {
        if (pickup?.latitude && dropoff?.latitude) {
            navigation.navigate('Home', {
                openOffersFor: vehicle.id,
                purposeId: serviceId,
                pickup,
                dropoff
            });
            return;
        }

        navigation.navigate('LocationPicker', {
             initialVehicle: vehicle.id,
             initialService: serviceId,
             selectionMode: 'dropoff', 
             returnScreen: 'Home' 
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{vehicle.label}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Escolha o tipo de serviço</Text>

                {vehicle.services.map((svc: any) => (
                    <TouchableOpacity 
                        key={svc.id} 
                        style={styles.card}
                        onPress={() => handleSelectService(svc.id)}
                    >
                         <View style={styles.iconBg}>
                             <MaterialCommunityIcons name={svc.icon} size={28} color="#02de95" />
                         </View>
                         <View style={{ flex: 1, marginHorizontal: 16 }}>
                             <Text style={styles.svcTitle}>{svc.label}</Text>
                             <Text style={styles.svcDesc}>{svc.description}</Text>
                         </View>
                         <View style={{ alignItems: 'flex-end' }}>
                             {svc.startPrice && (
                                 <Text style={styles.price}>
                                     A partir de{'\n'}R$ {svc.startPrice.toFixed(2).replace('.', ',')}
                                 </Text>
                             )}
                             <MaterialIcons name="chevron-right" size={24} color="#666" style={{ marginTop: 4 }} />
                         </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#11253E', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 24 },
    subtitle: { color: '#888', marginBottom: 20, fontSize: 16 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#11253E',
        padding: 16, borderRadius: 16, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(2,222,149,0.1)'
    },
    iconBg: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(2,222,149,0.1)',
        alignItems: 'center', justifyContent: 'center'
    },
    svcTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    svcDesc: { color: '#888', fontSize: 12, marginTop: 4 },
    price: { color: '#02de95', fontSize: 12, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }
});
