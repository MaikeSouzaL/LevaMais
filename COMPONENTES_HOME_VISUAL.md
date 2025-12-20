# 🎨 Home Screen Cliente - Guia Visual de Componentes

## 📱 Preview da Tela

```
┌─────────────────────────────────────┐
│  ╔════════════════════════════╗    │ ← LocationHeader (Global)
│  ║ 👤  LOCAL ATUAL             ▼║    │   - Avatar do usuário
│  ║    Rua das Flores, 123      ║    │   - Endereço atual
│  ╚════════════════════════════╝    │   - Dropdown
│                                      │
│          🗺️  M A P A               │
│         (Dark Style)                │
│                                      │
│     🚗                    🏍️        │ ← VehicleMarker (Local)
│  (pulsando)          (rotacionado)  │   - Ícones de veículos
│                                      │   - Efeito glow
│                                      │
│                            ┌────┐   │
│                            │🛡️  │   │ ← MapActionButtons
│                            └────┘   │   (Global)
│                            ┌────┐   │   - Segurança (azul)
│                            │📍  │   │   - Localização (verde)
│                            └────┘   │
│  ╔════════════════════════════╗    │
│  ║        ━━━━                ║    │ ← Handle
│  ║                            ║    │
│  ║  🔍  Para onde vamos?      ║    │ ← SearchBar (Local)
│  ║                            ║    │   - Background verde
│  ║  ┌───────────┐ ┌─────────┐║    │   - Ícone de busca
│  ║  │  🚕       │ │  📦     │║    │
│  ║  │           │ │         │║    │ ← ServiceCard (Local)
│  ║  │ Corrida   │ │ Entrega │║    │   - 2 cards lado a lado
│  ║  │ Carro ou  │ │ Enviar  │║    │   - Ícones + títulos
│  ║  │ Moto      │ │ itens   │║    │   - Background escuro
│  ║  └───────────┘ └─────────┘║    │
│  ╚════════════════════════════╝    │ ← BottomSheet (Local)
└─────────────────────────────────────┘
```

---

## 🧩 Anatomia dos Componentes

### 1. LocationHeader (Componente Global)

```
┌──────────────────────────────────────────┐
│  ┌────┐  LOCAL ATUAL                  ▼ │
│  │ 👤 │  Rua das Flores, 123           │ │
│  └────┘                                  │
│   Avatar    Texto + Endereço     Dropdown│
│                                           │
│  • Background: glassmorphism (#16201d90) │
│  • Border: branco translúcido            │
│  • Avatar: border verde (#02de95)        │
│  • Padding: interno de 8px               │
│  • Bordas: totalmente arredondadas       │
└──────────────────────────────────────────┘

Props:
  - currentAddress: string
  - userPhotoUrl?: string
  - onPressLocation?: () => void

Uso: Qualquer tela que precise mostrar localização atual
```

---

### 2. MapActionButtons (Componente Global)

```
        Posição: Absoluta
        Right: 16px
        Bottom: 24px

        ┌──────┐
        │  🛡️  │ ← Segurança (azul #60A5FA)
        └──────┘
           ↓ gap-3
        ┌──────┐
        │  📍  │ ← Minha Localização (verde #02de95)
        └──────┘

        • Tamanho: 48x48px cada
        • Background: glassmorphism
        • Shadow: elevada
        • Active: scale(0.95)

Props:
  - onPressSafety?: () => void
  - onPressLocation?: () => void

Uso: Qualquer tela com mapa que precise ações flutuantes
```

---

### 3. VehicleMarker (Componente Local)

```
        Sem pulso:              Com pulso:

        ┌──────┐               ┌~~~~~~~~~~┐
        │  🚗  │               │  🚗      │ ← Glow animado
        └──────┘               └~~~~~~~~~~┘

        • Rotação: customizável (45deg default)
        • Cores: ícone verde, fundo escuro
        • Border: verde translúcido
        • Tamanhos: carro (40px) / moto (32px)

Props:
  - type: 'car' | 'motorcycle'
  - isPulsing?: boolean (default: false)
  - rotation?: number (default: 45)

Uso: Marcadores de veículos no MapView
```

---

### 4. SearchBar (Componente Local)

```
┌──────────────────────────────────────────┐
│  🔍  Para onde vamos?                     │
│                                           │
│  • Background: #02de95 (verde primary)   │
│  • Altura: 56px (h-14)                   │
│  • Ícone: preto (#0f231c)                │
│  • Texto: negrito, escuro                │
│  • Bordas: totalmente arredondadas       │
│  • Shadow: sutil verde                   │
└──────────────────────────────────────────┘

Props:
  - onPress?: () => void

Uso: Bottom sheet da home (pode ser reutilizado)
```

---

### 5. ServiceCard (Componente Local)

```
┌──────────────────────────┐
│  ┌────────┐              │
│  │  🚕    │   ← Ícone com background verde/10
│  └────────┘              │
│                          │
│  Corrida    ← Título (bold, branco)
│  Carro ou Moto  ← Subtítulo (cinza)
│                          │
│         🚕  ← Decoração (opacidade 3%)
└──────────────────────────┘

Dimensões:
  - Altura: 144px (h-36)
  - Largura: flex (50% do container)
  - Padding: 20px
  - Border radius: 32px

Props:
  - icon: nome do MaterialIcon
  - title: string
  - subtitle: string
  - onPress?: () => void

Variações:
  - Corrida: icon="local-taxi"
  - Entrega: icon="local-shipping"
```

---

### 6. BottomSheet (Componente Local)

```
┌──────────────────────────────────────────┐
│               ━━━━━                      │ ← Handle (12x4px)
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ 🔍  Para onde vamos?                │ │ ← SearchBar
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─────────────┐  ┌─────────────┐       │
│  │   🚕        │  │   📦        │       │
│  │             │  │             │       │
│  │  Corrida    │  │  Entrega    │       │ ← ServiceCards
│  │  Carro ou   │  │  Enviar     │       │
│  │  Moto       │  │  itens      │       │
│  └─────────────┘  └─────────────┘       │
│                                           │
└──────────────────────────────────────────┘

Estrutura:
  - Background: #0f231c (background-dark)
  - Border radius top: 40px (2.5rem)
  - Padding: 24px horizontal
  - Padding bottom: 48px (para navegação)
  - Shadow: elevada superior
  - Border top: branco/5%

Props:
  - onPressSearch?: () => void
  - onPressRide?: () => void
  - onPressDelivery?: () => void

Conteúdo interno:
  1. Handle (indicador visual)
  2. SearchBar
  3. Grid 2 colunas com ServiceCards
```

---

## 🎨 Paleta de Cores Utilizada

```css
/* Principais */
--primary: #02de95; /* Verde Leva+ */
--background-dark: #0f231c; /* Fundo escuro */
--surface-dark: #16201d; /* Surface escuro */
--card-dark: #1b2823; /* Cards escuros */

/* Neutros */
--white: #ffffff;
--gray-400: #9ca5a3;
--gray-600: #4b5563;
--black: #000000;

/* Acento */
--blue-400: #60a5fa; /* Botão segurança */
```

---

## 📐 Sistema de Espaçamento

```
gap-1  = 4px    (0.25rem)
gap-2  = 8px    (0.5rem)
gap-3  = 12px   (0.75rem)
gap-4  = 16px   (1rem)     ← Mais usado
gap-5  = 20px   (1.25rem)
gap-6  = 24px   (1.5rem)

p-2    = 8px
p-3    = 12px
p-4    = 16px
p-5    = 20px   ← ServiceCard
p-6    = 24px   ← BottomSheet

mx-4   = margin horizontal 16px
mt-3   = margin top 12px
mb-6   = margin bottom 24px
```

---

## 🎯 Sistema de Bordas

```css
rounded-full    = 9999px  /* SearchBar, Avatar, Botões */
rounded-[2rem]  = 32px    /* ServiceCard */
rounded-t-[2.5rem] = 40px /* BottomSheet (só topo) */
rounded-2xl     = 16px    /* Ícones ServiceCard */
rounded-lg      = 8px
```

---

## 📊 Hierarquia Z-Index

```
z-0   = Marcadores de veículos no mapa
z-10  = Gradientes do mapa
z-20  = LocationHeader, MapActionButtons
z-30  = BottomSheet
```

---

## 🔄 Estados Interativos

### TouchableOpacity:

```tsx
activeOpacity={0.8}  // Padrão para cards
activeOpacity={0.9}  // SearchBar
```

### Active Scale:

```tsx
className = "active:scale-95"; // MapActionButtons
className = "active:bg-[#151f1b]"; // ServiceCard
```

### Hover (Web):

```tsx
className = "hover:bg-white/10"; // LocationHeader dropdown
className = "hover:bg-[#23332d]"; // ServiceCard
```

---

## 📱 Breakpoints e Responsividade

```tsx
// Usa Dimensions.get('window')
const { width, height } = Dimensions.get('window');

// SafeAreaView edges
edges={['top']}  // LocationHeader
edges={['bottom']}  // Antigo (não usado no novo layout)

// Flex para preencher
className="flex-1"  // Containers principais

// Absolute para flutuantes
className="absolute top-0 left-0 right-0"  // LocationHeader
className="absolute right-4 bottom-6"  // MapActionButtons
className="absolute bottom-0 left-0 right-0"  // BottomSheet
```

---

## 🗺️ Configuração do Mapa

### Provider:

```tsx
Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
```

### Propriedades:

```tsx
showsUserLocation={false}    // Customizado
showsMyLocationButton={false}  // Customizado
showsCompass={false}
showsTraffic={false}
showsBuildings={false}
showsIndoors={false}
toolbarEnabled={false}
rotateEnabled={true}
scrollEnabled={true}
zoomEnabled={true}
pitchEnabled={false}
```

### Estilo customizado:

- Base: `#101816`
- Ruas: `#1b2823` / `#1f2d29`
- Água: `#0a1410`
- POIs: ocultos

---

## 🎬 Animações Implementadas

### 1. Pulso no VehicleMarker:

```tsx
{
  isPulsing && (
    <View className="absolute inset-0 bg-primary rounded-full opacity-40 blur-md" />
  );
}
```

### 2. Centralização do Mapa:

```tsx
mapRef.current.animateToRegion(
  {
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  500
); // 500ms de duração
```

### 3. Active State Scale:

```tsx
className = "active:scale-95";
```

---

## 📝 Checklist de Implementação

### ✅ Concluído:

- [x] LocationHeader (componente global)
- [x] MapActionButtons (componente global)
- [x] VehicleMarker (componente local)
- [x] SearchBar (componente local)
- [x] ServiceCard (componente local)
- [x] BottomSheet (componente local)
- [x] HomeScreen (tela principal)
- [x] Dados mockados
- [x] Estilo escuro do mapa
- [x] Gradientes no mapa
- [x] Posicionamento absoluto dos componentes
- [x] Sem erros TypeScript

### ⏳ Próximos passos:

- [ ] Integração com GPS real
- [ ] Navegação para busca
- [ ] Animação do BottomSheet (swipe)
- [ ] Conectar com backend
- [ ] Implementar botão de segurança
- [ ] Histórico de endereços

---

**Resumo:** Todos os componentes foram criados 100% fiéis ao design, separados corretamente entre globais (reutilizáveis) e locais (específicos da tela), com dados mockados e sem funcionalidades por enquanto, exatamente como solicitado! 🎉
