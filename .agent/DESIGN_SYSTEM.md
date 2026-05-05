# 🎨 Design System - Leva Mais

## 📱 Inspiração: Uber, 99 e iFood

### **Princípios de Design**

1. **Minimalismo** - Interface limpa e focada
2. **Hierarquia Visual Clara** - Informações importantes em destaque
3. **Feedback Imediato** - Animações e transições suaves
4. **Consistência** - Padrões visuais em todas as telas
5. **Acessibilidade** - Contraste adequado e tamanhos de toque

---

## 🎨 Paleta de Cores

### **Cores Principais**
```typescript
export const colors = {
  // Primary (Verde Leva Mais)
  primary: {
    50: '#e6faf4',
    100: '#b3f0df',
    200: '#80e6ca',
    300: '#4ddcb5',
    400: '#1ad2a0',
    500: '#02de95',  // Principal
    600: '#02b277',
    700: '#018659',
    800: '#015a3b',
    900: '#002e1d',
  },
  
  // Background (Escuro)
  background: {
    primary: '#0f231c',    // Fundo principal
    secondary: '#1a2f27',  // Cards e elevações
    tertiary: '#243830',   // Inputs e áreas interativas
  },
  
  // Texto
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.75)',
    tertiary: 'rgba(255, 255, 255, 0.55)',
    disabled: 'rgba(255, 255, 255, 0.35)',
  },
  
  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Borders
  border: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.20)',
  },
};
```

### **Gradientes**
```typescript
export const gradients = {
  primary: 'linear-gradient(135deg, #02de95 0%, #01a86f 100%)',
  dark: 'linear-gradient(180deg, #0f231c 0%, #1a2f27 100%)',
  overlay: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
};
```

---

## 📏 Espaçamento e Dimensões

### **Spacing Scale**
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};
```

### **Border Radius**
```typescript
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};
```

### **Tamanhos de Toque (Touch Targets)**
```typescript
export const touchTargets = {
  minimum: 44,  // iOS HIG
  comfortable: 48,
  large: 56,
};
```

---

## 🔤 Tipografia

### **Font Families**
```typescript
export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  black: 'Inter-Black',
};
```

### **Font Sizes**
```typescript
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};
```

### **Line Heights**
```typescript
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};
```

---

## 🎭 Componentes Base

### **1. Buttons**

#### **Primary Button**
```typescript
{
  backgroundColor: colors.primary[500],
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: borderRadius.lg,
  minHeight: touchTargets.comfortable,
}
```

#### **Secondary Button**
```typescript
{
  backgroundColor: colors.background.secondary,
  borderWidth: 1,
  borderColor: colors.border.medium,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: borderRadius.lg,
}
```

#### **Danger Button**
```typescript
{
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  borderWidth: 1,
  borderColor: 'rgba(239, 68, 68, 0.35)',
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: borderRadius.lg,
}
```

### **2. Cards**

#### **Elevated Card**
```typescript
{
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
}
```

#### **Outlined Card**
```typescript
{
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderWidth: 1,
  borderColor: colors.border.light,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
}
```

### **3. Inputs**

#### **Text Input**
```typescript
{
  backgroundColor: colors.background.tertiary,
  borderWidth: 1,
  borderColor: colors.border.medium,
  borderRadius: borderRadius.md,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: fontSize.base,
  color: colors.text.primary,
  minHeight: touchTargets.comfortable,
}
```

#### **Search Input**
```typescript
{
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.xl,
  paddingVertical: 12,
  paddingHorizontal: 16,
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
}
```

### **4. Bottom Sheets**

#### **Container**
```typescript
{
  backgroundColor: colors.background.secondary,
  borderTopLeftRadius: borderRadius['2xl'],
  borderTopRightRadius: borderRadius['2xl'],
  paddingTop: spacing.sm,
  paddingBottom: spacing.xl,
  paddingHorizontal: spacing.lg,
}
```

#### **Handle**
```typescript
{
  width: 40,
  height: 4,
  backgroundColor: colors.border.medium,
  borderRadius: borderRadius.full,
  alignSelf: 'center',
  marginBottom: spacing.md,
}
```

---

## 🎬 Animações

### **Timing Functions**
```typescript
export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'spring',
  },
};
```

### **Micro-interações**
- **Tap**: Scale 0.95 (200ms)
- **Slide In**: TranslateY from bottom (300ms)
- **Fade**: Opacity 0 → 1 (200ms)
- **Bounce**: Spring animation para confirmações

---

## 📱 Layout Patterns

### **1. Tela Principal (Home)**
```
┌─────────────────────────────────┐
│ [≡] Leva Mais          [👤]     │ ← Header fixo
├─────────────────────────────────┤
│                                 │
│         🗺️ MAPA                 │ ← Mapa full screen
│                                 │
│                                 │
├─────────────────────────────────┤
│ 🔍 Para onde você vai?          │ ← Search bar flutuante
├─────────────────────────────────┤
│ [🏠] [💼] [⭐]                   │ ← Favoritos rápidos
└─────────────────────────────────┘
```

### **2. Bottom Sheet (Ofertas)**
```
┌─────────────────────────────────┐
│         ━━━                     │ ← Handle
│                                 │
│ 🚗 Escolha seu veículo          │ ← Título
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏍️ Moto      R$ 15,00       │ │ ← Opção
│ │ Rápido • 1 pessoa           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🚗 Carro     R$ 25,00  ✓    │ │ ← Selecionado
│ │ Conforto • 4 pessoas        │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Confirmar]                     │ ← Action button
└─────────────────────────────────┘
```

### **3. Tracking Screen**
```
┌─────────────────────────────────┐
│ [←]              [⋮]            │ ← Header
├─────────────────────────────────┤
│                                 │
│    🗺️ MAPA COM ROTA             │ ← Mapa com rota
│    📍 Origem                    │
│    🚗 Motorista                 │
│    📍 Destino                   │
│                                 │
├─────────────────────────────────┤
│ ━━━                             │
│                                 │
│ 🚗 Chegando em 5 min            │ ← Status
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👨‍✈️ João Silva  ⭐ 4.8       │ │ ← Driver info
│ │ Honda Civic • ABC-1234      │ │
│ └─────────────────────────────┘ │
│                                 │
│ [📞 Ligar]  [💬 Chat]           │ ← Actions
└─────────────────────────────────┘
```

---

## 🎯 Padrões de UX (Baseado em Uber/99/iFood)

### **1. Feedback Visual**
- ✅ Loading states em todos os botões
- ✅ Skeleton screens durante carregamento
- ✅ Animações de sucesso/erro
- ✅ Haptic feedback em ações importantes

### **2. Navegação**
- ✅ Bottom sheets para seleções rápidas
- ✅ Modais para confirmações importantes
- ✅ Transições suaves entre telas
- ✅ Gestos intuitivos (swipe, pull-to-refresh)

### **3. Hierarquia de Informação**
1. **Primária**: Ação principal (botão grande, cor destacada)
2. **Secundária**: Informações importantes (cards, badges)
3. **Terciária**: Detalhes e metadados (texto menor, cor suave)

### **4. Estados de Componentes**
- **Default**: Estado padrão
- **Hover**: Feedback visual (web)
- **Active**: Pressionado (scale 0.95)
- **Disabled**: Opacidade 0.5
- **Loading**: Spinner ou skeleton
- **Error**: Borda vermelha + mensagem

---

## 📐 Grid System

### **Breakpoints**
```typescript
export const breakpoints = {
  xs: 0,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
};
```

### **Container Padding**
```typescript
export const containerPadding = {
  mobile: spacing.lg,    // 16px
  tablet: spacing.xl,    // 24px
  desktop: spacing['2xl'], // 32px
};
```

---

## 🎨 Ícones

### **Biblioteca**: `@expo/vector-icons`

### **Tamanhos Padrão**
```typescript
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
};
```

### **Ícones Principais**
- **Home**: `MaterialCommunityIcons` - `home`
- **Busca**: `MaterialIcons` - `search`
- **Perfil**: `MaterialIcons` - `person`
- **Histórico**: `MaterialIcons` - `history`
- **Configurações**: `MaterialIcons` - `settings`
- **Mapa**: `MaterialCommunityIcons` - `map-marker`
- **Veículos**: `MaterialCommunityIcons` - `car`, `motorbike`, `van-utility`, `truck`

---

## 🚀 Implementação

### **Criar arquivo de tema**
```typescript
// src/theme/index.ts
export { colors, gradients } from './colors';
export { spacing, borderRadius, touchTargets } from './dimensions';
export { fonts, fontSize, lineHeight } from './typography';
export { animations } from './animations';
export { breakpoints, containerPadding } from './layout';
export { iconSizes } from './icons';
```

### **Usar no componente**
```typescript
import { colors, spacing, borderRadius } from '@/theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
});
```

---

## 📚 Referências

- **Uber Design**: Clean, minimal, focus on map
- **99**: Bright colors, clear CTAs, friendly
- **iFood**: Card-based, vibrant, easy navigation

**Objetivo**: Combinar o melhor de cada um para criar uma experiência única e consistente no Leva Mais.
