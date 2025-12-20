# Home Screen Cliente - Versão Final

## ✅ Configuração Atual (Restaurada ao BottomSheet)

Após testes com SideSheet lateral, **voltamos ao BottomSheet inferior** que estava funcionando melhor.

## 📱 Layout Final

```
┌─────────────────────────────────┐
│ [☰]  📍 Rua das Flores, 123 [⋮] │
│                                 │
│                                 │
│           MAPA 🗺️               │
│                            [🛡️] │
│                            [📍] │
│                                 │
├─────────────────────────────────┤
│ 🔍 Para onde vamos?             │ ← BottomSheet
│ [🚗 Corrida] [📦 Entrega]       │   (arrasta ↕)
└─────────────────────────────────┘
```

## 🎯 Componentes na Tela

### 1. Topo Esquerdo - Botão Menu Drawer

- **Ícone**: ☰ (menu hamburguer)
- **Ação**: Abre Drawer Navigator
- **Posição**: `absolute top-14 left-4`

### 2. Centro Superior - LocationHeader

- **Conteúdo**: Avatar + "LOCAL ATUAL" + Endereço + Seta ↓
- **Ação**: Clicável (futuro: selecionar endereço)
- **Posição**: `absolute top-28 left-4 right-4`

### 3. Topo Direito - Botão Mais Opções

- **Ícone**: ⋮ (three dots vertical)
- **Ação**: Nenhuma (reservado para futuro)
- **Posição**: `absolute top-14 right-4`

### 4. Inferior Direito - MapActionButtons

- **Botão 1**: 🛡️ Escudo (Segurança)
- **Botão 2**: 📍 My Location (Centralizar mapa)
- **Posição**: `absolute right-4 bottom-6`

### 5. Inferior - BottomSheet (Gorhom)

- **Conteúdo**:
  - SearchBar "Para onde vamos?"
  - ServiceCards (Corrida + Entrega)
- **Gestos**: Arrasta para cima/baixo
- **Snap Points**: 10%, 35%, 90%
- **Posição Inicial**: 35%

## 🎨 Estrutura de Componentes

```
HomeScreen/
├── MapView (background)
│   ├── Dark Style
│   ├── Gradientes (topo e base)
│   └── VehicleMarkers (carros/motos)
├── Botão Menu (☰)
├── LocationHeader (📍)
├── Botão More Options (⋮)
├── MapActionButtons (🛡️ 📍)
└── BottomSheet (@gorhom/bottom-sheet)
    ├── Handle (barrinha para arrastar)
    ├── SearchBar (🔍)
    └── ServiceCards
        ├── Corrida (🚗)
        └── Entrega (📦)
```

## 📂 Arquivos

### Componentes Globais

- `src/components/LocationHeader/index.tsx`
- `src/components/MapActionButtons/index.tsx`

### Componentes Locais (HomeScreen)

- `src/screens/(authenticated)/Client/HomeScreen/index.tsx` (principal)
- `src/screens/(authenticated)/Client/HomeScreen/components/BottomSheet.tsx`
- `src/screens/(authenticated)/Client/HomeScreen/components/SearchBar.tsx`
- `src/screens/(authenticated)/Client/HomeScreen/components/ServiceCard.tsx`
- `src/screens/(authenticated)/Client/HomeScreen/components/VehicleMarker.tsx`

### Navegação

- `src/routes/drawer.cliente.routes.tsx` (Drawer Navigator)

## 🔧 Handlers Implementados

```typescript
// Menu Drawer
handlePressMenu(); // Abre drawer navigator

// LocationHeader
handlePressLocation(); // Console log (TODO: modal/select)

// More Options (3 dots)
handlePressMoreOptions(); // Console log (TODO: futuro)

// MapActionButtons
handlePressSafety(); // Console log (TODO: funcionalidade segurança)
handlePressMyLocation(); // Centraliza mapa no usuário

// BottomSheet
handlePressSearch(); // Console log (TODO: busca de endereço)
handlePressRide(); // Console log (TODO: solicitar corrida)
handlePressDelivery(); // Console log (TODO: solicitar entrega)
```

## 🎯 BottomSheet - Detalhes

### Snap Points (Posições)

1. **10%** - Minimizado (apenas handle)
2. **35%** - Médio (posição inicial - mostra conteúdo)
3. **90%** - Expandido (quase tela cheia)

### Gestos

- **Arrasta Handle para cima** ↑ - Expande
- **Arrasta Handle para baixo** ↓ - Recolhe
- **Velocidade rápida** - Vai direto para próximo snap point

### Controle Programático

```typescript
bottomSheetRef.current?.snapToIndex(0); // Minimizar
bottomSheetRef.current?.snapToIndex(1); // Médio (inicial)
bottomSheetRef.current?.snapToIndex(2); // Expandir
```

## 🎨 Design System

### Cores

- **Primary**: `#02de95` (verde)
- **Background Dark**: `#0f231c`
- **Surface Dark**: `#16201d`
- **Card Dark**: `#1b2823`

### Espaçamentos

- Padding horizontal padrão: `px-6` (24px)
- Gap entre cards: `gap-4` (16px)
- Border radius cards: `rounded-3xl` (24px)

### Sombras

- MapActionButtons: `shadow-lg`
- LocationHeader: `shadow-2xl`
- BottomSheet: Elevation 10

## 🚀 Próximos Passos (TODOs)

### Funcionalidades Pendentes

1. **LocationHeader**

   - [ ] Modal/BottomSheet para selecionar endereço
   - [ ] Integração com GPS
   - [ ] Endereços salvos/favoritos

2. **SearchBar**

   - [ ] Navegação para tela de busca
   - [ ] Autocomplete de endereços
   - [ ] Histórico de buscas

3. **ServiceCards**

   - [ ] Navegação para tela de solicitação
   - [ ] Escolha de veículo (carro/moto)
   - [ ] Estimativa de preço

4. **Botão More Options (⋮)**

   - [ ] Menu de opções rápidas
   - [ ] Configurações rápidas
   - [ ] Compartilhar localização

5. **MapActionButtons**

   - [ ] Botão Segurança - Contatos de emergência
   - [ ] Botão Location - Animar câmera do mapa

6. **BottomSheet Expandido (90%)**
   - [ ] Conteúdo adicional quando expandido
   - [ ] Lista de endereços recentes
   - [ ] Promoções/ofertas

## 📊 Comparação: BottomSheet vs SideSheet

### Por que voltamos ao BottomSheet?

| Aspecto           | BottomSheet ✅          | SideSheet ❌         |
| ----------------- | ----------------------- | -------------------- |
| **UX Mobile**     | Natural (padrão mobile) | Menos comum          |
| **Espaço Mapa**   | Bom (2/3 visível)       | Melhor (mais espaço) |
| **Familiaridade** | Alta (Uber, 99, etc.)   | Baixa                |
| **Implementação** | Biblioteca madura       | Custom/complexo      |
| **Conflitos**     | Nenhum                  | Drawer Navigator     |
| **Conteúdo**      | Fácil de organizar      | Limitado (vertical)  |

## ✨ Vantagens do Layout Atual

1. ✅ **UX Familiar** - Usuários já conhecem (Uber, 99, Rappi)
2. ✅ **Acesso Rápido** - Busca e serviços sempre à mão
3. ✅ **Mapa Visível** - 60-70% do mapa sempre visível
4. ✅ **Gestos Intuitivos** - Arrastar para cima/baixo é natural
5. ✅ **Organização Clara** - Menu (☰) vs Opções (⋮) separados
6. ✅ **Biblioteca Madura** - @gorhom/bottom-sheet é estável e performático

## 🐛 Troubleshooting

### BottomSheet não responde

- Verifique `GestureHandlerRootView` no componente raiz
- Confirme que `react-native-gesture-handler` está instalado

### Conteúdo não aparece

- Verifique se `bottomSheetRef` está sendo passado
- Confirme snap points e index inicial

### Animações travadas

- Execute `npx expo start -c` para limpar cache
- Verifique configuração do Reanimated no `babel.config.js`

---

## 📝 Notas Finais

- **SideSheet removido** - Componentes em `src/components/SideSheet/` podem ser deletados
- **BottomSheet restaurado** - Usando `@gorhom/bottom-sheet` v5.2.8
- **Drawer Navigator mantido** - Menu principal na esquerda
- **Layout limpo** - 5 elementos principais bem posicionados

**Status**: ✅ **ESTÁVEL E PRONTO PARA DESENVOLVIMENTO DAS FUNCIONALIDADES**
