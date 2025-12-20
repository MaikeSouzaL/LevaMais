# Safety Help Sheet - Modal de Ajuda e Segurança

## Descrição

Modal (BottomSheet) que aparece quando o usuário clica no botão de **Escudo (Shield)** na Home Screen. Fornece acesso rápido a recursos de segurança e suporte.

## Componente

`src/screens/(authenticated)/Client/HomeScreen/components/SafetyHelpSheet.tsx`

## Design Reference

Baseado no HTML fornecido com tema dark e glassmorphism effect.

## Funcionalidades

### Opções Disponíveis

1. **Central de Ajuda**

   - Ícone: `help-center`
   - Descrição: "Dúvidas frequentes"
   - Ação: TODO - Navegar para FAQ/Central de Ajuda
   - Handler: `handleHelpCenter()`

2. **Falar com Suporte**

   - Ícone: `support-agent`
   - Descrição: "Atendimento 24h"
   - Ação: TODO - Abrir chat ou WhatsApp de suporte
   - Handler: `handleSupport()`

3. **Compartilhar Localização**

   - Ícone: `share-location`
   - Descrição: "Enviar para amigos"
   - Ação: TODO - Compartilhar localização via sistema nativo
   - Handler: `handleShareLocation()`

4. **Emergência - 190** ⚠️
   - Ícone: `warning` (filled)
   - Descrição: "LIGAR 190"
   - Cor: Vermelho (#EF4444)
   - Ação: ✅ Liga diretamente para 190 (Polícia)
   - Handler: `handleCallEmergency()`

## Configuração

### Snap Points

- **Único ponto**: `["85%"]`
- Comportamento: Abre quase em tela cheia ou completamente fechado
- `enablePanDownToClose`: `true` - Permite arrastar para baixo para fechar

### Estado Inicial

- `index: -1` - Inicia completamente fechado

### Abertura

Chamado via:

```tsx
safetyHelpRef.current?.snapToIndex(0);
```

### Fechamento

- Arrastar para baixo (gesto)
- Callback `onClose()` - Reabre BottomSheet principal

## Estilo Visual

### Background

- Cor: `rgba(11, 26, 21, 0.85)` - Verde escuro com transparência
- Efeito: Glassmorphism com backdrop-filter blur
- Border Radius: 32px no topo

### Header

- Título: "Ajuda Rápida" - Branco, bold, 20px
- Subtítulo: "Segurança em primeiro lugar" - Cinza, 12px
- Ícone: Shield verde (#02de95) em círculo com border

### Glow Effect

- Verde (#02de95) com opacidade 10%
- Posicionado no canto superior direito
- Adiciona depth ao design

### Botões

- Background: `bg-surface-dark/60` com border `border-white/5`
- Hover: Aumenta opacidade do background
- Active: `opacity-70` para feedback tátil
- Padding: 16px
- Border Radius: 16px
- Gap entre ícone e texto: 16px

### Botão de Emergência

- Background: `rgba(239, 68, 68, 0.1)` - Vermelho transparente
- Border: `rgba(239, 68, 68, 0.3)` - Vermelho semi-transparente
- Ícone com glow effect: `shadowRadius: 15`
- Destaque visual maior (margin-top adicional)

## Props Interface

```typescript
interface SafetyHelpSheetProps {
  onClose?: () => void;
}
```

## Integração com HomeScreen

### Refs

```typescript
const safetyHelpRef = useRef<GorhomBottomSheet>(null);
```

### Handler no Shield Button

```typescript
const handlePressSafety = () => {
  // Fecha outros bottom sheets
  bottomSheetRef.current?.close();
  locationPickerRef.current?.close();
  // Abre SafetyHelpSheet
  safetyHelpRef.current?.snapToIndex(0);
};
```

### Callback de Fechamento

```typescript
const handleCloseSafetyHelp = () => {
  // Reabre BottomSheet principal
  bottomSheetRef.current?.snapToIndex(1);
};
```

## TO-DO / Próximos Passos

### Alta Prioridade

- [ ] Implementar navegação para Central de Ajuda (FAQ)
- [ ] Configurar chat de suporte (WhatsApp ou in-app chat)
- [ ] Implementar compartilhamento de localização via Share API

### Média Prioridade

- [ ] Adicionar histórico de chamadas de emergência
- [ ] Integrar com sistema de rastreamento de viagem
- [ ] Adicionar mais opções de segurança (botão de pânico silencioso)

### Baixa Prioridade

- [ ] Adicionar animações de entrada/saída customizadas
- [ ] Internacionalização (i18n) para outros idiomas
- [ ] Testes unitários e de integração

## Notas Técnicas

### Linking API

O botão de emergência usa `Linking.openURL('tel:190')` para iniciar chamada:

```typescript
const canOpen = await Linking.canOpenURL(phoneNumber);
if (canOpen) {
  await Linking.openURL(phoneNumber);
}
```

### ScrollView

Conteúdo scrollável para comportar futuras opções adicionais sem quebrar o layout.

### React Native Gesture Handler

Depende de `GestureHandlerRootView` no componente pai (HomeScreen).

## Cores de Referência

- Primary Green: `#02de95`
- Background Dark: `#0f231c` / `rgba(11, 26, 21, 0.85)`
- Surface Dark: `#16201d` / `rgba(21, 46, 38, 0.6)`
- Emergency Red: `#EF4444`
- Text White: `#FFFFFF`
- Text Gray: `#9CA3AF` / `#6B7280` / `#4B5563`

## Acessibilidade

- Todos os botões são TouchableOpacity com activeOpacity
- Feedback visual claro em todas as interações
- Ícones descritivos com texto de apoio
- Alto contraste para facilitar leitura

---

**Última atualização**: 19 de dezembro de 2025
