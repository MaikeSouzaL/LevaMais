# SideSheet - Menu Lateral com Gestos (Esquerda → Direita)

## ✅ Implementação Completa - ATUALIZADA

Criado um **SideSheet** customizado que funciona como um Bottom Sheet, mas vem **lateralmente da ESQUERDA para DIREITA**.

## 🎯 Mudanças Implementadas

### ✨ O que mudou:

1. **Direção**: Agora vem da **ESQUERDA** → **DIREITA** (antes era direita → esquerda)
2. **Borda Visível**: Handle maior e colorido (50x80px) sempre visível na lateral
3. **Conteúdo Integrado**: SearchBar e ServiceCards movidos do BottomSheet para o SideSheet
4. **BottomSheet Removido**: O antigo BottomSheet inferior foi removido
5. **Botões MapActions Restaurados**: Escudo (segurança) e Localização estão visíveis

### 🎨 Visual da Borda (Handle)

- **Tamanho**: 50px largura x 80px altura
- **Cor**: Background `#16201d` com borda verde `#02de95` (2px)
- **Posição**: Lado direito do SideSheet (visível quando fechado)
- **Border Radius**: Arredondado nas pontas direitas
- **Indicadores**:
  - Barra vertical verde (4x40px)
  - Ícone chevron-right (→)

## 📱 Como Funciona Agora

### Posições (Snap Points)

1. **CLOSED** - Totalmente fora da tela (esquerda)
2. **PEEK** - Apenas borda visível (60px) - **Posição Inicial**
3. **HALF** - 60% da tela aberta
4. **FULL** - Tela completa

### Layout no HomeScreen

```
┌─────────────────────────────────┐
│ [☰]  📍 Location Header         │
│                                 │
│  │→│        MAPA      [🛡️]     │
│  │ │                   [📍]     │
│  │ │                            │
│  ↑ Borda                        │
│  Sempre                         │
│  Visível                        │
│                                 │
└─────────────────────────────────┘

Arraste a borda → para abrir
```

## 🎯 Conteúdo do SideSheet

### Seção Superior (sempre visível quando aberto)

- ✅ **SearchBar** - "Para onde vamos?" (verde)
- ✅ **ServiceCards** - Corrida e Entrega (2 colunas)

### Seção Rolável (ScrollView)

- 📜 Histórico de Viagens
- 💳 Carteira
- 📍 Endereços Salvos
- ⭐ Favoritos
- 🔔 Notificações
- ⚙️ Configurações

## 🔧 Gestos Implementados

### Arrastar a Borda

1. **Arrastar para DIREITA** (→) - Abre o menu

   - Velocidade > 500: Abre completamente
   - Velocidade normal: Vai para snap point mais próximo

2. **Arrastar para ESQUERDA** (←) - Fecha o menu

   - Velocidade < -500: Fecha imediatamente
   - Velocidade normal: Vai para snap point mais próximo

3. **Toque na borda**: Facilita o início do gesto

## 🚫 Zero Conflito com Drawer Navigator

### ✅ Solução Final

| Componente           | Direção            | Gesture                 | Quando Abre     |
| -------------------- | ------------------ | ----------------------- | --------------- |
| **Drawer Navigator** | Esquerda → Direita | Swipe da borda esquerda | Menu principal  |
| **SideSheet**        | Esquerda → Direita | Arrasta borda visível   | Menu secundário |

**Diferença-chave**:

- **Drawer**: Gesto na **borda da tela** (invisível)
- **SideSheet**: Arrasta a **borda verde visível** (60px sempre à mostra)

Não há conflito porque:

- ✅ SideSheet tem handle VISÍVEL - usuário sabe onde tocar
- ✅ Drawer requer swipe da borda da TELA
- ✅ São gestos diferentes em áreas diferentes

## 🎨 Componentes

### 1. SideSheet (`src/components/SideSheet/index.tsx`)

```tsx
interface SideSheetProps {
  children?: React.ReactNode;
  side?: "left" | "right"; // Agora usando "left"
  initialSnap?: "peek" | "half" | "full"; // Inicia em "peek"
  backgroundColor?: string;
}
```

### 2. SideSheetContent (`src/components/SideSheet/SideSheetContent.tsx`)

```tsx
interface SideSheetContentProps {
  onClose?: () => void;
  onPressSearch?: () => void;
  onPressRide?: () => void;
  onPressDelivery?: () => void;
}
```

## 📂 O que foi Removido

- ❌ `src/screens/(authenticated)/Client/HomeScreen/components/BottomSheet.tsx` (não está mais sendo usado)
- ❌ `src/screens/(authenticated)/Client/HomeScreen/components/SearchBar.tsx` (funcionalidade movida)
- ❌ `src/screens/(authenticated)/Client/HomeScreen/components/ServiceCard.tsx` (funcionalidade movida)
- ❌ Botão superior direito (three dots)
- ❌ Referência `bottomSheetRef`
- ❌ Import do `@gorhom/bottom-sheet`

## ✅ O que foi Restaurado

- ✅ **MapActionButtons** - Botões de Escudo e Localização (bottom-right)
- ✅ Handlers `handlePressSafety` e `handlePressMyLocation`

## 🎯 Uso no HomeScreen

### Integração

```tsx
<SideSheet ref={sideSheetRef} side="left" initialSnap="peek">
  <SideSheetContent
    onClose={handleCloseSideSheet}
    onPressSearch={handlePressSearch}
    onPressRide={handlePressRide}
    onPressDelivery={handlePressDelivery}
  />
</SideSheet>
```

### Controle Programático

```tsx
// Fechar o SideSheet
sideSheetRef.current?.close();

// Abrir para posição específica
sideSheetRef.current?.snapToPosition("half");
sideSheetRef.current?.snapToPosition("full");
sideSheetRef.current?.snapToPosition("peek");
```

## 🎨 Estrutura Visual Final

```
HomeScreen:
├── MapView (fundo)
│   ├── Gradientes
│   └── Marcadores de veículos
├── Botão Menu (☰) - top-left
├── LocationHeader - top-center
├── MapActionButtons - bottom-right
│   ├── Escudo (🛡️ segurança)
│   └── Localização (📍 my-location)
└── SideSheet - left side
    ├── Handle (borda verde 50x80px)
    └── Content
        ├── SearchBar
        ├── ServiceCards (Corrida + Entrega)
        └── ScrollView (opções adicionais)
```

## 💡 Como o Usuário Interage

### Fluxo de Uso

1. **Usuário vê**: Borda verde na lateral esquerda (60px visível)
2. **Usuário toca**: Na borda verde e arrasta para direita →
3. **SideSheet abre**: Mostra SearchBar e ServiceCards
4. **Usuário escolhe**:
   - 🚗 Corrida
   - 📦 Entrega
   - 🔍 Busca de endereço
   - Ou rola para ver mais opções
5. **Usuário fecha**: Arrasta para esquerda ← ou toca no X

## 🔮 Benefícios da Nova Abordagem

### ✅ Vantagens

1. **Mais Espaço no Mapa**: Sem BottomSheet cobrindo a parte inferior
2. **Acesso Rápido**: Borda sempre visível - 1 gesto para abrir
3. **Organização**: Todo conteúdo do menu em um único lugar
4. **Visual Limpo**: Apenas 4 elementos flutuantes (menu, header, actions, borda)
5. **Sem Conflitos**: Drawer e SideSheet convivem harmonicamente

### 📊 Antes vs Depois

| Aspecto          | Antes                | Depois                   |
| ---------------- | -------------------- | ------------------------ |
| **BottomSheet**  | Inferior, ocupa 1/3  | ❌ Removido              |
| **SideSheet**    | Direita, menu extra  | Esquerda, menu principal |
| **Conteúdo**     | Espalhado (2 sheets) | Centralizado (1 sheet)   |
| **Mapa Visível** | ~60%                 | ~90%                     |
| **Gestos**       | 2 direções (↑↔)      | 1 direção (→)            |

## 🐛 Troubleshooting

### SideSheet não abre

- Verifique se a borda verde está visível (60px)
- Certifique-se de arrastar para DIREITA →

### Conflito com Drawer

- Drawer: swipe da borda INVISÍVEL da tela
- SideSheet: arrasta borda VERDE visível
- São gestos diferentes!

### Conteúdo não aparece

- Verifique se props estão sendo passadas para SideSheetContent
- Confirme handlers (onPressSearch, onPressRide, onPressDelivery)

---

## ✨ Resultado Final

### O que temos agora:

- ✅ **SideSheet** da esquerda com borda verde sempre visível
- ✅ **Conteúdo integrado**: SearchBar + ServiceCards + Opções
- ✅ **BottomSheet removido**: Mais espaço para o mapa
- ✅ **MapActionButtons restaurados**: Escudo + Localização
- ✅ **Zero conflitos**: Drawer e SideSheet trabalham juntos
- ✅ **UX clara**: Borda verde indica onde arrastar

**Interface limpa, funcional e sem sobreposições! 🎉**

## 🎯 Características

### ✨ Funcionalidades Principais

- **Arrastar lateralmente**: Usuário pode abrir/fechar deslizando
- **Vem da direita**: Não conflita com o Drawer Navigator (que vem da esquerda)
- **3 posições**: Fechado, Peek (apenas handle), Meio, Aberto
- **Backdrop escuro**: Escurece o fundo quando aberto
- **Handle visual**: Indicador vertical no lado esquerdo do sheet
- **Animações suaves**: Usa Reanimated para 60fps nativos

### 🔄 Snap Points (Posições)

1. **CLOSED** - Totalmente fora da tela (direita)
2. **PEEK** - Apenas handle visível (80px da esquerda)
3. **HALF** - Metade da tela (50% width)
4. **FULL** - Tela completa

## 📱 Como Usar

### Integração Básica

```tsx
import { SideSheet, SideSheetMethods } from "@/components/SideSheet";

function MyScreen() {
  const sideSheetRef = useRef<SideSheetMethods>(null);

  const handleOpen = () => {
    sideSheetRef.current?.open();
  };

  return (
    <>
      {/* Seu conteúdo */}
      <TouchableOpacity onPress={handleOpen}>
        <Text>Abrir Menu</Text>
      </TouchableOpacity>

      {/* SideSheet */}
      <SideSheet ref={sideSheetRef} side="right" initialSnap="peek">
        {/* Seu conteúdo aqui */}
        <View>
          <Text>Conteúdo do SideSheet</Text>
        </View>
      </SideSheet>
    </>
  );
}
```

### Controle Programático

```tsx
// Abrir (vai para posição HALF)
sideSheetRef.current?.open();

// Fechar completamente
sideSheetRef.current?.close();

// Ir para posição específica
sideSheetRef.current?.snapToPosition("peek"); // Apenas handle
sideSheetRef.current?.snapToPosition("half"); // Meio
sideSheetRef.current?.snapToPosition("full"); // Tela cheia
sideSheetRef.current?.snapToPosition("closed"); // Fechado
```

## ⚙️ Props

```tsx
interface SideSheetProps {
  children?: React.ReactNode; // Conteúdo do sheet
  side?: "left" | "right"; // Lado (padrão: "right")
  initialSnap?: "peek" | "half" | "full"; // Posição inicial (padrão: "peek")
  backgroundColor?: string; // Cor de fundo (padrão: "#0f231c")
}
```

## 🎨 Visual e UX

### Handle (Indicador)

- **Posição**: Lado esquerdo, verticalmente centralizado
- **Dimensões**: 40px largura x 60px altura
- **Cor**: Background `#16201d`, barra verde `#02de95`
- **Ícone**: Chevron indicando direção (left/right)

### Backdrop

- **Cor**: Preto semi-transparente `rgba(0, 0, 0, 0.5)`
- **Comportamento**: Escurece proporcionalmente ao quanto o sheet está aberto
- **Interatividade**: Desabilitado quando sheet fechado

### Animações

- **Spring Animation**: Movimento suave e natural
- **Damping**: 50 (controla a "mola")
- **Stiffness**: 400 (velocidade da animação)

## 🚫 Evitando Conflito com Drawer Navigator

### ✅ Solução Implementada

O SideSheet vem da **DIREITA** → **ESQUERDA**, enquanto o Drawer Navigator vem da **ESQUERDA** → **DIREITA**.

Isso evita:

- ❌ Conflito de gestos
- ❌ Sobreposição visual
- ❌ Confusão do usuário

### Layout no HomeScreen

```
┌─────────────────────────────────┐
│ [☰]  Location Header      [⋮]  │ ← Botão ⋮ abre SideSheet
│                                 │
│         MAPA                    │
│                                 │
│                                 │
│  ←  ←  ←  ←  ←  ←  │           │
│  SideSheet    │                 │
│  (da direita) │                 │
│               │                 │
└───────────────┴─────────────────┘
        ↑
    Bottom Sheet
    (de baixo)
```

## 📂 Estrutura de Arquivos

```
src/components/SideSheet/
├── index.tsx              # Componente SideSheet
└── SideSheetContent.tsx   # Conteúdo de exemplo

src/screens/(authenticated)/Client/HomeScreen/
└── index.tsx              # Integração com botão e ref
```

## 🎯 Implementação no HomeScreen

### Componentes Adicionados

1. **Botão Superior Direito** - Ícone `more-vert` (três pontos verticais)
2. **SideSheet** - Componente lateral arrastável
3. **SideSheetContent** - Conteúdo com opções (exemplo)

### Handlers

```tsx
const handlePressSideSheet = () => {
  sideSheetRef.current?.open();
};

const handleCloseSideSheet = () => {
  sideSheetRef.current?.close();
};
```

## 🔧 Gestos Implementados

### Pan Gesture (Arrastar)

1. **Arrastar para Direita** (fecha)

   - Velocidade > 500: Fecha imediatamente
   - Velocidade normal: Vai para snap point mais próximo

2. **Arrastar para Esquerda** (abre)

   - Velocidade < -500: Abre completamente
   - Velocidade normal: Vai para snap point mais próximo

3. **Soltar** (end)
   - Calcula snap point mais próximo
   - Anima suavemente até lá

### Limites

- **Mínimo**: 0 (totalmente aberto)
- **Máximo**: SCREEN_WIDTH (totalmente fechado)

## 🎨 Conteúdo de Exemplo

O `SideSheetContent` mostra opções como:

- 📜 Histórico de Viagens
- 💳 Carteira
- 📍 Endereços Salvos
- ⭐ Favoritos
- 🔔 Notificações
- ⚙️ Configurações

## 🔮 Próximos Passos

### Melhorias Futuras

1. **Conteúdo Dinâmico**

   - Mostrar diferentes conteúdos por contexto
   - Filtros e pesquisa

2. **Integração com Navegação**

   - Navegar para outras telas ao clicar em opções
   - Fechar SideSheet após navegação

3. **Persistência de Estado**

   - Lembrar última posição do usuário
   - Preferências de abertura

4. **Acessibilidade**
   - Suporte a leitores de tela
   - Tamanhos de toque adequados

## 💡 Dicas de Uso

### Performance

- ✅ Usa `react-native-reanimated` (thread nativa)
- ✅ Worklet functions para animações 60fps
- ✅ Backdrop com `pointerEvents` otimizado

### UX

- ✅ Handle grande o suficiente para tocar (40x60px)
- ✅ Feedback visual claro (ícone chevron)
- ✅ Velocidade de gesto detectada para UX responsiva

### Customização

```tsx
// Exemplo: SideSheet verde com posição inicial aberta
<SideSheet
  ref={sideSheetRef}
  side="right"
  initialSnap="full"
  backgroundColor="#16201d"
>
  <MyCustomContent />
</SideSheet>
```

## 🐛 Troubleshooting

### SideSheet não aparece

- Verifique se `GestureHandlerRootView` envolve o componente raiz
- Confirme que a `ref` está sendo passada corretamente

### Gestos não funcionam

- Certifique-se de que `react-native-gesture-handler` está instalado
- Verifique se não há outros componentes com `zIndex` maior

### Conflito com Drawer

- Use `side="right"` para evitar conflito com Drawer (esquerda)
- Considere desabilitar gestos do Drawer quando SideSheet aberto

### Animações travadas

- Execute `npx expo start -c` para limpar cache
- Verifique configuração do Reanimated no `babel.config.js`

## 📊 Comparação: BottomSheet vs SideSheet

| Característica | BottomSheet           | SideSheet        |
| -------------- | --------------------- | ---------------- |
| **Direção**    | Vertical (↕)          | Horizontal (↔)   |
| **Posição**    | Inferior              | Lateral          |
| **Uso típico** | Ações rápidas, opções | Menu, navegação  |
| **Conflito**   | Scroll                | Drawer Navigator |
| **Handle**     | Horizontal (—)        | Vertical (\|)    |

---

## ✨ Resultado Final

Agora você tem:

- ✅ **BottomSheet** de baixo para cima (busca e serviços)
- ✅ **SideSheet** da direita para esquerda (opções e menu)
- ✅ **Drawer Navigator** da esquerda para direita (menu principal)
- ✅ Nenhum conflito entre os três! 🎉

**Três níveis de navegação complementares e harmônicos!**
