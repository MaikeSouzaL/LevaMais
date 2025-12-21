## Objetivo
- Converter `ServicePurposeSheet` (bottom sheet) em uma Screen navegável.
- A nova tela deve receber `vehicleType` e buscar dinamicamente as finalidades via `getPurposesByVehicleType`.
- Ajustar a navegação: após selecionar o veículo, ir para `ServicePurpose` (Screen). Remover dependência do sheet em `Home`.

## Pesquisa e contexto
- `ServicePurposeSheet.tsx` usa `getPurposesByVehicleType(vehicleType)` e já renderiza itens dinamicamente.
- `HomeScreen (index.tsx)` ainda importa `ServicePurposeSheet` e usa refs para abrir/fechar.
- `SelectVehicleScreen.tsx` já navega de volta para `Home` com `selectedVehicleType`.
- As rotas (drawer) não incluem `ServicePurpose` como Screen ainda.

## Mudanças propostas
### 1) Criar `ServicePurposeScreen.tsx` (Screen)
- Basear em `ServicePurposeSheet.tsx`, mas:
  - Remover `<BottomSheet>` e usar `<View>` com `ScrollView`.
  - Receber `vehicleType` via `route.params.vehicleType`.
  - Manter `useEffect` que chama `getPurposesByVehicleType(vehicleType)`.
  - Header com botão voltar e títulos já existentes.
  - Ao tocar num item, chamar `onSelect` equivalente: navegar para próxima etapa (ofertas) ou retornar para `Home` com um `route.params` apropriado (`purposeId`).

### 2) Rotas
- Em `src/routes/drawer.cliente.routes.tsx`:
  - Importar `ServicePurposeScreen` de `screens/(authenticated)/Client/HomeScreen/ServicePurposeScreen`.
  - Adicionar `<Screen name="ServicePurpose" component={ServicePurposeScreen} ... drawerItemStyle: { display: "none" }>`.

### 3) Navegação após seleção de veículo
- Em `SelectVehicleScreen.tsx`:
  - Alterar `handleSelect(type)` para navegar diretamente para `ServicePurpose` passando `{ vehicleType: type, pickup, dropoff }`.

### 4) Corrigir `HomeScreen (index.tsx)`
- Remover import de `ServicePurposeSheet` e seus refs.
- Remover lógica de abrir o sheet (`servicePurposeRef.current?.snapToIndex(0)`).
- Onde hoje reage a `selectedVehicleType` em `route.params`, trocar para navegar para `ServicePurpose` como Screen.
- Ajustar handlers de back que referenciavam o sheet para navegar para `SelectVehicle`/`LocationPicker` conforme o fluxo.

### 5) Integração com ofertas (próximo passo)
- Quando o usuário escolher uma finalidade na `ServicePurposeScreen`, navegar para a Screen de ofertas adequada (já existem: `OffersMotoSheet`, `OffersCarSheet`, etc. como sheets). Opcionalmente manter esses como sheets por ora, apenas acionados pela `Home` via params:
  - Enviar `navigation.navigate("Home", { openOffersFor: vehicleType, purposeId })`.
  - Em `Home`, detectar `openOffersFor` e abrir o sheet correspondente.

## Verificação
- Fluxo: LocationPicker → SelectVehicle (Screen) → ServicePurpose (Screen) → Home abre ofertas do veículo.
- Rodar app e validar que não há mais chamadas ao antigo `ServicePurposeSheet`.
- Confirmar que a busca de finalidades é dinâmica e muda conforme `vehicleType`.

## Observações
- Não muda backend; reusa `getPurposesByVehicleType`.
- Mantém estilo visual e textos existentes, apenas mudando container para Screen.
- Alterações restritas a arquivos citados e rotas do drawer.