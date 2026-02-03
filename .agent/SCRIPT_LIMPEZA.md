# 🗑️ SCRIPT DE LIMPEZA - Executar Manualmente

## ⚠️ IMPORTANTE: Faça backup antes de executar!

---

## 📋 OPÇÃO 1: Mover para Backup (Recomendado)

### Windows (PowerShell):
```powershell
# Criar pasta de backup
New-Item -Path "src\screens\(authenticated)\Client\_backup_old_screens" -ItemType Directory -Force

# Mover pasta HomeScreen
Move-Item -Path "src\screens\(authenticated)\Client\HomeScreen" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\HomeScreen" -Force

# Mover telas antigas individuais
Move-Item -Path "src\screens\(authenticated)\Client\ClientCancelRideScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\ClientHelpScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\ClientHistoryScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\ClientProfileScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\ClientRateDriverScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\ClientSettingsScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\ClientWalletScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\ClientCityScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\RideCompletedScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
Move-Item -Path "src\screens\(authenticated)\Client\RideTrackingScreen.tsx" -Destination "src\screens\(authenticated)\Client\_backup_old_screens\" -ErrorAction SilentlyContinue
```

---

## 📋 OPÇÃO 2: Deletar Permanentemente (Cuidado!)

### Windows (PowerShell):
```powershell
# ⚠️ ATENÇÃO: Isso deleta permanentemente!

# Deletar pasta HomeScreen
Remove-Item -Path "src\screens\(authenticated)\Client\HomeScreen" -Recurse -Force

# Deletar telas antigas individuais
Remove-Item -Path "src\screens\(authenticated)\Client\Client*.tsx" -Force
Remove-Item -Path "src\screens\(authenticated)\Client\Ride*.tsx" -Force
```

---

## 📋 OPÇÃO 3: Manual (Mais Seguro)

1. Abra o Windows Explorer
2. Navegue até: `src\screens\(authenticated)\Client\`
3. Crie uma pasta: `_backup_old_screens`
4. Mova manualmente:
   - Pasta `HomeScreen` → `_backup_old_screens\`
   - Arquivos `Client*.tsx` → `_backup_old_screens\`
   - Arquivos `Ride*.tsx` → `_backup_old_screens\`

---

## ✅ ARQUIVOS A MANTER

**NÃO DELETE:**
- ✅ `Home/` (nova versão refatorada)
- ✅ `Ride/` (nova estrutura)
- ✅ `Favorites/` (nova estrutura)
- ✅ `History/` (nova estrutura)
- ✅ `Profile/` (nova estrutura)
- ✅ `Shared/` (componentes e hooks)
- ✅ `types/` (tipos compartilhados)

---

## 📝 APÓS A LIMPEZA

1. Verificar compilação:
```bash
npm run build
```

2. Testar aplicação:
```bash
npm run dev
```

3. Se tudo funcionar, deletar backup:
```powershell
Remove-Item -Path "src\screens\(authenticated)\Client\_backup_old_screens" -Recurse -Force
```

---

## 🆘 SE ALGO DER ERRADO

Restaurar do backup:
```powershell
Move-Item -Path "src\screens\(authenticated)\Client\_backup_old_screens\*" -Destination "src\screens\(authenticated)\Client\" -Force
```

---

**Recomendação:** Use a OPÇÃO 1 (Mover para Backup)!
