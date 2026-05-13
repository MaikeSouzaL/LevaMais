#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files that have console.logs
const filesToClean = [
  'src/routes/ClientBoot.tsx',
  'src/screens/(authenticated)/Driver/DriverHomeScreen.tsx',
  'src/screens/(authenticated)/Driver/DriverRequestsScreen.tsx',
  'src/screens/(authenticated)/Client/Home/index.tsx',
  'src/screens/(authenticated)/Client/Ride/SearchingDriver/index.tsx',
  'src/components/client/destination/FloatingSearchCard.tsx',
  'src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx',
  'src/screens/(authenticated)/Driver/DriverRideScreen.tsx',
  'src/components/client/searching-delivery/DeliverySearchBottomSheet.tsx',
  'src/screens/(public)/DriverSelfieScreen/index.tsx',
  'src/screens/(public)/SelectProfileScreen/index.tsx',
  'src/screens/(public)/SignInScreen/index.tsx',
  'src/screens/(authenticated)/Client/Orders/RideOffersMarketplaceScreen.tsx',
  'src/screens/(authenticated)/Client/Ride/Request/RideSetup/index.tsx',
  'src/components/client/destination/DestinationSearchInput.tsx',
  'src/screens/(public)/SignUpScreen/index.tsx',
  'src/screens/(public)/DriverDocumentsScreen/index.tsx',
  'src/screens/(public)/GooglePhonePromptScreen/index.tsx',
  'src/screens/(public)/VerifyCodeScreen/index.tsx',
  'src/screens/(public)/ForgotPasswordScreen/index.tsx',
  'src/screens/(authenticated)/Client/Profile/Settings/index.tsx',
  'src/screens/(authenticated)/Client/Ride/Request/AddressPicker/index.tsx',
  'src/screens/(authenticated)/Driver/DriverRateClientScreen.tsx',
  'src/screens/(public)/NewPasswordScreen/index.tsx',
  'src/screens/(public)/NotificationPermissionScreen/index.tsx',
  'src/screens/(authenticated)/Driver/DriverRideDetailsScreen.tsx',
  'src/components/GlobalMap/index.tsx',
  'src/components/AddressAutocomplete.tsx',
];

console.log('🧹 Iniciando limpeza de console.logs...\n');

const patterns = [
  {
    pattern: /console\.log\([^)]*\);?\n?/g,
    replacement: '',
    name: 'console.log',
  },
  {
    pattern: /console\.warn\([^)]*\);?\n?/g,
    replacement: '',
    name: 'console.warn',
  },
  {
    pattern: /console\.error\([^)]*\);?\n?/g,
    replacement: '',
    name: 'console.error',
  },
];

let totalRemoved = 0;
let filesModified = 0;

filesToClean.forEach((filePath) => {
  const fullPath = path.join(__dirname, '../', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;
  let removedCount = 0;

  patterns.forEach(({ pattern, replacement, name }) => {
    const matches = content.match(pattern) || [];
    if (matches.length > 0) {
      removedCount += matches.length;
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    filesModified++;
    totalRemoved += removedCount;
    console.log(`✅ ${filePath}`);
    console.log(`   └─ Removidos: ${removedCount} console statements`);
  }
});

console.log(`\n📊 Resumo:`);
console.log(`   Total de arquivos processados: ${filesToClean.length}`);
console.log(`   Arquivos modificados: ${filesModified}`);
console.log(`   Total de console statements removidos: ${totalRemoved}`);

if (filesModified > 0) {
  console.log(`\n✨ Limpeza concluída com sucesso!`);
  console.log(`\n🔍 Próximo passo: Adicionar imports do logger onde necessário`);
  console.log(`   import { logger } from '@/utils/logger';`);
} else {
  console.log(`\n✅ Nenhum console.log encontrado!`);
}
