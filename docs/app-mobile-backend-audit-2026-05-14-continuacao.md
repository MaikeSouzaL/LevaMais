# Auditoria App + Backend (Fluxos Mobile) - 2026-05-14 (continuaï¿½ï¿½o)

## Objetivo auditado

Verificar consistï¿½ncia de fluxos mobile (cliente e motorista), contratos com backend e seguranï¿½a operacional, com foco em:
- Corridas
- Entregas (moto/carro)
- Entregas de van
- Fretes de caminhï¿½o
- Chamadas de motoristas / ofertas / agendamentos
- Menus e telas
- Seguranï¿½a bï¿½sica de APIs

## Checklist requisito -> evidï¿½ncia

1. Gate de autenticaï¿½ï¿½o e perfil (cliente/motorista aprovado)
- Evidï¿½ncia: `src/routes/index.tsx`
- Resultado: OK

2. Menus principais cliente e motorista conectados a rotas reais
- Evidï¿½ncia: `src/routes/drawer.cliente.routes.tsx`, `src/routes/client.stack.routes.tsx`, `src/routes/drawer.driver.routes.tsx`
- Resultado: OK no fluxo principal

3. Contrato app <-> backend para corridas/entregas/agendados
- Evidï¿½ncia: `src/services/ride.service.ts`, `backend/src/routes/ride.routes.js`
- Resultado: OK para endpoints principais (create/accept/reject/offers/queue/scheduled)

4. Regras de matching compatibilidade serviï¿½o x veï¿½culo
- Evidï¿½ncia: `backend/src/controllers/ride.controller.js` (`accept`, `submitOfferResponse`, `acceptScheduled`)
- Resultado: OK (protegido e testado)

5. LGPD e consentimento versionado
- Evidï¿½ncia: `backend/src/controllers/auth.controller.js`, `backend/src/models/User.js`, `src/screens/(authenticated)/Client/Profile/PrivacyDataScreen.tsx`, `src/screens/(public)/TermsScreen/index.tsx`
- Resultado: OK no fluxo operacional atual (com versï¿½es pï¿½blicas via `/config/policy-versions`)

6. Conciliaï¿½ï¿½o de pagamentos (MVP interno)
- Evidï¿½ncia: `backend/src/controllers/payment.controller.js`, `backend/src/routes/payments.routes.js`, `backend/src/models/PaymentWebhookEvent.js`
- Resultado: OK no escopo MVP (webhook, idempotï¿½ncia, auditoria, replay admin)

7. Seguranï¿½a operacional bï¿½sica de admin/webhook
- Evidï¿½ncia: `backend/src/createServer.js`, `backend/src/controllers/payment.controller.js`
- Resultado: Parcialmente OK (headers e bloqueio de webhook sem secret em produï¿½ï¿½o)


- Corre??o aplicada: `DeliverySetup` agora recarrega pricing ao trocar `deliveryType`, `cargoSize`, `needsHelper` e contexto de rota/cidade, evitando pre?o desatualizado.

## Achados (priorizados)

### Alto
1. Falta validaï¿½ï¿½o E2E real de fluxo ponta-a-ponta em dispositivo
- Impacto: regressï¿½es visuais/estado podem passar em testes unitï¿½rios.
- Evidï¿½ncia: suï¿½te atual ï¿½ controller/unit (`backend/tests/*.test.js`) e `tsc`.
- Aï¿½ï¿½o sugerida: adicionar smoke e2e mï¿½nimo (login -> criar corrida/entrega -> tracking).

### Mï¿½dio
2. Tela de `DeliverySetup` carrega imports de mapa nï¿½o usados no layout atual
- Impacto: complexidade desnecessï¿½ria e risco de manutenï¿½ï¿½o.
- Evidï¿½ncia: `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx` (imports `MapView`, `Marker`, `Polyline`, `MapViewDirections` sem uso efetivo no JSX).
- Aï¿½ï¿½o sugerida: remover dependï¿½ncias nï¿½o usadas ou reativar mapa de forma consistente.

3. Algumas telas ainda misturam regras de negï¿½cio e UI extensa
- Impacto: manutenï¿½ï¿½o lenta e maior chance de bug.
- Evidï¿½ncia: `src/screens/(authenticated)/Client/Orders/ActiveOrders/index.tsx`, `src/screens/(authenticated)/Driver/DriverRequestsScreen.tsx`.
- Aï¿½ï¿½o sugerida: extrair hooks/serviï¿½os de estado de fluxo (aceite, negociaï¿½ï¿½o, agendados).

### Baixo
4. Mensagens/textos e encoding inconsistentes em partes do app
- Impacto: UX e legibilidade.
- Evidï¿½ncia: mï¿½ltiplos arquivos com acentuaï¿½ï¿½o inconsistente.
- Aï¿½ï¿½o sugerida: padronizar encoding UTF-8 e revisar cï¿½pias crï¿½ticas.

## Validaï¿½ï¿½es executadas nesta continuaï¿½ï¿½o
- `backend\\npm test -- payment-withdraw.controller.test.js`
- `backend\\npm test -- auth.privacy.controller.test.js`
- `npx tsc --noEmit`

## Conclusï¿½o objetiva

O fluxo principal estï¿½ funcional e mais robusto que no inï¿½cio do ciclo, com ganhos reais em matching, LGPD e pagamentos MVP. Ainda faltam melhorias de engenharia de produto para atingir padrï¿½o de apps grandes (principalmente E2E real, refinamento de telas complexas e limpeza arquitetural em fluxos densos).

- Correcao aplicada: tela de motorista em analise agora encerra sessao com `logout()` ao finalizar, evitando navegacao invalida para `SignIn` dentro do stack autenticado.

## Atualizacao incremental - 2026-05-14 (rodada atual)

### Melhorias aplicadas

1. Agendamento recomendado no fluxo de baixa oferta
- Evidencia: `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx`
- Ajuste:
  - Quando `preferScheduled` esta ativo, o cliente agora escolhe janela de agendamento (`30`, `60` ou `120` min).
  - `scheduledFor` deixou de ser fixo em `+60 min` e passa a usar a selecao do usuario.
- Impacto:
  - Melhora conversao em cenarios de baixa oferta e reduz friccao de UX.

2. Hardening de CORS no backend (HTTP + WebSocket)
- Evidencia:
  - `backend/src/createServer.js`
  - `backend/src/config/websocket.js`
- Ajuste:
  - Origem agora e lida de env (`CORS_ORIGINS`/`CORS_ORIGIN` e `WS_CORS_ORIGINS`).
  - Em producao, sem env configurado, o backend nao abre wildcard implicitamente.
  - Em dev, mantem fallback `*` para nao quebrar ambiente local.
- Impacto:
  - Reduz superficie de abuso cross-origin e melhora postura de seguranca operacional.

### Validacoes executadas nesta rodada
- `npx tsc --noEmit`
- `backend\\npm test -- ride.matching.controller.test.js`
- `backend\\npm test -- auth.privacy.controller.test.js`

## Atualizacao incremental - 2026-05-14 (hardening logica backend)

### Melhorias aplicadas

1. Aceite de corrida envia rating real do motorista
- Evidencia: `backend/src/controllers/ride.controller.js`
- Ajuste:
  - `accept` agora popula `driverId` com `rating` e envia esse valor em `driver-found`.
  - Remove fallback fixo `4.8`.

2. Meta e bonus diario do motorista deixam de ser hardcoded
- Evidencia:
  - `backend/src/controllers/ride.controller.js`
  - `backend/src/models/PlatformConfig.js`
- Ajuste:
  - `getDriverStats` passa a ler `driverGoals.dailyGoalRides` e `driverGoals.dailyBonusAmount` de `PlatformConfig`.
  - Mantido fallback seguro (`10` corridas / `R$ 20`).

3. Timezone de agregacao de ganhos configuravel
- Evidencia: `backend/src/controllers/ride.controller.js`
- Ajuste:
  - `getDriverEarningsChart` passou a usar `$dateToString` com `timezone` via `APP_TIMEZONE` (fallback `America/Sao_Paulo`).
  - Remove dependencia de deslocamento fixo UTC-3 no agrupamento.

4. Chave de comparacao diaria de online time ajustada para timezone configuravel
- Evidencia: `backend/src/controllers/ride.controller.js`
- Ajuste:
  - `activeDateStr` compara com data local derivada por timezone configurado, reduzindo discrepancia de virada de dia em UTC.

### Validacoes executadas nesta rodada
- `backend\\npm test -- ride.matching.controller.test.js`
- `backend\\npm test -- payment-withdraw.controller.test.js`
- `npx tsc --noEmit`

## Atualizacao incremental - 2026-05-14 (fluxo telas cliente/motorista)

### Melhorias aplicadas

1. DriverRequests: aceite mais resiliente em falhas transitórias
- Evidencia: `src/screens/(authenticated)/Driver/DriverRequestsScreen.tsx`
- Ajuste:
  - Em oferta (`respondToOffer`), o card so sai da lista quando o envio realmente ocorre com sucesso.
  - Em aceite direto (`accept`), em erro o card so e removido quando a corrida realmente ficou indisponivel; falhas transitórias mantem o item para nova tentativa.
- Impacto:
  - Reduz perda de oportunidade por erro momentaneo de rede/API.

2. DriverRequests: validação de saldo em agendado alinhada com regra backend
- Evidencia: `src/screens/(authenticated)/Driver/DriverRequestsScreen.tsx`
- Ajuste:
  - Remove verificacao simplista via `walletService.getBalance().available > 0`.
  - Passa a usar `driverService.canAcceptRide(rideValue)` tambem para aceitar agendamento.
- Impacto:
  - Cliente/driver recebem comportamento coerente com validacao real de backend.

3. ActiveOrders: texto de cancelamento de agendado dinamico por tipo
- Evidencia: `src/screens/(authenticated)/Client/Orders/ActiveOrders/index.tsx`
- Ajuste:
  - Mensagem de confirmacao deixa de falar sempre "entrega" e passa a refletir corrida/entrega.

### Validacoes executadas nesta rodada
- `npx tsc --noEmit`
- `backend\\npm test -- ride.matching.controller.test.js`

## Auditoria de conclusao parcial - 2026-05-14

### Criterios concretos do objetivo (traduzidos)
1. Fluxos completos cliente e motorista para: corrida, delivery, van e caminhao.
2. Chamadas aos motoristas, aceite, recusa, negociacao, fila e agendamento funcionando com contrato backend.
3. Menus e navegacao sem rotas orfas, com telas principais acessiveis.
4. Seguranca basica de API e realtime (CORS, webhook/admin, validacoes de aceite).
5. Coerencia visual e UX em telas principais (mensagens, estados vazios, acoes criticas).
6. Indicacao objetiva do que ainda falta criar/refatorar para aproximar de apps grandes.

### Checklist requisito -> evidencia real
1. Menus cliente/motorista conectados
- Evidencia:
  - `src/routes/drawer.cliente.routes.tsx`
  - `src/routes/client.stack.routes.tsx`
  - `src/routes/drawer.driver.routes.tsx`
- Status: atendido no fluxo principal.

2. Fluxo cliente (pedido -> busca -> ofertas -> tracking -> ativos)
- Evidencia:
  - `src/screens/(authenticated)/Client/Home/index.tsx`
  - `src/screens/(authenticated)/Client/Ride/Request/DestinationSearch/index.tsx`
  - `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx`
  - `src/screens/(authenticated)/Client/Orders/RideOffersMarketplaceScreen.tsx`
  - `src/screens/(authenticated)/Client/Orders/ActiveOrders/index.tsx`
- Status: atendido com melhorias aplicadas (agendamento recomendado, ajuste de oferta, cancelamento/edicao de agendado).

3. Fluxo motorista (fila/direto/agendado, aceite/recusa/contraoferta)
- Evidencia:
  - `src/screens/(authenticated)/Driver/DriverRequestsScreen.tsx`
  - `backend/src/controllers/ride.controller.js`
  - `backend/tests/ride.matching.controller.test.js`
- Status: atendido no core; resiliencia de erro no app melhorada nesta rodada.

4. Compatibilidade servico x veiculo e bloqueios operacionais
- Evidencia:
  - `backend/src/controllers/ride.controller.js` (`accept`, `submitOfferResponse`, `acceptScheduled`, `getAvailableScheduledRides`)
  - `backend/tests/ride.matching.controller.test.js`
- Status: atendido.

5. Seguranca basica (webhook/admin/CORS)
- Evidencia:
  - `backend/src/controllers/payment.controller.js`
  - `backend/src/routes/payments.routes.js`
  - `backend/src/createServer.js`
  - `backend/src/config/websocket.js`
- Status: atendido no escopo MVP (hardening aplicado para CORS configuravel + webhook secret em producao).

6. LGPD operacional (consentimento, revogacao, exclusao, versoes)
- Evidencia:
  - `backend/src/controllers/auth.controller.js`
  - `backend/src/models/User.js`
  - `src/screens/(authenticated)/Client/Profile/PrivacyDataScreen.tsx`
  - `src/screens/(public)/TermsScreen/index.tsx`
- Status: atendido no operacional atual.

7. Pagamento e saque (contrato app-backend)
- Evidencia:
  - `backend/src/routes/payments.routes.js`
  - `backend/src/routes/withdraw.routes.js`
  - `src/screens/(authenticated)/Client/Ride/Request/PaymentEnhanced/index.tsx`
  - `backend/tests/payment-withdraw.controller.test.js`
- Status: atendido no MVP interno.

### Lacunas ainda abertas (nao concluido)
1. E2E real em dispositivo
- Falta evidenciar fluxo ponta-a-ponta em ambiente real (cliente->motorista) para corrida/delivery/agendado.

2. Cobertura de frete pesado (van/caminhao) com roteiro de QA dedicado
- O contrato aceita `vehicleType`, mas falta evidenciar cenarios completos com checklist e validacao manual especifica desses modais/telas.

3. Integracao financeira real
- Ainda sem gateway real (tokenizacao/captura/PIX real), apenas fachada MVP.

4. Auditoria visual final de consistencia
- Ainda existem pontos de copy/encoding e telas densas que pedem refinamento adicional para padrao de app grande.

### Decisao de status
- Objetivo ainda NAO concluido.
- Proximo passo recomendado: executar roteiro de validacao funcional guiado (checklist de cenarios cliente/motorista por tipo de servico) e registrar evidencias por tela.

## Atualizacao incremental - 2026-05-14 (frete van/caminhao - UI x backend)

### Melhorias aplicadas

1. DeliverySetup agora expõe todos os parametros enviados ao backend
- Evidencia: `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx`
- Ajuste:
  - Adicionado `CargoSizeSelector` (small/medium/large) na UI.
  - Adicionado `HelperSwitch` para controlar `needsHelper` na UI.
- Impacto:
  - Elimina mismatch entre payload e tela: `cargoSize` e `needsHelper` deixaram de ficar fixos/invisiveis.
  - Melhora especialmente cenarios de van/caminhao (mudanca/material/frete).

### Validacoes executadas nesta rodada
- `npx tsc --noEmit`
- `backend\\npm test -- ride.matching.controller.test.js`

## Atualizacao incremental - 2026-05-14 (UX frete pesado)

### Melhorias aplicadas

1. DeliverySetup com orientacao contextual para van/caminhao
- Evidencia: `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx`
- Ajuste:
  - Banner contextual para frete pesado pedindo detalhes de acesso/peso/ajudante.
  - Para `truck`, o app sugere automaticamente `needsHelper=true` na primeira selecao (usuario pode alterar depois).
- Impacto:
  - Reduz friccao de aceite para fretes de maior complexidade e melhora clareza do fluxo.

### Validacao executada nesta rodada
- `npx tsc --noEmit`

## Atualizacao incremental - 2026-05-14 (evidencia adicional de fluxo agendado)

### Melhorias aplicadas

1. Cobertura de teste para caminho feliz de aceite de agendamento
- Evidencia: `backend/tests/ride.matching.controller.test.js`
- Ajuste:
  - Adicionado teste que valida `acceptScheduled` com motorista compativel/disponivel.
  - Verifica mudanca de status para `driver_assigned` e atribuicao de `driverId`.
- Impacto:
  - Reforca evidencia de que o fluxo de agendados funciona nos dois lados: bloqueios e sucesso.

### Validacoes executadas nesta rodada
- `backend\\npm test -- ride.matching.controller.test.js` (7/7)
- `npx tsc --noEmit`

## Atualizacao incremental - 2026-05-14 (historico financeiro real no driver service)

### Melhorias aplicadas

1. Endpoint backend de historico de saldo
- Evidencia:
  - `backend/src/controllers/driver.controller.js`
  - `backend/src/routes/driver.routes.js`
- Ajuste:
  - Novo `GET /api/drivers/balance/history?limit=` com transacoes do ledger (`deposit`, `deduction`, `withdrawal`) ordenadas por data.

2. Frontend driver.service sem retornos vazios artificiais
- Evidencia: `src/services/driver.service.ts`
- Ajuste:
  - `getBalanceHistory` agora consome `/drivers/balance/history` e normaliza o retorno.
  - `getDepositHistory` passou a derivar de historico real (filtro `deposit`) em vez de retornar array vazio.
- Impacto:
  - Evita fluxo "aparentemente completo" com dados sempre vazios em historico/depositos.

### Validacoes executadas nesta rodada
- `npx tsc --noEmit`
- `backend\\npm test -- payment-withdraw.controller.test.js`
- `backend\\npm test -- ride.matching.controller.test.js`

## Atualizacao incremental - 2026-05-14 (fluxo entrega agendada cliente->motorista)

### Melhorias aplicadas

1. Destravado fluxo de entrega em `driver_assigned`
- Evidencia:
  - `src/screens/(authenticated)/Driver/DriverRideScreen.tsx`
  - `backend/src/controllers/ride.controller.js`
- Ajuste:
  - App motorista agora trata `driver_assigned` como estado valido para avancar para `driver_arriving`.
  - Backend `updateStatus` agora permite transicao `driver_assigned -> driver_arriving/arrived`.
- Impacto:
  - Evita bloqueio em entregas agendadas apos aceite antecipado do motorista.

2. Cobertura de teste da nova transicao
- Evidencia: `backend/tests/ride.matching.controller.test.js`
- Ajuste:
  - Novo teste valida atualizacao de status de `driver_assigned` para `driver_arriving`.

### Validacoes executadas nesta rodada
- `backend\\npm test -- ride.matching.controller.test.js` (8/8)
- `npx tsc --noEmit`
