# BottomSheet com Drag (Arrastar para Cima/Baixo)

## ✅ Implementação Completa

O BottomSheet agora suporta gestos de arrastar para cima e para baixo!

## 🎯 Funcionalidades

### Gestos Implementados

- **Arrastar para cima**: Expande o BottomSheet
- **Arrastar para baixo**: Recolhe o BottomSheet
- **Toque no handle**: Facilita o gesto de arrastar

### Pontos de Snap (Posições)

O BottomSheet tem 3 posições configuradas:

1. **Minimizado (10%)**: Mostra apenas o handle
2. **Médio (35%)**: Posição inicial - mostra SearchBar e ServiceCards
3. **Expandido (90%)**: Ocupa quase toda a tela

## 📱 Como Usar

### Gestos do Usuário

```
┌─────────────────────────┐
│   🔽 Arrastar Handle    │ ← Toque e arraste para cima/baixo
├─────────────────────────┤
│   🔍 Barra de Busca     │
├─────────────────────────┤
│  🚗 Corrida | 📦 Entrega│
└─────────────────────────┘
```

### Controle Programático

No `HomeScreen`, você pode controlar o BottomSheet via código:

```tsx
// Expandir para posição máxima
bottomSheetRef.current?.snapToIndex(2); // 90%

// Recolher para posição média (inicial)
bottomSheetRef.current?.snapToIndex(1); // 35%

// Minimizar
bottomSheetRef.current?.snapToIndex(0); // 10%

// Fechar completamente (se enablePanDownToClose: true)
bottomSheetRef.current?.close();
```

## ⚙️ Configurações Atuais

### BottomSheet.tsx

```tsx
snapPoints: ["10%", "35%", "90%"];
index: 1; // Inicia no ponto médio (35%)
enablePanDownToClose: false; // Não fecha completamente
```

### Personalização

Você pode ajustar em `src/screens/(authenticated)/Client/HomeScreen/components/BottomSheet.tsx`:

**Alterar posições:**

```tsx
const snapPoints = useMemo(() => ["5%", "30%", "95%"], []);
```

**Permitir fechar completamente:**

```tsx
enablePanDownToClose={true}
```

**Alterar posição inicial:**

```tsx
index={0}  // Inicia minimizado
index={1}  // Inicia médio (padrão)
index={2}  // Inicia expandido
```

## 🎨 Estilo Visual

### Handle (Indicador)

- Cor: Cinza semi-transparente
- Largura: 48px
- Altura: 4px
- Posição: Centralizado no topo

### Background

- Cor: `#0f231c` (background-dark)
- Border Radius: 24px (topo)
- Shadow: Sombra escura elevada

## 🔧 Dependências Utilizadas

### @gorhom/bottom-sheet

Biblioteca completa para BottomSheets com:

- ✅ Gestos suaves
- ✅ Múltiplos snap points
- ✅ Animações fluidas
- ✅ Customização total

### react-native-gesture-handler

Gerencia os gestos de toque e arrasto

### react-native-reanimated

Fornece animações de alta performance

## 📝 Estrutura de Arquivos

```
src/screens/(authenticated)/Client/HomeScreen/
├── index.tsx                    # HomeScreen com GestureHandlerRootView
│   └── bottomSheetRef           # Referência para controle programático
└── components/
    └── BottomSheet.tsx          # BottomSheet com drag implementado
        ├── SearchBar            # Barra de busca
        └── ServiceCards         # Cards de Corrida e Entrega
```

## 🚀 Próximos Passos

### Implementações Futuras

1. **Conteúdo Dinâmico**: Mostrar diferentes conteúdos em cada posição
2. **Backdrop**: Escurecer o fundo quando expandido
3. **Teclado**: Ajustar automaticamente quando o teclado aparecer
4. **Scroll Interno**: Adicionar ScrollView para conteúdo extenso

### Exemplo de Conteúdo Expandido

Quando o usuário arrastar para 90%, você pode mostrar:

- Lista de endereços recentes
- Histórico de corridas
- Opções adicionais de serviço
- Configurações de viagem

## 💡 Dicas

1. **Performance**: O BottomSheet usa `react-native-reanimated` para animações na thread nativa (60fps)
2. **Acessibilidade**: O handle é grande o suficiente para ser tocado facilmente
3. **UX**: A posição inicial (35%) mostra o conteúdo principal sem cobrir muito o mapa
4. **Feedback Visual**: O handle indica visualmente que o componente pode ser arrastado

## 🐛 Troubleshooting

### BottomSheet não responde ao toque

- Verifique se `GestureHandlerRootView` envolve o componente pai
- Confirme que `react-native-gesture-handler` está instalado

### Animações travadas

- Execute `npx expo start -c` para limpar o cache
- Verifique se `react-native-reanimated` está configurado no `babel.config.js`

### Conflito com outros gestos

- Ajuste a prioridade de gestos usando `simultaneousHandlers`
- Use `waitFor` para coordenar múltiplos gestures

---

✨ **O BottomSheet agora oferece uma experiência nativa e fluida de arrastar!**
