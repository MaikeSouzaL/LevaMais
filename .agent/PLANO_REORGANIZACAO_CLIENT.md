# 🎯 Plano de Reorganização - Telas do Cliente

## 📋 Objetivo

Reorganizar a estrutura de pastas e arquivos do módulo Client para melhorar:
- ✅ Manutenibilidade
- ✅ Escalabilidade
- ✅ Clareza do código
- ✅ Reutilização de componentes

---

## 🗂️ Nova Estrutura Proposta

```
src/screens/(authenticated)/Client/
│
├── 📁 Home/                              # Tela principal
│   ├── HomeScreen.tsx                    # Tela principal (refatorada)
│   ├── hooks/
│   │   ├── useHomeMap.ts                # Lógica do mapa
│   │   ├── useDriverSearch.ts           # Busca de motorista
│   │   └── useWebSocketEvents.ts        # Eventos WebSocket
│   └── components/
│       ├── SearchBar.tsx
│       ├── ServiceCard.tsx
│       ├── VehicleMarker.tsx
│       └── SafetyButton.tsx
│
├── 📁 Ride/                              # Fluxo completo de corrida
│   │
│   ├── 📁 Request/                       # Solicitação de corrida
│   │   ├── AddressPickerScreen.tsx
│   │   ├── SelectVehicleScreen.tsx
│   │   ├── ServicePurposeScreen.tsx
│   │   ├── PaymentMethodScreen.tsx      # Renomeado de PaymentScreen
│   │   ├── OrderSummaryScreen.tsx       # Renomeado de FinalOrderSummaryScreen
│   │   └── components/
│   │       ├── VehicleCard.tsx
│   │       ├── PaymentMethodCard.tsx
│   │       └── OrderSummaryCard.tsx
│   │
│   ├── 📁 Search/                        # Busca de motorista
│   │   ├── SearchingDriverScreen.tsx    # Tela de busca
│   │   ├── SearchTimeoutScreen.tsx
│   │   └── components/
│   │       ├── SearchingAnimation.tsx
│   │       ├── CountdownTimer.tsx
│   │       └── CancelSearchButton.tsx
│   │
│   ├── 📁 Tracking/                      # Acompanhamento
│   │   ├── RideTrackingScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── components/
│   │       ├── DriverInfoCard.tsx
│   │       ├── RideStatusBar.tsx
│   │       ├── RouteMap.tsx
│   │       └── ActionButtons.tsx
│   │
│   ├── 📁 Completion/                    # Finalização
│   │   ├── RideCompletedScreen.tsx
│   │   ├── RateDriverScreen.tsx         # Renomeado
│   │   └── components/
│   │       ├── RideSummaryCard.tsx
│   │       ├── StarRating.tsx
│   │       └── FeedbackForm.tsx
│   │
│   └── 📁 Cancellation/                  # Cancelamento
│       ├── CancelRideScreen.tsx         # Renomeado
│       ├── CancelFeeScreen.tsx
│       └── components/
│           ├── CancelReasonSelector.tsx
│           └── CancelFeeCard.tsx
│
├── 📁 Favorites/                         # Endereços favoritos
│   ├── FavoritesScreen.tsx
│   ├── AddFavoriteScreen.tsx
│   └── components/
│       ├── FavoriteCard.tsx
│       └── FavoriteIconPicker.tsx
│
├── 📁 History/                           # Histórico
│   ├── HistoryScreen.tsx                # Renomeado
│   ├── OrderDetailsScreen.tsx
│   └── components/
│       ├── RideHistoryCard.tsx
│       ├── FilterTabs.tsx
│       └── SummaryHeader.tsx
│
├── 📁 Profile/                           # Perfil e configurações
│   ├── ProfileScreen.tsx                # Renomeado
│   ├── SettingsScreen.tsx               # Renomeado
│   ├── CitySelectionScreen.tsx          # Renomeado
│   ├── WalletScreen.tsx                 # Renomeado
│   ├── HelpScreen.tsx                   # Renomeado
│   └── components/
│       ├── ProfileForm.tsx
│       ├── SettingItem.tsx
│       ├── CitySearchBar.tsx
│       └── WalletBalance.tsx
│
├── 📁 Shared/                            # Componentes compartilhados
│   ├── components/
│   │   ├── BottomSheet.tsx
│   │   ├── OffersSheet.tsx              # Unificado (era 4 arquivos)
│   │   ├── SafetyHelpSheet.tsx
│   │   └── MapView.tsx
│   │
│   ├── hooks/
│   │   ├── useSearchCountdown.ts
│   │   ├── useRideStatus.ts
│   │   └── useLocation.ts
│   │
│   └── utils/
│       ├── formatters.ts                # formatBRL, formatDate, etc
│       ├── validators.ts
│       └── mappers.ts                   # Funções de mapeamento
│
└── 📁 types/                             # Tipos TypeScript
    ├── navigation.ts                     # Tipos de navegação
    ├── ride.ts                          # Tipos de corrida
    └── user.ts                          # Tipos de usuário
```

---

## 🔄 Mapeamento de Mudanças

### **Arquivos que serão MOVIDOS**

| Arquivo Atual | Novo Local | Ação |
|--------------|-----------|------|
| `HomeScreen/index.tsx` | `Home/HomeScreen.tsx` | Mover + Refatorar |
| `HomeScreen/AddressPickerScreen.tsx` | `Ride/Request/AddressPickerScreen.tsx` | Mover |
| `HomeScreen/SelectVehicleScreen.tsx` | `Ride/Request/SelectVehicleScreen.tsx` | Mover |
| `HomeScreen/ServicePurposeScreen.tsx` | `Ride/Request/ServicePurposeScreen.tsx` | Mover |
| `HomeScreen/PaymentScreen.tsx` | `Ride/Request/PaymentMethodScreen.tsx` | Mover + Renomear |
| `HomeScreen/FinalOrderSummaryScreen.tsx` | `Ride/Request/OrderSummaryScreen.tsx` | Mover + Renomear |
| `HomeScreen/FavoritesScreen.tsx` | `Favorites/FavoritesScreen.tsx` | Mover |
| `HomeScreen/AddFavoriteScreen.tsx` | `Favorites/AddFavoriteScreen.tsx` | Mover |
| `HomeScreen/ChatScreen.tsx` | `Ride/Tracking/ChatScreen.tsx` | Mover |
| `HomeScreen/CancelFeeScreen.tsx` | `Ride/Cancellation/CancelFeeScreen.tsx` | Mover |
| `HomeScreen/OrderDetailsScreen.tsx` | `History/OrderDetailsScreen.tsx` | Mover |
| `RideTrackingScreen.tsx` | `Ride/Tracking/RideTrackingScreen.tsx` | Mover |
| `RideCompletedScreen.tsx` | `Ride/Completion/RideCompletedScreen.tsx` | Mover |
| `ClientCancelRideScreen.tsx` | `Ride/Cancellation/CancelRideScreen.tsx` | Mover + Renomear |
| `ClientRateDriverScreen.tsx` | `Ride/Completion/RateDriverScreen.tsx` | Mover + Renomear |
| `ClientHistoryScreen.tsx` | `History/HistoryScreen.tsx` | Mover + Renomear |
| `ClientProfileScreen.tsx` | `Profile/ProfileScreen.tsx` | Mover + Renomear |
| `ClientSettingsScreen.tsx` | `Profile/SettingsScreen.tsx` | Mover + Renomear |
| `ClientCityScreen.tsx` | `Profile/CitySelectionScreen.tsx` | Mover + Renomear |
| `ClientWalletScreen.tsx` | `Profile/WalletScreen.tsx` | Mover + Renomear |
| `ClientHelpScreen.tsx` | `Profile/HelpScreen.tsx` | Mover + Renomear |

### **Componentes que serão UNIFICADOS**

| Arquivos Atuais | Novo Arquivo | Estratégia |
|----------------|--------------|-----------|
| `OffersCarSheet.tsx`<br>`OffersMotoSheet.tsx`<br>`OffersVanSheet.tsx`<br>`OffersTruckSheet.tsx` | `Shared/components/OffersSheet.tsx` | Criar componente genérico com prop `vehicleType` |

### **Componentes que serão EXTRAÍDOS**

Do `HomeScreen/index.tsx` (1534 linhas):
- `useHomeMap.ts` - Lógica do mapa
- `useDriverSearch.ts` - Busca de motorista
- `useWebSocketEvents.ts` - Eventos WebSocket
- `SearchBar.tsx` - Já existe, mover para Home/components
- `ServiceCard.tsx` - Já existe, mover para Home/components
- `VehicleMarker.tsx` - Já existe, mover para Home/components

---

## 📦 Arquivos Utilitários a Criar

### **`Shared/utils/formatters.ts`**
```typescript
export function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export function formatDate(value?: string): string {
  if (!value) return "-";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

export function formatVehicleText(driver: any): string {
  if (!driver?.vehicle) return "Veículo não informado";
  const { brand, model, color, plate } = driver.vehicle;
  return `${brand} ${model} ${color} - ${plate}`;
}
```

### **`Shared/utils/validators.ts`**
```typescript
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\d{10,11}$/.test(phone.replace(/\D/g, ""));
}

export function isValidCPF(cpf: string): boolean {
  // Implementar validação de CPF
  return true;
}
```

### **`types/navigation.ts`**
```typescript
export type ClientStackParamList = {
  Home: undefined;
  AddressPicker: { type: "pickup" | "destination" };
  SelectVehicle: undefined;
  ServicePurpose: undefined;
  PaymentMethod: { amount: number };
  OrderSummary: undefined;
  RideTracking: { rideId: string };
  RideCompleted: { rideId: string };
  RateDriver: { rideId: string };
  CancelRide: { rideId: string; total?: number };
  // ... outros
};
```

---

## 🚀 Plano de Execução

### **Fase 1: Preparação** (1 dia)
- [ ] Criar nova estrutura de pastas
- [ ] Criar arquivos utilitários
- [ ] Criar arquivos de tipos
- [ ] Fazer backup do código atual

### **Fase 2: Mover Componentes Simples** (2 dias)
- [ ] Mover telas de Profile
- [ ] Mover telas de History
- [ ] Mover telas de Favorites
- [ ] Atualizar imports

### **Fase 3: Reorganizar Fluxo de Corrida** (3 dias)
- [ ] Mover telas de Request
- [ ] Mover telas de Tracking
- [ ] Mover telas de Completion
- [ ] Mover telas de Cancellation
- [ ] Atualizar imports

### **Fase 4: Refatorar HomeScreen** (2 dias)
- [ ] Extrair hooks customizados
- [ ] Separar componentes
- [ ] Mover para nova estrutura
- [ ] Testar funcionalidades

### **Fase 5: Unificar Componentes** (1 dia)
- [ ] Criar OffersSheet genérico
- [ ] Substituir 4 sheets antigos
- [ ] Testar com todos os tipos de veículo

### **Fase 6: Atualizar Navegação** (1 dia)
- [ ] Atualizar tipos de navegação
- [ ] Atualizar todas as referências
- [ ] Criar constantes de rotas
- [ ] Testar fluxo completo

### **Fase 7: Testes e Ajustes** (1 dia)
- [ ] Testar todos os fluxos
- [ ] Corrigir bugs
- [ ] Validar performance
- [ ] Documentar mudanças

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Quebrar navegação | Alto | Testar cada tela após mover |
| Imports quebrados | Médio | Usar busca global para atualizar |
| Perder funcionalidades | Alto | Testar fluxo completo antes de commitar |
| Conflitos de merge | Médio | Fazer em branch separada |

---

## ✅ Checklist de Validação

Após cada fase, validar:
- [ ] App compila sem erros
- [ ] Navegação funciona corretamente
- [ ] WebSocket continua funcionando
- [ ] Mapas carregam corretamente
- [ ] Todas as telas são acessíveis
- [ ] Não há imports quebrados
- [ ] Tipos TypeScript estão corretos

---

## 📊 Métricas de Sucesso

**Antes:**
- 35 arquivos na pasta Client
- HomeScreen com 1534 linhas
- 4 componentes duplicados (Offers)
- Funções utilitárias duplicadas em 5+ arquivos

**Depois:**
- Estrutura organizada em 7 módulos principais
- HomeScreen com ~300-400 linhas
- 1 componente genérico de Offers
- Funções utilitárias centralizadas

---

## 🎯 Próximos Passos

1. **Revisar este plano** com a equipe
2. **Aprovar estrutura proposta**
3. **Criar branch** `refactor/client-screens`
4. **Executar Fase 1** (Preparação)
5. **Revisar e ajustar** conforme necessário

---

## 📝 Notas Importantes

- ⚠️ **NÃO fazer tudo de uma vez** - Fazer em fases pequenas e testáveis
- ✅ **Commitar frequentemente** - Cada fase deve ter seu commit
- 🧪 **Testar após cada mudança** - Não acumular problemas
- 📖 **Documentar decisões** - Manter este documento atualizado
- 🤝 **Comunicar mudanças** - Avisar equipe sobre alterações

---

**Estimativa Total:** 10-12 dias de trabalho
**Prioridade:** Alta
**Complexidade:** Média-Alta
