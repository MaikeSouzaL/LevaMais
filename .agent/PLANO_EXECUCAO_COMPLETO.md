# 🚀 Plano de Execução - Reorganização Client

## 📋 Visão Geral

Reorganizar completamente a estrutura do módulo Client seguindo padrões modernos (Uber, 99, iFood) e mantendo consistência com backend e web.

---

## 🎯 Objetivos

1. ✅ Reorganizar estrutura de pastas
2. ✅ Implementar design system
3. ✅ Padronizar nomenclatura
4. ✅ Melhorar layouts
5. ✅ Manter consistência com backend/web

---

## 📁 FASE 1: Criar Nova Estrutura (DIA 1)

### **1.1 Criar pastas base**

```bash
mkdir -p src/screens/\(authenticated\)/Client/Home
mkdir -p src/screens/\(authenticated\)/Client/Ride/Request
mkdir -p src/screens/\(authenticated\)/Client/Ride/Search
mkdir -p src/screens/\(authenticated\)/Client/Ride/Tracking
mkdir -p src/screens/\(authenticated\)/Client/Ride/Completion
mkdir -p src/screens/\(authenticated\)/Client/Ride/Cancellation
mkdir -p src/screens/\(authenticated\)/Client/Favorites
mkdir -p src/screens/\(authenticated\)/Client/History
mkdir -p src/screens/\(authenticated\)/Client/Profile
mkdir -p src/screens/\(authenticated\)/Client/Shared/components
mkdir -p src/screens/\(authenticated\)/Client/Shared/hooks
mkdir -p src/screens/\(authenticated\)/Client/Shared/utils
mkdir -p src/screens/\(authenticated\)/Client/types
```

### **1.2 Criar arquivos de tema**

```bash
mkdir -p src/theme
touch src/theme/colors.ts
touch src/theme/dimensions.ts
touch src/theme/typography.ts
touch src/theme/animations.ts
touch src/theme/layout.ts
touch src/theme/icons.ts
touch src/theme/index.ts
```

### **1.3 Criar arquivos utilitários**

```bash
touch src/screens/\(authenticated\)/Client/Shared/utils/formatters.ts
touch src/screens/\(authenticated\)/Client/Shared/utils/validators.ts
touch src/screens/\(authenticated\)/Client/Shared/utils/mappers.ts
touch src/screens/\(authenticated\)/Client/Shared/utils/navigation.ts
```

### **1.4 Criar arquivos de tipos**

```bash
touch src/screens/\(authenticated\)/Client/types/navigation.ts
touch src/screens/\(authenticated\)/Client/types/ride.ts
touch src/screens/\(authenticated\)/Client/types/user.ts
```

---

## 🎨 FASE 2: Implementar Design System (DIA 1-2)

### **2.1 Cores e Gradientes**

Criar `src/theme/colors.ts` com paleta completa

### **2.2 Dimensões e Espaçamento**

Criar `src/theme/dimensions.ts` com spacing, borderRadius, touchTargets

### **2.3 Tipografia**

Criar `src/theme/typography.ts` com fonts, fontSize, lineHeight

### **2.4 Animações**

Criar `src/theme/animations.ts` com durações e easings

### **2.5 Layout**

Criar `src/theme/layout.ts` com breakpoints e padding

### **2.6 Ícones**

Criar `src/theme/icons.ts` com tamanhos padrão

### **2.7 Index**

Criar `src/theme/index.ts` exportando tudo

---

## 🔧 FASE 3: Criar Utilitários (DIA 2)

### **3.1 Formatters**

```typescript
// src/screens/(authenticated)/Client/Shared/utils/formatters.ts
export function formatBRL(value: number): string;
export function formatDate(value?: string): string;
export function formatTime(value?: string): string;
export function formatDistance(meters: number): string;
export function formatDuration(seconds: number): string;
export function formatPhone(phone: string): string;
export function formatCPF(cpf: string): string;
export function formatPlate(plate: string): string;
```

### **3.2 Validators**

```typescript
// src/screens/(authenticated)/Client/Shared/utils/validators.ts
export function isValidEmail(email: string): boolean;
export function isValidPhone(phone: string): boolean;
export function isValidCPF(cpf: string): boolean;
export function isValidCEP(cep: string): boolean;
```

### **3.3 Mappers**

```typescript
// src/screens/(authenticated)/Client/Shared/utils/mappers.ts
export function mapServiceModeToApi(mode: string): string;
export function mapVehicleTypeToApi(type: string): string;
export function mapPaymentMethodToApi(method: string): string;
export function mapRideStatusToText(status: string): string;
```

### **3.4 Navigation**

```typescript
// src/screens/(authenticated)/Client/Shared/utils/navigation.ts
export const ROUTES = {
  HOME: 'Home',
  ADDRESS_PICKER: 'AddressPicker',
  SELECT_VEHICLE: 'SelectVehicle',
  // ... todos os outros
};

export function navigateToHome(navigation: any): void;
export function navigateToRideTracking(navigation: any, rideId: string): void;
// ... helpers de navegação
```

---

## 📝 FASE 4: Criar Tipos (DIA 2)

### **4.1 Navigation Types**

```typescript
// src/screens/(authenticated)/Client/types/navigation.ts
export type ClientStackParamList = {
  Home: undefined;
  AddressPicker: { type: 'pickup' | 'destination' };
  SelectVehicle: undefined;
  ServicePurpose: undefined;
  PaymentMethod: { amount: number };
  OrderSummary: undefined;
  SearchingDriver: undefined;
  RideTracking: { rideId: string };
  RideCompleted: { rideId: string };
  RateDriver: { rideId: string };
  CancelRide: { rideId: string; total?: number };
  Favorites: undefined;
  AddFavorite: { address: string; coordinates: LatLng };
  History: undefined;
  OrderDetails: { rideId: string };
  Profile: undefined;
  Settings: undefined;
  CitySelection: undefined;
  Wallet: undefined;
  Help: undefined;
  Chat: { rideId: string; driverName: string };
};
```

### **4.2 Ride Types**

```typescript
// src/screens/(authenticated)/Client/types/ride.ts
export type RideStatus = 
  | 'pending'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VehicleType = 'motorcycle' | 'car' | 'van' | 'truck';
export type ServiceMode = 'transport' | 'delivery' | 'moving' | 'other';
export type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit' | 'wallet';

export interface Ride {
  id: string;
  status: RideStatus;
  vehicleType: VehicleType;
  serviceMode: ServiceMode;
  paymentMethod: PaymentMethod;
  pickup: Address;
  destination: Address;
  driver?: Driver;
  price: number;
  distance: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🏗️ FASE 5: Criar Componentes Compartilhados (DIA 3)

### **5.1 BottomSheet Genérico**

```typescript
// src/screens/(authenticated)/Client/Shared/components/BottomSheet.tsx
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
  snapPoints?: string[];
}
```

### **5.2 OffersSheet Unificado**

```typescript
// src/screens/(authenticated)/Client/Shared/components/OffersSheet.tsx
interface OffersSheetProps {
  visible: boolean;
  onClose: () => void;
  vehicleType: VehicleType;
  offers: Offer[];
  onConfirm: (offerId: string) => void;
}
```

### **5.3 MapView Customizado**

```typescript
// src/screens/(authenticated)/Client/Shared/components/MapView.tsx
interface CustomMapViewProps {
  region: Region;
  onRegionChange?: (region: Region) => void;
  markers?: Marker[];
  route?: LatLng[];
  showsUserLocation?: boolean;
}
```

### **5.4 SearchBar**

```typescript
// src/screens/(authenticated)/Client/Shared/components/SearchBar.tsx
interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onSubmit?: () => void;
}
```

### **5.5 VehicleCard**

```typescript
// src/screens/(authenticated)/Client/Shared/components/VehicleCard.tsx
interface VehicleCardProps {
  type: VehicleType;
  price: number;
  capacity: string;
  selected?: boolean;
  onPress: () => void;
}
```

---

## 🔄 FASE 6: Mover e Refatorar Telas (DIA 4-7)

### **DIA 4: Home e Request**

#### **6.1 Home**
- [ ] Mover `HomeScreen/index.tsx` → `Home/HomeScreen.tsx`
- [ ] Extrair lógica para hooks:
  - `useHomeMap.ts`
  - `useDriverSearch.ts`
  - `useWebSocketEvents.ts`
- [ ] Reduzir de 1534 → ~400 linhas
- [ ] Aplicar novo design system
- [ ] Testar funcionalidades

#### **6.2 Request Flow**
- [ ] Mover `AddressPickerScreen.tsx` → `Ride/Request/AddressPickerScreen.tsx`
- [ ] Mover `SelectVehicleScreen.tsx` → `Ride/Request/SelectVehicleScreen.tsx`
- [ ] Mover `ServicePurposeScreen.tsx` → `Ride/Request/ServicePurposeScreen.tsx`
- [ ] Mover `PaymentScreen.tsx` → `Ride/Request/PaymentMethodScreen.tsx`
- [ ] Mover `FinalOrderSummaryScreen.tsx` → `Ride/Request/OrderSummaryScreen.tsx`
- [ ] Aplicar novo design
- [ ] Atualizar navegação
- [ ] Testar fluxo completo

### **DIA 5: Search e Tracking**

#### **6.3 Search Flow**
- [ ] Criar `Ride/Search/SearchingDriverScreen.tsx` (extrair do Home)
- [ ] Criar `Ride/Search/SearchTimeoutScreen.tsx`
- [ ] Aplicar design system
- [ ] Implementar animações
- [ ] Testar countdown

#### **6.4 Tracking Flow**
- [ ] Mover `RideTrackingScreen.tsx` → `Ride/Tracking/RideTrackingScreen.tsx`
- [ ] Mover `ChatScreen.tsx` → `Ride/Tracking/ChatScreen.tsx`
- [ ] Refatorar componentes
- [ ] Aplicar novo layout
- [ ] Testar WebSocket
- [ ] Testar mapa e rota

### **DIA 6: Completion e Cancellation**

#### **6.5 Completion Flow**
- [ ] Mover `RideCompletedScreen.tsx` → `Ride/Completion/RideCompletedScreen.tsx`
- [ ] Mover `ClientRateDriverScreen.tsx` → `Ride/Completion/RateDriverScreen.tsx`
- [ ] Aplicar design moderno
- [ ] Adicionar animações de sucesso
- [ ] Testar avaliação

#### **6.6 Cancellation Flow**
- [ ] Mover `ClientCancelRideScreen.tsx` → `Ride/Cancellation/CancelRideScreen.tsx`
- [ ] Mover `CancelFeeScreen.tsx` → `Ride/Cancellation/CancelFeeScreen.tsx`
- [ ] Aplicar design
- [ ] Testar fluxo

### **DIA 7: Favorites, History e Profile**

#### **6.7 Favorites**
- [ ] Mover `FavoritesScreen.tsx` → `Favorites/FavoritesScreen.tsx`
- [ ] Mover `AddFavoriteScreen.tsx` → `Favorites/AddFavoriteScreen.tsx`
- [ ] Aplicar design
- [ ] Testar CRUD

#### **6.8 History**
- [ ] Mover `ClientHistoryScreen.tsx` → `History/HistoryScreen.tsx`
- [ ] Mover `OrderDetailsScreen.tsx` → `History/OrderDetailsScreen.tsx`
- [ ] Aplicar design
- [ ] Testar filtros

#### **6.9 Profile**
- [ ] Mover `ClientProfileScreen.tsx` → `Profile/ProfileScreen.tsx`
- [ ] Mover `ClientSettingsScreen.tsx` → `Profile/SettingsScreen.tsx`
- [ ] Mover `ClientCityScreen.tsx` → `Profile/CitySelectionScreen.tsx`
- [ ] Mover `ClientWalletScreen.tsx` → `Profile/WalletScreen.tsx`
- [ ] Mover `ClientHelpScreen.tsx` → `Profile/HelpScreen.tsx`
- [ ] Aplicar design
- [ ] Testar todas as telas

---

## 🎨 FASE 7: Melhorias de Layout (DIA 8-9)

### **7.1 HomeScreen - Estilo Uber/99**

```typescript
// Layout inspirado no Uber
- Header fixo com menu e perfil
- Mapa full screen
- Search bar flutuante sobre o mapa
- Favoritos rápidos (Home, Trabalho, etc)
- Bottom sheet para seleções
- Botão de "Minha Localização" flutuante
```

### **7.2 RideTrackingScreen - Estilo 99**

```typescript
// Layout inspirado no 99
- Mapa com rota destacada
- Card do motorista flutuante
- Status bar no topo
- Botões de ação (Ligar, Chat) acessíveis
- Informações em tempo real
```

### **7.3 OrderSummaryScreen - Estilo iFood**

```typescript
// Layout inspirado no iFood
- Card de resumo destacado
- Informações claras e organizadas
- Botão de ação principal grande
- Opção de editar cada item
- Preço em destaque
```

### **7.4 HistoryScreen - Estilo Uber**

```typescript
// Layout inspirado no Uber
- Cards de corridas anteriores
- Filtros no topo
- Resumo de gastos
- Scroll infinito
- Pull to refresh
```

---

## 🧪 FASE 8: Testes e Validação (DIA 10)

### **8.1 Testes Funcionais**
- [ ] Fluxo completo de solicitação
- [ ] Busca de motorista
- [ ] Acompanhamento em tempo real
- [ ] Cancelamento
- [ ] Avaliação
- [ ] Histórico
- [ ] Perfil e configurações

### **8.2 Testes de Navegação**
- [ ] Todas as rotas funcionando
- [ ] Parâmetros sendo passados corretamente
- [ ] Voltar funciona em todas as telas
- [ ] Deep links (se aplicável)

### **8.3 Testes de WebSocket**
- [ ] Conexão estabelecida
- [ ] Eventos recebidos
- [ ] Reconexão automática
- [ ] Desconexão limpa

### **8.4 Testes de Performance**
- [ ] Tempo de carregamento
- [ ] Animações suaves (60fps)
- [ ] Sem memory leaks
- [ ] Scroll performance

### **8.5 Testes de UX**
- [ ] Feedback visual em todas as ações
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Acessibilidade básica

---

## 📊 Checklist de Qualidade

### **Código**
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings
- [ ] Imports organizados
- [ ] Código comentado onde necessário
- [ ] Sem console.logs

### **Design**
- [ ] Cores do design system
- [ ] Espaçamentos consistentes
- [ ] Tipografia padronizada
- [ ] Ícones corretos
- [ ] Animações suaves

### **Funcionalidade**
- [ ] Todas as features funcionando
- [ ] WebSocket conectado
- [ ] Mapas carregando
- [ ] Navegação fluida
- [ ] Dados persistindo

### **Performance**
- [ ] Renderizações otimizadas
- [ ] Imagens otimizadas
- [ ] Lazy loading onde aplicável
- [ ] Sem re-renders desnecessários

---

## 🚀 Deploy e Documentação (DIA 10)

### **9.1 Atualizar Documentação**
- [ ] README atualizado
- [ ] ARQUITETURA.md atualizado
- [ ] Criar MIGRATION_GUIDE.md
- [ ] Atualizar CHANGELOG.md

### **9.2 Comunicação**
- [ ] Avisar equipe sobre mudanças
- [ ] Documentar breaking changes
- [ ] Criar guia de migração
- [ ] Apresentar novo design system

### **9.3 Merge e Deploy**
- [ ] Code review
- [ ] Merge para develop
- [ ] Testes em staging
- [ ] Deploy para produção

---

## 📈 Métricas de Sucesso

| Métrica | Antes | Meta | Status |
|---------|-------|------|--------|
| Arquivos organizados | 35 | 15 | ⏳ |
| Linhas HomeScreen | 1534 | 400 | ⏳ |
| Componentes duplicados | 4 | 1 | ⏳ |
| Funções duplicadas | 5+ | 0 | ⏳ |
| Tempo de build | - | < 30s | ⏳ |
| Cobertura de testes | 0% | 60% | ⏳ |
| Performance (FPS) | - | 60 | ⏳ |
| Acessibilidade | - | 80% | ⏳ |

---

## ⚠️ Riscos e Contingências

| Risco | Plano B |
|-------|---------|
| Quebrar navegação | Rollback imediato + fix |
| WebSocket parar | Verificar eventos + reconectar |
| Performance ruim | Profiling + otimização |
| Bugs em produção | Hotfix branch + deploy rápido |
| Atraso no cronograma | Priorizar features críticas |

---

## 🎯 Próximos Passos

1. ✅ **Aprovar este plano**
2. ✅ **Criar branch** `refactor/client-redesign`
3. ✅ **Iniciar FASE 1** (Criar estrutura)
4. ✅ **Daily updates** no Slack/Discord
5. ✅ **Code review** ao final de cada fase

---

**Início Previsto:** 03/02/2026  
**Conclusão Prevista:** 14/02/2026  
**Duração:** 10 dias úteis  
**Responsável:** Time de Desenvolvimento  
**Status:** ⏳ Aguardando Aprovação
