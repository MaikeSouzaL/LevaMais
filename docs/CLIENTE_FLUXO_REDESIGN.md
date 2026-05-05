# Fluxo Cliente V2 (Corridas + Entregas + Fretes)

## Objetivo
Padronizar o app cliente com um fluxo completo, ordenado e funcional, no padrão de apps como Uber/99 (adaptado para corrida, entrega e frete).

## 1) Fluxo Publico (Nao autenticado)
1. `IntroScreen`
2. `SignIn` ou `SignUp`
3. `SelectProfile` (cliente/motorista)
4. `CompleteRegistrationClient` (quando perfil cliente)
5. `Terms`
6. `PhoneVerification`
7. `NotificationPermission`
8. Entrada no app autenticado do cliente

## 2) Fluxo Privado Cliente (Arquitetura)
Estrutura principal:
- Drawer (menu lateral do cliente)
- Stack centralizado com rotas do dominio cliente

Rotas principais:
- `Home`
- `History`
- `Wallet`
- `Profile`
- `NotificationsCenter`
- `Favorites`
- `SafetyCenter`
- `Help`
- `Settings`

Rotas de solicitacao:
- `LocationPicker`
- `SelectVehicle`
- `ServicePurpose`
- `ServiceSelection`
- `ConfirmPickup`
- `FinalOrderSummary`
- `Payment`
- `SearchingDriver`
- `RideTracking`

Rotas de corrida ativa/finalizacao:
- `Chat`
- `ClientCancelRide`
- `CancelFee`
- `RideCompleted`
- `ClientRateDriver`
- `TipDriver`

Rotas de suporte:
- `OrderDetails`
- `ClientCity`
- `AddPaymentMethod`

## 3) Jornada ideal do pedido
1. Cliente abre `Home`
2. Define origem/destino (`LocationPicker`)
3. Escolhe veiculo (`SelectVehicle`)
4. Escolhe proposito do servico (`ServicePurpose`):
   - Corrida de passageiro
   - Entrega (moto/carro/van)
   - Frete/mudanca (van/caminhao)
5. Confere resumo e preco (`FinalOrderSummary`)
6. Confirma forma de pagamento (`Payment`)
7. Busca motorista (`SearchingDriver`)
8. Motorista encontrado -> acompanhamento ao vivo (`RideTracking`)
9. Durante corrida/entrega:
   - `Chat`
   - Cancelamento com regras (`ClientCancelRide` / `CancelFee`)
10. Conclusao:
   - `RideCompleted`
   - `ClientRateDriver`
   - `TipDriver`
11. Historico e detalhes:
   - `History`
   - `OrderDetails`

## 4) Regras de UX e produto
- Nao travar usuario em estado de busca infinita.
- Sempre mostrar fallback quando nao encontrar motorista.
- Mostrar erro acionavel (ex: "tentar novamente", "ajustar pedido", "trocar veiculo").
- Sempre manter contexto de origem/destino ao voltar etapas.
- Menos passos possiveis para pedir uma corrida.
- Informar ETA e preco antes da confirmacao final.

## 5) Paridade de funcionalidades esperadas
- Corrida de passageiros
- Entregas rapidas (moto/carro)
- Fretes/mudancas (van/caminhao)
- Favoritos
- Carteira e pagamentos
- Seguranca
- Chat em corrida
- Historico e avaliacao

## 6) Estado atual da refatoracao
- Navegacao cliente reestruturada para Drawer + Stack centralizado.
- Menu cliente padronizado e desacoplado das rotas internas.
- Rotas cliente organizadas por dominio (principal, solicitacao, corrida ativa, suporte).
- Fluxo de solicitacao padronizado:
  `SelectVehicle -> ServicePurpose -> FinalOrderSummary -> Payment -> SearchingDriver -> RideTracking`.
- Pos-corrida padronizado:

  `RideCompleted -> ClientRateDriver -> TipDriver`.
- Historico e detalhes com UX de reuso:
  `History` com filtros e `OrderDetails` com acao `Pedir novamente`.
- Limpeza de legado: rota redundante `MapLocationPicker` removida da malha principal.

## 7) Proximas entregas de interface (execucao)
1. Consolidar visual de `Home` com cards de acesso rapido por tipo de servico.
2. Padronizar telas de solicitacao (`SelectVehicle`, `ServicePurpose`, `FinalOrderSummary`).
3. Padronizar `SearchingDriver` com estados:
   - buscando
   - sem motorista
   - re-tentativa
4. Refinar `RideTracking` para mostrar rota real e status progressivo da corrida.
5. Padronizar pos-corrida (`RideCompleted`, avaliacao e gorjeta).
