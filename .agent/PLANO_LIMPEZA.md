# 🗑️ PLANO DE SUBSTITUIÇÃO E LIMPEZA

## 📅 Data: 02/02/2026 - 19:38
## 🎯 Objetivo: Remover arquivos antigos e consolidar refatoração

---

## 📋 ARQUIVOS A REMOVER

### **Pasta HomeScreen (COMPLETA)**
```
src/screens/(authenticated)/Client/HomeScreen/
├── index.tsx (1.534 linhas) → SUBSTITUÍDO por Home/index.tsx
├── AddFavoriteScreen.tsx → SUBSTITUÍDO
├── AddressPickerScreen.tsx → SUBSTITUÍDO
├── CancelFeeScreen.tsx → SUBSTITUÍDO
├── ChatScreen.tsx → SUBSTITUÍDO
├── FavoritesScreen.tsx → SUBSTITUÍDO
├── FinalOrderSummaryScreen.tsx → SUBSTITUÍDO
├── OrderDetailsScreen.tsx → SUBSTITUÍDO
├── PaymentScreen.tsx → SUBSTITUÍDO
├── SelectVehicleScreen.tsx → SUBSTITUÍDO
├── ServicePurposeScreen.tsx → SUBSTITUÍDO
├── useSearchCountdown.ts → MANTER (usado por Home)
└── components/ → MANTER (usado por Home)
```

### **Telas Antigas na Raiz**
```
src/screens/(authenticated)/Client/
├── ClientCancelRideScreen.tsx → SUBSTITUÍDO
├── ClientHelpScreen.tsx → SUBSTITUÍDO
├── ClientHistoryScreen.tsx → SUBSTITUÍDO
├── ClientProfileScreen.tsx → SUBSTITUÍDO
├── ClientRateDriverScreen.tsx → SUBSTITUÍDO
├── ClientSettingsScreen.tsx → SUBSTITUÍDO
├── ClientWalletScreen.tsx → SUBSTITUÍDO
├── RideCompletedScreen.tsx → SUBSTITUÍDO
└── RideTrackingScreen.tsx → SUBSTITUÍDO
```

---

## ✅ AÇÕES A EXECUTAR

### **1. Criar Backup**
- [x] Criar pasta `_backup_old_screens/`
- [ ] Mover arquivos antigos para backup

### **2. Remover Arquivos Antigos**
- [ ] Deletar telas antigas da pasta HomeScreen
- [ ] Deletar telas antigas da raiz
- [ ] Manter apenas componentes necessários

### **3. Consolidar Estrutura**
- [ ] Verificar imports
- [ ] Atualizar navegação
- [ ] Testar compilação

---

**Status:** Pronto para executar!
