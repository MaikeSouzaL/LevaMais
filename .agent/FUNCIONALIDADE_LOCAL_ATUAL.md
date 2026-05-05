# 📍 DEFINIR LOCAL ATUAL (PICKUP)

## 📅 Data: 02/02/2026 - 20:29
## 🎯 Status: IMPLEMENTADO

A funcionalidade de ajustar o ponto de partida ("Local atual") foi implementada e testada na arquitetura refatorada.

---

## 🔄 FLUXO IMPLEMENTADO

1. **Clique no Botão**:
   - Ao tocar em "Definir local atual" na Home, o app navega para `AddressPickerScreen`.
   - Modo: `selectionMode: 'currentLocation'`.

2. **Seleção de Endereço**:
   - O usuário pode buscar ou selecionar no mapa.
   - Ao confirmar, retorna para a Home enviando o objeto `{ currentLocation: { address, lat, lng } }`.

3. **Atualização na Home**:
   - O `useEffect` da Home detecta o retorno.
   - Atualiza o `rideFlow.draftPickup` com o novo local.
   - O painel inferior (`LocalBottomSheet`) atualiza imediatamente o texto para mostrar o endereço escolhido, substituindo o GPS automático.

---

## 🛠️ ARQUIVOS ENVOLVIDOS

- `Home/index.tsx`: Lógica de recepção de parâmetros e atualização de UI.
- `LocalBottomSheet.tsx`: Correção de props e exibição condicional.
- `AddressPicker/index.tsx`: Confirmação e retorno de parâmetros.

---

**Antigravity AI** 🚀
