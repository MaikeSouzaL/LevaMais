# 🏠 Home Screen Cliente - Nova Interface

## ✨ Visão Geral

Nova interface da tela Home do cliente, criada seguindo 100% o design fornecido. A tela foi completamente reconstruída com componentes modulares e reutilizáveis.

---

## 📁 Estrutura de Arquivos

```
src/
├── components/ (GLOBAIS - Reutilizáveis em todo o app)
│   ├── LocationHeader/
│   │   └── index.tsx
│   └── MapActionButtons/
│       └── index.tsx
│
└── screens/(authenticated)/Client/HomeScreen/
    ├── components/ (LOCAIS - Específicos da HomeScreen)
    │   ├── VehicleMarker.tsx
    │   ├── SearchBar.tsx
    │   ├── ServiceCard.tsx
    │   └── BottomSheet.tsx
    └── index.tsx (Tela principal)
```

---

## 🧩 Componentes Globais

### 1. **LocationHeader** (`src/components/LocationHeader/index.tsx`)

**Uso:** Header com avatar do usuário e localização atual

**Props:**

- `currentAddress: string` - Endereço atual do usuário
- `userPhotoUrl?: string` - URL da foto de perfil
- `onPressLocation?: () => void` - Callback ao pressionar dropdown

**Características:**

- Avatar redondo com border verde (primary)
- Texto "LOCAL ATUAL" em uppercase
- Endereço em negrito
- Botão dropdown com ícone
- Background glassmorphism (bg-surface-dark/90)
- Border sutil branca

**Exemplo de uso:**

```tsx
<LocationHeader
  currentAddress="Rua das Flores, 123"
  userPhotoUrl="https://..."
  onPressLocation={() => console.log("Location pressed")}
/>
```

---

### 2. **MapActionButtons** (`src/components/MapActionButtons/index.tsx`)

**Uso:** Botões de ação flutuantes no mapa

**Props:**

- `onPressSafety?: () => void` - Callback botão de segurança
- `onPressLocation?: () => void` - Callback botão de localização

**Características:**

- 2 botões circulares flutuantes
- Botão Segurança (azul) com ícone shield
- Botão Localização (verde) com ícone my-location
- Background glassmorphism
- Active state com scale animation
- Posicionamento absoluto (bottom-right)

**Exemplo de uso:**

```tsx
<MapActionButtons
  onPressSafety={() => console.log("Safety")}
  onPressLocation={() => console.log("My location")}
/>
```

---

## 🎨 Componentes Locais (HomeScreen)

### 1. **VehicleMarker** (`components/VehicleMarker.tsx`)

**Uso:** Marcadores de veículos no mapa

**Props:**

- `type: 'car' | 'motorcycle'` - Tipo do veículo
- `isPulsing?: boolean` - Animação de pulso (default: false)
- `rotation?: number` - Rotação do ícone em graus (default: 45)

**Características:**

- Ícones: `directions-car` (carro) ou `two-wheeler` (moto)
- Efeito glow pulsante opcional
- Background escuro com border verde
- Rotação customizável

**Exemplo de uso:**

```tsx
<Marker coordinate={coords}>
  <VehicleMarker type="car" rotation={45} isPulsing={true} />
</Marker>
```

---

### 2. **SearchBar** (`components/SearchBar.tsx`)

**Uso:** Barra de busca de destino

**Props:**

- `onPress?: () => void` - Callback ao pressionar

**Características:**

- Background verde (primary)
- Ícone de lupa (preto) à esquerda
- Texto placeholder: "Para onde vamos?"
- Bordas totalmente arredondadas (rounded-full)
- Sombra sutil
- Altura fixa de 56px (h-14)

**Exemplo de uso:**

```tsx
<SearchBar onPress={() => navigate("SearchDestination")} />
```

---

### 3. **ServiceCard** (`components/ServiceCard.tsx`)

**Uso:** Cards de serviço (Corrida/Entrega)

**Props:**

- `icon: keyof typeof MaterialIcons.glyphMap` - Nome do ícone
- `title: string` - Título do serviço
- `subtitle: string` - Subtítulo/descrição
- `onPress?: () => void` - Callback ao pressionar

**Características:**

- Background escuro (card-dark)
- Ícone em container com fundo verde translúcido
- Título em negrito branco
- Subtítulo cinza
- Ícone decorativo gigante em background (opacidade baixa)
- Bordas arredondadas (2rem)
- Altura fixa 144px (h-36)
- Active state

**Exemplo de uso:**

```tsx
<ServiceCard
  icon="local-taxi"
  title="Corrida"
  subtitle="Carro ou Moto"
  onPress={() => console.log("Ride selected")}
/>
```

---

### 4. **BottomSheet** (`components/BottomSheet.tsx`)

**Uso:** Painel inferior com busca e serviços

**Props:**

- `onPressSearch?: () => void` - Callback busca
- `onPressRide?: () => void` - Callback corrida
- `onPressDelivery?: () => void` - Callback entrega

**Características:**

- Background escuro com bordas superiores arredondadas (2.5rem)
- Handle/indicador no topo
- Contém SearchBar + 2 ServiceCards lado a lado
- Padding bottom para navegação
- Sombra superior pronunciada
- Border superior sutil

**Estrutura interna:**

```tsx
<BottomSheet>
  - Handle (barra cinza) - SearchBar - Grid 2 colunas: - ServiceCard (Corrida) -
  ServiceCard (Entrega)
</BottomSheet>
```

---

## 🗺️ Tela Principal (HomeScreen/index.tsx)

### Layout Hierárquico:

```
SafeAreaView (edges: top)
└── View (Container principal)
    └── View (Mapa container)
        ├── MapView (Mapa com estilo escuro)
        │   └── Marker[] (Veículos com VehicleMarker)
        ├── View (Gradiente superior - escurece topo)
        ├── View (Gradiente inferior - escurece base)
        ├── LocationHeader (Absoluto top)
        ├── MapActionButtons (Absoluto right-bottom)
        └── BottomSheet (Absoluto bottom)
```

---

### Dados Mockados:

```tsx
MOCK_DATA = {
  user: {
    name: "João Silva",
    photoUrl: "https://ui-avatars.com/api/...",
  },
  currentLocation: {
    address: "Rua das Flores, 123",
    coordinates: {
      latitude: -23.5505,
      longitude: -46.6333,
    },
  },
  vehicles: [
    {
      id: "1",
      type: "car",
      latitude: -23.5485,
      longitude: -46.635,
      rotation: 45,
    },
    {
      id: "2",
      type: "motorcycle",
      latitude: -23.5525,
      longitude: -46.628,
      rotation: -12,
    },
  ],
};
```

---

### Estilo do Mapa (Dark Mode):

**Cores principais:**

- Fundo base: `#101816`
- Ruas: `#1b2823` / `#1f2d29`
- Rodovias: `#23332d`
- Água: `#0a1410`
- Textos: `#9ca5a3` / `#746855`

**Features ocultas:**

- POIs (pontos de interesse)
- Ícones de transporte
- Geometria administrativa

---

### Funcionalidades (Stubs):

```tsx
handlePressLocation(); // Dropdown de endereço
handlePressSafety(); // Botão de segurança
handlePressMyLocation(); // Centralizar no usuário (implementado)
handlePressSearch(); // Abrir busca de destino
handlePressRide(); // Solicitar corrida
handlePressDelivery(); // Solicitar entrega
```

---

## 🎨 Design System

### Cores:

- **Primary:** `#02de95` (Verde Leva+)
- **Background Dark:** `#0f231c`
- **Surface Dark:** `#16201d`
- **Card Dark:** `#1b2823`
- **White:** `#ffffff`
- **Gray 400:** `#9ca5a3`
- **Gray 600:** `#4b5563`

### Espaçamentos:

- Gap entre cards: `16px` (gap-4)
- Padding horizontal: `24px` (px-6)
- Padding vertical BottomSheet: `20px` (p-5)

### Bordas:

- SearchBar: `rounded-full` (9999px)
- ServiceCard: `rounded-[2rem]` (32px)
- BottomSheet: `rounded-t-[2.5rem]` (40px superior)
- Avatar: `rounded-full`

### Sombras:

- SearchBar: `shadow-lg`
- BottomSheet: `shadow-2xl`
- MapActionButtons: `shadow-lg`

---

## 📱 Responsividade

- **Dimensões:** Usa `Dimensions.get('window')` para tamanhos dinâmicos
- **SafeAreaView:** Edges configurados para respeitar notch/island
- **Flex:** Componentes usam flex-1 para preencher espaço disponível
- **Absolute:** Componentes flutuantes usam posicionamento absoluto

---

## 🔄 Estado Atual

### ✅ Implementado:

- [x] Interface 100% fiel ao design
- [x] Componentes separados (globais e locais)
- [x] Dados mockados
- [x] Mapa com estilo escuro customizado
- [x] Marcadores de veículos no mapa
- [x] Header com localização
- [x] Botões de ação flutuantes
- [x] Bottom sheet com serviços
- [x] Gradientes no mapa
- [x] Animação de centralização no mapa

### ❌ Não Implementado (próximas etapas):

- [ ] Navegação para tela de busca
- [ ] Integração com localização real (GPS)
- [ ] Animação do Bottom Sheet (arrastar)
- [ ] Busca de endereço funcionando
- [ ] Seleção de serviço (Corrida/Entrega)
- [ ] Integração com backend (motoristas disponíveis)
- [ ] Botão de segurança funcionando
- [ ] Drawer/Menu lateral

---

## 🚀 Próximos Passos

1. **Integrar localização real:**

   ```tsx
   import * as Location from "expo-location";
   ```

2. **Implementar busca de endereço:**

   - Criar `SearchDestinationScreen`
   - Integrar com Google Places API

3. **Animar Bottom Sheet:**

   - Usar `react-native-gesture-handler`
   - Adicionar swipe up/down

4. **Conectar com backend:**

   - API para buscar motoristas próximos
   - WebSocket para atualização em tempo real

5. **Implementar navegação:**
   ```tsx
   navigation.navigate("SearchDestination");
   navigation.navigate("RideRequest");
   ```

---

## 📝 Notas Técnicas

### Imports Necessários:

```tsx
import { MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
```

### Configuração NativeWind:

Todos os componentes usam classes Tailwind através do NativeWind. Certifique-se de ter o `tailwind.config.js` configurado com as cores customizadas.

### Performance:

- `tracksViewChanges={false}` nos Markers para otimizar
- `StyleSheet.absoluteFillObject` no MapView
- Memoização pode ser adicionada posteriormente se necessário

---

## 🎯 Diferenças do Layout Anterior

| Aspecto          | Anterior            | Novo                 |
| ---------------- | ------------------- | -------------------- |
| **Bottom Sheet** | Lista de motoristas | Cards de serviço     |
| **Busca**        | Input no header     | Botão grande verde   |
| **Categorias**   | Scroll horizontal   | 2 cards fixos        |
| **Mapa**         | Padrão claro        | Dark mode estilizado |
| **Header**       | Simples             | Avatar + localização |
| **Botões**       | Toolbar inferior    | Flutuantes laterais  |

---

**Data de criação:** 19 de dezembro de 2025  
**Status:** ✅ Interface completa, funcionalidades pendentes  
**Designer:** Baseado em HTML fornecido  
**Developer:** GitHub Copilot
