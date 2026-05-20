# PLANO DE FLUXO COMPLETO - ESTILO INDRIVE
## Leva Mais: Cliente e Entregador

**Data:** 2026-05-19  
**Versão:** 1.0  
**Objetivo:** Definir o fluxo correto de telas e lógica para clientes e entregadores, focando no modelo de negociação do inDriver

---

## 📋 SUMÁRIO EXECUTIVO

### Conceito Central

O Leva Mais implementa um modelo de **negociação de preço** inspirado no inDriver, onde:

1. **Cliente define o serviço** e faz uma oferta inicial
2. **Entregadores visualizam** e podem aceitar, recusar ou contrapropor
3. **Cliente escolhe** o melhor entregador entre as propostas
4. **Pagamento é confirmado** após a negociação
5. **Entrega é executada** com rastreamento e comprovação
6. **Avaliação mútua** fecha o ciclo

### Diferencial do inDriver

- **Preço negociável**: não é fixo, cliente e motorista negociam
- **Transparência**: ambos veem faixas sugeridas e podem decidir
- **Escolha do cliente**: mesmo com contrapropostas, cliente decide quem aceitar
- **Sem intermediação forçada**: plataforma sugere, mas não impõe preço

---

## 🎯 PRINCÍPIOS DO FLUXO

### 1. Transparência Financeira
- Todos os valores vêm do backend
- Faixas sugeridas são calculadas por algoritmo
- Cliente e motorista veem custos e ganhos claramente

### 2. Negociação Justa
- Cliente pode aumentar oferta se não houver interesse
- Motorista pode contrapropor se achar justo
- Ambos podem recusar e seguir em frente

### 3. Pagamento Pós-Negociação
- Cliente NÃO escolhe forma de pagamento antes de fechar acordo
- Após selecionar motorista, cliente confirma pagamento
- Motorista só inicia após confirmação de pagamento

### 4. Comprovação Operacional
- Coleta exige comprovação (foto/PIN/assinatura)
- Entrega exige comprovação (foto/PIN/nome do recebedor)
- Sistema rastreia GPS durante todo o trajeto

### 5. Cancelamento Inteligente
- Antes da coleta: regras mais flexíveis
- Após coleta: exige justificativa e pode gerar taxa
- Sistema registra motivo e impacto

---

## 📱 FLUXO COMPLETO DO CLIENTE

### FASE 1: SOLICITAÇÃO DA ENTREGA

#### Tela 1.1: Home do Cliente
**Arquivo:** `src/screens/(authenticated)/Client/Home/index.tsx`

**Objetivo:** Escolher o tipo de serviço

**Layout:**
```
┌─────────────────────────────────┐
│ 📍 Boa tarde, João              │
│    Porto Velho, RO              │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────┐ ┌───────────┐ │
│  │   🚗        │ │   📦      │ │
│  │  Corrida   │ │  Entrega  │ │
│  │            │ │           │ │
│  └─────────────┘ └───────────┘ │
│                                 │
│  📋 Ver pedidos ativos          │
│  💰 Carteira                    │
│  ❓ Suporte                     │
└─────────────────────────────────┘
```

**Componentes:**
- Header com saudação e localização
- Card "Corrida" (ride)
- Card "Entrega" (delivery)
- Links rápidos (pedidos, carteira, suporte)

**Estados:**
- ✅ Normal: cards ativos
- ⏳ Carregando: verificando disponibilidade
- ❌ Erro: cidade não atendida

**Ação:**
- Toque em "Entrega" → navega para `DestinationSearch` com `serviceType: 'delivery'`

**Regras:**
- Card "Entrega" só ativo se cidade atendida
- Se houver pedido ativo, mostrar badge de notificação

---

#### Tela 1.2: Definir Endereços
**Arquivo:** `src/screens/(authenticated)/Client/Ride/Request/DestinationSearch/index.tsx`

**Objetivo:** Definir ponto de coleta e ponto de entrega

**Layout:**
```
┌─────────────────────────────────┐
│ ← Nova Entrega                  │
├─────────────────────────────────┤
│                                 │
│ 📍 Coleta                       │
│ ┌─────────────────────────────┐ │
│ │ Rua das Flores, 123...      │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📍 Entrega                      │
│ ┌─────────────────────────────┐ │
│ │ Av. Principal, 456...       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⭐ Endereços Favoritos          │
│ • Casa                          │
│ • Trabalho                      │
│                                 │
│ 📊 Distância: 8.5 km            │
│ ⏱️  Tempo estimado: 15 min      │
│                                 │
│        [Continuar]              │
└─────────────────────────────────┘
```

**Componentes:**
- Input de coleta com autocomplete
- Input de entrega com autocomplete
- Lista de favoritos
- Card de resumo (distância e tempo)
- Botão "Continuar"

**Estados:**
- ⏳ Carregando sugestões do Google Places
- 🔍 Buscando endereço
- ❌ Endereço não encontrado
- ✅ Endereços válidos

**Validações:**
- Coleta e entrega são obrigatórios
- Endereços devem ter lat/lng válidos
- Coleta e entrega não podem ser iguais
- Ambos devem estar em área atendida

**Ação:**
- "Continuar" → navega para `DeliverySetup`

**Backend:**
- Geocoding via Google Maps API
- Validação de área atendida
- Cálculo de distância e tempo estimado

---

#### Tela 1.3: Configurar Entrega
**Arquivo:** `src/screens/(authenticated)/Client/Ride/Request/DeliverySetup/index.tsx`

**Objetivo:** Definir detalhes do pacote e fazer oferta inicial

**Layout:**
```
┌─────────────────────────────────┐
│ ← Configurar Entrega            │
├─────────────────────────────────┤
│ 📍 Resumo da Rota               │
│ Coleta: Rua das Flores, 123    │
│ Entrega: Av. Principal, 456    │
│ 8.5 km • 15 min                 │
├─────────────────────────────────┤
│ 🚗 Tipo de Veículo              │
│ ○ Moto  ● Carro  ○ Van         │
├─────────────────────────────────┤
│ 📦 Tipo de Entrega              │
│ ● Documento  ○ Pacote  ○ Compra│
├─────────────────────────────────┤
│ 📏 Tamanho da Carga             │
│ ● Pequeno  ○ Médio  ○ Grande   │
│                                 │
│ 👤 Precisa de ajudante?         │
│ ○ Não  ○ Sim                   │
├─────────────────────────────────┤
│ 📝 Descrição do Pacote          │
│ ┌─────────────────────────────┐ │
│ │ Ex: Documentos importantes  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ⚡ Prioridade                   │
│ ● Normal  ○ Urgente            │
├─────────────────────────────────┤
│ 💰 Sua Oferta                   │
│ ┌─────────────────────────────┐ │
│ │ R$ 25,00                    │ │
│ └─────────────────────────────┘ │
│ Faixa sugerida: R$ 20 - R$ 35  │
│ ℹ️  Ofertas maiores atraem mais│
│    entregadores rapidamente     │
│                                 │
│        [Revisar Pedido]         │
└─────────────────────────────────┘
```

**Componentes:**
- Card de resumo da rota
- `VehicleSelector` (moto/carro/van)
- `DeliveryTypeSelector` (documento/pacote/compra)
- `CargoSizeSelector` (pequeno/médio/grande)
- `HelperSwitch` (precisa ajudante?)
- `CargoDescriptionInput` (textarea)
- `DeliveryPrioritySelector` (normal/urgente)
- `DeliveryOfferCard` (input de valor + faixa sugerida)

**Estados:**
- ⏳ Calculando cotação
- ❌ Erro ao calcular preço
- ✅ Cotação válida

**Validações:**
- Veículo obrigatório
- Tipo de entrega obrigatório
- Tamanho obrigatório
- Descrição obrigatória (mínimo 10 caracteres)
- Oferta deve estar entre `allowedMin` e `allowedMax` do backend
- Se urgente, pode ter taxa adicional

**Regras Importantes:**
- ❌ **NÃO** incluir seleção de pagamento aqui
- ✅ Apenas configurar o serviço e fazer oferta
- Backend calcula faixa sugerida baseado em:
  - Distância
  - Tipo de veículo
  - Tamanho da carga
  - Prioridade
  - Horário (pico/normal)
  - Demanda atual

**Ação:**
- "Revisar Pedido" → navega para `DeliveryReviewScreen`

**Backend:**
- `POST /rides/calculate-price`
  ```json
  {
    "serviceType": "delivery",
    "pickupLocation": {...},
    "dropoffLocation": {...},
    "vehicleType": "car",
    "deliveryType": "package",
    "cargoSize": "small",
    "needsHelper": false,
    "priority": "normal",
    "clientOffer": 25.00
  }
  ```
- Resposta:
  ```json
  {
    "quoteId": "quote_123",
    "suggestedMin": 20.00,
    "suggestedMax": 35.00,
    "allowedMin": 15.00,
    "allowedMax": 50.00,
    "baseFare": 8.00,
    "distanceFare": 12.00,
    "platformFee": 3.00,
    "expiresAt": "2026-05-19T23:50:00Z"
  }
  ```

---

#### Tela 1.4: Revisar Entrega
**Arquivo:** `src/screens/(authenticated)/Client/Ride/Request/DeliveryReview/index.tsx`

**Objetivo:** Confirmar todos os dados antes de publicar para entregadores

**Layout:**
```
┌─────────────────────────────────┐
│ ← Revisar Entrega               │
├─────────────────────────────────┤
│ 📍 Rota                         │
│ ┌─────────────────────────────┐ │
│ │ Coleta:                     │ │
│ │ Rua das Flores, 123         │ │
│ │                             │ │
│ │ Entrega:                    │ │
│ │ Av. Principal, 456          │ │
│ │                             │ │
│ │ 8.5 km • 15 min             │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 📦 Pacote                       │
│ ┌─────────────────────────────┐ │
│ │ Tipo: Pacote pequeno        │ │
│ │ Descrição: Documentos...    │ │
│ │ ⚠️  Frágil                  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 🚗 Veículo e Prioridade         │
│ ┌─────────────────────────────┐ │
│ │ Veículo: Carro              │ │
│ │ Prioridade: Normal          │ │
│ │ Ajudante: Não               │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 💰 Oferta e Faixa               │
│ ┌─────────────────────────────┐ │
│ │ Sua oferta: R$ 25,00        │ │
│ │ Faixa sugerida: R$ 20-35    │ │
│ │                             │ │
│ │ ℹ️  Entregadores podem      │ │
│ │    aceitar ou contrapropor  │ │
│ └─────────────────────────────┘ │
│                                 │
│   [Enviar para Entregadores]    │
└─────────────────────────────────┘
```

**Componentes:**
- Card de rota (coleta/entrega/distância)
- Card de pacote (tipo/descrição/alertas)
- Card de veículo (tipo/prioridade/ajudante)
- Card de oferta (valor/faixa/info)
- Botão "Enviar para Entregadores"

**Estados:**
- ✅ Normal: pronto para enviar
- ❌ Cotação expirada: precisa recalcular

**Validações:**
- Verificar se `quoteId` ainda é válido
- Se expirou, voltar para `DeliverySetup` com recotação automática

**Ação:**
- "Enviar para Entregadores" → cria a ride e navega para `SearchingDriver`

**Backend:**
- `POST /rides`
  ```json
  {
    "quoteId": "quote_123",
    "serviceType": "delivery",
    "pickupLocation": {...},
    "dropoffLocation": {...},
    "vehicleType": "car",
    "deliveryType": "package",
    "cargoSize": "small",
    "cargoDescription": "Documentos importantes",
    "needsHelper": false,
    "priority": "normal",
    "clientOffer": 25.00,
    "status": "searching_driver"
  }
  ```
- Resposta:
  ```json
  {
    "rideId": "ride_456",
    "status": "searching_driver",
    "clientOffer": 25.00,
    "expiresAt": "2026-05-19T23:55:00Z"
  }
  ```

---

### FASE 2: NEGOCIAÇÃO

#### Tela 2.1: Buscando Entregadores
**Arquivo:** `src/screens/(authenticated)/Client/Ride/SearchingDriver/index.tsx`

**Objetivo:** Mostrar busca ativa e permitir ajustes na oferta

**Layout:**
```
┌─────────────────────────────────┐
│ ← Buscando Entregadores         │
├─────────────────────────────────┤
│        [Mapa de contexto]       │
│                                 │
│         🔍 Procurando...        │
│                                 │
├─────────────────────────────────┤
│ 💰 Sua oferta: R$ 25,00         │
│                                 │
│ ⏱️  Tempo restante: 4:32        │
│                                 │
│ 📊 Status:                      │
│ • Notificando entregadores...   │
│ • 12 entregadores visualizaram  │
│ • 3 propostas recebidas         │
│                                 │
│    [💰 Aumentar Oferta]         │
│    [📋 Ver Propostas (3)]       │
│    [❌ Cancelar]                │
└─────────────────────────────────┘
```

**Componentes:**
- Mapa mostrando área de busca
- Card de status com animação
- Contador de tempo
- Estatísticas de visualizações
- Botão "Aumentar Oferta"
- Botão "Ver Propostas" (badge com contador)
- Botão "Cancelar"

**Estados:**
- 🔍 Buscando: sem propostas ainda
- 📬 Propostas recebidas: badge com número
- ⏰ Tempo expirando: alerta visual
- ❌ Expirado: redirecionar para aumentar oferta ou cancelar

**Regras:**
- Timer de 5-10 minutos (configurável no backend)
- WebSocket recebe notificações de novas propostas em tempo real
- Se expirar sem propostas, sugerir aumentar oferta
- Se receber propostas, habilitar botão "Ver Propostas"

**Ações:**
- "Aumentar Oferta" → modal para ajustar valor
- "Ver Propostas" → navega para `RideOffersMarketplace`
- "Cancelar" → modal de confirmação → cancela ride

**Backend:**
- WebSocket: `ride-offer-received` (notifica nova proposta)
- WebSocket: `ride-offer-updated` (motorista ajustou proposta)
- `POST /rides/:rideId/offers/increase` (aumentar oferta)

---

#### Tela 2.2: Marketplace de Propostas
**Arquivo:** `src/screens/(authenticated)/Client/Orders/RideOffersMarketplaceScreen.tsx`

**Objetivo:** Visualizar e escolher entre as propostas dos entregadores

**Layout:**
```
┌─────────────────────────────────┐
│ ← Propostas Recebidas (5)       │
├─────────────────────────────────┤
│ 💰 Sua oferta: R$ 25,00         │
│ 📊 Faixa sugerida: R$ 20-35     │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 👤 Carlos Silva    ⭐ 4.9   │ │
│ │ 🚗 Fiat Uno Branco          │ │
│ │ 📍 2.3 km de você           │ │
│ │                             │ │
│ │ 💰 R$ 25,00 ✅ Aceitou      │ │
│ │ ⏱️  Chega em 5 min          │ │
│ │                             │ │
│ │        [Escolher]           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 João Santos     ⭐ 4.7   │ │
│ │ 🏍️  Honda CG Preta          │ │
│ │ 📍 1.8 km de você           │ │
│ │                             │ │
│ │ 💰 R$ 28,00 💬 Contrapropôs │ │
│ │ ⏱️  Chega em 3 min          │ │
│ │                             │ │
│ │        [Escolher]           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 Maria Oliveira  ⭐ 5.0   │ │
│ │ 🚗 Gol Prata                │ │
│ │ 📍 3.1 km de você           │ │
│ │                             │ │
│ │ 💰 R$ 23,00 💬 Contrapropôs │ │
│ │ ⏱️  Chega em 7 min          │ │
│ │                             │ │
│ │        [Escolher]           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Componentes:**
- Header com contador de propostas
- Card de referência (oferta original)
- Lista de cards de motoristas com:
  - Foto e nome
  - Avaliação (estrelas)
  - Veículo (tipo, modelo, cor)
  - Distância atual
  - Valor proposto
  - Status (aceitou/contrapropôs)
  - ETA (tempo até chegar na coleta)
  - Botão "Escolher"

**Estados:**
- ✅ Propostas disponíveis
- ⏳ Carregando propostas
- 📭 Sem propostas ainda
- ❌ Erro ao carregar

**Ordenação:**
- Por padrão: menor valor primeiro
- Opções: menor valor, maior avaliação, mais próximo

**Regras:**
- Mostrar badge visual para quem aceitou o valor original
- Destacar contrapropostas (valor diferente)
- Mostrar distância em tempo real
- Atualizar lista via WebSocket quando novas propostas chegam

**Ação:**
- "Escolher" → navega para `DeliveryPaymentConfirmScreen` com motorista selecionado

**Backend:**
- `GET /rides/:rideId/offers` (lista propostas)
  ```json
  {
    "offers": [
      {
        "offerId": "offer_123",
        "driverId": "driver_456",
        "driverName": "Carlos Silva",
        "driverPhoto": "https://...",
        "driverRating": 4.9,
        "vehicleType": "car",
        "vehicleModel": "Fiat Uno",
        "vehicleColor": "Branco",
        "vehiclePlate": "ABC1234",
        "currentDistance": 2.3,
        "eta": 5,
        "proposedPrice": 25.00,
        "status": "accepted",
        "createdAt": "2026-05-19T23:35:00Z"
      }
    ]
  }
  ```

---

#### Tela 2.3: Confirmar Pagamento
**Arquivo:** `src/screens/(authenticated)/Client/Ride/Request/DeliveryPaymentConfirm/index.tsx`

**Objetivo:** Escolher forma de pagamento e confirmar contratação do motorista

**Layout:**
```
┌─────────────────────────────────┐
│ ← Confirmar Pagamento           │
├─────────────────────────────────┤
│ 👤 Entregador Selecionado       │
│ ┌─────────────────────────────┐ │
│ │ Carlos Silva       ⭐ 4.9   │ │
│ │ 🚗 Fiat Uno Branco          │ │
│ │ 📍 2.3 km • Chega em 5 min  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 💰 Resumo Financeiro            │
│ ┌─────────────────────────────┐ │
│ │ Valor da entrega: R$ 25,00  │ │
│ │ Taxa de serviço:  R$  3,00  │ │
│ │ ─────────────────────────── │ │
│ │ Total:           R$ 28,00  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 💳 Forma de Pagamento           │
│ ┌─────────────────────────────┐ │
│ │ ● Cartão •••• 1234          │ │
│ │ ○ Dinheiro                  │ │
│ │ ○ PIX                       │ │
│ │ ○ Carteira Leva Mais        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⚠️  O motorista aguardará sua   │
│    confirmação para iniciar     │
│                                 │
│      [Confirmar e Pagar]        │
│      [Voltar]                   │
└─────────────────────────────────┘
```

**Componentes:**
- Card do motorista selecionado
- Card de resumo financeiro (valor + taxa)
- Seletor de forma de pagamento
- Aviso sobre aguardo do motorista
- Botão "Confirmar e Pagar"
- Botão "Voltar"

**Estados:**
- ✅ Normal: pronto para confirmar
- ⏳ Processando pagamento
- ❌ Erro no pagamento
- ✅ Pagamento confirmado

**Validações:**
- Forma de pagamento obrigatória
- Se cartão, validar se está ativo
- Se carteira, validar saldo suficiente
- Se PIX, gerar QR code ou chave

**Regras Importantes:**
- ⚠️ **ESTE É O MOMENTO DO PAGAMENTO**, não antes
- Motorista fica em estado "aguardando confirmação"
- Se cliente não confirmar em X minutos, liberar motorista
- Backend pode pré-autorizar cartão ou reservar saldo

**Ação:**
- "Confirmar e Pagar" → processa pagamento → navega para `RideTracking`
- "Voltar" → volta para marketplace (motorista é liberado)

**Backend:**
- `POST /rides/:rideId/offers/select`
  ```json
  {
    "offerId": "offer_123",
    "paymentMethod": "credit_card",
    "paymentDetails": {
      "cardId": "card_789"
    }
  }
  ```
- `POST /payments/process`
  ```json
  {
    "rideId": "ride_456",
    "amount": 28.00,
    "method": "credit_card",
    "cardId": "card_789"
  }
  ```
- Resposta:
  ```json
  {
    "paymentId": "pay_999",
    "status": "authorized",
    "rideStatus": "driver_assigned"
  }
  ```

---

### FASE 3: RASTREAMENTO DA ENTREGA

#### Tela 3.1: Rastreamento em Tempo Real
**Arquivo:** `src/screens/(authenticated)/Client/Ride/Tracking/RideTracking/index.tsx`

**Objetivo:** Acompanhar o motorista em tempo real durante toda a entrega

**Layout (Fase: A caminho da coleta):**
```
┌─────────────────────────────────┐
│        [Mapa em tela cheia]     │
│                                 │
│  📍 Você (coleta)               │
│  🚗 Carlos (2.3 km)             │
│  📍 Destino                     │
│                                 │
├─────────────────────────────────┤
│ 🚗 A caminho da coleta          │
│ ┌─────────────────────────────┐ │
│ │ Carlos Silva       ⭐ 4.9   │ │
│ │ Fiat Uno Branco • ABC1234   │ │
│ │                             │ │
│ │ ⏱️  Chega em 5 min          │ │
│ │ 📍 2.3 km de distância      │ │
│ │                             │ │
│ │ [💬 Chat] [📞 Ligar]        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Layout (Fase: Coletando pacote):**
```
┌─────────────────────────────────┐
│        [Mapa em tela cheia]     │
│                                 │
│  🚗 Carlos (no local)           │
│  📍 Destino (8.5 km)            │
│                                 │
├─────────────────────────────────┤
│ 📦 Coletando o pacote           │
│ ┌─────────────────────────────┐ │
│ │ Carlos chegou no local      │ │
│ │                             │ │
│ │ ⏱️  Aguardando coleta...    │ │
│ │                             │ │
│ │ ℹ️  O entregador está       │ │
│ │    confirmando o pacote     │ │
│ │                             │ │
│ │ [💬 Chat] [📞 Ligar]        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Layout (Fase: A caminho do destino):**
```
┌─────────────────────────────────┐
│        [Mapa em tela cheia]     │
│                                 │
│  🚗 Carlos (5.2 km do destino)  │
│  📍 Destino                     │
│                                 │
├─────────────────────────────────┤
│ 🚚 Pacote a caminho             │
│ ┌─────────────────────────────┐ │
│ │ ✅ Pacote coletado          │ │
│ │                             │ │
│ │ ⏱️  Chega em 12 min         │ │
│ │ 📍 5.2 km do destino        │ │
│ │                             │ │
│ │ 📸 Ver comprovante coleta   │ │
│ │                             │ │
│ │ [💬 Chat] [📞 Ligar]        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Layout (Fase: Entregando):**
```
┌─────────────────────────────────┐
│        [Mapa em tela cheia]     │
│                                 │
│  🚗 Carlos (no destino)         │
│                                 │
├─────────────────────────────────┤
│ 📦 Entregando o pacote          │
│ ┌─────────────────────────────┐ │
│ │ Carlos chegou no destino    │ │
│ │                             │ │
│ │ ⏱️  Finalizando entrega...  │ │
│ │                             │ │
│ │ ℹ️  Aguarde a confirmação   │ │
│ │    do recebimento           │ │
│ │                             │ │
│ │ [💬 Chat] [📞 Ligar]        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Componentes:**
- Mapa em tela cheia com:
  - Marcador do motorista (atualizado em tempo real)
  - Marcador da coleta
  - Marcador do destino
  - Linha da rota
  - Trilha GPS do motorista (opcional)
- Bottom sheet com:
  - Status atual (texto dinâmico)
  - Info do motorista
  - ETA e distância
  - Botões de ação (chat, ligar)
  - Link para comprovantes (quando disponível)

**Estados por Fase:**
1. `driver_assigned` → "Motorista confirmado"
2. `driver_going_to_pickup` → "A caminho da coleta"
3. `driver_arrived_pickup` → "Chegou no local de coleta"
4. `picking_up` → "Coletando o pacote"
5. `in_transit` → "Pacote a caminho"
6. `driver_arrived_dropoff` → "Chegou no destino"
7. `delivering` → "Entregando o pacote"
8. `completed` → navega para `RideCompleted`

**WebSocket Events:**
- `driver-location-updated` → atualiza posição no mapa
- `ride-status-changed` → atualiza status e UI
- `driver-message` → notificação de mensagem no chat
- `proof-uploaded` → notifica comprovante disponível

**Ações:**
- "Chat" → abre `ChatScreen`
- "Ligar" → inicia chamada telefônica
- "Ver comprovante" → modal com foto/detalhes
- Botão "Cancelar" (só antes da coleta)

**Backend:**
- WebSocket connection mantida durante toda a entrega
- `GET /rides/:rideId` → busca status atualizado
- `GET /rides/:rideId/proof/pickup` → busca comprovante de coleta
- `GET /rides/:rideId/proof/delivery` → busca comprovante de entrega

---

### FASE 4: CONCLUSÃO

#### Tela 4.1: Entrega Concluída
**Arquivo:** `src/screens/(authenticated)/Client/Ride/Completion/RideCompleted/index.tsx`

**Objetivo:** Mostrar resumo da entrega e solicitar avaliação

**Layout:**
```
┌─────────────────────────────────┐
│ ✅ Entrega Concluída!           │
├─────────────────────────────────┤
│ 📦 Seu pacote foi entregue      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💰 Resumo Financeiro        │ │
│ │                             │ │
│ │ Valor da entrega: R$ 25,00  │ │
│ │ Taxa de serviço:  R$  3,00  │ │
│ │ ─────────────────────────── │ │
│ │ Total pago:      R$ 28,00  │ │
│ │                             │ │
│ │ 💳 Cartão •••• 1234         │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⏱️  Tempo Total             │ │
│ │ 23 minutos                  │ │
│ │                             │ │
│ │ 📍 Distância                │ │
│ │ 8.5 km                      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📸 Comprovantes             │ │
│ │ • Foto da coleta            │ │
│ │ • Foto da entrega           │ │
│ │ • Assinatura do recebedor   │ │
│ └─────────────────────────────┘ │
│                                 │
│      [Avaliar Entregador]       │
│      [Voltar ao Início]         │
│      [❓ Reportar Problema]     │
└─────────────────────────────────┘
```

**Componentes:**
- Header de sucesso
- Card financeiro (valor, taxa, total, método)
- Card de métricas (tempo, distância)
- Card de comprovantes (links para fotos)
- Botão "Avaliar Entregador"
- Botão "Voltar ao Início"
- Link "Reportar Problema"

**Estados:**
- ✅ Normal: entrega concluída
- ⏳ Carregando detalhes
- ❌ Erro ao carregar

**Ação:**
- "Avaliar Entregador" → navega para `RateDriverScreen`
- "Voltar ao Início" → navega para `Home`
- "Reportar Problema" → abre suporte/disputa

**Backend:**
- `GET /rides/:rideId` → busca detalhes completos
- Dados incluem:
  - Valor final
  - Método de pagamento
  - Tempo total
  - Distância percorrida
  - URLs dos comprovantes
  - Status de avaliação

---

#### Tela 4.2: Avaliar Entregador
**Arquivo:** `src/screens/(authenticated)/Client/Ride/Completion/RateDriver/index.tsx`

**Objetivo:** Coletar feedback sobre o entregador

**Layout:**
```
┌─────────────────────────────────┐
│ ← Avaliar Entregador            │
├─────────────────────────────────┤
│ 👤 Carlos Silva                 │
│ 🚗 Fiat Uno Branco              │
│                                 │
│ Como foi sua experiência?       │
│                                 │
│    ⭐ ⭐ ⭐ ⭐ ⭐               │
│                                 │
├─────────────────────────────────┤
│ O que você achou?               │
│                                 │
│ ✅ Pontual                      │
│ ✅ Cuidadoso com o pacote       │
│ ✅ Boa comunicação              │
│ ⬜ Profissional                 │
│ ⬜ Veículo limpo                │
│                                 │
├─────────────────────────────────┤
│ Comentário (opcional)           │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│        [Enviar Avaliação]       │
│        [Pular]                  │
└─────────────────────────────────┘
```

**Componentes:**
- Info do motorista
- Seletor de estrelas (1-5)
- Tags de feedback (múltipla escolha)
- Campo de comentário (opcional)
- Botão "Enviar Avaliação"
- Botão "Pular"

**Tags Sugeridas para Delivery:**
- ✅ Pontual
- ✅ Cuidadoso com o pacote
- ✅ Boa comunicação
- ✅ Profissional
- ✅ Veículo limpo
- ✅ Entrega correta
- ❌ Atrasado
- ❌ Pacote danificado
- ❌ Má comunicação

**Validações:**
- Estrelas obrigatórias
- Tags opcionais
- Comentário opcional (máximo 500 caracteres)

**Ação:**
- "Enviar Avaliação" → envia feedback → volta para `Home`
- "Pular" → volta para `Home` (pode avaliar depois no histórico)

**Backend:**
- `POST /rides/:rideId/rate-driver`
  ```json
  {
    "rating": 5,
    "tags": ["pontual", "cuidadoso", "boa_comunicacao"],
    "comment": "Excelente entregador!"
  }
  ```

---

## 📱 FLUXO COMPLETO DO ENTREGADOR

### FASE 1: DISPONIBILIDADE E SOLICITAÇÕES

#### Tela 1.1: Home do Entregador
**Arquivo:** `src/screens/(authenticated)/Driver/Home/index.tsx`

**Objetivo:** Controlar disponibilidade e ver solicitações

**Layout (Offline):**
```
┌─────────────────────────────────┐
│ 👤 Carlos Silva                 │
│ ⭐ 4.9 • 234 entregas           │
├─────────────────────────────────┤
│                                 │
│        Você está offline        │
│                                 │
│    [🟢 Ficar Disponível]        │
│                                 │
├─────────────────────────────────┤
│ 💰 Saldo: R$ 450,00             │
│ 📊 Hoje: 8 entregas • R$ 180    │
│                                 │
│ [💰 Carteira] [📊 Estatísticas] │
└─────────────────────────────────┘
```

**Layout (Online):**
```
┌─────────────────────────────────┐
│ 👤 Carlos Silva                 │
│ ⭐ 4.9 • 234 entregas           │
├─────────────────────────────────┤
│    🟢 Você está disponível      │
│                                 │
│    [🔴 Ficar Offline]           │
│                                 │
├─────────────────────────────────┤
│ 📬 Novas Solicitações (3)       │
│                                 │
│    [Ver Solicitações]           │
│                                 │
├─────────────────────────────────┤
│ 💰 Saldo: R$ 450,00             │
│ 📊 Hoje: 8 entregas • R$ 180    │
│                                 │
│ [💰 Carteira] [📊 Estatísticas] │
└─────────────────────────────────┘
```

**Componentes:**
- Header com foto, nome, avaliação e contador
- Toggle de disponibilidade (online/offline)
- Badge de novas solicitações
- Card de ganhos do dia
- Links rápidos (carteira, estatísticas)

**Estados:**
- 🔴 Offline: não recebe solicitações
- 🟢 Online: recebe notificações de novas entregas
- 🚗 Em entrega: não recebe novas solicitações

**Regras:**
- Só pode ficar online se:
  - Perfil aprovado (`driverStatus: 'approved'`)
  - Localização ativada
  - Veículo cadastrado
- WebSocket conecta quando fica online
- Notificação push quando nova solicitação chega

**Ação:**
- "Ficar Disponível" → ativa modo online → conecta WebSocket
- "Ficar Offline" → desativa modo online → desconecta WebSocket
- "Ver Solicitações" → navega para `DriverRequestsScreen`

**Backend:**
- `POST /driver/status`
  ```json
  {
    "status": "online",
    "location": {
      "latitude": -8.76,
      "longitude": -63.90
    }
  }
  ```
- WebSocket: `new-ride-available` → notifica nova entrega na área

---

#### Tela 1.2: Solicitações de Entrega
**Arquivo:** `src/screens/(authenticated)/Driver/DriverRequestsScreen.tsx`

**Objetivo:** Visualizar entregas disponíveis e negociar propostas

**Layout:**
```
┌─────────────────────────────────┐
│ ← Solicitações                  │
├─────────────────────────────────┤
│ [Novos Pedidos] [Negociações]  │
├─────────────────────────────────┤
│ 📦 NOVOS PEDIDOS (5)            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📍 2.3 km de você           │ │
│ │ Coleta: Rua das Flores, 123│ │
│ │ Entrega: Av. Principal, 456│ │
│ │ 8.5 km • 15 min             │ │
│ │                             │ │
│ │ 📦 Pacote pequeno           │ │
│ │ 🚗 Carro                    │ │
│ │                             │ │
│ │ 💰 Oferta: R$ 25,00         │ │
│ │ 📊 Faixa: R$ 20-35          │ │
│ │ 💵 Você recebe: ~R$ 22,00   │ │
│ │ 💳 Pagamento: Cartão        │ │
│ │                             │ │
│ │ ⏱️  Expira em 3:45          │ │
│ │                             │ │
│ │ [✅ Aceitar] [💬 Propor]   │ │
│ │ [❌ Recusar]                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📍 4.1 km de você           │ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Componentes:**
- Tabs: "Novos Pedidos" e "Negociações"
- Lista de cards de entregas com:
  - Distância até coleta
  - Endereços (coleta e entrega)
  - Distância e tempo da rota
  - Detalhes do pacote
  - Tipo de veículo necessário
  - Oferta do cliente
  - Faixa sugerida
  - Valor estimado para o motorista (após taxa)
  - Forma de pagamento
  - Timer de expiração
  - Botões: Aceitar, Propor, Recusar

**Estados:**
- ✅ Pedidos disponíveis
- 📭 Sem pedidos no momento
- ⏳ Carregando
- ❌ Erro ao carregar

**Regras de Exibição:**
- Mostrar apenas entregas compatíveis com veículo do motorista
- Ordenar por distância (mais próximo primeiro)
- Atualizar em tempo real via WebSocket
- Remover automaticamente quando expirar
- Badge "URGENTE" para prioridade alta

**Cálculo do Valor para Motorista:**
```
Oferta do cliente: R$ 25,00
Taxa da plataforma: R$ 3,00 (12%)
Motorista recebe: R$ 22,00
```

**Ações:**
- "Aceitar" → aceita o valor oferecido → aguarda seleção do cliente
- "Propor" → abre modal para contrapropor valor
- "Recusar" → remove da lista
- Toque no card → navega para `DeliveryOfferDetailScreen`

**Backend:**
- `GET /rides/available` → lista entregas disponíveis
  ```json
  {
    "rides": [
      {
        "rideId": "ride_456",
        "clientOffer": 25.00,
        "suggestedMin": 20.00,
        "suggestedMax": 35.00,
        "platformFee": 3.00,
        "driverEarnings": 22.00,
        "pickupLocation": {...},
        "dropoffLocation": {...},
        "distance": 8.5,
        "duration": 15,
        "vehicleType": "car",
        "deliveryType": "package",
        "cargoSize": "small",
        "priority": "normal",
        "paymentMethod": "credit_card",
        "expiresAt": "2026-05-19T23:55:00Z"
      }
    ]
  }
  ```

---

#### Tela 1.3: Detalhes da Oferta
**Arquivo:** `src/screens/(authenticated)/Driver/DeliveryOfferDetailScreen/index.tsx`

**Objetivo:** Ver todos os detalhes antes de decidir

**Layout:**
```
┌─────────────────────────────────┐
│ ← Detalhes da Entrega           │
├─────────────────────────────────┤
│        [Mapa da rota]           │
│                                 │
│  📍 Coleta → 📍 Entrega         │
│  8.5 km • 15 min                │
│                                 │
├─────────────────────────────────┤
│ 📍 Endereços                    │
│ ┌─────────────────────────────┐ │
│ │ Coleta:                     │ │
│ │ Rua das Flores, 123         │ │
│ │ Bairro Centro               │ │
│ │ 📍 2.3 km de você           │ │
│ │                             │ │
│ │ Entrega:                    │ │
│ │ Av. Principal, 456          │ │
│ │ Bairro Jardim               │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 📦 Detalhes do Pacote           │
│ ┌─────────────────────────────┐ │
│ │ Tipo: Pacote pequeno        │ │
│ │ Descrição: Documentos...    │ │
│ │ Veículo: Carro              │ │
│ │ Ajudante: Não               │ │
│ │ Prioridade: Normal          │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 💰 Valores                      │
│ ┌─────────────────────────────┐ │
│ │ Oferta do cliente: R$ 25,00 │ │
│ │ Taxa Leva Mais:    R$  3,00 │ │
│ │ ─────────────────────────── │ │
│ │ Você recebe:      R$ 22,00 │ │
│ │                             │ │
│ │ 📊 Faixa sugerida: R$ 20-35 │ │
│ │ 💳 Pagamento: Cartão        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⏱️  Expira em 3:45              │
│                                 │
│ [✅ Aceitar R$ 25,00]           │
│ [💬 Fazer Contraproposta]       │
│ [❌ Recusar]                    │
└─────────────────────────────────┘
```

**Componentes:**
- Mapa com rota completa
- Card de endereços (coleta e entrega)
- Card de detalhes do pacote
- Card de valores (oferta, taxa, ganho)
- Timer de expiração
- Botões de ação

**Estados:**
- ✅ Normal: disponível para ação
- ⏰ Expirando: alerta visual
- ❌ Expirado: desabilitar ações

**Ações:**
- "Aceitar" → envia proposta aceitando valor original
- "Fazer Contraproposta" → abre modal para propor novo valor
- "Recusar" → volta para lista

**Modal de Contraproposta:**
```
┌─────────────────────────────────┐
│ Fazer Contraproposta            │
├─────────────────────────────────┤
│ Oferta do cliente: R$ 25,00     │
│ Faixa sugerida: R$ 20-35        │
│                                 │
│ Sua contraproposta:             │
│ ┌─────────────────────────────┐ │
│ │ R$ 28,00                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ Você receberá: R$ 25,00         │
│ (após taxa de R$ 3,00)          │
│                                 │
│ ℹ️  O cliente decidirá se aceita│
│    sua contraproposta           │
│                                 │
│      [Enviar Proposta]          │
│      [Cancelar]                 │
└─────────────────────────────────┘
```

**Validações:**
- Contraproposta deve estar entre `allowedMin` e `allowedMax`
- Mostrar valor líquido após taxa
- Avisar se valor está muito acima/abaixo da faixa

**Backend:**
- `POST /rides/:rideId/offers/respond`
  ```json
  {
    "action": "accept",
    "proposedPrice": 25.00
  }
  ```
  ou
  ```json
  {
    "action": "counter",
    "proposedPrice": 28.00
  }
  ```
  ou
  ```json
  {
    "action": "reject"
  }
  ```

---

### FASE 2: AGUARDANDO CONFIRMAÇÃO DO CLIENTE

#### Tela 2.1: Aguardando Pagamento
**Arquivo:** Estado especial em `DriverRequestsScreen` ou tela dedicada

**Objetivo:** Informar que cliente está confirmando pagamento

**Layout:**
```
┌─────────────────────────────────┐
│ ⏳ Aguardando Cliente           │
├─────────────────────────────────┤
│                                 │
│    Cliente escolheu você!       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📦 Entrega                  │ │
│ │ Coleta: Rua das Flores, 123│ │
│ │ Entrega: Av. Principal, 456│ │
│ │                             │ │
│ │ 💰 Valor acordado: R$ 25,00 │ │
│ │ 💵 Você recebe: R$ 22,00    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⏱️  Aguardando confirmação...   │
│                                 │
│ ℹ️  O cliente está confirmando  │
│    a forma de pagamento         │
│                                 │
│ Você será notificado quando     │
│ puder iniciar a entrega         │
│                                 │
└─────────────────────────────────┘
```

**Componentes:**
- Indicador de aguardo
- Card com resumo da entrega
- Valor acordado
- Mensagem explicativa
- Timer (opcional)

**Estados:**
- ⏳ Aguardando: cliente confirmando pagamento
- ✅ Confirmado: navega para `DriverRideScreen`
- ❌ Cancelado: cliente desistiu, volta para disponível

**Regras:**
- Motorista não pode iniciar rota ainda
- Se cliente não confirmar em X minutos, liberar motorista
- WebSocket notifica quando pagamento confirmado

**WebSocket Events:**
- `ride-payment-confirmed` → navega para execução
- `ride-cancelled` → volta para lista de solicitações

---

### FASE 3: EXECUÇÃO DA ENTREGA

#### Tela 3.1: Entrega Ativa
**Arquivo:** `src/screens/(authenticated)/Driver/DriverRideScreen.tsx`

**Objetivo:** Executar a entrega com todas as etapas operacionais

**Layout (Fase: A caminho da coleta):**
```
┌─────────────────────────────────┐
│        [Mapa em tela cheia]     │
│                                 │
│  📍 Você                        │
│  📍 Coleta (2.3 km)             │
│  📍 Entrega                     │
│                                 │
├─────────────────────────────────┤
│ 🚗 Indo para coleta             │
│ ┌─────────────────────────────┐ │
│ │ Rua das Flores, 123         │ │
│ │ Bairro Centro               │ │
│ │                             │ │
│ │ 📍 2.3 km • 5 min           │ │
│ │                             │ │
│ │ 📦 Pacote pequeno           │ │
│ │ 💰 Você recebe: R$ 22,00    │ │
│ │                             │ │
│ │ [🧭 Navegar]                │ │
│ │ [📞 Ligar Cliente]          │ │
│ │ [✅ Cheguei no Local]       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Layout (Fase: Confirmando coleta):**
```
┌─────────────────────────────────┐
│ ← Confirmar Coleta              │
├─────────────────────────────────┤
│ 📦 Confirme o Pacote            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Descrição esperada:         │ │
│ │ Documentos importantes      │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📸 Foto do Pacote (obrigatório) │
│ ┌─────────────────────────────┐ │
│ │     [Tirar Foto]            │ │
│ │                             │ │
│ │  [Foto capturada ✓]         │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🔢 PIN de Coleta (se aplicável) │
│ ┌─────────────────────────────┐ │
│ │ Digite o PIN: ____          │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📝 Observações (opcional)       │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│    [Confirmar Coleta]           │
└─────────────────────────────────┘
```

**Layout (Fase: A caminho da entrega):**
```
┌─────────────────────────────────┐
│        [Mapa em tela cheia]     │
│                                 │
│  📍 Você                        │
│  📍 Entrega (5.2 km)            │
│                                 │
├─────────────────────────────────┤
│ 🚚 Indo para entrega            │
│ ┌─────────────────────────────┐ │
│ │ Av. Principal, 456          │ │
│ │ Bairro Jardim               │ │
│ │                             │ │
│ │ 📍 5.2 km • 12 min          │ │
│ │                             │ │
│ │ 📦 Pacote coletado ✓        │ │
│ │ 💰 Você recebe: R$ 22,00    │ │
│ │                             │ │
│ │ [🧭 Navegar]                │ │
│ │ [📞 Ligar Cliente]          │ │
│ │ [✅ Cheguei no Destino]     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Layout (Fase: Confirmando entrega):**
```
┌─────────────────────────────────┐
│ ← Confirmar Entrega             │
├─────────────────────────────────┤
│ 📦 Confirme a Entrega           │
│                                 │
│ 📸 Foto da Entrega (obrigatório)│
│ ┌─────────────────────────────┐ │
│ │     [Tirar Foto]            │ │
│ │                             │ │
│ │  [Foto capturada ✓]         │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🔢 PIN de Entrega (se aplicável)│
│ ┌─────────────────────────────┐ │
│ │ Digite o PIN: ____          │ │
│ └─────────────────────────────┘ │
│                                 │
│ 👤 Nome do Recebedor            │
│ ┌─────────────────────────────┐ │
│ │ João Silva                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ✍️  Assinatura (opcional)       │
│ ┌─────────────────────────────┐ │
│ │   [Área de assinatura]      │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📝 Observações (opcional)       │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│    [Finalizar Entrega]          │
└─────────────────────────────────┘
```

**Componentes:**
- Mapa em tela cheia com rota
- Bottom sheet com status e ações
- Botões contextuais por fase:
  - "Navegar" (abre Google Maps/Waze)
  - "Ligar Cliente" (inicia chamada)
  - "Cheguei no Local" (marca chegada)
  - "Confirmar Coleta" (abre tela de comprovação)
  - "Cheguei no Destino" (marca chegada)
  - "Finalizar Entrega" (abre tela de comprovação)

**Fases da Entrega:**
1. `driver_going_to_pickup` → Indo para coleta
2. `driver_arrived_pickup` → Chegou na coleta
3. `picking_up` → Confirmando coleta
4. `in_transit` → Indo para entrega
5. `driver_arrived_dropoff` → Chegou no destino
6. `delivering` → Confirmando entrega
7. `completed` → Concluído

**Comprovação de Coleta:**
- ✅ Foto obrigatória
- 🔢 PIN opcional (se configurado)
- 📝 Observações opcionais

**Comprovação de Entrega:**
- ✅ Foto obrigatória
- 🔢 PIN opcional (se configurado)
- 👤 Nome do recebedor obrigatório
- ✍️ Assinatura opcional
- 📝 Observações opcionais

**Tracking GPS:**
- Enviar localização a cada 4-5 segundos
- Persistir pontos no backend
- Continuar em background (se permitido)

**Ações:**
- "Navegar" → abre app de navegação externo
- "Ligar Cliente" → `Linking.openURL('tel:...')`
- "Cheguei no Local" → atualiza status → habilita confirmação
- "Confirmar Coleta" → upload foto/PIN → muda para `in_transit`
- "Cheguei no Destino" → atualiza status → habilita finalização
- "Finalizar Entrega" → upload foto/PIN/nome → muda para `completed`

**Backend:**
- `POST /rides/:rideId/status`
  ```json
  {
    "status": "driver_arrived_pickup",
    "location": {...},
    "timestamp": "2026-05-19T23:40:00Z"
  }
  ```
- `POST /rides/:rideId/proof/pickup`
  ```json
  {
    "photo": "base64...",
    "pin": "1234",
    "notes": "Pacote em perfeito estado",
    "location": {...},
    "timestamp": "2026-05-19T23:42:00Z"
  }
  ```
- `POST /rides/:rideId/proof/delivery`
  ```json
  {
    "photo": "base64...",
    "pin": "5678",
    "receiverName": "João Silva",
    "signature": "base64...",
    "notes": "Entregue ao porteiro",
    "location": {...},
    "timestamp": "2026-05-19T23:55:00Z"
  }
  ```

---

#### Tela 3.2: Cancelamento Durante Entrega
**Arquivo:** `src/screens/(authenticated)/Driver/DriverCancelRideScreen.tsx`

**Objetivo:** Permitir cancelamento com justificativa

**Layout:**
```
┌─────────────────────────────────┐
│ ← Cancelar Entrega              │
├─────────────────────────────────┤
│ ⚠️  Atenção                     │
│                                 │
│ Cancelar após aceitar pode      │
│ afetar sua avaliação            │
│                                 │
├─────────────────────────────────┤
│ Motivo do cancelamento:         │
│                                 │
│ ○ Cliente não atende            │
│ ○ Endereço incorreto            │
│ ○ Pacote não corresponde        │
│ ○ Problema com veículo          │
│ ○ Emergência pessoal            │
│ ○ Outro                         │
│                                 │
├─────────────────────────────────┤
│ Observações (obrigatório):      │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⚠️  Impacto:                    │
│ • Sua taxa de cancelamento      │
│   aumentará                     │
│ • Cliente será notificado       │
│ • Suporte pode entrar em contato│
│                                 │
│    [Confirmar Cancelamento]     │
│    [Voltar]                     │
└─────────────────────────────────┘
```

**Componentes:**
- Aviso de impacto
- Lista de motivos (radio buttons)
- Campo de observações
- Card de consequências
- Botões de ação

**Validações:**
- Motivo obrigatório
- Observações obrigatórias (mínimo 20 caracteres)

**Regras por Fase:**
- **Antes da coleta**: cancelamento mais flexível
- **Após coleta**: pode exigir devolução ou taxa
- **Próximo à entrega**: impacto maior na avaliação

**Backend:**
- `POST /rides/:rideId/cancel`
  ```json
  {
    "cancelledBy": "driver",
    "reason": "cliente_nao_atende",
    "notes": "Liguei 3 vezes, ninguém atendeu",
    "phase": "going_to_pickup"
  }
  ```

---

### FASE 4: CONCLUSÃO

#### Tela 4.1: Entrega Concluída
**Arquivo:** `src/screens/(authenticated)/Driver/DriverRideCompletedScreen.tsx`

**Objetivo:** Mostrar ganhos e solicitar avaliação

**Layout:**
```
┌─────────────────────────────────┐
│ ✅ Entrega Concluída!           │
├─────────────────────────────────┤
│ 💰 Seus Ganhos                  │
│ ┌─────────────────────────────┐ │
│ │ Valor da entrega: R$ 25,00  │ │
│ │ Taxa Leva Mais:   R$  3,00  │ │
│ │ ─────────────────────────── │ │
│ │ Você recebeu:    R$ 22,00  │ │
│ │                             │ │
│ │ 💳 Disponível na carteira   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⏱️  Tempo Total             │ │
│ │ 23 minutos                  │ │
│ │                             │ │
│ │ 📍 Distância Percorrida     │ │
│ │ 11.2 km                     │ │
│ │                             │ │
│ │ 📊 Hoje                     │ │
│ │ 9 entregas • R$ 202,00      │ │
│ └─────────────────────────────┘ │
│                                 │
│      [Avaliar Cliente]          │
│      [Próxima Entrega]          │
│      [Ver Detalhes]             │
└─────────────────────────────────┘
```

**Componentes:**
- Header de sucesso
- Card de ganhos (valor, taxa, líquido)
- Card de métricas (tempo, distância, total do dia)
- Botões de ação

**Estados:**
- ✅ Normal: entrega concluída
- ⏳ Processando pagamento
- ❌ Erro no pagamento

**Ação:**
- "Avaliar Cliente" → navega para `DriverRateClientScreen`
- "Próxima Entrega" → volta para `DriverHome` (online)
- "Ver Detalhes" → mostra detalhes completos da entrega

---

#### Tela 4.2: Avaliar Cliente
**Arquivo:** `src/screens/(authenticated)/Driver/DriverRateClientScreen.tsx`

**Objetivo:** Coletar feedback sobre o cliente

**Layout:**
```
┌─────────────────────────────────┐
│ ← Avaliar Cliente               │
├─────────────────────────────────┤
│ 👤 João Silva                   │
│                                 │
│ Como foi sua experiência?       │
│                                 │
│    ⭐ ⭐ ⭐ ⭐ ⭐               │
│                                 │
├─────────────────────────────────┤
│ O que você achou?               │
│                                 │
│ ✅ Respondeu rápido             │
│ ✅ Local correto                │
│ ✅ Pacote pronto                │
│ ⬜ Educado                      │
│ ⬜ Pagamento sem problema       │
│                                 │
├─────────────────────────────────┤
│ Comentário (opcional)           │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│        [Enviar Avaliação]       │
│        [Pular]                  │
└─────────────────────────────────┘
```

**Componentes:**
- Info do cliente
- Seletor de estrelas (1-5)
- Tags de feedback
- Campo de comentário
- Botões de ação

**Tags Sugeridas:**
- ✅ Respondeu rápido
- ✅ Local correto
- ✅ Pacote pronto
- ✅ Educado
- ✅ Pagamento sem problema
- ✅ Instruções claras
- ❌ Demorou muito
- ❌ Endereço errado
- ❌ Pacote não estava pronto

**Backend:**
- `POST /rides/:rideId/rate-client`
  ```json
  {
    "rating": 5,
    "tags": ["respondeu_rapido", "local_correto", "pacote_pronto"],
    "comment": "Cliente muito atencioso!"
  }
  ```

---

## 🔧 LÓGICA E REGRAS DO BACKEND

### Arquitetura de Estados da Ride

**Modelo:** `backend/src/models/Ride.js`

**Estados Possíveis:**
```javascript
const RIDE_STATUSES = {
  // Fase 1: Criação e Negociação
  'searching_driver': 'Buscando entregadores',
  'offers_received': 'Propostas recebidas',
  
  // Fase 2: Seleção e Pagamento
  'driver_selected': 'Motorista selecionado (aguardando pagamento)',
  'payment_pending': 'Pagamento pendente',
  'payment_failed': 'Pagamento falhou',
  'driver_assigned': 'Motorista confirmado (pagamento OK)',
  
  // Fase 3: Execução
  'driver_going_to_pickup': 'Indo para coleta',
  'driver_arrived_pickup': 'Chegou na coleta',
  'picking_up': 'Coletando pacote',
  'in_transit': 'A caminho da entrega',
  'driver_arrived_dropoff': 'Chegou no destino',
  'delivering': 'Entregando pacote',
  
  // Fase 4: Conclusão
  'completed': 'Concluído',
  'cancelled': 'Cancelado',
  'disputed': 'Em disputa'
};
```

**Transições Válidas:**
```javascript
const VALID_TRANSITIONS = {
  'searching_driver': ['offers_received', 'cancelled'],
  'offers_received': ['driver_selected', 'cancelled'],
  'driver_selected': ['payment_pending', 'cancelled'],
  'payment_pending': ['driver_assigned', 'payment_failed', 'cancelled'],
  'payment_failed': ['payment_pending', 'cancelled'],
  'driver_assigned': ['driver_going_to_pickup', 'cancelled'],
  'driver_going_to_pickup': ['driver_arrived_pickup', 'cancelled'],
  'driver_arrived_pickup': ['picking_up', 'cancelled'],
  'picking_up': ['in_transit', 'cancelled'],
  'in_transit': ['driver_arrived_dropoff', 'cancelled'],
  'driver_arrived_dropoff': ['delivering', 'cancelled'],
  'delivering': ['completed', 'cancelled'],
  'completed': ['disputed'],
  'cancelled': ['disputed']
};
```

---

### Regras de Negociação

**Arquivo:** `backend/src/services/pricing-engine.js`

**Cálculo de Faixa Sugerida:**
```javascript
function calculatePricingRange(params) {
  const {
    distance,        // km
    duration,        // minutos
    vehicleType,     // moto/carro/van
    cargoSize,       // pequeno/médio/grande
    priority,        // normal/urgente
    timeOfDay,       // hora do dia
    demandLevel      // baixa/média/alta
  } = params;

  // Base fare
  let baseFare = 5.00;
  
  // Distance fare (R$/km)
  const distanceRates = {
    'moto': 1.50,
    'car': 2.00,
    'van': 3.00
  };
  let distanceFare = distance * distanceRates[vehicleType];
  
  // Time fare (R$/min)
  let timeFare = duration * 0.30;
  
  // Cargo size multiplier
  const cargoMultipliers = {
    'small': 1.0,
    'medium': 1.2,
    'large': 1.5
  };
  let cargoMultiplier = cargoMultipliers[cargoSize];
  
  // Priority multiplier
  let priorityMultiplier = priority === 'urgent' ? 1.3 : 1.0;
  
  // Time of day multiplier (pico)
  let timeMultiplier = 1.0;
  const hour = new Date(timeOfDay).getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    timeMultiplier = 1.2; // Horário de pico
  }
  
  // Demand multiplier
  const demandMultipliers = {
    'low': 0.9,
    'medium': 1.0,
    'high': 1.3
  };
  let demandMultiplier = demandMultipliers[demandLevel];
  
  // Calculate base price
  let basePrice = (baseFare + distanceFare + timeFare) 
    * cargoMultiplier 
    * priorityMultiplier 
    * timeMultiplier 
    * demandMultiplier;
  
  // Calculate range (±20%)
  let suggestedMin = basePrice * 0.8;
  let suggestedMax = basePrice * 1.2;
  
  // Absolute limits (±50%)
  let allowedMin = basePrice * 0.5;
  let allowedMax = basePrice * 1.5;
  
  // Platform fee (12%)
  let platformFeeRate = 0.12;
  
  return {
    basePrice: round(basePrice),
    suggestedMin: round(suggestedMin),
    suggestedMax: round(suggestedMax),
    allowedMin: round(allowedMin),
    allowedMax: round(allowedMax),
    platformFeeRate,
    breakdown: {
      baseFare,
      distanceFare,
      timeFare,
      cargoMultiplier,
      priorityMultiplier,
      timeMultiplier,
      demandMultiplier
    }
  };
}
```

**Validação de Ofertas:**
```javascript
function validateOffer(clientOffer, pricingRange) {
  const { allowedMin, allowedMax } = pricingRange;
  
  if (clientOffer < allowedMin) {
    return {
      valid: false,
      error: 'Oferta abaixo do mínimo permitido',
      suggestedMin: allowedMin
    };
  }
  
  if (clientOffer > allowedMax) {
    return {
      valid: false,
      error: 'Oferta acima do máximo permitido',
      suggestedMax: allowedMax
    };
  }
  
  return { valid: true };
}
```

**Cálculo de Ganhos do Motorista:**
```javascript
function calculateDriverEarnings(agreedPrice, platformFeeRate = 0.12) {
  const platformFee = agreedPrice * platformFeeRate;
  const driverEarnings = agreedPrice - platformFee;
  
  return {
    agreedPrice: round(agreedPrice),
    platformFee: round(platformFee),
    driverEarnings: round(driverEarnings),
    platformFeeRate
  };
}
```

---

### Regras de Cancelamento

**Arquivo:** `backend/src/services/cancellation-rules.js`

**Taxas por Fase:**
```javascript
const CANCELLATION_RULES = {
  // Cliente cancela
  client: {
    'searching_driver': {
      fee: 0,
      refund: 100,
      impact: 'none'
    },
    'offers_received': {
      fee: 0,
      refund: 100,
      impact: 'none'
    },
    'driver_selected': {
      fee: 0,
      refund: 100,
      impact: 'none'
    },
    'driver_assigned': {
      fee: 5.00,
      refund: 95,
      impact: 'low'
    },
    'driver_going_to_pickup': {
      fee: 8.00,
      refund: 92,
      impact: 'medium'
    },
    'driver_arrived_pickup': {
      fee: 12.00,
      refund: 88,
      impact: 'high'
    },
    'picking_up': {
      fee: 15.00,
      refund: 85,
      impact: 'high'
    },
    'in_transit': {
      fee: 0,
      refund: 0,
      impact: 'critical',
      note: 'Após coleta, cancelamento exige suporte'
    }
  },
  
  // Motorista cancela
  driver: {
    'driver_assigned': {
      penalty: 'warning',
      impact: 'low'
    },
    'driver_going_to_pickup': {
      penalty: 'warning',
      impact: 'medium'
    },
    'driver_arrived_pickup': {
      penalty: 'strike',
      impact: 'high'
    },
    'picking_up': {
      penalty: 'strike',
      impact: 'high'
    },
    'in_transit': {
      penalty: 'suspension_review',
      impact: 'critical',
      note: 'Após coleta, cancelamento exige justificativa forte'
    }
  }
};
```

**Lógica de Aplicação:**
```javascript
async function applyCancellationRules(rideId, cancelledBy, reason, currentStatus) {
  const ride = await Ride.findById(rideId);
  const rules = CANCELLATION_RULES[cancelledBy][currentStatus];
  
  if (!rules) {
    throw new Error('Cancelamento não permitido nesta fase');
  }
  
  // Se cliente cancela
  if (cancelledBy === 'client') {
    if (rules.fee > 0) {
      // Cobrar taxa de cancelamento
      await chargeCancellationFee(ride.clientId, rules.fee);
      
      // Compensar motorista
      if (ride.driverId) {
        await creditDriver(ride.driverId, rules.fee * 0.8);
      }
    }
    
    // Reembolsar se aplicável
    if (rules.refund > 0 && ride.paymentId) {
      const refundAmount = ride.finalPrice * (rules.refund / 100);
      await processRefund(ride.paymentId, refundAmount);
    }
  }
  
  // Se motorista cancela
  if (cancelledBy === 'driver') {
    // Registrar penalidade
    await registerDriverPenalty(ride.driverId, {
      type: rules.penalty,
      rideId,
      reason,
      status: currentStatus
    });
    
    // Liberar ride para outros motoristas se antes da coleta
    if (currentStatus !== 'in_transit') {
      ride.status = 'searching_driver';
      ride.driverId = null;
      await ride.save();
      
      // Notificar outros motoristas
      await notifyAvailableDrivers(ride);
    }
  }
  
  // Atualizar ride
  ride.status = 'cancelled';
  ride.cancellationReason = reason;
  ride.cancelledBy = cancelledBy;
  ride.cancelledAt = new Date();
  await ride.save();
  
  return {
    success: true,
    fee: rules.fee || 0,
    refund: rules.refund || 0,
    penalty: rules.penalty || 'none'
  };
}
```

---

### Regras de Timeout

**Timeouts Configuráveis:**
```javascript
const TIMEOUTS = {
  // Tempo para receber propostas
  searchingDriver: 10 * 60 * 1000, // 10 minutos
  
  // Tempo para cliente confirmar pagamento após selecionar motorista
  paymentConfirmation: 5 * 60 * 1000, // 5 minutos
  
  // Tempo para motorista chegar na coleta
  goingToPickup: 30 * 60 * 1000, // 30 minutos
  
  // Tempo para confirmar coleta após chegar
  pickupConfirmation: 10 * 60 * 1000, // 10 minutos
  
  // Tempo para chegar no destino
  goingToDropoff: 60 * 60 * 1000, // 60 minutos
  
  // Tempo para confirmar entrega após chegar
  deliveryConfirmation: 10 * 60 * 1000 // 10 minutos
};
```

**Ações Automáticas:**
```javascript
async function handleTimeout(rideId, phase) {
  const ride = await Ride.findById(rideId);
  
  switch (phase) {
    case 'searching_driver':
      // Sugerir aumentar oferta
      await notifyClient(ride.clientId, {
        type: 'timeout_no_offers',
        message: 'Nenhuma proposta recebida. Deseja aumentar a oferta?'
      });
      break;
      
    case 'payment_confirmation':
      // Liberar motorista
      await releaseDriver(ride.driverId);
      ride.status = 'cancelled';
      ride.cancellationReason = 'payment_timeout';
      await ride.save();
      break;
      
    case 'going_to_pickup':
      // Alertar suporte
      await alertSupport({
        rideId,
        issue: 'driver_not_arriving',
        eta_exceeded: true
      });
      break;
      
    case 'pickup_confirmation':
      // Solicitar confirmação urgente
      await notifyDriver(ride.driverId, {
        type: 'urgent_confirmation_needed',
        message: 'Por favor, confirme a coleta do pacote'
      });
      break;
  }
}
```

---

### Sistema de Avaliações

**Modelo:** `backend/src/models/Rating.js`

**Cálculo de Média:**
```javascript
async function updateUserRating(userId, userType) {
  const ratings = await Rating.find({
    [userType === 'client' ? 'clientId' : 'driverId']: userId
  });
  
  if (ratings.length === 0) return;
  
  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / ratings.length;
  
  // Calcular distribuição de tags
  const tagCounts = {};
  ratings.forEach(r => {
    r.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  // Top 3 tags
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
  
  // Atualizar usuário
  await User.findByIdAndUpdate(userId, {
    rating: averageRating.toFixed(2),
    totalRatings: ratings.length,
    topTags
  });
}
```

**Prevenção de Duplicatas:**
```javascript
async function createRating(rideId, raterId, ratedId, ratingData) {
  // Verificar se já avaliou
  const existing = await Rating.findOne({ rideId, raterId });
  if (existing) {
    throw new Error('Você já avaliou esta entrega');
  }
  
  // Criar avaliação
  const rating = await Rating.create({
    rideId,
    raterId,
    ratedId,
    rating: ratingData.rating,
    tags: ratingData.tags,
    comment: ratingData.comment,
    createdAt: new Date()
  });
  
  // Atualizar média do usuário
  await updateUserRating(ratedId, ratingData.userType);
  
  return rating;
}
```

---

### Tracking GPS

**Modelo:** `backend/src/models/RideTrackPoint.js`

**Schema:**
```javascript
const RideTrackPointSchema = new Schema({
  rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  accuracy: Number,
  speed: Number,
  heading: Number,
  phase: {
    type: String,
    enum: ['to_pickup', 'to_dropoff'],
    required: true
  },
  capturedAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index geoespacial
RideTrackPointSchema.index({ location: '2dsphere' });
RideTrackPointSchema.index({ rideId: 1, capturedAt: 1 });
```

**Persistência Otimizada:**
```javascript
async function saveTrackPoint(data) {
  const { rideId, driverId, latitude, longitude, accuracy, speed, heading, phase } = data;
  
  // Buscar último ponto
  const lastPoint = await RideTrackPoint.findOne({ rideId })
    .sort({ capturedAt: -1 });
  
  // Calcular distância do último ponto
  if (lastPoint) {
    const distance = calculateDistance(
      lastPoint.location.coordinates[1],
      lastPoint.location.coordinates[0],
      latitude,
      longitude
    );
    
    // Só salvar se moveu mais de 50 metros ou passou 30 segundos
    const timeDiff = Date.now() - lastPoint.capturedAt.getTime();
    if (distance < 0.05 && timeDiff < 30000) {
      return; // Ignorar ponto muito próximo
    }
  }
  
  // Salvar ponto
  await RideTrackPoint.create({
    rideId,
    driverId,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    accuracy,
    speed,
    heading,
    phase,
    capturedAt: new Date()
  });
}
```

**Auditoria de Rota:**
```javascript
async function generateRouteAudit(rideId) {
  const ride = await Ride.findById(rideId);
  const trackPoints = await RideTrackPoint.find({ rideId })
    .sort({ capturedAt: 1 });
  
  if (trackPoints.length === 0) {
    return { error: 'Nenhum ponto GPS registrado' };
  }
  
  // Separar por fase
  const toPickup = trackPoints.filter(p => p.phase === 'to_pickup');
  const toDropoff = trackPoints.filter(p => p.phase === 'to_dropoff');
  
  // Calcular distância real
  const distanceToPickup = calculateRouteDistance(toPickup);
  const distanceToDropoff = calculateRouteDistance(toDropoff);
  const totalDistance = distanceToPickup + distanceToDropoff;
  
  // Calcular tempo real
  const timeToPickup = toPickup.length > 0
    ? toPickup[toPickup.length - 1].capturedAt - toPickup[0].capturedAt
    : 0;
  const timeToDropoff = toDropoff.length > 0
    ? toDropoff[toDropoff.length - 1].capturedAt - toDropoff[0].capturedAt
    : 0;
  
  // Verificar divergências
  const expectedDistance = ride.distance;
  const distanceDivergence = ((totalDistance - expectedDistance) / expectedDistance) * 100;
  
  // Verificar se confirmações foram no local correto
  const pickupConfirmationPoint = await findPointNearTime(
    trackPoints,
    ride.pickupConfirmedAt
  );
  const deliveryConfirmationPoint = await findPointNearTime(
    trackPoints,
    ride.deliveryConfirmedAt
  );
  
  const pickupLocationMatch = pickupConfirmationPoint
    ? calculateDistance(
        pickupConfirmationPoint.location.coordinates[1],
        pickupConfirmationPoint.location.coordinates[0],
        ride.pickupLocation.latitude,
        ride.pickupLocation.longitude
      ) < 0.1 // 100 metros
    : false;
  
  const deliveryLocationMatch = deliveryConfirmationPoint
    ? calculateDistance(
        deliveryConfirmationPoint.location.coordinates[1],
        deliveryConfirmationPoint.location.coordinates[0],
        ride.dropoffLocation.latitude,
        ride.dropoffLocation.longitude
      ) < 0.1
    : false;
  
  return {
    totalPoints: trackPoints.length,
    distanceToPickup: round(distanceToPickup),
    distanceToDropoff: round(distanceToDropoff),
    totalDistance: round(totalDistance),
    expectedDistance: round(expectedDistance),
    distanceDivergence: round(distanceDivergence),
    timeToPickup: formatDuration(timeToPickup),
    timeToDropoff: formatDuration(timeToDropoff),
    pickupLocationMatch,
    deliveryLocationMatch,
    alerts: [
      distanceDivergence > 20 && 'Rota divergiu mais de 20% do esperado',
      !pickupLocationMatch && 'Coleta confirmada longe do endereço',
      !deliveryLocationMatch && 'Entrega confirmada longe do endereço'
    ].filter(Boolean)
  };
}
```

---

## 🖥️ ADMIN WEB: PAINEL DE CONTROLE

### Tela: Lista de Entregas

**Arquivo:** `leva-mais-web/app/rides/page.tsx`

**Objetivo:** Monitorar todas as entregas em tempo real

**Funcionalidades:**
- Filtros avançados (status, cidade, período, motorista, cliente)
- Busca por ID, nome, telefone
- Ordenação por data, valor, status
- Exportação CSV/Excel
- Atualização em tempo real via WebSocket

**Colunas:**
- ID da entrega
- Data/hora
- Cliente (nome, foto, avaliação)
- Motorista (nome, foto, avaliação)
- Status (badge colorido)
- Origem → Destino
- Distância
- Valor acordado
- Taxa plataforma
- Ganho motorista
- Método de pagamento
- Ações (ver detalhes, cancelar, suporte)

**Badges de Status:**
```javascript
const STATUS_BADGES = {
  'searching_driver': { color: 'blue', text: 'Buscando' },
  'offers_received': { color: 'cyan', text: 'Propostas' },
  'driver_assigned': { color: 'purple', text: 'Confirmado' },
  'driver_going_to_pickup': { color: 'orange', text: 'Indo coleta' },
  'in_transit': { color: 'yellow', text: 'Em trânsito' },
  'completed': { color: 'green', text: 'Concluído' },
  'cancelled': { color: 'red', text: 'Cancelado' },
  'disputed': { color: 'pink', text: 'Disputa' }
};
```

---

### Drawer: Detalhes da Entrega

**Objetivo:** Auditoria completa de uma entrega

**Abas:**

#### 1. Resumo
- Info do cliente e motorista
- Endereços completos
- Detalhes do pacote
- Status atual
- Timeline resumida

#### 2. Financeiro
- Valor acordado
- Taxa da plataforma
- Ganho do motorista
- Método de pagamento
- Status do pagamento
- Histórico de transações
- Reembolsos (se houver)

#### 3. Negociação
- Oferta inicial do cliente
- Faixa sugerida
- Lista de propostas recebidas
- Contrapropostas
- Proposta aceita
- Timeline da negociação

#### 4. Timeline
- Todos os eventos com timestamp
- Mudanças de status
- Ações do cliente
- Ações do motorista
- Eventos automáticos
- Notificações enviadas

#### 5. Mapa e Rota
- Mapa interativo
- Rota estimada (Google)
- Rota real percorrida (GPS)
- Marcadores de eventos:
  - Aceite do motorista
  - Chegada na coleta
  - Confirmação da coleta
  - Chegada no destino
  - Confirmação da entrega
- Métricas:
  - Distância real vs estimada
  - Tempo real vs estimado
  - Divergência de rota
  - Velocidade média
- Alertas de divergência

#### 6. Comprovantes
- Foto da coleta
- PIN da coleta (se usado)
- Observações da coleta
- Foto da entrega
- PIN da entrega (se usado)
- Nome do recebedor
- Assinatura (se houver)
- Observações da entrega
- Timestamps e localização de cada comprovante

#### 7. Avaliações
- Avaliação do cliente sobre o motorista
- Avaliação do motorista sobre o cliente
- Tags selecionadas
- Comentários
- Data das avaliações

#### 8. Cancelamento/Disputa
- Motivo do cancelamento
- Quem cancelou
- Fase em que foi cancelado
- Taxa aplicada
- Reembolso processado
- Observações
- Histórico de disputas
- Ações do suporte

---

### Tela: Configuração de Preços

**Arquivo:** `leva-mais-web/app/settings/pricing/page.tsx`

**Objetivo:** Configurar algoritmo de precificação

**Seções:**

#### Tarifas Base
- Tarifa base (R$)
- Tarifa por km (moto/carro/van)
- Tarifa por minuto
- Taxa da plataforma (%)

#### Multiplicadores
- Tamanho da carga (pequeno/médio/grande)
- Prioridade (normal/urgente)
- Horário de pico (manhã/tarde/noite)
- Demanda (baixa/média/alta)

#### Limites
- Faixa sugerida (% do preço base)
- Limites absolutos (% do preço base)
- Valor mínimo por entrega
- Valor máximo por entrega

#### Regras Especiais
- Desconto por volume (motorista)
- Bônus por avaliação alta
- Taxa extra por ajudante
- Taxa extra por área de risco

---

## 📋 PRIORIDADES DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Crítico)
**Objetivo:** Garantir que o fluxo básico funcione corretamente

**Backend:**
- ✅ Modelo de Ride com todos os estados
- ✅ Sistema de ofertas e contrapropostas
- ✅ Cálculo de precificação dinâmica
- ✅ Validação de transições de estado
- ⚠️ **CORRIGIR:** Pagamento deve vir APÓS seleção do motorista
- ⚠️ **CORRIGIR:** `selectOffer` não deve atribuir motorista até pagamento confirmado

**App Cliente:**
- ✅ Telas de solicitação (endereços, setup, review)
- ✅ Tela de busca de entregadores
- ✅ Marketplace de propostas
- ⚠️ **CRIAR:** `DeliveryPaymentConfirmScreen` (após selecionar motorista)
- ⚠️ **REFATORAR:** `DeliverySetup` remover seleção de pagamento
- ✅ Tela de rastreamento
- ✅ Tela de conclusão e avaliação

**App Motorista:**
- ✅ Tela de solicitações
- ✅ Tela de detalhes da oferta
- ⚠️ **CRIAR:** Estado "Aguardando pagamento do cliente"
- ✅ Tela de execução (DriverRideScreen)
- ⚠️ **ADICIONAR:** Evento "Cheguei no destino"
- ✅ Comprovação de coleta e entrega
- ✅ Tela de conclusão e avaliação

**Estimativa:** 2-3 semanas

---

### Fase 2: Operacional (Importante)
**Objetivo:** Garantir rastreabilidade e auditoria

**Backend:**
- ⚠️ **IMPLEMENTAR:** Persistência de pontos GPS (`RideTrackPoint`)
- ⚠️ **IMPLEMENTAR:** Eventos operacionais detalhados
- ⚠️ **IMPLEMENTAR:** Sistema de timeout automático
- ⚠️ **IMPLEMENTAR:** Regras de cancelamento por fase
- ⚠️ **IMPLEMENTAR:** Auditoria de rota (`generateRouteAudit`)

**App Motorista:**
- ⚠️ **MELHORAR:** Tracking GPS contínuo com `watchPositionAsync`
- ⚠️ **IMPLEMENTAR:** Fila offline de pontos GPS
- ⚠️ **IMPLEMENTAR:** Background location (se necessário)

**App Cliente:**
- ⚠️ **MELHORAR:** Timeline detalhada por fase
- ⚠️ **ADICIONAR:** Visualização de comprovantes em tempo real
- ⚠️ **MELHORAR:** Notificações de mudança de fase

**Admin Web:**
- ⚠️ **CRIAR:** Aba de rota percorrida no drawer
- ⚠️ **IMPLEMENTAR:** Visualização de mapa com rota real
- ⚠️ **IMPLEMENTAR:** Auditoria de divergências
- ⚠️ **MELHORAR:** Timeline completa com todos os eventos

**Estimativa:** 2-3 semanas

---

### Fase 3: Experiência (Desejável)
**Objetivo:** Melhorar UX e engajamento

**Backend:**
- Sistema de notificações push inteligente
- Algoritmo de matching por proximidade e avaliação
- Sistema de bônus e incentivos
- Analytics e métricas de negociação

**App Cliente:**
- Histórico de entregas com filtros
- Favoritos de endereços e motoristas
- Chat em tempo real
- Compartilhamento de rastreamento
- Estimativa de chegada dinâmica

**App Motorista:**
- Dashboard de ganhos e estatísticas
- Mapa de calor de demanda
- Sugestões de áreas rentáveis
- Sistema de metas e conquistas
- Histórico de entregas

**Admin Web:**
- Dashboard executivo
- Relatórios financeiros
- Analytics de negociação
- Heatmap de entregas
- Previsão de demanda

**Estimativa:** 3-4 semanas

---

### Fase 4: Escala (Futuro)
**Objetivo:** Preparar para crescimento

**Backend:**
- Cache distribuído (Redis)
- Fila de mensagens (RabbitMQ/SQS)
- Microserviços (separar pricing, tracking, payments)
- CDN para comprovantes
- Backup e disaster recovery

**Infraestrutura:**
- Auto-scaling
- Load balancing
- Monitoring e alertas
- CI/CD completo
- Testes automatizados

**Estimativa:** Contínuo

---

## 🎯 RESUMO EXECUTIVO DO FLUXO

### Cliente: 8 Passos Principais

1. **Home** → Escolhe "Entrega"
2. **Endereços** → Define coleta e entrega
3. **Configurar** → Define pacote e faz oferta inicial
4. **Revisar** → Confirma dados antes de publicar
5. **Buscando** → Aguarda propostas dos entregadores
6. **Propostas** → Escolhe o melhor entregador
7. **Pagamento** → Confirma forma de pagamento (APÓS escolher motorista)
8. **Rastreamento** → Acompanha em tempo real até conclusão

**Tempo estimado:** 2-5 minutos para solicitar + 15-45 minutos de entrega

---

### Motorista: 7 Passos Principais

1. **Home** → Fica disponível (online)
2. **Solicitações** → Vê entregas disponíveis
3. **Detalhes** → Analisa e decide (aceitar/propor/recusar)
4. **Aguardando** → Cliente confirma pagamento
5. **Coleta** → Vai até local, confirma com foto/PIN
6. **Entrega** → Vai até destino, confirma com foto/PIN/nome
7. **Conclusão** → Recebe pagamento e avalia cliente

**Tempo estimado:** 5-10 minutos de negociação + 15-45 minutos de execução

---

### Backend: Fluxo de Estados

```
searching_driver
    ↓
offers_received (motoristas propõem)
    ↓
driver_selected (cliente escolhe)
    ↓
payment_pending (cliente confirma pagamento) ← PONTO CRÍTICO
    ↓
driver_assigned (pagamento OK, motorista liberado)
    ↓
driver_going_to_pickup
    ↓
driver_arrived_pickup
    ↓
picking_up (comprovação de coleta)
    ↓
in_transit
    ↓
driver_arrived_dropoff
    ↓
delivering (comprovação de entrega)
    ↓
completed
```

**Cancelamento possível em qualquer fase, com regras específicas**

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Fluxo Cliente

- [ ] Cliente consegue criar entrega sem escolher pagamento antes
- [ ] Cliente vê faixa sugerida calculada pelo backend
- [ ] Cliente consegue aumentar oferta se não houver interesse
- [ ] Cliente vê todas as propostas (aceites e contrapropostas)
- [ ] Cliente consegue escolher motorista
- [ ] **APÓS escolher motorista**, cliente escolhe forma de pagamento
- [ ] Cliente só vai para rastreamento após pagamento confirmado
- [ ] Cliente vê status em tempo real durante toda a entrega
- [ ] Cliente vê comprovantes de coleta e entrega
- [ ] Cliente consegue avaliar motorista ao final
- [ ] Cliente pode cancelar com regras por fase

### Fluxo Motorista

- [ ] Motorista só vê entregas compatíveis com seu veículo
- [ ] Motorista vê valor líquido (após taxa da plataforma)
- [ ] Motorista consegue aceitar valor original
- [ ] Motorista consegue fazer contraproposta
- [ ] Motorista fica em "aguardando" após cliente selecionar
- [ ] Motorista só pode iniciar após confirmação de pagamento
- [ ] Motorista marca "cheguei na coleta"
- [ ] Motorista confirma coleta com foto/PIN obrigatório
- [ ] Motorista marca "cheguei no destino"
- [ ] Motorista confirma entrega com foto/PIN/nome obrigatório
- [ ] Motorista recebe pagamento imediatamente após conclusão
- [ ] Motorista consegue avaliar cliente ao final
- [ ] Motorista pode cancelar com penalidades por fase

### Backend

- [ ] Cálculo de preço considera todos os fatores
- [ ] Validação de ofertas dentro dos limites
- [ ] Transições de estado são validadas
- [ ] Pagamento só é processado após seleção do motorista
- [ ] Motorista só é atribuído após pagamento confirmado
- [ ] Pontos GPS são persistidos durante toda a entrega
- [ ] Comprovantes são armazenados com timestamp e localização
- [ ] Cancelamento aplica regras corretas por fase
- [ ] Timeouts disparam ações automáticas
- [ ] Avaliações atualizam média do usuário
- [ ] WebSocket notifica mudanças em tempo real

### Admin Web

- [ ] Lista todas as entregas com filtros
- [ ] Mostra status em tempo real
- [ ] Drawer de detalhes com todas as abas
- [ ] Aba de negociação mostra todas as propostas
- [ ] Aba de timeline mostra todos os eventos
- [ ] Aba de mapa mostra rota real percorrida
- [ ] Aba de comprovantes mostra fotos e detalhes
- [ ] Auditoria de rota detecta divergências
- [ ] Configuração de preços funciona corretamente

---

## 🚨 PONTOS CRÍTICOS DE ATENÇÃO

### 1. Pagamento Pós-Negociação
**Problema Atual:** `DeliverySetup` já envia `payment.method`

**Solução:**
- Remover seleção de pagamento de `DeliverySetup`
- Criar `DeliveryPaymentConfirmScreen` após seleção do motorista
- Backend: adicionar estado `payment_pending` entre `driver_selected` e `driver_assigned`
- Motorista fica em "aguardando" até pagamento confirmado

### 2. Atribuição do Motorista
**Problema Atual:** `selectOffer` já atribui motorista

**Solução:**
- `selectOffer` deve apenas marcar como `driver_selected`
- Criar endpoint `confirmPayment` que:
  - Processa pagamento
  - Atribui motorista (`driver_assigned`)
  - Notifica motorista para iniciar

### 3. Comprovação Obrigatória
**Problema Atual:** Pode não estar sendo validado

**Solução:**
- Backend deve validar foto obrigatória na coleta
- Backend deve validar foto + nome na entrega
- Não permitir mudança de status sem comprovação

### 4. Tracking GPS
**Problema Atual:** Pode não estar persistindo

**Solução:**
- Implementar modelo `RideTrackPoint`
- WebSocket ou endpoint para receber pontos
- Otimizar para não salvar pontos muito próximos
- Admin web consumir pontos para mostrar rota

### 5. Cancelamento por Fase
**Problema Atual:** Regras podem não estar implementadas

**Solução:**
- Implementar `cancellation-rules.js`
- Validar fase antes de permitir cancelamento
- Aplicar taxas/penalidades corretas
- Notificar ambas as partes

---

## 📊 MÉTRICAS DE SUCESSO

### Operacionais
- **Taxa de conversão:** % de solicitações que viram entregas
- **Tempo médio de negociação:** tempo até aceite
- **Taxa de aceite direto:** % que aceitam valor original
- **Taxa de contraproposta:** % que contrapropõem
- **Taxa de cancelamento:** % por fase
- **Tempo médio de entrega:** coleta até entrega

### Qualidade
- **Avaliação média cliente:** estrelas
- **Avaliação média motorista:** estrelas
- **Taxa de comprovação:** % com fotos válidas
- **Divergência de rota:** % média de desvio
- **Taxa de disputa:** % de entregas disputadas

### Financeiras
- **Valor médio por entrega:** R$
- **Taxa média da plataforma:** %
- **Ganho médio do motorista:** R$
- **Volume total:** R$ por dia/mês
- **Ticket médio por cliente:** R$

---

## 🎓 LIÇÕES DO INDRIVE

### O que copiar:
1. **Negociação livre:** cliente e motorista decidem o preço
2. **Transparência:** ambos veem faixas sugeridas
3. **Escolha do cliente:** mesmo com contrapropostas, cliente decide
4. **Sem imposição:** plataforma sugere, não força
5. **Marketplace:** cliente vê múltiplas opções

### O que adaptar:
1. **Comprovação:** inDriver não tem delivery, precisamos de fotos/PIN
2. **Tracking:** delivery precisa de rastreamento mais detalhado
3. **Fases:** coleta e entrega são eventos críticos
4. **Cancelamento:** regras diferentes antes/depois da coleta
5. **Pagamento:** confirmar após negociação, antes de iniciar

### O que evitar:
1. **Preço fixo:** mata o diferencial da negociação
2. **Pagamento antecipado:** cliente deve escolher após ver motorista
3. **Falta de limites:** ofertas absurdas prejudicam o sistema
4. **Sem auditoria:** delivery precisa de comprovação forte
5. **Timeout muito curto:** negociação precisa de tempo

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

### Semana 1-2: Correções Críticas
1. Refatorar `DeliverySetup` (remover pagamento)
2. Criar `DeliveryPaymentConfirmScreen`
3. Ajustar backend: adicionar estado `payment_pending`
4. Criar endpoint `confirmPayment`
5. Implementar estado "aguardando" no app motorista
6. Testar fluxo completo end-to-end

### Semana 3-4: Tracking e Comprovação
1. Implementar modelo `RideTrackPoint`
2. Melhorar tracking GPS no app motorista
3. Validar comprovações obrigatórias no backend
4. Implementar auditoria de rota
5. Criar aba de mapa no admin web
6. Testar divergências e alertas

### Semana 5-6: Cancelamento e Timeouts
1. Implementar regras de cancelamento por fase
2. Implementar sistema de timeouts
3. Criar telas de cancelamento melhoradas
4. Testar todos os cenários de cancelamento
5. Validar taxas e reembolsos

### Semana 7-8: Polimento e Testes
1. Melhorar UX de todas as telas
2. Adicionar loading states e error handling
3. Implementar notificações push
4. Testes de carga e performance
5. Testes com usuários reais (beta)
6. Ajustes finais baseados em feedback

---

## 📝 CONCLUSÃO

Este documento define o **fluxo completo e correto** para clientes e entregadores no estilo inDriver, com foco em:

✅ **Negociação justa e transparente**
✅ **Pagamento pós-negociação** (correção crítica)
✅ **Comprovação operacional forte**
✅ **Rastreamento completo**
✅ **Auditoria e controle**

### Diferencial Competitivo

O Leva Mais combina:
- **Flexibilidade do inDriver** (negociação de preço)
- **Confiabilidade do Uber** (rastreamento e comprovação)
- **Transparência do iFood** (visibilidade operacional)

### Próximo Passo Imediato

**PRIORIDADE MÁXIMA:** Corrigir o fluxo de pagamento
- Cliente NÃO escolhe pagamento em `DeliverySetup`
- Cliente escolhe pagamento APÓS selecionar motorista
- Motorista aguarda confirmação antes de iniciar

Isso é **crítico** para o modelo de negociação funcionar corretamente.

---

**Documento criado em:** 2026-05-19  
**Versão:** 1.0  
**Status:** Pronto para implementação  
**Próxima revisão:** Após implementação da Fase 1

---

## 📚 REFERÊNCIAS

- [inDrive Terms](https://lktcdn2.prixacdn.net/media/pdf_upload/Indrive.pdf)
- [Análise do inDrive](https://www.approsing.com/app/reviews/indrive-review)
- [Uber Package Delivery](https://www.uber.com/us/en/item-delivery/)
- [Uber Connect](https://www.uber.com/us/en/newsroom/uber-connect-holiday/)
- [DoorDash Shop & Deliver](https://help.doordash.com/en-us/dashers/article/what-is-doordash-shop-deliver)
- Documentação existente: `delivery-negotiation-flow-plan.md`
- Documentação existente: `delivery-screens-spec.md`

---

**FIM DO DOCUMENTO**
