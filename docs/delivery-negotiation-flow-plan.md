# Planejamento do Fluxo de Delivery Negociavel

Data do estudo: 2026-05-18  
Branch: `feature-add-new-features`  
Escopo: rota de entrega/encomenda no app cliente, app motorista, backend e reflexos no painel web admin.

## 1. Visao Do Produto

O Leva Mais deve ser um aplicativo unico para cliente e motorista, juntando:

- Corrida urbana estilo Uber/99.
- Entrega de pacote/encomenda estilo Uber Connect/Uber Courier.
- Logistica local estilo iFood/DoorDash.
- Negociacao de preco estilo inDrive.
- Controle operacional via web admin.

Para delivery, a ideia central nao e apenas "chamar um entregador". A ideia e:

1. Cliente informa coleta, entrega e dados do pacote.
2. Backend calcula faixa sugerida e regras.
3. Cliente publica uma oferta.
4. Entregadores aceitam, recusam ou contrapropoem.
5. Cliente escolhe um entregador e fecha um pre-contrato.
6. Cliente escolhe/confirma pagamento.
7. Motorista recebe liberacao definitiva e inicia a entrega.

## 2. Referencias De Mercado

Fontes estudadas:

- [inDrive Terms](https://lktcdn2.prixacdn.net/media/pdf_upload/Indrive.pdf) descreve a plataforma como intermediadora entre cliente e motorista, com preco ofertado pelo passageiro, aceite ou contraproposta do motorista e escolha final do cliente.
- [Analise do inDrive](https://www.approsing.com/app/reviews/indrive-review) descreve motoristas aceitando, ignorando ou contrapondo o valor.
- [Uber package delivery](https://www.uber.com/us/en/item-delivery/) posiciona pacote como fluxo proximo de corrida, com coleta, entrega e rastreamento.
- [Uber Connect](https://www.uber.com/us/en/newsroom/uber-connect-holiday/) reforca rastreamento, comunicacao e envio/recebimento de pacotes.
- [Uber Help sobre PIN](https://help.uber.com/en/driving-and-delivering/article/uber-connect---proof-of-delivery-pin?nodeId=61478729-8a5f-4f93-ba77-8fbcec909c16) mostra preocupacao com comprovacao de entrega via PIN.
- [Uber Help sobre pacote](https://help.uber.com/driving-and-delivering/article/node-title?nodeId=d7f78a1c-6888-47d6-bd72-4df43d6a26dc) mostra que o entregador precisa ver tempo, distancia, notas de coleta, limites de peso, contato e instrucoes.
- [DoorDash Shop & Deliver](https://help.doordash.com/en-us/dashers/article/what-is-doordash-shop-deliver) mostra importancia de informar valor, itens e contato durante o processo.

Conclusao aplicada:

- O cliente deve negociar antes de pagar.
- O motorista precisa ver informacoes suficientes antes de ofertar.
- O backend deve ser a fonte unica de preco, configuracao, faixa sugerida, taxas e regras.
- O admin web precisa enxergar cada fase: publicado, negociando, pre-contrato, pagamento pendente, entrega ativa, comprovantes e finalizacao.

## 3. Fluxo Atual Encontrado

### Cliente

Arquivos principais:

- `src/screens/(authenticated)/Client/Home/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Request/DestinationSearch/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx`
- `src/screens/(authenticated)/Client/Ride/SearchingDriver/index.tsx`
- `src/screens/(authenticated)/Client/Orders/RideOffersMarketplaceScreen.tsx`
- `src/screens/(authenticated)/Client/Ride/Tracking/RideTracking/index.tsx`

Fluxo atual:

```text
Home
  -> DestinationSearch
  -> DeliverySetup
  -> SearchingDriver
  -> RideOffersMarketplace ou RideTracking
  -> RideCompleted
```

### Backend

Arquivos principais:

- `backend/src/controllers/ride.controller.js`
- `backend/src/models/Ride.js`
- `backend/src/services/pricing-engine.js`
- `backend/src/models/PricingConfig.js`
- `backend/src/routes/ride.routes.js`
- `backend/src/routes/payments.routes.js`

Recursos ja existentes:

- `POST /rides/calculate-price`
- `POST /rides`
- `GET /rides/:rideId/offers`
- `POST /rides/:rideId/offers/respond`
- `POST /rides/:rideId/offers/client-counter`
- `POST /rides/:rideId/offers/select`
- `POST /rides/:rideId/offers/increase`
- `POST /rides/:rideId/queue`
- `POST /rides/:rideId/proof/pickup`
- `POST /rides/:rideId/proof/delivery`
- `POST /payments/process`

### Web Admin

Arquivos relevantes:

- `leva-mais-web/services/ridesService.ts`
- `leva-mais-web/services/pricingService.ts`
- `leva-mais-web/app/rides/page.tsx`
- `leva-mais-web/app/settings/pricing/page.tsx`

O admin ja tem base para ver rides e configurar precos, mas ainda nao esta completo para gerir negociacao, pagamento pendente, detalhes de pacote e comprovantes.

## 4. Principais Problemas Atuais

### 4.1 Pagamento Entra Cedo Demais

Hoje `DeliverySetup` ja envia `payment.method`, com default interno. Isso conflita com o fluxo desejado.

Regra correta:

- Antes da negociacao: pagamento ainda nao deve ser escolhido.
- Depois do cliente escolher a proposta/motorista: abrir tela de pagamento/confirmacao.
- Enquanto isso: motorista fica aguardando confirmacao.

### 4.2 `selectOffer` Ja Atribui Motorista Cedo Demais

Hoje `POST /rides/:rideId/offers/select` faz:

- define `negotiation.finalAgreedPrice`;
- define `negotiation.selectedDriverId`;
- define `driverId`;
- muda status para `driver_assigned`;
- notifica motorista.

Para o fluxo correto, ele deve virar:

```text
selectOffer -> payment_pending
```

E somente apos pagamento/confirmacao:

```text
payment_pending -> driver_assigned
```

### 4.3 Preco Nao Pode Ter Fallback De Produto No App

O app pode mostrar loading, erro ou mensagem amigavel, mas nao deve criar pedido com preco local estatico.

Regra:

- Sem resposta valida de `/rides/calculate-price`, nao cria pedido.
- Faixa sugerida, minimo, maximo, prioridade, veiculos e tipos devem vir do backend.

### 4.4 Dados Do Pacote Estao Incompletos

Existem componentes prontos mas nao integrados:

- `CargoSizeSelector`
- `HelperSwitch`
- `PaymentMethodSelector`

O `PaymentMethodSelector` deve sair do setup inicial e ir para depois do acordo. Ja `CargoSizeSelector` e `HelperSwitch` devem voltar para o setup da entrega.

### 4.5 Falta Recebedor

Entrega precisa de:

- Nome do recebedor.
- Telefone do recebedor.
- Complemento/referencia.
- Instrucao de entrega.
- Opcional: PIN de entrega.

Sem isso, motorista chega no destino sem informacao suficiente.

## 5. Fluxo-Alvo Do Cliente

### Tela 1: Home

Objetivo: escolher servico.

Elementos:

- Card `Corrida`.
- Card `Entrega`.
- Disponibilidade local vinda do backend.
- Atalhos/favoritos.

Ao tocar em `Entrega`:

```text
navigate("DestinationSearch", { serviceType: "delivery" })
```

### Tela 2: Enderecos

Objetivo: definir coleta e entrega.

Campos:

- Local de coleta.
- Destino da entrega.
- Complemento da coleta.
- Complemento da entrega.
- Referencia opcional.

Backend:

- Pode validar cidade atendida.
- Pode validar distancia maxima.
- Pode retornar disponibilidade por tipo de veiculo.

Saida:

```text
pickup, dropoff, distance, duration, cityId
```

### Tela 3: Definir Entrega

Objetivo: configurar pacote e oferta.

Campos:

- Resumo da rota.
- Veiculo: moto, carro, van, frete.
- Tipo: delivery, documento, mercado, caixa, material, moveis, mudanca, outros.
- Tamanho: pequeno, medio, grande.
- Peso aproximado.
- Fragil: sim/nao.
- Precisa ajudante: sim/nao.
- Descricao obrigatoria.
- Prioridade: economico, rapido, urgente.
- Faixa sugerida do backend.
- Oferta do cliente.

Nao deve ter forma de pagamento aqui.

Botao:

```text
Revisar pedido
```

### Tela 4: Revisar Entrega

Nova tela recomendada: `DeliveryReviewScreen`.

Objetivo: evitar erro antes de publicar.

Mostra:

- Coleta.
- Entrega.
- Tipo do item.
- Veiculo.
- Tamanho/peso.
- Fragil/ajudante.
- Oferta inicial.
- Faixa sugerida.
- Tempo/distancia.

Botao:

```text
Enviar para entregadores
```

Acao:

```text
POST /rides
```

Cria status:

```text
requesting ou negotiating
```

### Tela 5: Buscando Entregadores

Objetivo: mostrar que o pedido foi publicado.

Elementos:

- Radar/mapa.
- Oferta atual.
- Tempo restante.
- Quantos entregadores foram notificados.
- Quantos visualizaram, se backend suportar.
- Botao `Aumentar oferta`.
- Botao `Cancelar`.
- Fallback: `Entrar na fila` ou `Agendar`.

### Tela 6: Propostas

Objetivo: cliente escolher melhor oferta.

Cada proposta deve mostrar:

- Nome/foto/avaliacao do entregador.
- Valor proposto.
- Distancia ate coleta.
- Tempo ate coleta.
- Veiculo.
- Quantidade de entregas finalizadas.
- Status da proposta: aceita, contraproposta, aguardando resposta.

Acoes:

- Aceitar proposta.
- Fazer contraproposta.
- Recusar proposta.

Ao aceitar:

```text
POST /rides/:rideId/offers/select
```

Mas o backend deve retornar:

```text
status = payment_pending
```

### Tela 7: Confirmar Pagamento

Nova tela recomendada: `DeliveryPaymentConfirmScreen`.

Objetivo: escolher pagamento depois do acordo.

Mostra:

- Entregador selecionado.
- Valor final acordado.
- Taxas/descontos.
- Metodo de pagamento.
- Cupom.
- Carteira, se existir.

Metodos:

- Dinheiro.
- Pix.
- Cartao.
- Carteira.

Regras:

- Dinheiro: cliente confirma metodo; status vai para `driver_assigned`.
- Pix/cartao/carteira: processa/autoriza; apos sucesso, status vai para `driver_assigned`.
- Falha: continua em `payment_pending`, com timer.
- Timeout: libera motorista e volta para propostas ou cancela selecao.

### Tela 8: Tracking

Objetivo: acompanhar entrega.

Estados:

- Motorista confirmado.
- Indo para coleta.
- Chegou na coleta.
- Coleta confirmada.
- Indo para entrega.
- Entregue.

### Tela 9: Conclusao

Objetivo: fechar experiencia.

Mostra:

- Valor final.
- Metodo de pagamento.
- Comprovante de coleta/entrega.
- Avaliacao.
- Gorjeta opcional.

## 6. Fluxo-Alvo Do Motorista

### Tela: Lista De Pedidos

Mostrar pedidos disponiveis com:

- Tipo: entrega/corrida/frete.
- Oferta do cliente.
- Faixa sugerida, se permitido pela estrategia.
- Distancia ate coleta.
- Distancia coleta -> entrega.
- Tempo estimado.
- Veiculo necessario.
- Tipo de pacote.
- Peso/tamanho.
- Fragil/ajudante.

Acoes:

- Aceitar oferta do cliente.
- Fazer contraproposta.
- Recusar.

### Tela: Aguardando Cliente

Quando cliente seleciona a oferta:

```text
status = payment_pending
```

Motorista ve:

- `Cliente escolheu voce`.
- `Aguardando confirmacao do pagamento`.
- Timer de reserva.
- Valor final.
- Nao deve iniciar deslocamento ainda.

### Tela: Entrega Ativa

Apos pagamento confirmado:

- Botao `Ir para coleta`.
- Botao `Cheguei`.
- Enviar foto/PIN de coleta.
- Botao `Iniciar entrega`.
- Enviar foto/PIN/nome do recebedor.
- Botao `Finalizar`.

## 7. Backend: Mudancas Necessarias

### 7.1 Novos Status

Adicionar ao `Ride.status`:

- `payment_pending`
- `payment_failed`
- Opcional: `negotiating`

Status recomendado:

```text
requesting
  -> payment_pending
  -> driver_assigned
  -> accepted
  -> driver_arriving
  -> arrived
  -> in_progress
  -> completed
```

### 7.2 Novo Subdocumento De Pagamento

Expandir `Ride.payment`:

```js
payment: {
  method: "cash" | "card" | "wallet" | "pix" | null,
  status: "not_selected" | "pending" | "authorized" | "completed" | "failed" | "refunded",
  selectedAt: Date,
  confirmedAt: Date,
  transactionId: String,
  provider: String,
  failureReason: String
}
```

### 7.3 Novo Subdocumento De Entrega

Adicionar `delivery` ou expandir `details`:

```js
delivery: {
  itemType: String,
  cargoSize: "small" | "medium" | "large",
  approximateWeightKg: Number,
  isFragile: Boolean,
  needsHelper: Boolean,
  description: String,
  pickupComplement: String,
  dropoffComplement: String,
  recipient: {
    name: String,
    phone: String,
    instructions: String,
    deliveryPin: String
  }
}
```

### 7.4 Endpoints Novos

#### Selecionar proposta

Atual:

```text
POST /rides/:rideId/offers/select
```

Novo comportamento:

- Define `finalAgreedPrice`.
- Define `selectedDriverId`.
- Define `driverId` ou `reservedDriverId`.
- Define `status = payment_pending`.
- Notifica motorista: `client-selected-offer-awaiting-payment`.
- Nao permite iniciar entrega ainda.

#### Confirmar pagamento

Novo endpoint:

```text
POST /rides/:rideId/payment/confirm
```

Payload:

```json
{
  "method": "pix",
  "paymentMethodId": "optional",
  "pixKey": "optional",
  "wallet": false,
  "promotionCode": "optional"
}
```

Resultado:

- Se dinheiro: confirma metodo.
- Se carteira: debita ou reserva saldo.
- Se cartao/pix: processa ou cria transacao.
- Atualiza `payment.status`.
- Muda `status` para `driver_assigned`.
- Notifica motorista e cliente.

#### Cancelar pre-contrato

Novo endpoint:

```text
POST /rides/:rideId/payment/cancel-selection
```

Uso:

- Cliente desistiu na tela de pagamento.
- Pagamento expirou.
- Motorista deve ser liberado.
- Pedido volta para `requesting` ou vai para `cancelled_by_client`.

### 7.5 Pricing Deve Ser 100% Backend

O endpoint `/rides/calculate-price` deve retornar:

```json
{
  "pricing": {
    "basePrice": 10,
    "distancePrice": 5,
    "serviceFee": 2,
    "total": 17,
    "platformFee": 2.55,
    "driverValue": 17
  },
  "smartPricing": {
    "minimumPrice": 15,
    "suggestedPrice": 20,
    "priorityPrice": 27,
    "currency": "BRL",
    "reason": "distancia + prioridade + veiculo"
  },
  "config": {
    "allowedOfferMin": 15,
    "allowedOfferMax": 60,
    "step": 1,
    "priorities": [...]
  }
}
```

O app nao deve decidir:

- preco minimo;
- preco maximo;
- multiplicador de prioridade;
- taxa da plataforma;
- valor do motorista;
- se um veiculo esta habilitado;
- se um tipo de entrega e permitido.

## 8. Admin Web: Mudancas Necessarias

### 8.1 Rides/Entregas

Adicionar colunas:

- Service type.
- Status detalhado.
- Payment status.
- Final agreed price.
- Client offer.
- Selected driver.
- City.
- Vehicle.
- Package type.
- Fragile/helper.
- Proof status.

### 8.2 Detalhe Da Entrega

Mostrar:

- Linha do tempo completa.
- Todas as propostas.
- Oferta aceita.
- Quem selecionou quem.
- Pagamento.
- Comprovantes.
- Chat/logs relevantes.
- Erros de pagamento.
- Cancelamentos.

### 8.3 Configuracoes

Admin deve configurar:

- Veiculos habilitados por cidade.
- Tipos de entrega por veiculo.
- Capacidade/peso por veiculo.
- Multiplicadores de prioridade.
- Taxa minima.
- Km incluso.
- Preco por km.
- Taxa plataforma.
- Timeout de pagamento pendente.
- Timeout de busca.
- Raio de busca por veiculo.
- Regras de fila.

## 9. Plano De Implementacao

### Fase 1: Ajustar Fluxo Sem Grande Reescrita

1. Remover selecao de pagamento do `DeliverySetup`.
2. Reintegrar `CargoSizeSelector` e `HelperSwitch`.
3. Criar `DeliveryReviewScreen`.
4. Garantir que `DestinationSearch` preserve `serviceType: "delivery"` em favoritos.
5. Bloquear criacao se `calculate-price` falhar.

### Fase 2: Pre-Contrato E Pagamento Depois Da Oferta

1. Adicionar status `payment_pending` no backend.
2. Alterar `selectOffer` para nao ir direto para `driver_assigned`.
3. Criar tela `DeliveryPaymentConfirmScreen`.
4. Criar endpoint `POST /rides/:rideId/payment/confirm`.
5. Criar timeout de pagamento pendente.
6. Criar tela/estado do motorista `Aguardando pagamento do cliente`.

### Fase 3: Detalhes De Entrega

1. Adicionar recebedor.
2. Adicionar complemento/referencia.
3. Adicionar peso aproximado.
4. Adicionar fragilidade.
5. Adicionar PIN de entrega.
6. Melhorar comprovante de coleta/entrega.

### Fase 4: Admin Web

1. Atualizar listagem de rides.
2. Atualizar detalhe da ride.
3. Adicionar filtros por status de pagamento/negociacao.
4. Exibir propostas e comprovantes.
5. Exibir configuracoes de delivery.

### Fase 5: Otimizacoes

1. Recomendacao inteligente de oferta.
2. Mensagens de incentivo: "aumente R$ 3 para maior chance".
3. Ranking de propostas por menor preco, mais rapido, melhor avaliacao.
4. Notificacoes push refinadas.
5. Regras de cancelamento por fase.

## 10. Decisoes Recomendadas

### Decisao 1

Nao pedir pagamento antes de negociar.

Motivo: o DNA do produto e negociacao. Pedir pagamento cedo quebra o fluxo estilo inDrive.

### Decisao 2

Criar `payment_pending`.

Motivo: resolve o periodo entre "cliente escolheu motorista" e "pagamento confirmado".

### Decisao 3

Backend como fonte unica de calculo.

Motivo: evita preco inconsistente, fraude, diferenca entre app e admin, e facilita configuracao por cidade.

### Decisao 4

Criar tela de revisao.

Motivo: entrega tem mais risco operacional que corrida. Um erro de endereco, pacote ou recebedor gera suporte.

### Decisao 5

Motorista deve ficar reservado, mas nao em rota obrigatoria, enquanto cliente confirma pagamento.

Motivo: justo para o motorista e evita deslocamento antes de contrato fechado.

## 11. Telas Novas Recomendadas

Obrigatorias:

- `DeliveryReviewScreen`
- `DeliveryPaymentConfirmScreen`
- `DriverAwaitingClientPaymentScreen` ou estado equivalente dentro da tela atual do motorista

Fortemente recomendadas:

- `DeliveryRecipientDetailsScreen`
- `DeliveryProofDetailsScreen`
- `DeliveryReceiptScreen`

Futuras:

- `DeliveryScheduleScreen`
- `DeliveryInsuranceScreen`
- `DeliveryMultiStopScreen`

## 12. Checklist De Aceite

O fluxo sera considerado correto quando:

- O app nao criar entrega sem cotacao backend valida.
- O cliente conseguir publicar oferta sem escolher pagamento.
- Motorista conseguir aceitar/contrapropor.
- Cliente conseguir selecionar proposta.
- Backend entrar em `payment_pending`.
- Motorista ver que esta aguardando confirmacao.
- Cliente escolher metodo de pagamento.
- Backend confirmar pagamento/metodo.
- Backend mudar para `driver_assigned`.
- Motorista receber liberacao.
- Tracking funcionar.
- Comprovante de coleta/entrega ser exigido para delivery.
- Admin web conseguir ver todo o ciclo.


## 13. Contratos De API Recomendados

### 13.1 Cotacao De Entrega

Endpoint recomendado:

```text
POST /delivery/quotes
```

Alternativa de menor refatoracao:

```text
POST /rides/calculate-price
```

Payload minimo:

```json
{
  "serviceType": "delivery",
  "pickup": {
    "latitude": -11.6661242,
    "longitude": -61.1833359,
    "cityId": "697d799b160cb43bc5e0cf09"
  },
  "dropoff": {
    "latitude": -11.67,
    "longitude": -61.19
  },
  "vehicleType": "moto",
  "deliveryType": "delivery",
  "cargoSize": "small",
  "approximateWeightKg": 20,
  "needsHelper": false,
  "isFragile": false,
  "priority": "economy"
}
```

Resposta esperada:

```json
{
  "quoteId": "quote_123",
  "expiresAt": "2026-05-18T23:59:00.000Z",
  "pricingVersion": "pb-2026-05-18",
  "currency": "BRL",
  "distance": {
    "meters": 9200,
    "durationSeconds": 900
  },
  "suggestion": {
    "minimumOffer": 15,
    "recommendedOffer": 20,
    "fastOffer": 27,
    "allowedMin": 15,
    "allowedMax": 60,
    "step": 1
  },
  "breakdown": {
    "basePrice": 8,
    "distancePrice": 7,
    "vehicleMultiplier": 1,
    "priorityMultiplier": 1,
    "helperFee": 0,
    "platformFee": 2.5,
    "driverEstimatedValue": 17.5
  },
  "availableOptions": {
    "vehicles": [],
    "deliveryTypes": [],
    "priorities": []
  },
  "warnings": []
}
```

Regras:

- O app deve salvar `quoteId`.
- O app deve exibir apenas valores vindos da resposta.
- O backend deve expirar cotacao antiga.
- Ao criar entrega, backend recalcula ou valida a cotacao.

### 13.2 Criacao Da Entrega

Endpoint atual pode continuar:

```text
POST /rides
```

Payload recomendado:

```json
{
  "serviceType": "delivery",
  "quoteId": "quote_123",
  "vehicleType": "moto",
  "pickup": {},
  "dropoff": {},
  "details": {
    "itemType": "delivery",
    "cargoSize": "small",
    "approximateWeightKg": 20,
    "isFragile": false,
    "needsHelper": false,
    "description": "Caixa pequena lacrada",
    "priority": "economy",
    "recipient": {
      "name": "Maria",
      "phone": "+5569999999999",
      "instructions": "Entregar na recepcao"
    }
  },
  "negotiation": {
    "clientOffer": 20
  }
}
```

Nao enviar aqui:

- `payment.method`
- `payment.status`
- `driverId`
- valores finais calculados pelo app

### 13.3 Selecionar Motorista

Endpoint:

```text
POST /rides/:rideId/offers/select
```

Resposta nova:

```json
{
  "success": true,
  "ride": {
    "id": "ride_123",
    "status": "payment_pending",
    "negotiation": {
      "selectedDriverId": "driver_123",
      "finalAgreedPrice": 22
    },
    "payment": {
      "method": null,
      "status": "not_selected"
    },
    "paymentDeadlineAt": "2026-05-19T00:04:00.000Z"
  }
}
```

### 13.4 Confirmar Pagamento

Endpoint:

```text
POST /rides/:rideId/payment/confirm
```

Resposta de sucesso:

```json
{
  "success": true,
  "ride": {
    "status": "driver_assigned",
    "payment": {
      "method": "pix",
      "status": "authorized",
      "confirmedAt": "2026-05-18T23:59:30.000Z"
    }
  }
}
```

## 14. Eventos Realtime Recomendados

Eventos para cliente:

- `delivery-quote-updated`
- `delivery-offer-received`
- `delivery-offer-expired`
- `delivery-payment-required`
- `delivery-payment-confirmed`
- `delivery-driver-released`
- `delivery-proof-uploaded`

Eventos para motorista:

- `new-delivery-request`
- `delivery-offer-selected-awaiting-payment`
- `delivery-payment-confirmed-start`
- `delivery-selection-expired`
- `delivery-cancelled`
- `delivery-reassigned`

Regra importante:

- O motorista nao deve receber evento de "iniciar entrega" antes de `delivery-payment-confirmed-start`.

## 15. Pricing: Formula De Backend

O calculo pode seguir esta composicao:

```text
preco_base
+ km_excedente * preco_por_km
+ tempo_estimado * preco_por_minuto_opcional
+ taxa_tipo_entrega
+ taxa_tamanho_carga
+ taxa_peso
+ taxa_ajudante
+ taxa_fragil
+ taxa_seguro
* multiplicador_prioridade
* multiplicador_demanda_opcional
```

Depois:

```text
minimumOffer = max(preco_minimo_cidade_veiculo, calculo * fator_minimo)
recommendedOffer = calculo
fastOffer = calculo * fator_rapido
allowedMax = recommendedOffer * fator_maximo ou teto_configurado
platformFee = regra_admin
driverEstimatedValue = finalAgreedPrice - platformFee
```

Tudo configuravel por:

- cidade;
- veiculo;
- tipo de entrega;
- prioridade;
- horario/demanda, em fase futura;
- categoria do motorista, em fase futura.

## 16. Impacto Por Arquivo

### App Cliente

- `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx`
  - remover pagamento;
  - remover fallback de preco local;
  - integrar tamanho, ajudante, fragilidade, recebedor;
  - usar `quoteId`.
- `src/components/client/delivery-setup/DeliveryOfferCard.tsx`
  - exibir faixa do backend;
  - travar oferta fora de `allowedMin/allowedMax`.
- `src/components/client/delivery-setup/PaymentMethodSelector.tsx`
  - mover para nova tela de pagamento.
- `src/screens/(authenticated)/Client/Orders/RideOffersMarketplaceScreen.tsx`
  - apos aceitar proposta, navegar para pagamento, nao para tracking direto.
- `src/screens/(authenticated)/Client/Ride/SearchingDriver/index.tsx`
  - tratar `payment_pending` como estado intermediario, nao como motorista ativo.

### Backend

- `backend/src/models/Ride.js`
  - adicionar status e campos de pagamento/entrega.
- `backend/src/controllers/ride.controller.js`
  - alterar `create`, `selectOffer`, `submitOfferResponse`, `buildRideRequestPayload`.
- `backend/src/services/pricing-engine.js`
  - considerar tipo, peso, tamanho, ajudante, fragilidade, prioridade e config.
- `backend/src/routes/ride.routes.js`
  - adicionar rota de pagamento pos-negociacao.
- `backend/src/routes/payments.routes.js`
  - reaproveitar processamento, mas vincular ao ciclo da ride.

### App Motorista

Mapear telas atuais do motorista e aplicar:

- card de pedido com dados de pacote;
- acao de contraproposta clara;
- estado reservado/aguardando pagamento;
- bloqueio de iniciar rota antes da confirmacao;
- comprovantes obrigatorios.

### Admin Web

- `leva-mais-web/services/ridesService.ts`
  - incluir campos de negotiation/payment/delivery.
- `leva-mais-web/services/pricingService.ts`
  - expor configuracoes de delivery.
- `leva-mais-web/app/rides/page.tsx`
  - listar status completo, pagamento, proposta final, motorista selecionado.
- tela de detalhe da entrega
  - mostrar timeline, propostas, pagamento, provas e suporte.

## 17. Ordem Recomendada De Execucao

1. Backend: status `payment_pending`, pagamento `not_selected`, `selectOffer` sem ativar corrida.
2. Backend: cotacao com `quoteId` e calculo completo.
3. Cliente: remover pagamento inicial e fallback local.
4. Cliente: criar revisao antes de publicar.
5. Cliente: criar pagamento apos selecionar proposta.
6. Motorista: mostrar aguardando pagamento.
7. Admin: dar visibilidade do ciclo.
8. Provas/PIN/recebedor: endurecer seguranca operacional.

## 18. Riscos E Cuidados

- Se o motorista for reservado por muito tempo, ele perde oportunidade. Usar timer curto, exemplo 3 a 5 minutos.
- Se dinheiro for permitido, deve haver confirmacao explicita para evitar o app mostrar "pago" sem pagamento real.
- Se Pix/cartao falhar, nao liberar motorista.
- Se cliente abandonar pagamento, liberar motorista e manter historico da proposta.
- Se o pacote for pesado ou proibido, motorista deve poder cancelar sem penalidade.
- Se recebedor nao estiver no local, app precisa ter fluxo de contato, espera, devolucao ou suporte.
- Se admin nao enxergar `payment_pending`, suporte vai ficar cego em casos de travamento.


## 19. Leitura Do Branch Atual Contra origin/main

Comparativo executado em 2026-05-18:

```text
git diff --name-status origin/main...HEAD
```

Resumo do que o branch `feature-add-new-features` mexeu:

- Backend: alteracoes em autenticacao, configuracao, motoristas, pricing, ride controller, middleware, modelos de usuario/plataforma/pricing e pricing engine.
- App cliente: alteracoes fortes em home, busca de destino, setup de entrega, setup de corrida, busca de motorista, tracking, cancelamento, conclusao e componentes de oferta/preco.
- App motorista: alteracoes em home, documentos, veiculo e onboarding.
- Rotas: alteracoes em `ClientBoot`, stack do cliente e drawer do cliente.
- Web admin: novas paginas de dashboard, ganhos, rides e usuarios; alteracoes em configuracoes, pricing, verificacao de motoristas e sidebar.
- Servicos web/mobile: alteracoes em `ride.service`, `config.service`, `driver.service`, `user.service`, `pricingService`, `ridesService` e configuracoes da plataforma.
- Pagamento antigo do cliente: `src/screens/(authenticated)/Client/Ride/Request/Payment/index.tsx` foi removido no branch.

Conclusao tecnica:

- O branch ja esta caminhando para separar melhor corrida, entrega, pricing e admin web.
- A remocao da tela antiga de pagamento combina com a decisao de pedir pagamento depois da negociacao, mas ainda falta criar a nova tela pos-acordo.
- Como `ride.controller.js`, `pricing-engine.js`, `PricingConfig.js`, `DeliverySetup` e `ride.service.ts` ja foram alterados, a proxima implementacao deve ser feita com cuidado para nao criar dois modelos de pricing concorrentes.
- A maior lacuna hoje nao e tela visual; e maquina de estados: falta `payment_pending` entre proposta aceita e motorista liberado.

## 20. Regra Financeira Do Motorista: Saldo, Taxa E Repasse

Esta secao substitui a leitura antiga de que a plataforma simplesmente desconta uma taxa do valor da entrega no momento do pagamento. A regra de produto desejada e diferente:

- O cliente negocia e paga o valor final da entrega conforme metodo escolhido.
- O motorista precisa ter saldo/credito operacional para ficar online e aceitar pedidos.
- A taxa da plataforma e debitada do saldo do motorista, usando o percentual configurado no admin web.
- O percentual atual encontrado no admin/backend e `appFeePercentage`, com default de 15% em `PlatformConfig`.
- O app nao deve mostrar textos fixos de 20%, porque isso conflita com a configuracao real.

### 20.1 Conceito Recomendado De Carteira Do Motorista

Usar uma carteira unica para o motorista, mas com ledger contabil claro.

Sub-saldos recomendados:

```js
driverWallet: {
  availableBalance: Number,      // saldo livre para saque ou uso
  operationalCredit: Number,     // credito usado para pagar taxas da plataforma
  pendingReceivables: Number,    // valores pagos no app ainda aguardando liquidacao
  blockedReserve: Number,        // reserva temporaria para garantir taxa de pedido aceito
  totalDeposits: Number,
  totalAppFeesPaid: Number,
  totalWithdrawn: Number,
  transactions: []
}
```

Se preferir manter o campo atual `driverBalance.balance`, ele precisa representar saldo unificado. Nesse caso, cada transacao deve deixar claro se foi:

- recarga comprada pelo motorista;
- pagamento de cliente dentro do app;
- taxa da plataforma;
- saque;
- estorno;
- ajuste administrativo.

Hoje o backend tem `driverBalance.balance`, `totalDeposits`, `totalDeductions` e transacoes `deposit`, `deduction`, `withdrawal`. Isso e uma boa base, mas ainda mistura deposito, ganho e saldo operacional sem classificacao suficiente.

### 20.2 Como A Taxa Deve Ser Cobrada

Formula da taxa:

```text
appFeeAmount = finalAgreedPrice * appFeePercentage / 100
```

Exemplo com app fee de 15%:

```text
Entrega negociada: R$ 40,00
Taxa app: R$ 6,00
Motorista precisa ter pelo menos R$ 6,00 de saldo operacional disponivel
```

Regra importante:

- A taxa nao deve depender do metodo de pagamento do cliente.
- A taxa sempre nasce da entrega concluida ou do evento financeiro definido pela plataforma.
- A cobranca e feita contra o saldo/carteira do motorista.
- Se o motorista recebeu do cliente por fora, em dinheiro ou maquininha propria, ainda assim a taxa sai do saldo do motorista.

### 20.3 Metodo De Pagamento Do Cliente E Consequencia Para O Motorista

#### Carteira Do Cliente No App

Fluxo:

1. Cliente escolhe pagar com carteira.
2. Backend debita a carteira do cliente.
3. Backend credita o valor bruto ou liquido na carteira do motorista, conforme regra contabil escolhida.
4. Backend debita a taxa da plataforma do saldo do motorista.
5. Motorista pode usar o saldo recebido para pagar novas taxas ou solicitar saque.

Recomendacao contabil:

```text
+ R$ 40,00 driver_wallet_credit_client_wallet_payment
- R$  6,00 app_fee_debit
= R$ 34,00 liquido economico do motorista
```

Mas a tela deve mostrar claramente:

- valor da entrega: R$ 40,00;
- taxa Leva Mais: R$ 6,00;
- saldo liquido: R$ 34,00.

#### Cartao Dentro Do Aplicativo

Fluxo quando motorista nao usa maquininha propria:

1. Cliente paga no app por cartao.
2. Backend/gateway autoriza ou captura o pagamento.
3. Motorista recebe credito na carteira/saldo interno quando o pagamento for confirmado.
4. Backend debita a taxa da plataforma do saldo do motorista.
5. Driver pode sacar depois, respeitando regras de liquidacao e antifraude.

Ponto tecnico:

- O backend atual `payment.controller.process` e MVP interno; ele autoriza cartao sem gateway real.
- Para producao, precisa gateway real, webhook, conciliacao e status `authorized`, `captured`, `settled`, `failed`, `refunded`.

#### Cartao Na Maquininha Do Motorista

Fluxo:

1. Cliente seleciona `cartao com motorista` ou `maquininha do motorista`.
2. Motorista recebe diretamente na propria maquininha.
3. App registra metodo externo, sem capturar valor no gateway.
4. Backend debita a taxa da plataforma do saldo do motorista.
5. Se motorista nao tiver saldo suficiente para cobrir a taxa, ele nao deveria aceitar o pedido ou deve haver reserva antes.

Recomendacao de UX:

- No cliente: separar `Cartao no app` de `Cartao com o entregador`.
- No motorista: cadastro em configuracoes: `Aceito maquininha propria`.
- No backend: campo `driverAcceptsOwnCardMachine` ou `driverPaymentCapabilities.cardMachine`.

#### Dinheiro

Fluxo:

1. Cliente escolhe dinheiro.
2. Motorista recebe diretamente em especie.
3. App registra `payment.method = cash` e `payment.collection = external_driver`.
4. Backend debita a taxa da plataforma do saldo do motorista.
5. Se nao houver saldo suficiente, motorista nao fica online ou nao aceita a entrega.

#### Pix

Decisao de produto necessaria:

- Pix no app: cliente paga para plataforma, motorista recebe na carteira interna.
- Pix direto para motorista: cliente paga chave Pix do motorista; app debita taxa do saldo do motorista.

Recomendacao:

- Para MVP, usar Pix no app ou dinheiro. Pix direto aumenta risco de disputa sem comprovacao.
- Se Pix direto for permitido, exigir comprovante/foto e confirmacao manual do motorista/cliente.

### 20.4 Online, Aceite E Reserva De Taxa

Hoje ja existe no backend:

- `POST /drivers/go-online` bloqueia motorista com saldo `<= 0`.
- `POST /drivers/check-ride-availability` exige saldo suficiente com base em percentual.
- `POST /drivers/balance/deduct` debita percentual do valor.

O que precisa ajustar:

- Trocar textos e fallbacks de 20% pelo percentual configurado em `PlatformConfig.appFeePercentage`.
- Ao aceitar proposta, reservar a taxa estimada no saldo do motorista.
- Ao concluir entrega, transformar reserva em debito definitivo.
- Se entrega for cancelada sem culpa do motorista, liberar reserva.
- Se cliente pagar pelo app, creditar motorista e debitar taxa na mesma transacao contabil.

Estados recomendados da taxa:

```text
not_reserved
reserved_on_offer_accept
charged_on_completion
released_on_cancel
failed_insufficient_balance
```

Campos recomendados em `Ride`:

```js
platformFeeAccounting: {
  percentage: 15,
  amount: 6,
  chargedTo: "driver_wallet",
  reserveTransactionId: String,
  chargeTransactionId: String,
  status: "not_reserved" | "reserved" | "charged" | "released" | "failed"
}
```

### 20.5 Onde O Codigo Atual Esta Alinhado

Arquivos encontrados:

- `backend/src/models/PlatformConfig.js`: tem `appFeePercentage` default 15.
- `backend/src/controllers/config.controller.js`: expoe `deductionPercentage` baseado em `appFeePercentage`.
- `backend/src/controllers/driver.controller.js`: tem saldo, deposito, debito, check de aceite e bloqueio de online sem saldo.
- `src/services/driver.service.ts`: app motorista consulta saldo, deposita, calcula deducao e tenta ficar online.
- `src/components/DriverDepositModal.tsx`: modal de recarga do motorista.
- `src/screens/(authenticated)/Driver/DriverEarningsScreen.tsx`: mostra saldo, recarga, saque e extrato.
- `leva-mais-web/app/settings/general/page.tsx`: admin configura taxa da plataforma.

### 20.6 Onde O Codigo Atual Ainda Nao Esta Alinhado

- Textos do app ainda falam em 20% em alguns pontos, mas o admin usa 15% configuravel.
- `driver.controller.deductBalance` tem descricao fixa `Deducao de 20% da corrida`.
- `driver.service.canAcceptRide` tem fallback `rideValue * 0.2`.
- `DriverDepositModal` explica 20% fixo.
- Nao ha reserva de taxa ao aceitar entrega; ha apenas checagem/debito direto.
- Pagamento dentro do app ainda nao credita automaticamente o motorista no ciclo da ride.
- Pagamento externo por maquininha propria ainda nao esta modelado como capacidade do motorista.
- A carteira atual do motorista mistura credito operacional, ganhos e saques; funciona para MVP, mas fica fraca para auditoria e conciliacao.

## 21. Plano Financeiro Do Motorista Por Cenario

### Cenario A: Cliente Paga Em Dinheiro

```text
Cliente entrega R$ 40,00 ao motorista
Backend registra pagamento externo em dinheiro
Backend cobra R$ 6,00 do saldo do motorista
Motorista fica com dinheiro fisico e saldo interno reduzido pela taxa
```

Bloqueio:

- Motorista so pode aceitar se saldo disponivel >= taxa estimada.

### Cenario B: Cliente Paga No App Com Carteira

```text
Cliente paga R$ 40,00 com carteira
Backend debita cliente
Backend credita motorista
Backend cobra R$ 6,00 de taxa
Motorista ve R$ 34,00 liquido ou R$ 40,00 bruto com taxa separada
```

### Cenario C: Cliente Paga No App Com Cartao

```text
Gateway autoriza/captura R$ 40,00
Backend confirma pagamento
Backend credita motorista conforme regra de liquidacao
Backend cobra R$ 6,00 de taxa
Motorista pode sacar apos liberacao
```

### Cenario D: Cliente Paga No Cartao Da Maquininha Do Motorista

```text
Motorista recebe R$ 40,00 fora do app
Backend registra metodo externo
Backend cobra R$ 6,00 do saldo do motorista
```

Campo recomendado:

```js
payment: {
  method: "card",
  channel: "driver_pos" | "in_app_gateway" | "cash" | "client_wallet",
  status: "external_pending" | "authorized" | "completed"
}
```

## 22. Regras Do App Motorista

### 22.1 Home/Mapa Do Motorista

Antes de ficar online, o app deve checar:

- `driverStatus === approved`;
- pelo menos um veiculo aprovado e ativo;
- documentos pessoais aprovados;
- termos aceitos;
- saldo suficiente para taxa minima configurada;
- cidade/regiao atendida;
- preferencia de trabalho configurada.

Se faltar saldo:

- mostrar card bloqueante: `Adicione saldo para trabalhar`;
- CTA: `Adicionar saldo`;
- explicar que a taxa da plataforma sera descontada do saldo, nao cobrada do cliente.

### 22.2 Lista De Pedidos

Cada pedido deve mostrar ao motorista:

- valor que cliente ofereceu;
- valor de contraproposta, se houver;
- taxa estimada da plataforma;
- saldo necessario para aceitar;
- saldo atual;
- metodo de pagamento do cliente, se ja escolhido ou quando ficar disponivel;
- tipo de recebimento: `recebe no app`, `recebe em dinheiro`, `recebe na maquininha`.

Exemplo de card:

```text
Entrega: R$ 40,00
Taxa Leva Mais: R$ 6,00 (15%)
Voce precisa ter R$ 6,00 de saldo para aceitar
Pagamento do cliente: dinheiro direto com voce
```

### 22.3 Ao Aceitar Uma Proposta

Fluxo recomendado:

```text
Driver aceita ou envia contraproposta
Backend verifica saldo >= taxa estimada
Backend reserva taxa
Cliente escolhe proposta
Ride vai para payment_pending
Motorista fica aguardando cliente confirmar pagamento/metodo
```

### 22.4 Aguardando Pagamento Do Cliente

Tela/estado necessario:

- titulo: `Cliente escolheu voce`;
- subtitulo: `Aguardando confirmacao do pagamento`;
- valor acordado;
- metodo de pagamento escolhido quando houver;
- timer de reserva;
- botao secundario: `Cancelar reserva` com regras de penalidade;
- nao mostrar botao de iniciar deslocamento ainda.

### 22.5 Entrega Ativa

Quando backend confirmar pagamento/metodo:

```text
payment_pending -> driver_assigned
```

Motorista passa a ver:

- rota ate coleta;
- contato do cliente/remetente;
- dados do pacote;
- comprovante de coleta;
- rota ate entrega;
- contato do recebedor;
- comprovante/PIN de entrega;
- finalizacao.

## 23. Documentos E Validacao De Cadastro

### 23.1 Cliente: Estado Atual

Hoje existe:

- cadastro/login;
- aceite de termos;
- CPF/CNPJ no perfil/onboarding;
- validacao matematica de CPF/CNPJ no backend;
- tentativa de validacao externa de CPF/CNPJ;
- selfie por upload de foto de perfil;
- painel web com lista de clientes e ativacao/bloqueio.

Arquivos relevantes:

- `src/components/client/home/ClientOnboardingDashboard.tsx`
- `backend/src/controllers/auth.controller.js`
- `backend/src/models/User.js`
- `leva-mais-web/app/verification/drivers/page.tsx`
- `leva-mais-web/app/clients/page.tsx`

Lacunas:

- Nao existe um subdocumento `clientDocuments` com status de verificacao.
- A selfie do cliente vira `profilePhoto`, nao documento auditavel com status.
- Admin web consegue ver cliente e ativar/bloquear, mas nao ha fluxo forte de aprovar/reprovar documento do cliente.
- Nao ha captura de RG/CNH do cliente, caso a plataforma queira KYC mais forte.

Recomendacao:

```js
clientVerification: {
  status: "none" | "pending" | "approved" | "rejected",
  cpfStatus: "unchecked" | "valid" | "invalid" | "manual_review",
  selfieStatus: "none" | "pending" | "approved" | "rejected",
  documents: {
    selfie: String,
    rgFront: String,
    rgBack: String
  },
  rejectionReason: String,
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId
}
```

Para MVP, exigir do cliente:

- telefone validado;
- CPF/CNPJ validado;
- termos aceitos;
- selfie opcional ou obrigatoria antes de pedidos de maior risco.

### 23.2 Motorista: Estado Atual

Hoje existe:

- `driverStatus`: `none`, `pending`, `approved`, `rejected`.
- `driverDocuments`: CNH frente, CNH verso, CRLV frente, CRLV verso, foto veiculo, selfie.
- Endpoint real `POST /auth/driver-verification` com multipart upload.
- Admin web em `leva-mais-web/app/verification/drivers/page.tsx` para aprovar/reprovar.
- Frota em `vehicles[]`, com status por veiculo.
- Consulta externa de placa em `driver.controller.js`, com bypass quando `isDevelopmentMode` esta ativo.

Lacunas:

- Tela `DriverDocumentsScreen` hoje mostra principalmente CNH frente, CNH verso e selfie; CRLV/foto de veiculo ficam mais no fluxo de veiculo.
- `DriverVehicleScreen` anexa CRLV/foto do veiculo como URI local e envia dentro do JSON de `addVehicle`; isso pode nao ser acessivel no admin web depois.
- Admin aprova todos os veiculos pendentes automaticamente ao aprovar motorista; idealmente deve aprovar documento pessoal e veiculo separadamente.
- Nao ha campo claro `reviewedBy`, `reviewedAt`, `documentQuality`, `expiryDate` para CNH/CRLV.
- A API de placa pode cair em fallback e marcar `valid: true`; para producao precisa separar `verifiedByAPI` de `acceptedByAdmin`.

Recomendacao para motorista:

```js
driverVerification: {
  personalStatus: "pending" | "approved" | "rejected",
  vehicleStatus: "pending" | "approved" | "rejected",
  backgroundStatus: "not_started" | "clear" | "manual_review",
  documents: {
    cnhFront: { url, status, rejectionReason, expiresAt },
    cnhBack: { url, status, rejectionReason },
    selfie: { url, status, rejectionReason },
    crlvFront: { url, status, rejectionReason, expiresAt },
    crlvBack: { url, status, rejectionReason },
    vehiclePhoto: { url, status, rejectionReason }
  },
  reviewedBy: ObjectId,
  reviewedAt: Date
}
```

### 23.3 Admin Web Para Documentos

O admin precisa conseguir:

- abrir imagem em tela cheia;
- aprovar/reprovar documento individual;
- aprovar/reprovar conta;
- aprovar/reprovar veiculo individual;
- informar motivo padrao e motivo customizado;
- ver se CPF/CNPJ/placa foi validado por API ou apenas por fallback;
- ver historico de revisoes;
- bloquear motorista mesmo aprovado, se documento vencer.

## 24. Termos De Uso E Politica De Privacidade

Estado atual:

- Existe `TermsScreen` para termos e privacidade.
- Existe gatekeeper em rotas para exigir aceite.
- Backend registra versoes, aceite de termos e aceite de privacidade.
- Admin web configura versoes de politicas.

Lacunas:

- O texto atual e curto para uma operacao com transporte, delivery, negociacao, pagamentos, saldo de motorista e documentos.
- O texto do motorista ainda diz que taxas sao retidas no momento da transacao; precisa refletir a regra nova de saldo/credito operacional.
- Nao detalha suficientemente: negociacao, pagamento externo, maquininha propria, dinheiro, responsabilidade pelo pacote, itens proibidos, comprovantes, PIN, cancelamento, saldo minimo, saque e bloqueios.

Secoes que precisam entrar nos termos:

- natureza de intermediacao da plataforma;
- motorista autonomo, sem vinculo;
- negociacao de preco e aceite de propostas;
- taxa da plataforma debitada do saldo do motorista;
- obrigatoriedade de saldo para ficar online;
- pagamentos dentro e fora do app;
- responsabilidade por dinheiro/maquininha propria;
- regras de entrega de pacotes;
- itens proibidos;
- comprovantes, fotos e PIN;
- tratamento de documentos e validacao cadastral;
- LGPD, retencao e exclusao;
- suspensao por fraude, chargeback ou documento irregular;
- regras de cancelamento e disputa.

## 25. Menus E Configuracoes Do App

### 25.1 Menu Cliente Atual

Hoje o cliente tem:

- Inicio;
- Historico;
- Pedidos ativos;
- Plantoes motoboy;
- Comprovantes;
- Carteira;
- Pagamentos;
- Cupons;
- Perfil;
- Notificacoes;
- Favoritos;
- Seguranca;
- Suporte;
- Privacidade;
- Convidar amigos;
- Configuracoes.

Recomendacoes:

- Em `Pagamentos`, separar: cartoes salvos, carteira, Pix, dinheiro e preferencias.
- Em `Carteira`, mostrar saldo, recargas, pagamentos de pedidos e reembolsos.
- Em `Pedidos ativos`, mostrar claramente `aguardando propostas`, `aguardando pagamento`, `motorista a caminho`, `em entrega`.
- Em `Privacidade`, permitir rever termos e versoes aceitas.
- Em `Seguranca`, incluir PIN de entrega e contatos de emergencia.

### 25.2 Menu Motorista Atual

Hoje o motorista tem:

- Mapa;
- Solicitacoes;
- Ganhos e carteira;
- Plantoes;
- Avaliacoes;
- Historico;
- Veiculo;
- Documentos;
- Preferencias;
- Perfil;
- Seguranca;
- Suporte;
- Ajuda rapida;
- Configuracoes.

Recomendacoes:

- `Ganhos e carteira`: renomear internamente para `Saldo, ganhos e taxas`, deixando explicito o saldo operacional.
- Adicionar card: `Taxa por entrega: 15% configuravel pelo app`.
- Mostrar `saldo minimo para aceitar proxima entrega`.
- Mostrar extrato com tipos: recarga, pagamento recebido, taxa Leva Mais, saque, estorno.
- Em `Preferencias`, adicionar `aceito dinheiro`, `aceito maquininha propria`, `aceito Pix direto`, `aceito pagamento somente no app`.
- Em `Documentos`, mostrar vencimento da CNH/CRLV e status por documento.
- Em `Configuracoes`, incluir notificacoes, raio, bateria/GPS, privacidade, dados bancarios/Pix.

## 26. Admin Web: O Que Precisa Acompanhar

### 26.1 Financeiro Do Motorista

Adicionar no admin:

- saldo operacional atual;
- ganhos disponiveis;
- valores pendentes de liquidacao;
- total de taxas cobradas;
- total depositado pelo motorista;
- total sacado;
- extrato por motorista;
- ajustes manuais com motivo e auditoria;
- filtro de saldo zerado;
- bloqueio/desbloqueio financeiro.

### 26.2 Configuracao Financeira

A tela de configuracao global ja tem `Taxa da Plataforma (App Fee %)`. Precisa deixar claro:

- essa taxa e debitada da carteira/saldo do motorista;
- nao e uma taxa extra cobrada do cliente por fora;
- aplica para corrida e delivery, ou permitir configurar por servico;
- valor minimo de saldo para online;
- se a taxa e reservada no aceite ou cobrada na conclusao;
- regras de estorno da taxa.

### 26.3 Documentos

A tela de verificacao atual e um bom inicio. Precisa evoluir para:

- abas: clientes, motoristas, veiculos;
- aprovacao individual por documento;
- preview confiavel de arquivos persistidos no backend;
- motivo por documento;
- historico de revisao;
- documentos vencidos;
- APIs externas com status: validado, fallback, erro, divergente.

## 27. Plano De Implementacao Adicional

### Fase 6: Financeiro Do Motorista

1. Trocar textos fixos de 20% por `appFeePercentage` vindo do backend.
2. Alterar `driver.controller.deductBalance` para usar percentual do `PlatformConfig` quando o request nao mandar percentual.
3. Criar ledger com tipos mais claros: `driver_topup`, `client_in_app_payment`, `app_fee_debit`, `withdrawal`, `refund`, `manual_adjustment`, `fee_reserve`, `fee_release`.
4. Criar reserva de taxa no aceite da proposta.
5. Cobrar taxa ao concluir entrega.
6. Creditar motorista quando pagamento for carteira/cartao/Pix no app.
7. Registrar pagamento externo quando for dinheiro ou maquininha propria.
8. Atualizar `DriverDepositModal`, `DriverEarningsScreen`, extrato e cards de oferta.
9. Atualizar admin web para visualizar saldo, taxa e ledger.

### Fase 7: Capacidades De Pagamento Do Motorista

1. Adicionar no perfil do motorista:
   - aceita dinheiro;
   - aceita maquininha propria;
   - aceita Pix direto;
   - aceita somente pagamento no app.
2. Usar essas preferencias para filtrar ou informar pedidos.
3. No cliente, mostrar metodos disponiveis conforme cidade, motorista e regra da plataforma.
4. Separar `Cartao no app` de `Cartao com motorista`.

### Fase 8: Documentos E Auditoria

1. Criar `clientVerification` no modelo de usuario.
2. Criar upload auditavel para selfie/documentos do cliente, se a regra de negocio exigir.
3. Corrigir veiculos para upload real multipart dos documentos, nao URI local.
4. Separar aprovacao de motorista pessoal e aprovacao de veiculo.
5. Adicionar `reviewedBy`, `reviewedAt`, `rejectionReason` por documento.
6. Exibir documentos individuais no admin web com approve/reject.
7. Adicionar alertas de vencimento CNH/CRLV.

### Fase 9: Termos E Compliance

1. Expandir termos para cobrir saldo operacional do motorista.
2. Expandir termos de delivery com itens proibidos e responsabilidade pelo pacote.
3. Incluir politicas de pagamentos externos.
4. Incluir regras de saque, estorno e chargeback.
5. Versionar aceite por perfil: cliente e motorista.
6. Admin deve editar versoes e talvez apontar para documentos legais completos.

## 28. Checklist De Aceite Adicional

O modulo financeiro/documental sera considerado alinhado quando:

- Motorista nao consegue ficar online com saldo zerado.
- Motorista nao consegue aceitar entrega sem saldo suficiente para taxa estimada.
- Taxa usada no app e no backend vem de `appFeePercentage`, nao de texto fixo.
- Pagamento em dinheiro debita taxa do saldo do motorista.
- Pagamento por maquininha propria debita taxa do saldo do motorista.
- Pagamento por carteira/cartao/Pix no app credita motorista e debita taxa no ledger.
- Extrato do motorista mostra taxa, recarga, recebimento, saque e estorno separadamente.
- Admin web enxerga saldos e lancamentos do motorista.
- Documentos pessoais do motorista sao visualizaveis no admin.
- Documentos do veiculo sao arquivos persistidos e visualizaveis no admin.
- Cliente tem fluxo claro de verificacao cadastral e, se necessario, documental.
- Termos de uso explicam saldo, taxa, pagamentos externos, entrega e negociacao.

## 29. Fluxo Operacional Da Entrega: Coleta, Rota E Entrega

Esta camada e necessaria. Nao e apenas detalhe visual: e o que permite o cliente confiar na entrega, o motorista operar com clareza e o admin auditar problemas.

Referencias de mercado confirmam esse padrao:

- Uber Courier/Connect usa aceite, ida ate remetente, coleta, entrega no destino e, em alguns casos, PIN de entrega.
- Uber Courier tambem define fluxo para destinatario ausente, retorno do pacote e cancelamento por item proibido.
- DoorDash usa estados como entregador confirmado, chegada ao ponto de coleta, pedido coletado, chegada ao consumidor, entrega finalizada, cancelamento, tentativa de entrega e retorno.
- DoorDash tambem envia eventos de tracking periodico em integracoes, com localizacao do entregador durante ida para coleta e ida para entrega.

Fontes adicionais:

- [Uber Courier FAQ](https://help.uber.com/driving-and-delivering/article/uber-courier-faq?nodeId=8e4952cb-c44e-4957-a39d-08b5dd7db13f)
- [Uber Courier Delivery FAQ](https://help.uber.com/en/driving-and-delivering/article/courier-delivery-faq?nodeId=a93eeb73-04e8-4036-89a7-b915f642b3a1)
- [DoorDash Order Tracking](https://help.doordash.com/en-us/consumers/article/customer-where-is-my-order?ctry=US)
- [DoorDash Delivery Webhooks](https://developer.doordash.com/en-US/docs/drive_classic/reference/webhooks/)
- [DoorDash Shop & Deliver](https://help.doordash.com/en-au/dashers/article/what-is-doordash-shop-deliver)
- [Uber Cancellation Fees](https://help.uber.com/prs-AF/driving-and-delivering/article/how-rider-cancellation-fees-are-charged?nodeId=2f3aaf1e-2afc-4e25-b42d-067b24453412)

### 29.1 Status Operacionais Recomendados

O backend ja tem estes status:

```text
requesting
payment_pending     // recomendado em secoes anteriores
payment_confirmed   // opcional
accepted
driver_arriving
arrived
in_progress
completed
cancelled_by_client
cancelled_by_driver
cancelled_no_driver
```

Para delivery, os nomes atuais funcionam, mas podem ser semanticamente mais claros se o app mapear assim:

```text
driver_arriving = motorista a caminho da coleta
arrived = motorista chegou na coleta
in_progress = pacote coletado e entrega em andamento
completed = pacote entregue
```

Opcionalmente, o backend pode evoluir para status mais explicitos:

```text
enroute_to_pickup
arrived_at_pickup
picked_up
enroute_to_dropoff
arrived_at_dropoff
delivered
```

Decisao recomendada:

- Para evitar refatoracao grande agora, manter os status atuais no banco.
- Criar labels especificos por `serviceType = delivery` no app e admin.
- Adicionar campos de evento para diferenciar coleta e entrega sem trocar toda a maquina de estados.

### 29.2 Fluxo Ideal Do Motorista

Depois que proposta foi aceita e pagamento/metodo confirmado:

```text
1. Pedido liberado para o motorista
2. Motorista toca em "Estou a caminho da coleta"
3. App registra inicio do trecho ate coleta
4. Motorista chega no ponto A
5. Motorista toca em "Cheguei na coleta"
6. App registra hora, coordenada e possivel raio de validacao
7. Motorista coleta pacote
8. Motorista envia foto/PIN/confirmacao de coleta
9. Motorista toca em "Pacote coletado / iniciar entrega"
10. App registra inicio do trecho ate entrega
11. Motorista chega no ponto B
12. Motorista toca em "Cheguei no destino"
13. Motorista entrega pacote
14. Motorista envia foto/PIN/nome do recebedor
15. Motorista toca em "Finalizar entrega"
16. Backend encerra, cobra taxa, libera comprovante e abre avaliacao
```

### 29.3 Fluxo Ideal Do Cliente

Cliente deve enxergar:

```text
Motorista confirmado
Motorista a caminho da coleta
Motorista chegou na coleta
Pacote coletado
Motorista a caminho da entrega
Motorista chegou ao destino
Entrega concluida
Avalie o motorista
```

Durante o tracking:

- mapa com posicao do motorista;
- ETA ate coleta ou destino;
- status atual claro;
- botao de chat/ligacao;
- botao de cancelar quando permitido;
- aviso quando o motorista coletar o produto;
- comprovantes apos a conclusao.

### 29.4 Estado Atual Do Codigo

Ja existe no app/backend:

- `Ride.status` com `driver_arriving`, `arrived`, `in_progress`, `completed`.
- `statusHistory` no modelo `Ride`.
- `acceptedAt`, `arrivedAt`, `startedAt`, `completedAt`, `cancelledAt`.
- `DriverRideScreen` com botoes para chegar, iniciar e finalizar.
- `DriverRideScreen` envia foto de coleta antes de `in_progress` em delivery.
- `DriverRideScreen` envia foto de entrega antes de `completed` em delivery.
- `ride.controller.updateStatus` impede `in_progress` sem foto de coleta e `completed` sem foto de entrega.
- `RideTracking` do cliente acompanha status e localizacao do motorista.
- WebSocket `driver-location-updated` envia localizacao do motorista ao cliente.

Lacunas:

- Falta um status/tela especifica de `cheguei no destino` antes de finalizar entrega.
- Falta registrar coordenada e raio no momento de cada evento operacional.
- Falta trilha historica persistida da rota percorrida.
- Fotos estao como base64 no documento da ride; isso funciona no MVP, mas pode pesar o banco. Melhor migrar para upload de arquivo/storage.
- Nao existe endpoint dedicado para eventos operacionais de entrega; hoje tudo passa por `PATCH /rides/:rideId/status`.

## 30. Auditoria De Rota E Salvamento Da Trilha GPS

A regra desejada e correta: a plataforma deve salvar por onde o motorista passou com o produto, nao apenas a ultima posicao.

### 30.1 O Que Deve Ser Salvo

A partir do momento em que o motorista aceita a corrida/entrega, salvar eventos e pontos de rota.

Eventos principais:

```text
offer_accepted
payment_confirmed
driver_enroute_to_pickup
arrived_at_pickup
pickup_confirmed
driver_enroute_to_dropoff
arrived_at_dropoff
delivery_confirmed
completed
cancelled
```

Pontos GPS:

```js
{
  rideId: ObjectId,
  driverId: ObjectId,
  serviceType: "delivery",
  phase: "to_pickup" | "at_pickup" | "to_dropoff" | "at_dropoff" | "return" | "unknown",
  latitude: Number,
  longitude: Number,
  heading: Number,
  speed: Number,
  accuracy: Number,
  altitude: Number,
  batteryLevel: Number,
  source: "foreground" | "background" | "websocket" | "http",
  capturedAt: Date,
  receivedAt: Date
}
```

### 30.2 Modelo Recomendado

Criar uma collection separada, nao colocar todos os pontos dentro de `Ride`, para evitar documento gigante.

```js
RideTrackPoint {
  rideId,
  driverId,
  phase,
  location: { type: "Point", coordinates: [lng, lat] },
  heading,
  speed,
  accuracy,
  capturedAt,
  receivedAt
}
```

Indices:

```js
{ rideId: 1, capturedAt: 1 }
{ driverId: 1, capturedAt: -1 }
{ location: "2dsphere" }
```

No `Ride`, salvar resumo:

```js
routeAudit: {
  trackingStartedAt: Date,
  trackingEndedAt: Date,
  acceptedLocation: { latitude, longitude, capturedAt },
  pickupArrivalLocation: { latitude, longitude, capturedAt, distanceFromPickupMeters },
  pickupConfirmedLocation: { latitude, longitude, capturedAt },
  dropoffArrivalLocation: { latitude, longitude, capturedAt, distanceFromDropoffMeters },
  deliveryConfirmedLocation: { latitude, longitude, capturedAt },
  totalTrackedDistanceMeters: Number,
  toPickupDistanceMeters: Number,
  toDropoffDistanceMeters: Number,
  toPickupDurationSeconds: Number,
  toDropoffDurationSeconds: Number,
  pointsCount: Number,
  suspiciousFlags: [String]
}
```

### 30.3 Frequencia De Tracking

Sugestao para MVP:

- Em primeiro plano: a cada 4 segundos ou 10 metros.
- Em segundo plano: a cada 15 a 30 segundos, se permitido pelo sistema operacional.
- Quando parado: reduzir frequencia.
- Sempre registrar eventos importantes imediatamente.

DoorDash, em integracoes, cita eventos de tracking a cada 30 segundos durante trechos de entrega. Para o app proprio, podemos usar frequencia mais alta no app e compactar no backend.

### 30.4 Como Evitar Excesso De Dados

No backend:

- ignorar ponto se distancia do ultimo ponto < 10 metros e tempo < 10 segundos;
- ignorar ponto com accuracy ruim, exemplo > 100 metros, salvo se for evento critico;
- compactar rota apos conclusao usando simplificacao de polyline;
- manter pontos detalhados por periodo limitado, exemplo 90 a 180 dias;
- manter resumo e polyline simplificada por mais tempo.

### 30.5 Privacidade E LGPD

Salvar rota e dado sensivel. Precisa estar nos termos.

Regras:

- coletar rota apenas durante pedido ativo;
- deixar claro para motorista que tracking operacional ocorre durante entrega/corrida;
- restringir visualizacao no admin por permissao;
- auditar quem abriu a rota;
- reter por prazo definido;
- permitir exportacao nos dados de privacidade quando aplicavel.

## 31. Cancelamentos E Taxas

### 31.1 Estado Atual

Ja existe:

- `ride.cancel` para cliente ou motorista.
- `Ride.canBeCancelled()`.
- `Ride.calculateCancellationFee()` com 30% se status estiver em `accepted`, `driver_arriving` ou `arrived`.
- Tela cliente `ClientCancelRide`.
- Tela motorista `DriverCancelRide`.
- Tela `CancelFee` no cliente.
- WebSocket `ride-cancelled`.

Lacunas:

- Taxa de cancelamento esta fixa em 30%, nao configuravel pelo admin.
- Nao diferencia cancelamento antes da coleta, depois da coleta e depois de chegar no destino.
- Nao diferencia culpa do cliente, culpa do motorista, item proibido, destinatario ausente, endereco errado, risco de seguranca.
- Nao ha fluxo de retorno do pacote se o motorista ja coletou.
- Nao ha evidencia obrigatoria para motorista cancelar apos coleta.
- Nao ha tela clara de disputa/suporte quando cancelamento ocorre com produto em posse do motorista.

### 31.2 Cancelamento Pelo Cliente

Regras recomendadas:

```text
requesting/payment_pending: sem taxa ou taxa zero
accepted/driver_arriving: taxa baixa se motorista ja se deslocou
arrived_at_pickup: taxa maior por deslocamento + espera
picked_up/in_progress: cliente nao cancela sozinho; abre suporte/retorno
arrived_at_dropoff: cliente nao cancela sozinho; abre suporte
completed: nao cancela; abre disputa/reembolso
```

Tela cliente deve mostrar:

- motivo;
- status atual;
- taxa prevista;
- se ha motorista com produto;
- consequencia do cancelamento;
- botao `Falar com suporte` quando pacote ja foi coletado.

### 31.3 Cancelamento Pelo Motorista

Regras recomendadas:

```text
antes de aceitar: recusar sem penalidade
apos aceitar antes de sair: cancelamento permitido, pode afetar taxa de aceitacao
indo para coleta: permitido com motivo
chegou na coleta: permitido se cliente/remetente ausente, endereco errado, item proibido, seguranca
apos coletar: nao cancelar livremente; iniciar fluxo de suporte/devolucao
indo para entrega: cancelar apenas por suporte, seguranca ou impossibilidade real
no destino: se recebedor ausente, iniciar espera + contato + suporte/retorno
```

Tela motorista deve pedir:

- motivo;
- evidencia quando necessario;
- foto opcional/obrigatoria;
- observacao;
- confirmacao de que esta com o pacote ou nao;
- proxima acao: cancelar, devolver, chamar suporte.

### 31.4 Taxa De Cancelamento Configuravel

Admin deve configurar:

```js
cancellationRules: {
  clientBeforeDriverAccepted: 0,
  clientAfterDriverAccepted: 0.1,
  clientAfterDriverArriving: 0.15,
  clientAfterDriverArrived: 0.3,
  clientAfterPickup: "support_only",
  driverBeforePickupPenalty: "acceptance_rate",
  driverAfterPickup: "support_only",
  waitingTimePickupMinutes: 5,
  waitingTimeDropoffMinutes: 7,
  noShowFeeMode: "fixed" | "percentage",
  noShowFeeAmount: Number,
  noShowFeePercentage: Number
}
```

## 32. Telas De Prova, Sucesso E Avaliacao

### 32.1 Tela Cheguei Na Coleta

Necessaria.

Para motorista:

- endereco de coleta;
- contato do remetente/cliente;
- instrucoes;
- botao `Cheguei na coleta`;
- timer de espera;
- opcoes: chat, ligar, reportar problema.

Para cliente:

- aviso: `Motorista chegou na coleta`;
- instrucao: entregar pacote;
- botao chat/ligar.

### 32.2 Tela Coleta Confirmada

Necessaria para delivery.

Motorista deve informar:

- foto do pacote ou comprovante;
- opcional: nome de quem entregou;
- opcional: PIN de coleta;
- observacao de estado do item;
- confirmacao de que esta com o pacote.

Backend deve salvar:

```js
proofs.pickupPhoto
proofs.pickupAt
proofs.pickupLocation
proofs.pickupConfirmedBy
proofs.pickupNotes
```

### 32.3 Tela Cheguei No Destino

Recomendada.

Hoje o app pula de `in_progress` para `completed`. Para auditoria e UX, melhor adicionar evento intermediario:

```text
arrived_at_dropoff
```

Se nao quiser novo status no MVP, salvar evento em `deliveryEvents` e manter status `in_progress`.

### 32.4 Tela Entrega Confirmada

Necessaria.

Motorista deve informar:

- foto de entrega;
- PIN do recebedor, quando ativado;
- nome do recebedor;
- documento/assinatura opcional para entregas sensiveis;
- observacao;
- se foi entregue em maos ou deixado em local combinado.

Backend deve salvar:

```js
proofs.deliveryPhoto
proofs.deliveryAt
proofs.deliveryLocation
proofs.deliveryPinStatus
proofs.recipientName
proofs.deliveryNotes
```

### 32.5 Tela De Sucesso

Cliente:

- entrega concluida;
- valor final;
- forma de pagamento;
- comprovantes;
- tempo total;
- avaliacao do motorista;
- suporte/disputa.

Motorista:

- valor recebido;
- taxa Leva Mais debitada;
- saldo atualizado;
- tempo total;
- distancia rodada;
- avaliacao do cliente;
- proximo pedido.

### 32.6 Avaliacao Por Estrelas

Ja existe:

- cliente avalia motorista em `RateDriverScreen`.
- motorista avalia cliente em `DriverRateClientScreen`.
- backend tem `rateClientToDriver` e `rateDriverToClient`.

Melhorias recomendadas:

- apos `completed`, garantir navegacao obrigatoria ou pelo menos prompt persistente;
- tags diferentes para delivery: `cuidado com pacote`, `comunicacao`, `pontualidade`, `entrega correta`;
- motorista avaliar cliente/remetente: `respondeu rapido`, `local correto`, `pacote pronto`, `pagamento sem problema`;
- admin visualizar avaliacoes no detalhe da ride;
- calcular media do usuario em background;
- impedir avaliacao duplicada, ja existe no backend.

## 33. Admin Web: Visualizacao Da Rota Percorrida

O admin precisa conseguir abrir uma entrega e ver:

- mapa da rota planejada;
- rota real percorrida pelo motorista;
- ponto onde motorista aceitou;
- ponto onde marcou chegada na coleta;
- ponto onde confirmou coleta;
- ponto onde marcou chegada no destino;
- ponto onde confirmou entrega;
- horarios de cada evento;
- fotos/PIN/comprovantes;
- velocidade media e tempo parado;
- divergencia de rota;
- distancia do ponto real ate o endereco configurado.

Tela recomendada no drawer de detalhes da ride:

```text
Aba 1: Resumo
Aba 2: Financeiro
Aba 3: Propostas/Negociacao
Aba 4: Timeline
Aba 5: Mapa e rota
Aba 6: Provas
Aba 7: Cancelamentos/Disputas
```

No mapa:

- linha cinza: rota estimada Google;
- linha verde: rota real ate coleta;
- linha azul: rota real ate entrega;
- marcadores: aceite, coleta, entrega, cancelamento;
- alerta se confirmacao ocorreu longe demais do ponto A/B.

## 34. Implementacao Tecnica Recomendada Para Tracking

### 34.1 Backend

Criar:

```text
backend/src/models/RideTrackPoint.js
backend/src/models/RideOperationalEvent.js
```

Endpoints:

```text
POST /rides/:rideId/track-points
POST /rides/:rideId/events
GET /rides/:rideId/route-audit
```

Ou, mais simples no MVP:

- estender WebSocket `update-location` para persistir ponto quando `currentRideId` existir;
- salvar um ponto no maximo a cada X segundos/metros;
- criar endpoint admin para listar pontos.

### 34.2 App Motorista

Atual:

- `DriverRideScreen` usa `getCurrentPositionAsync` a cada 4 segundos e emite `update-location`.

Melhorar para:

- `Location.watchPositionAsync` com `timeInterval` e `distanceInterval`;
- enviar `rideId`, `phase`, `accuracy`, `capturedAt`;
- suportar background location se for requisito operacional;
- guardar fila local offline e reenviar quando internet voltar;
- parar tracking ao completar/cancelar.

Payload recomendado:

```json
{
  "rideId": "ride_123",
  "latitude": -11.66,
  "longitude": -61.18,
  "heading": 90,
  "speed": 8.4,
  "accuracy": 12,
  "phase": "to_dropoff",
  "capturedAt": "2026-05-19T10:30:00.000Z"
}
```

### 34.3 Cliente

Atual:

- `RideTracking` recebe `driver-location-updated` e mostra marcador.

Melhorar para:

- mostrar linha real recente do motorista;
- mostrar timeline textual;
- avisar quando motorista chegou/coletou/chegou no destino;
- depois de entregue, mostrar comprovantes e resumo.

### 34.4 Web Admin

Atual:

- `leva-mais-web/app/rides/page.tsx` lista rides, detalhes, comprovantes e timeline simples.

Melhorar para:

- consumir `/rides/:rideId/route-audit`;
- renderizar mapa com rota real;
- mostrar statusHistory completo;
- mostrar `routeAudit`;
- mostrar eventos e pontos suspeitos;
- exportar CSV/JSON da rota para suporte.

## 35. Checklist De Aceite Operacional

O fluxo operacional ficara correto quando:

- Motorista marcar `a caminho da coleta`.
- Cliente ver motorista a caminho da coleta.
- Motorista marcar `cheguei na coleta`.
- Backend salvar hora e coordenada da chegada.
- Motorista confirmar coleta com foto/PIN/observacao.
- Backend salvar hora, foto e coordenada da coleta.
- Cliente ver `pacote coletado`.
- Motorista navegar ate destino.
- App salvar pontos GPS durante todo o trajeto.
- Motorista marcar `cheguei no destino` ou evento equivalente.
- Motorista finalizar com foto/PIN/nome do recebedor.
- Backend salvar hora, foto e coordenada da entrega.
- Cliente receber tela de sucesso e avaliacao.
- Motorista receber tela de ganhos/taxa/saldo e avaliacao do cliente.
- Cancelamento antes da coleta aplicar regra configuravel.
- Cancelamento apos coleta exigir suporte/devolucao/evidencia.
- Admin conseguir abrir mapa da rota real percorrida.
- Admin conseguir ver timeline, fotos, cancelamento, avaliacao e divergencias.
