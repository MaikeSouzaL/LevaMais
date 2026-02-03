# ⚡ QUICK START - Reorganização Client

## 🚀 Início Rápido em 5 Minutos

Este guia te coloca em ação rapidamente!

---

## 📖 1. LEIA PRIMEIRO (2 min)

### **Contexto:**
Estamos reorganizando o módulo Client do Leva Mais seguindo padrões do **Uber, 99 e iFood**.

### **Progresso Atual:**
- ✅ **72% concluído**
- ✅ 5 fases completas
- 🟡 Fase 6 em andamento

### **O que já está pronto:**
- Design System completo
- 7 componentes reutilizáveis
- 4 hooks customizados
- Utilitários centralizados
- Tipos TypeScript completos

---

## 🎯 2. ENTENDA A ESTRUTURA (1 min)

```
src/
├── theme/                    # Design system
│   └── index.ts             # Import: @/theme
│
└── screens/(authenticated)/Client/Shared/
    ├── components/          # Componentes reutilizáveis
    │   └── index.tsx       # Import: @/...Shared/components
    ├── hooks/              # Hooks customizados
    │   └── index.ts        # Import: @/...Shared/hooks
    ├── utils/              # Utilitários
    │   └── index.ts        # Import: @/...Shared/utils
    └── types/              # Tipos TypeScript
        └── index.ts        # Import: @/...Shared/types
```

---

## 💻 3. USE OS RECURSOS (2 min)

### **Design System:**
```typescript
import { colors, spacing, fontSize, borderRadius } from '@/theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary[500],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
});
```

### **Componentes:**
```typescript
import { 
  LoadingButton, 
  SearchBar, 
  BottomSheet 
} from '@/screens/(authenticated)/Client/Shared/components';

<LoadingButton
  title="Confirmar"
  onPress={handleSubmit}
  loading={isLoading}
/>
```

### **Hooks:**
```typescript
import { 
  useDriverSearch, 
  useMapLocation 
} from '@/screens/(authenticated)/Client/Shared/hooks';

const { searchingState, startSearch } = useDriverSearch();
const { region, centerOnUser } = useMapLocation();
```

### **Utilitários:**
```typescript
import { 
  formatBRL, 
  isValidCPF, 
  mapRideStatusToText 
} from '@/screens/(authenticated)/Client/Shared/utils';

const price = formatBRL(25.50);  // "R$ 25,50"
const valid = isValidCPF('123.456.789-00');
const status = mapRideStatusToText('in_progress');  // "Em andamento"
```

### **Tipos:**
```typescript
import type { 
  RideStatus, 
  VehicleType, 
  User 
} from '@/screens/(authenticated)/Client/types';

const status: RideStatus = 'pending';
const vehicle: VehicleType = 'car';
```

---

## 🎨 4. PADRÕES DE DESIGN

### **Cores:**
```typescript
colors.primary[500]        // Verde principal
colors.background.primary  // Fundo escuro
colors.text.primary        // Texto branco
colors.border.light        // Borda sutil
```

### **Espaçamentos:**
```typescript
spacing.xs   // 4px
spacing.sm   // 8px
spacing.md   // 12px
spacing.lg   // 16px
spacing.xl   // 24px
spacing.2xl  // 32px
```

### **Tamanhos de Fonte:**
```typescript
fontSize.xs    // 12px
fontSize.sm    // 14px
fontSize.base  // 16px
fontSize.lg    // 18px
fontSize.xl    // 20px
fontSize.2xl   // 24px
```

### **Border Radius:**
```typescript
borderRadius.sm    // 8px
borderRadius.md    // 12px
borderRadius.lg    // 16px
borderRadius.xl    // 20px
borderRadius.full  // 9999px
```

---

## 🛠️ 5. EXEMPLOS PRÁTICOS

### **Criar um botão:**
```typescript
import { LoadingButton } from '@/screens/(authenticated)/Client/Shared/components';

<LoadingButton
  title="Solicitar Corrida"
  onPress={handleRequest}
  variant="primary"
  loading={isLoading}
  disabled={!canRequest}
/>
```

### **Usar busca de motorista:**
```typescript
import { useDriverSearch } from '@/screens/(authenticated)/Client/Shared/hooks';

const { 
  searchingState, 
  driverFoundState, 
  startSearch 
} = useDriverSearch(rideId);

// Iniciar busca
startSearch({
  title: 'Buscando motorista...',
  price: 'R$ 25,00',
  eta: '5 min',
  rideId: '123',
});
```

### **Formatar valores:**
```typescript
import { formatBRL, formatDate, formatPhone } from '@/screens/(authenticated)/Client/Shared/utils';

const price = formatBRL(25.50);           // "R$ 25,50"
const date = formatDate('2026-02-02');    // "02/02/2026"
const phone = formatPhone('11987654321'); // "(11) 98765-4321"
```

---

## 📚 6. DOCUMENTAÇÃO COMPLETA

### **Para aprender mais:**
- `.agent/INDICE_GERAL.md` - Navegação completa
- `.agent/DESIGN_SYSTEM.md` - Design system detalhado
- `.agent/FASE_5_COMPONENTES.md` - Componentes
- `.agent/PROGRESSO_FASE_6.md` - Hooks

### **Para implementar:**
- `.agent/PLANO_EXECUCAO_COMPLETO.md` - Plano de 10 dias
- `.agent/PROGRESSO_REORGANIZACAO.md` - Acompanhamento

---

## ✅ CHECKLIST RÁPIDO

Antes de começar:

- [ ] Entendi a estrutura de pastas
- [ ] Sei usar o design system
- [ ] Conheço os componentes disponíveis
- [ ] Conheço os hooks disponíveis
- [ ] Sei usar os utilitários
- [ ] Entendo os tipos TypeScript
- [ ] Configurei imports absolutos (`@/`)

---

## 🎯 PRÓXIMOS PASSOS

### **Se você vai:**

#### **Criar um componente:**
1. Use design system (`@/theme`)
2. Adicione tipos TypeScript
3. Exporte em `index.tsx`
4. Documente props

#### **Criar um hook:**
1. Siga padrão `use*`
2. Adicione tipos TypeScript
3. Exporte em `index.ts`
4. Documente retorno

#### **Criar uma tela:**
1. Use componentes compartilhados
2. Use hooks customizados
3. Aplique design system
4. Siga padrões de navegação

---

## 💡 DICAS

### **Performance:**
- Use `React.memo` quando necessário
- Evite re-renders desnecessários
- Lazy load quando possível

### **Qualidade:**
- Sempre use TypeScript
- Sempre aplique design system
- Sempre reutilize componentes
- Sempre documente código complexo

### **Manutenção:**
- Mantenha código limpo
- Siga padrões estabelecidos
- Teste antes de commitar
- Peça code review

---

## 🚨 PROBLEMAS COMUNS

### **Import não funciona:**
```typescript
// ❌ Errado
import { colors } from '../../../theme';

// ✅ Correto
import { colors } from '@/theme';
```

### **Componente não encontrado:**
```typescript
// ❌ Errado
import BottomSheet from './components/BottomSheet';

// ✅ Correto
import { BottomSheet } from '@/screens/(authenticated)/Client/Shared/components';
```

### **Tipo não encontrado:**
```typescript
// ❌ Errado
import { RideStatus } from './types';

// ✅ Correto
import type { RideStatus } from '@/screens/(authenticated)/Client/types';
```

---

## 🎉 PRONTO!

Você está pronto para começar! 🚀

**Dúvidas?** Consulte a documentação completa em `.agent/`

---

**Última atualização:** 02/02/2026 - 18:57  
**Versão:** 1.0
