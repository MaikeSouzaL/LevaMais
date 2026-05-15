# Delivery Flow Audit - Cliente -> Motorista (2026-05-14)

## Criterios de aceite (somente entregas)
1. Cliente cria entrega com parametros completos (veiculo, tipo, tamanho, ajudante, oferta, agendamento opcional).
2. Entrega entra em busca e/ou fila de espera com estados consistentes.
3. Motorista recebe solicitacao (direto/fila/agendado) conforme compatibilidade.
4. Aceite do motorista evolui status sem travar (incluindo agendado -> atendimento ativo).
5. Tracking cliente mostra status e mensagens corretas de entrega.
6. Fluxo operacional motorista exige prova de coleta para iniciar e prova de entrega para concluir.
7. Cancelamento e taxa mostram linguagem de entrega.
8. Finalizacao e avaliacao do cliente mantem contexto de entrega.

## Evidencias no codigo

### 1) Criacao da entrega no cliente
- `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx`
  - payload inclui `serviceType=delivery`, `vehicleType`, `details.itemType`, `cargoSize`, `needsHelper`, `negotiation.clientOffer`, `scheduledFor`.
  - UI exposta para `CargoSizeSelector` e `HelperSwitch`.

### 2) Busca/fila no cliente
- `src/screens/(authenticated)/Client/Ride/SearchingDriver/index.tsx`
  - monitora aceite, timeout, fila e oferta.
  - textos de cancelamento/encerramento ajustados para entrega quando aplicavel.

### 3) Recebimento no motorista
- `src/screens/(authenticated)/Driver/DriverRequestsScreen.tsx`
  - abas `queue`, `realtime`, `scheduled`.
  - aceite/recusa/contraoferta e filtro de compatibilidade refletido.

### 4) Aceite + transicoes de status
- `backend/src/controllers/ride.controller.js`
  - transicoes incluem `driver_assigned -> driver_arriving/arrived`.
- `src/screens/(authenticated)/Driver/DriverRideScreen.tsx`
  - trata `driver_assigned` sem travar entrega agendada.

### 5) Tracking cliente
- `src/screens/(authenticated)/Client/Ride/Tracking/RideTracking/index.tsx`
  - status meta de entrega, toasts dinamicos e share dinamico (`entrega`).

### 6) Provas obrigatorias para entrega
- `backend/src/controllers/ride.controller.js`
  - bloqueia `in_progress` sem `pickupPhoto`.
  - bloqueia `completed` sem `deliveryPhoto`.
- `src/screens/(authenticated)/Driver/DriverRideScreen.tsx`
  - coleta foto de prova antes de iniciar/finalizar entrega.

### 7) Cancelamento + taxa
- `src/screens/(authenticated)/Client/Ride/Cancellation/CancelRide/index.tsx`
  - titulo/toast/valor dinamicos para entrega.
- `src/screens/(authenticated)/Client/Ride/Cancellation/CancelFee/index.tsx`
  - bullets dinamicos para entrega.

### 8) Pos-entrega
- `src/screens/(authenticated)/Client/Ride/Completion/RideCompleted/index.tsx`
  - titulo dinamico `Entrega finalizada`.
  - repassa `serviceType` para avaliacao.
- `src/screens/(authenticated)/Client/Ride/Completion/RateDriver/index.tsx`
  - subtitulo dinamico `Como foi a entrega...`.

## Evidencias de teste
- `backend/tests/ride.matching.controller.test.js`
  - 12 testes passando.
  - cobre bloqueios e caminho feliz relevantes para entrega:
    - compatibilidade de aceite,
    - agendado (bloqueio e sucesso),
    - transicao `driver_assigned -> driver_arriving`,
    - bloqueio sem provas,
    - sucesso com provas.

## Comandos de validacao executados
- `backend\\npm test -- ride.matching.controller.test.js` -> PASS (12/12)
- `npx tsc --noEmit` -> PASS

## Lacunas para considerar fluxo 100% concluido
1. Sem evidencia E2E real em dispositivo (cliente e motorista simultaneos).
2. Sem artefato de execucao real de cada etapa (screenshots/video/log de sessao).
3. Falta validar manualmente latencia/reconexao com rede instavel no caminho de entrega.

## Status
- Fluxo de entrega no codigo: fortemente coberto e consistente.
- Conclusao final operacional: pendente de E2E real.
