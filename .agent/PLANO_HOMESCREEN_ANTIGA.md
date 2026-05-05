# 🗂️ PLANO PARA PASTA HomeScreen

## 📋 ANÁLISE DA PASTA

**Localização:** `src/screens/(authenticated)/Client/HomeScreen/`

**Conteúdo:**
- 12 arquivos de telas (SUBSTITUÍDOS)
- 1 pasta `components/` (PARCIALMENTE NECESSÁRIA)
- 1 arquivo `useSearchCountdown.ts` (NECESSÁRIO)

---

## ✅ ARQUIVOS QUE DEVEM SER PRESERVADOS

### **1. useSearchCountdown.ts** ⚠️ IMPORTANTE
**Status:** NECESSÁRIO - Usado pelo Home/index.tsx refatorado  
**Ação:** MOVER para `Shared/hooks/`

### **2. components/ (Parcial)** ⚠️ IMPORTANTE
Alguns componentes ainda são usados pelo Home/index.tsx:

**NECESSÁRIOS (Mover para Shared/components/):**
- ✅ `BottomSheet.tsx` - Usado (mas já temos versão nova)
- ✅ `DriverFoundSheet.tsx` - Usado pelo Home
- ✅ `FinalOrderSummarySheet.tsx` - Usado pelo Home
- ✅ `OffersCarSheet.tsx` - Usado pelo Home
- ✅ `OffersMotoSheet.tsx` - Usado pelo Home
- ✅ `OffersTruckSheet.tsx` - Usado pelo Home
- ✅ `OffersVanSheet.tsx` - Usado pelo Home
- ✅ `SafetyHelpSheet.tsx` - Usado pelo Home
- ✅ `SearchTimeoutCard.tsx` - Usado pelo Home
- ✅ `SearchingDriverModal.tsx` - Usado pelo Home
- ✅ `VehicleMarker.tsx` - Usado pelo Home

**PODEM SER REMOVIDOS (Substituídos):**
- ❌ `SearchBar.tsx` - Já temos em Shared/components
- ❌ `ServiceCard.tsx` - Não usado

---

## 🗑️ ARQUIVOS QUE PODEM SER REMOVIDOS

**Telas antigas (TODAS SUBSTITUÍDAS):**
- ❌ `index.tsx` (1.534 linhas) → Substituído por Home/index.tsx
- ❌ `AddFavoriteScreen.tsx` → Substituído
- ❌ `AddressPickerScreen.tsx` → Substituído
- ❌ `CancelFeeScreen.tsx` → Substituído
- ❌ `ChatScreen.tsx` → Substituído
- ❌ `FavoritesScreen.tsx` → Substituído
- ❌ `FinalOrderSummaryScreen.tsx` → Substituído
- ❌ `OrderDetailsScreen.tsx` → Substituído
- ❌ `PaymentScreen.tsx` → Substituído
- ❌ `SelectVehicleScreen.tsx` → Substituído
- ❌ `ServicePurposeScreen.tsx` → Substituído

---

## 📝 PLANO DE AÇÃO

### **PASSO 1: Mover Componentes Necessários**

```powershell
# Criar pasta para componentes legados
New-Item -Path "src\screens\(authenticated)\Client\Home\components" -ItemType Directory -Force

# Mover componentes necessários
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\DriverFoundSheet.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\FinalOrderSummarySheet.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\OffersCarSheet.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\OffersMotoSheet.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\OffersTruckSheet.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\OffersVanSheet.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\SafetyHelpSheet.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\SearchTimeoutCard.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\SearchingDriverModal.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\components\VehicleMarker.tsx" -Destination "src\screens\(authenticated)\Client\Home\components\"
```

### **PASSO 2: Mover Hook Necessário**

```powershell
# Mover useSearchCountdown para Shared/hooks
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen\useSearchCountdown.ts" -Destination "src\screens\(authenticated)\Client\Shared\hooks\"
```

### **PASSO 3: Atualizar Imports no Home/index.tsx**

Atualizar de:
```typescript
import { LocalBottomSheet } from '../HomeScreen/components/BottomSheet';
```

Para:
```typescript
import { LocalBottomSheet } from './components/BottomSheet';
```

### **PASSO 4: Mover Pasta HomeScreen para Backup**

```powershell
# Criar backup
New-Item -Path "src\screens\(authenticated)\Client\_backup_old_screens" -ItemType Directory -Force

# Mover pasta HomeScreen completa
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\HomeScreen"
```

---

## ⚠️ IMPORTANTE

**ANTES de mover:**
1. ✅ Mover componentes necessários (Passo 1)
2. ✅ Mover hook necessário (Passo 2)
3. ✅ Atualizar imports (Passo 3)
4. ✅ Testar compilação
5. ✅ Só então mover HomeScreen para backup (Passo 4)

**DEPOIS de mover:**
1. Testar aplicação
2. Verificar se tudo funciona
3. Se OK, deletar backup
4. Se não OK, restaurar backup

---

## 🎯 RESUMO

**O QUE FAZER:**
1. ✅ PRESERVAR: 10 componentes + 1 hook
2. ✅ MOVER: Para Home/components/
3. ✅ ATUALIZAR: Imports no Home/index.tsx
4. ✅ BACKUP: Mover HomeScreen para _backup_old_screens/
5. ✅ TESTAR: Aplicação completa
6. ✅ LIMPAR: Deletar backup se tudo OK

**NÃO DELETAR SEM:**
- Mover componentes necessários
- Atualizar imports
- Testar aplicação

---

**Recomendação:** Execute os passos na ordem exata! ⚠️
