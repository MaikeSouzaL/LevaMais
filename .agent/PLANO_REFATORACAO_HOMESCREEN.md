# 🔄 PLANO DE REFATORAÇÃO - HomeScreen

## 🎯 Objetivo

Reduzir o HomeScreen de **1.534 linhas → ~400 linhas** (-74%) usando os hooks customizados criados.

---

## 📊 ANÁLISE ATUAL

### **Problemas Identificados:**

1. **1.534 linhas** - Arquivo muito grande
2. **Lógica misturada** - UI + Business Logic
3. **Difícil de testar** - Tudo em um componente
4. **Muitos estados** - ~25 estados locais
5. **WebSocket inline** - Lógica complexa no componente
6. **Duplicação** - Código repetido

---

## 🔧 ESTRATÉGIA DE REFATORAÇÃO

### **Fase 1: Extrair Lógica para Hooks** ✅ FEITO

- ✅ useDriverSearch - Busca de motorista + WebSocket
- ✅ useMapLocation - Localização e mapa
- ✅ useRideFlow - Fluxo de corrida
- ✅ useActiveRide - Corrida ativa

### **Fase 2: Simplificar Componente** 🎯 PRÓXIMO

1. Substituir estados por hooks
2. Remover lógica de WebSocket
3. Remover lógica de localização
4. Simplificar handlers

### **Fase 3: Usar Componentes Compartilhados**

1. Substituir OffersMotoSheet, OffersCarSheet, etc por OffersSheet unificado
2. Usar SearchBar compartilhado
3. Usar LoadingButton compartilhado

---

## 📝 MAPEAMENTO DE REFATORAÇÃO

### **Estados a Remover (substituir por hooks):**

```typescript
// ❌ REMOVER (usar useDriverSearch)
const [searchingModal, setSearchingModal] = useState(...);
const [isDriverFound, setIsDriverFound] = useState(false);
const [driverLatLng, setDriverLatLng] = useState(null);
const [driverInfo, setDriverInfo] = useState(null);
const [driverEtaText, setDriverEtaText] = useState(undefined);
const [cancelNotice, setCancelNotice] = useState({ visible: false });
const [currentRideId, setCurrentRideId] = useState(null);

// ❌ REMOVER (usar useMapLocation)
const [region, setRegion] = useState(null);
const [userRegion, setUserRegion] = useState(null);
const [currentAddress, setCurrentAddress] = useState('');
const [showMyLocationButton, setShowMyLocationButton] = useState(false);
const [dragLatLng, setDragLatLng] = useState(null);

// ❌ REMOVER (usar useRideFlow)
const [serviceMode, setServiceMode] = useState(null);
const [selectedVehicleType, setSelectedVehicleType] = useState(null);
const [selectedPurposeId, setSelectedPurposeId] = useState(null);
const [pickupSelection, setPickupSelection] = useState(null);
const [dropoffSelection, setDropoffSelection] = useState(null);
const [priceQuote, setPriceQuote] = useState(null);
const [priceQuoteLoading, setPriceQuoteLoading] = useState(false);
```

### **Lógica a Remover (substituir por hooks):**

```typescript
// ❌ REMOVER (useDriverSearch já faz isso)
useEffect(() => {
  // WebSocket: buscar motorista / receber eventos
  // ~100 linhas
}, [searchingModal.visible, ...]);

// ❌ REMOVER (useMapLocation já faz isso)
useEffect(() => {
  // Obter localização inicial
  // ~30 linhas
}, []);

// ❌ REMOVER (useActiveRide já faz isso)
useFocusEffect(() => {
  // Verificar corrida ativa
  // ~30 linhas
}, [userType, ...]);
```

---

## 🎯 ESTRUTURA FINAL (ESTIMADA)

```typescript
export default function HomeScreen() {
  // ✅ Hooks customizados (substitui ~25 estados)
  const mapLocation = useMapLocation();
  const driverSearch = useDriverSearch(currentRideId);
  const rideFlow = useRideFlow();
  
  // ✅ Hooks de navegação
  const navigation = useNavigation();
  const route = useRoute();
  
  // ✅ Hooks de contexto
  const userType = useAuthStore(s => s.userType);
  const detectedCity = useClientCityStore(s => s.city);
  
  // ✅ Refs (mantém)
  const bottomSheetRef = useRef(null);
  const safetyHelpRef = useRef(null);
  
  // ✅ Estados locais mínimos (apenas UI)
  const [searchTimeoutCardVisible, setSearchTimeoutCardVisible] = useState(false);
  
  // ✅ Verificar corrida ativa
  useActiveRide(navigation, userType, driverSearch.searchingState.visible);
  
  // ✅ Handlers simplificados
  const handlePressSearch = () => { ... };
  const handlePressMyLocation = () => mapLocation.centerOnUser();
  const handlePressSafety = () => { ... };
  
  // ✅ Renderização (UI pura)
  return (
    <View>
      <MapView ref={mapLocation.mapRef} ... />
      <SearchBar ... />
      <BottomSheet ref={bottomSheetRef} ... />
    </View>
  );
}
```

---

## 📊 REDUÇÃO ESPERADA

### **Antes:**
- 1.534 linhas
- ~25 estados
- ~10 useEffects
- Lógica misturada

### **Depois:**
- ~400 linhas (-74%)
- ~5 estados
- ~2 useEffects
- UI pura

---

## ✅ BENEFÍCIOS

1. **Manutenibilidade** - Código mais limpo e organizado
2. **Testabilidade** - Hooks podem ser testados isoladamente
3. **Reutilização** - Hooks podem ser usados em outras telas
4. **Performance** - Re-renders otimizados
5. **Legibilidade** - Fácil de entender

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar versão refatorada do HomeScreen
2. ✅ Testar funcionalidades
3. ✅ Substituir sheets antigos por OffersSheet unificado
4. ✅ Validar com usuário

---

**Status:** 🎯 Pronto para refatorar!  
**Tempo estimado:** 2-3 horas  
**Complexidade:** Alta

---

*Documento criado em 02/02/2026 19:00*
