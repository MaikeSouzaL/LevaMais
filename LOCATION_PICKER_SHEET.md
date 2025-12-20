# Location Picker BottomSheet - Seleção de Endereço

## ✅ Implementação Completa

Criado um novo **BottomSheet** para seleção de endereço (origem) que abre quando o usuário clica em "Para onde vamos?".

## 🎯 Funcionalidade

### Fluxo de Uso

1. **Usuário** clica em "🔍 Para onde vamos?" no BottomSheet principal
2. **BottomSheet principal** fecha automaticamente
3. **LocationPickerSheet** abre mostrando:
   - Local atual (editável)
   - Campo de busca
   - Ações rápidas (GPS e Mapa)
   - Favoritos (Casa, Trabalho)
   - Histórico recente
4. **Usuário** seleciona um endereço
5. **LocationPickerSheet** fecha
6. **BottomSheet principal** reabre

## 📱 Componentes Criados

### LocationPickerSheet.tsx

**Localização**: `src/screens/(authenticated)/Client/HomeScreen/components/LocationPickerSheet.tsx`

**Props**:

```typescript
interface LocationPickerSheetProps {
  onClose?: () => void;
  onSelectLocation?: (location: string) => void;
  currentLocation?: string;
  currentAddress?: string;
}
```

**Snap Points**:

- `75%` - Posição inicial (mostra todo conteúdo)
- `90%` - Expandido (mais espaço para scroll)

## 🎨 Estrutura Visual

```
┌─────────────────────────────────┐
│         ═══ (handle)            │
├─────────────────────────────────┤
│      LOCAL ATUAL                │
│  Av. Paulista, 1578 ✏️          │
│  Bela Vista, São Paulo - SP     │
├─────────────────────────────────┤
│ 🔍 Digite um endereço...        │
├─────────────────────────────────┤
│ [📍 Localização] [🗺️ Mapa]     │
├─────────────────────────────────┤
│ FAVORITOS                       │
│ 🏠 Casa                      >  │
│ 💼 Trabalho                  >  │
│ ➕ Adicionar Favorito           │
├─────────────────────────────────┤
│ RECENTES                        │
│ 🕒 Shopping Cidade São Paulo    │
│ 🕒 Aeroporto de Congonhas       │
│ 🕒 Parque Ibirapuera            │
└─────────────────────────────────┘
```

## 🔧 Seções do LocationPickerSheet

### 1. Header - Local Atual

- **Título**: "LOCAL ATUAL" (verde, maiúsculo)
- **Endereço Principal**: Grande, bold
- **Ícone Edit**: Permite editar
- **Endereço Completo**: Cidade, bairro, estado

### 2. Search Bar

- **Placeholder**: "Digite um endereço ou escolha no mapa"
- **Ícone**: 🔍 Lupa
- **Estilo**: Fundo escuro, borda sutil
- **Funcionalidade**: TODO - Autocomplete

### 3. Quick Actions (Grid 2 colunas)

#### Localização Atual

- **Ícone**: 📍 My Location (verde)
- **Título**: "Localização Atual"
- **Subtitle**: "Usar GPS"
- **Ação**: TODO - Pegar coordenadas GPS

#### Escolher no Mapa

- **Ícone**: 🗺️ Mapa (azul)
- **Título**: "Escolher no Mapa"
- **Subtitle**: "Ajustar pino"
- **Ação**: TODO - Modo de seleção no mapa

### 4. Favoritos

**Itens Padrão**:

```typescript
[
  { icon: "home", title: "Casa", address: "Rua Augusta, 500 - Consolação" },
  {
    icon: "work",
    title: "Trabalho",
    address: "Av. Faria Lima, 3477 - Itaim Bibi",
  },
];
```

**Adicionar Favorito**:

- Botão com borda tracejada
- Ícone ➕
- TODO - Modal para adicionar novo

### 5. Recentes (Histórico)

**Itens de Exemplo**:

```typescript
[
  {
    title: "Shopping Cidade São Paulo",
    address: "Av. Paulista, 1230 - Bela Vista",
  },
  { title: "Aeroporto de Congonhas", address: "Vila Congonhas, São Paulo" },
  {
    title: "Parque Ibirapuera - Portão 3",
    address: "Av. Pedro Álvares Cabral",
  },
];
```

**Ícone**: 🕒 Schedule
**Funcionalidade**: Clicável - seleciona o endereço

## 🔄 Handlers Implementados

### handlePressSearch

```typescript
const handlePressSearch = () => {
  bottomSheetRef.current?.close(); // Fecha principal
  locationPickerRef.current?.snapToIndex(0); // Abre picker
};
```

### handleSelectLocation

```typescript
const handleSelectLocation = (location: string) => {
  console.log("Selected location:", location);
  locationPickerRef.current?.close(); // Fecha picker
  bottomSheetRef.current?.snapToIndex(1); // Reabre principal
};
```

### handleCloseLocationPicker

```typescript
const handleCloseLocationPicker = () => {
  bottomSheetRef.current?.snapToIndex(1); // Reabre principal
};
```

## 🎨 Estilos e Design

### Cores

- **Background**: `#0f231c` (background-dark)
- **Surface**: `#162e26` (surface-dark)
- **Primary**: `#02de95` (verde)
- **Text Primary**: `#FFFFFF` (branco)
- **Text Secondary**: `#9CA3AF` (cinza)

### Bordas

- **Input/Cards**: `border-white/10` (sutil)
- **Rounded**: `rounded-xl` (16px), `rounded-2xl` (24px)

### Ícones

- **Favoritos**: Cinza (#D1D5DB)
- **Localização**: Verde (#02de95)
- **Mapa**: Azul (#60A5FA)
- **Recentes**: Cinza (#9CA3AF)

## 🚀 Próximos Passos (TODOs)

### 1. Search Bar - Autocomplete

- [ ] Integrar com API de geocoding
- [ ] Sugestões em tempo real
- [ ] Debounce para performance

### 2. Ações Rápidas

- [ ] "Localização Atual" - Pegar GPS do dispositivo
- [ ] "Escolher no Mapa" - Modo de pin no MapView

### 3. Favoritos

- [ ] Persistir favoritos (AsyncStorage)
- [ ] Modal para adicionar novo favorito
- [ ] Editar/remover favoritos
- [ ] Ícones customizados

### 4. Histórico Recente

- [ ] Salvar histórico de buscas
- [ ] Limitar a 10-20 itens recentes
- [ ] Opção de limpar histórico

### 5. Editar Local Atual

- [ ] Modal/BottomSheet para editar
- [ ] Confirmar mudança de localização

### 6. Validação

- [ ] Verificar se endereço é válido
- [ ] Feedback visual de erro
- [ ] Mensagens de erro claras

## 💡 Diferenças do HTML Original

### Mantido ✅

- Estrutura geral do layout
- Seções (Header, Search, Actions, Favorites, Recents)
- Cores e estilos
- Ícones e textos

### Adaptado 🔄

- **HTML → React Native Components**
- **Tailwind CSS → NativeWind classes**
- **div → View**
- **input → TextInput**
- **button → TouchableOpacity**
- **Material Symbols → MaterialIcons (@expo/vector-icons)**

### Removido ❌

- Background do mapa (já está no HomeScreen)
- Botão "Voltar" (usa gesture do BottomSheet)
- Backdrop blur (performance mobile)

## 📊 Performance

### Otimizações

- ✅ `showsVerticalScrollIndicator={false}` - Visual limpo
- ✅ `numberOfLines={1}` - Trunca textos longos
- ✅ `useMemo` para snap points
- ✅ `forwardRef` para controle via ref

### ScrollView

- Scroll suave nativo
- Padding adequado para conteúdo
- Sem interferência com gesture do BottomSheet

## 🐛 Troubleshooting

### BottomSheet não abre

- Verifique se `locationPickerRef` está configurado
- Confirme que `snapToIndex(0)` está sendo chamado

### Sobreposição de BottomSheets

- Sistema gerencia automaticamente
- Principal fecha quando picker abre
- Picker fecha quando usuário arrasta para baixo

### Textos cortados

- Ajuste padding horizontal
- Use `numberOfLines` para truncar
- Teste em diferentes tamanhos de tela

## 📝 Exemplo de Uso

```typescript
// No HomeScreen
const locationPickerRef = useRef<GorhomBottomSheet>(null);

const handlePressSearch = () => {
  locationPickerRef.current?.snapToIndex(0);
};

<LocationPickerSheet
  ref={locationPickerRef}
  onClose={handleClose}
  onSelectLocation={(location) => {
    console.log("Selecionado:", location);
  }}
  currentLocation="Av. Paulista, 1578"
  currentAddress="Bela Vista, São Paulo - SP"
/>;
```

---

## ✨ Resultado Final

Agora temos **2 BottomSheets** trabalhando em harmonia:

1. **BottomSheet Principal** (HomeScreen)

   - SearchBar "Para onde vamos?"
   - ServiceCards (Corrida + Entrega)
   - Sempre visível em 35%

2. **LocationPickerSheet** (Seleção de Endereço)
   - Abre ao clicar no SearchBar
   - Interface completa de seleção
   - Fecha após selecionar endereço

**Transição suave entre os dois!** 🎉
