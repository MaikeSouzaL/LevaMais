# Prompts De Construção E Refatoração Por Tela

Data: 2026-05-19
Escopo: Leva Mais (Cliente + Motorista + Admin Web)
Objetivo: prompts prontos para usar em IA/codificação de cada tela.

## Como usar

- Copie 1 prompt por vez.
- Rode no contexto do repositório `Leva_Mais`.
- Peça para implementar com integração real (sem mock estático).
- Sempre validar navegação, estados de erro, loading e sucesso.

## 1) Cliente - Home (Entrega)

```text
Você é um engenheiro React Native no projeto Leva Mais.
Refatore a tela Home do cliente para destacar o fluxo de Entrega.

Objetivo:
- Melhorar seleção de serviço (Corrida x Entrega).
- Garantir navegação correta para DestinationSearch com serviceType="delivery".

Requisitos:
- Manter padrão visual atual do app.
- Exibir estado de loading e erro de disponibilidade por cidade.
- Se entrega indisponível na cidade, desabilitar card e mostrar mensagem contextual.
- Garantir que o card Entrega sempre envie params corretos para o fluxo.

Arquivos alvo:
- src/screens/(authenticated)/Client/Home/index.tsx
- src/routes/client.stack.routes.tsx

Integração:
- Usar dados reais do backend/config para disponibilidade.
- Não usar fallback estático para regras de negócio.

Critério de aceite:
- Toque em Entrega navega corretamente para DestinationSearch.
- Com cidade sem cobertura, UI bloqueia entrega com feedback claro.
```

## 2) Cliente - DestinationSearch (Coleta e Entrega)

```text
Você está no app React Native Leva Mais.
Implemente/refatore a tela DestinationSearch para o fluxo de entrega.

Objetivo:
- Capturar coleta e destino com lat/lng válidos.

Requisitos:
- Inputs com autocomplete e favoritos.
- Validar que ambos endereços têm coordenadas.
- Exibir resumo de distância/tempo quando possível.
- Botão Continuar só habilita com dados válidos.

Arquivos alvo:
- src/screens/(authenticated)/Client/Ride/Request/DestinationSearch/index.tsx

Navegação:
- Continuar -> DeliverySetup
- Params obrigatórios: pickup, dropoff, distance, duration, serviceType="delivery"

Critério de aceite:
- Não permite avançar com endereço incompleto.
- Mantém consistência dos params usados no fluxo seguinte.
```

## 3) Cliente - DeliverySetup

```text
Você é responsável pela tela DeliverySetup no Leva Mais.
Refatore a tela para ficar 100% aderente ao fluxo de entrega negociável.

Objetivo:
- Configurar pacote + oferta inicial sem pagamento antecipado.

Requisitos:
- Reintegrar seleção de tamanho da carga e necessidade de ajudante.
- Exibir faixa sugerida vindo do backend.
- Remover qualquer decisão financeira local estática.
- Bloquear criação de pedido se cotação backend falhar.
- Não mostrar método de pagamento nesta fase.

Arquivos alvo:
- src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx
- src/components/client/delivery-setup/*

Integração:
- Usar endpoint de cálculo/cotação backend.
- Oferta precisa respeitar limites mínimos/máximos da resposta.

Critério de aceite:
- Pedido só é criado com cotação válida.
- Sem seleção de pagamento nesta tela.
```

## 4) Cliente - DeliveryReviewScreen (Nova)

```text
Crie a nova tela DeliveryReviewScreen no app Leva Mais.

Objetivo:
- Revisão final antes de publicar para motoristas.

Conteúdo da tela:
- Coleta e destino.
- Veículo selecionado.
- Tipo/tamanho/peso/descrição do pacote.
- Prioridade.
- Oferta inicial e faixa sugerida.

Ações:
- Botão editar (voltar para setup).
- Botão enviar para entregadores.

Navegação:
- Entrada: params do DeliverySetup.
- Saída: cria ride e vai para SearchingDriver.

Arquivos alvo:
- criar: src/screens/(authenticated)/Client/Ride/Request/DeliveryReview/index.tsx
- atualizar: src/routes/client.stack.routes.tsx

Critério de aceite:
- Tela mostra todos os dados críticos.
- Publicação cria ride com payload coerente.
```

## 5) Cliente - SearchingDriver

```text
Refatore SearchingDriver para fluxo delivery com negociação e pré-contrato.

Objetivo:
- Mostrar estado de busca e transição para ofertas/pagamento.

Requisitos:
- Exibir status, tempo, oferta atual.
- Suportar aumentar oferta e cancelamento.
- Se houver ofertas, ir para marketplace.
- Se status entrar em payment_pending, navegar para tela de pagamento (não tracking).

Arquivos alvo:
- src/screens/(authenticated)/Client/Ride/SearchingDriver/index.tsx

Critério de aceite:
- Transições corretas por status backend.
- Nenhum caminho direto para tracking quando ainda estiver payment_pending.
```

## 6) Cliente - Marketplace De Propostas

```text
Refatore RideOffersMarketplaceScreen para seleção e contraproposta robusta.

Objetivo:
- Cliente escolher motorista com clareza.

Requisitos:
- Card com nome/foto/nota/ETA/distância/valor.
- Ações: aceitar, contrapropor, recusar.
- Após aceitar proposta: abrir DeliveryPaymentConfirmScreen.

Arquivos alvo:
- src/screens/(authenticated)/Client/Orders/RideOffersMarketplaceScreen.tsx

Integração:
- /rides/:rideId/offers/select
- /rides/:rideId/offers/client-counter
- /rides/:rideId/offers/decline

Critério de aceite:
- Ações refletem em tempo real no estado da ride.
- Navegação pós-aceite vai para pagamento.
```

## 7) Cliente - DeliveryPaymentConfirmScreen (Nova)

```text
Crie a tela DeliveryPaymentConfirmScreen no app cliente.

Objetivo:
- Confirmar método de pagamento após acordo com motorista.

Requisitos:
- Mostrar motorista selecionado e valor final acordado.
- Exibir métodos: dinheiro, cartão no app, cartão com motorista, carteira, pix.
- Tratar sucesso/falha/timeout.

Arquivos alvo:
- criar: src/screens/(authenticated)/Client/Ride/Request/DeliveryPaymentConfirm/index.tsx
- atualizar rotas e tipagens de navegação.

Integração:
- endpoint de confirmação de pagamento pós-negociação.

Critério de aceite:
- Sucesso leva para tracking.
- Falha permanece em payment_pending com feedback claro.
```

## 8) Cliente - RideTracking

```text
Refatore RideTracking para timeline de entrega mais clara.

Objetivo:
- Exibir fases operacionais da entrega em linguagem do usuário.

Fases exibidas:
- Motorista a caminho da coleta.
- Motorista chegou na coleta.
- Pacote coletado.
- A caminho da entrega.
- Chegou no destino.
- Entrega concluída.

Requisitos:
- Mapa com localização do motorista em tempo real.
- ETA e distância.
- Chat/call/cancelar conforme fase.

Arquivos alvo:
- src/screens/(authenticated)/Client/Ride/Tracking/RideTracking/index.tsx

Critério de aceite:
- Status real-time consistente com backend.
- UX clara em cada fase.
```

## 9) Cliente - Cancelamento

```text
Refatore ClientCancelRide para regras de cancelamento por fase.

Objetivo:
- Tornar taxa e impacto transparentes.

Requisitos:
- Mostrar taxa prevista por status da corrida.
- Bloquear cancelamento direto quando pacote já foi coletado e direcionar para suporte.
- Capturar motivo obrigatório.

Arquivos alvo:
- src/screens/(authenticated)/Client/Ride/Cancellation/CancelRide/index.tsx

Critério de aceite:
- Cancelamento alinhado ao status real.
- Mensagens objetivas de consequência.
```

## 10) Cliente - Avaliação

```text
Refatore RateDriver e RideCompleted para fechamento de experiência delivery.

Objetivo:
- Garantir avaliação e resumo final completo.

Requisitos:
- Exibir valor final, método de pagamento, comprovantes.
- Tela de estrelas com tags relevantes para entrega.
- Evitar duplicidade de avaliação.

Arquivos alvo:
- src/screens/(authenticated)/Client/Ride/Completion/RideCompleted/index.tsx
- src/screens/(authenticated)/Client/Ride/Completion/RateDriver/index.tsx

Critério de aceite:
- Fluxo pós-conclusão consistente e sem lacunas.
```

## 11) Motorista - DriverHome

```text
Refatore DriverHome para gate operacional antes de ficar online.

Objetivo:
- Garantir que só motorista apto e com saldo possa operar.

Requisitos:
- Verificar saldo > 0.
- Verificar aprovação documental e veículo ativo/aprovado.
- Mostrar card de bloqueio com CTA para recarga quando necessário.

Arquivos alvo:
- src/screens/(authenticated)/Driver/DriverHomeScreen.tsx

Critério de aceite:
- Bloqueios funcionais e mensagens claras.
```

## 12) Motorista - DriverRequests

```text
Refatore DriverRequestsScreen para foco em ofertas negociáveis.

Objetivo:
- Exibir pedido com risco financeiro e contexto operacional.

Requisitos do card:
- Valor ofertado.
- Taxa estimada da plataforma.
- Saldo necessário para aceitar.
- Método de pagamento previsto.
- Distâncias e ETA.

Ações:
- Aceitar, contrapropor, recusar.

Arquivos alvo:
- src/screens/(authenticated)/Driver/DriverRequestsScreen.tsx

Critério de aceite:
- Decisão do motorista fica informada e segura.
```

## 13) Motorista - Aguardando Pagamento (Novo estado/tela)

```text
Implemente estado/tela de motorista aguardando confirmação de pagamento do cliente.

Objetivo:
- Evitar início prematuro da entrega.

Requisitos:
- Mostrar status "Cliente escolheu você".
- Mostrar timer de reserva.
- Bloquear botões de início de rota.

Arquivos alvo:
- DriverRideScreen (estado) ou nova tela dedicada.

Critério de aceite:
- Só libera ações operacionais após confirmação backend.
```

## 14) Motorista - DriverRide (coleta e entrega)

```text
Refatore DriverRideScreen para operação delivery completa.

Objetivo:
- Controlar cada fase de execução com prova e tracking.

Requisitos:
- Botões por fase: chegar coleta, iniciar entrega, chegar destino (novo), finalizar.
- Exigir prova de coleta antes de iniciar entrega.
- Exigir prova de entrega antes de finalizar.
- Enviar localização com fase atual periodicamente.

Arquivos alvo:
- src/screens/(authenticated)/Driver/DriverRideScreen.tsx

Critério de aceite:
- Transições bloqueadas corretamente quando faltar evidência.
- Tracking estável e sem perda de estado.
```

## 15) Motorista - Cancelamento

```text
Refatore DriverCancelRideScreen para regras por fase e suporte.

Objetivo:
- Evitar cancelamento incorreto quando já está com pacote.

Requisitos:
- Motivo obrigatório.
- Regras especiais após coleta (suporte/devolução).
- Mensagens de impacto operacional.

Arquivos alvo:
- src/screens/(authenticated)/Driver/DriverCancelRideScreen.tsx

Critério de aceite:
- Fluxo de cancelamento respeita fase da entrega.
```

## 16) Motorista - Avaliação Do Cliente

```text
Refatore DriverRateClientScreen para pós-entrega delivery.

Objetivo:
- Fechar corrida com nota e feedback estruturado.

Requisitos:
- Estrelas + tags + comentário.
- Mostrar resumo financeiro final com taxa e líquido.

Arquivos alvo:
- src/screens/(authenticated)/Driver/DriverRateClientScreen.tsx

Critério de aceite:
- Avaliação salva uma única vez e UX é direta.
```

## 17) Backend - Tracking de rota

```text
Implemente trilha de rota por entrega no backend do Leva Mais.

Objetivo:
- Persistir histórico de coordenadas durante execução da entrega.

Requisitos:
- Criar modelo RideTrackPoint com índices por ride e tempo.
- Salvar pontos com fase: to_pickup, at_pickup, to_dropoff, at_dropoff.
- Adicionar endpoint para consultar auditoria da rota por ride.
- Gerar resumo routeAudit na ride ao concluir.

Arquivos alvo:
- backend/src/models/
- backend/src/controllers/ride.controller.js
- backend/src/routes/ride.routes.js
- backend/src/config/websocket.js

Critério de aceite:
- Admin consegue recuperar rota percorrida e eventos operacionais.
```

## 18) Backend - Cancelamento por fase

```text
Refatore regras de cancelamento da Ride com política por fase.

Objetivo:
- Cálculo de taxa de cancelamento configurável e contextual.

Requisitos:
- Remover percentuais hardcoded fixos.
- Ler regras de configuração da plataforma.
- Diferenciar antes da coleta, após coleta, em entrega, concluída.

Arquivos alvo:
- backend/src/models/Ride.js
- backend/src/controllers/ride.controller.js
- backend/src/models/PlatformConfig.js
- backend/src/controllers/config.controller.js

Critério de aceite:
- Taxas e bloqueios variam por fase e regra admin.
```

## 19) Admin Web - Lista e detalhe de entregas

```text
Refatore /rides no admin para visão operacional de delivery.

Objetivo:
- Auditoria completa de status, financeiro e evidências.

Requisitos:
- Colunas novas: payment status, offer final, app fee, método de pagamento.
- Drawer com abas: resumo, financeiro, negociação, timeline, provas, cancelamento.

Arquivos alvo:
- leva-mais-web/app/rides/page.tsx
- leva-mais-web/services/ridesService.ts

Critério de aceite:
- Operação consegue investigar casos sem depender do app mobile.
```

## 20) Admin Web - Mapa da rota percorrida (Nova aba)

```text
Implemente aba de rota percorrida no detalhe da entrega no admin web.

Objetivo:
- Mostrar trajeto real do motorista por fase.

Requisitos:
- Buscar endpoint de route-audit.
- Renderizar rota estimada e rota real.
- Exibir marcadores de aceite/coleta/entrega/cancelamento.
- Mostrar métricas: tempo e distância por trecho.

Arquivos alvo:
- leva-mais-web/app/rides/page.tsx
- leva-mais-web/services/ridesService.ts

Critério de aceite:
- Time administrativo visualiza claramente por onde o motorista passou.
```
