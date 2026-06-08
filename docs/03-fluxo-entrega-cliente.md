# 03 — Fluxo de Entrega (Cliente)

## Visão Geral

O cliente solicita uma entrega definindo remetente, destinatário, tipo de carga e veículo. Motoristas fazem ofertas (marketplace estilo InDriver), o cliente escolhe um, acompanha em tempo real e avalia ao final.

---

## Jornada Completa — Passo a Passo

```
HomeScreen
    ↓ toca "Entrega"
DeliverySetupScreen          [escolhe tipo de veículo]
    ↓
DeliverySenderInfo           [dados do remetente (nome, fone, endereço)]
    ↓
[LocationPicker / DeliveryMapPicker]   [define endereço no mapa]
    ↓
DeliveryDetails              [dados do pacote: tamanho, peso, frágil, ajudante]
    ↓
DeliveryReview               [resumo completo + método de pagamento + PIN]
    ↓ POST /api/rides
OrderSentScreen              [pedido enviado, aguardando ofertas]
    ↓
RideOffersMarketplace        [marketplace de ofertas dos motoristas]
    ↓ POST /api/rides/:id/offers/select
DeliveryTracking             [motorista a caminho + mapa ao vivo]
    ↓
[Chat disponível]
    ↓ status: completed
RideCompleted                [tela de conclusão + avaliação]
    ↓
ClientRateDriver             [dar estrelas + comentário + gorjeta]
```

---

## Telas Detalhadas

### 1. `HomeScreen`
- Mapa centralizado na localização atual
- Botão de serviço: **Entrega** (e **Corrida**)
- Marcador mostrando motoristas próximos
- Bottom sheet de pedido ativo (se houver)
- Banner de notificações pendentes

**Comportamento esperado (referência Lalamove/iFood):**
- Ao abrir o app, GPS já centraliza o mapa
- Se há entrega ativa, reabre automaticamente o tracking

---

### 2. `DeliverySetupScreen`
**Parâmetros de entrada:** `vehicleType?`, `pickup?`, `dropoff?`, `preferScheduled?`

**O que o cliente faz:**
- Escolhe o tipo de veículo:
  - 🏍️ Moto — documentos, pequenos volumes, rápido
  - 🚗 Carro — médio volume
  - 🚐 Van — grande volume
  - 🚚 Caminhão — cargas pesadas / mudanças
- Define endereço de coleta e entrega
- Vê estimativa de distância, tempo e preço sugerido

**Comportamento esperado:**
- Preço calculado em tempo real conforme endereços mudam
- Mostra faixa de preço (mín–máx sugerido), como no InDriver
- Permite adicionar paradas intermediárias (taxa extra por parada)

---

### 3. `DeliverySenderInfo`
**O que o cliente informa:**
- **Modo**: Eu sou o remetente (padrão) ou Eu sou o destinatário
- **Remetente**: nome, telefone, endereço completo, complemento
- **Destinatário**: nome, telefone, endereço completo, instruções de entrega

**Integração com endereços favoritos:**
- Pode usar endereços salvos (casa, trabalho, favoritos)
- `FavoriteAddressFlow` abre para selecionar ou criar favorito

---

### 4. `DeliveryDetails`
Dados da carga:
| Campo | Opções |
|-------|--------|
| Tamanho | Pequeno (cabe em mochila), Médio (caixa), Grande (móvel) |
| Peso estimado | Até 5 kg / 5–15 kg / 15–30 kg / 30–50 kg / acima de 50 kg |
| Frágil? | Sim / Não (adiciona surcharge) |
| Precisa de ajudante? | Sim / Não (adiciona surcharge) |
| Prioridade | Econômico / Rápido / Urgente |
| Tipo de item | Texto livre (ex: "Eletrônico", "Roupa", "Alimento") |

Cada atributo aplica um multiplicador no preço final (ver [13-precificacao.md](./13-precificacao.md)).

---

### 5. `DeliveryReview`
Tela de confirmação antes de enviar o pedido.

**Exibe:**
- Mapa com rota A→B
- Endereço de coleta e entrega
- Dados do contato destinatário
- Preço sugerido (editável pelo cliente no modelo InDriver)
- Método de pagamento selecionado:
  - 💳 LevaPay (carteira interna) — escrow retido no aceite
  - 📱 PIX — QR code gerado após aceite
  - 💵 Dinheiro — pago ao motorista presencialmente
- PIN de entrega gerado automaticamente (6 dígitos)
  - O remetente passa o PIN ao destinatário
  - O motorista valida o PIN ao entregar

**Ação:** botão **"Solicitar Entrega"** → `POST /api/rides`

---

### 6. `OrderSentScreen`
- Confirmação de que o pedido foi criado
- Botão "Ver Ofertas" → `RideOffersMarketplace`
- Contagem regressiva do timeout de busca (padrão: 300 segundos)

---

### 7. `RideOffersMarketplace`
**Tela central do modelo InDriver para entregas.**

**O que é exibido por oferta:**
- Nome e foto do motorista
- Avaliação média (estrelas)
- Tipo e modelo do veículo
- **ETA real** (Google Maps distance matrix) — "chega em X min"
- **Distância até o ponto de coleta** — "X,X km de você"
- **Valor ofertado** pelo motorista
- Badge "Recomendado" (oferta com melhor custo-benefício ETA×preço)

**Ações do cliente:**
- ✅ **Selecionar oferta** → `POST /api/rides/:id/offers/select`
  - Confirma pagamento (reserva escrow se wallet)
  - Atribui o motorista
  - Status muda para `accepted`
- ↩️ **Contra-oferta** → `POST /api/rides/:id/offers/client-counter`
  - Propõe um valor diferente ao motorista
- 📈 **Aumentar oferta** → `POST /api/rides/:id/offers/increase`
  - Cliente eleva seu próprio lance para atrair mais motoristas
- ❌ **Recusar oferta individual** → `POST /api/rides/:id/offers/decline`

**Fluxo de negociação:**
```
Cliente cria pedido (com oferta inicial)
    ↓
Motoristas veem e respondem: aceita o valor, ou contra-oferta
    ↓
Cliente vê lista de ofertas ordenadas (Recomendado primeiro)
    ↓
Cliente seleciona → pagamento confirmado → motorista notificado
```

**Comportamento esperado:**
- Lista atualiza em tempo real via WebSocket
- Se nenhuma oferta em X minutos → sugerir aumentar o valor
- Botão de "aumentar oferta" bem visível quando timeout se aproxima

---

### 8. `DeliveryTracking`
Tela de rastreamento em tempo real.

**Estado: motorista a caminho da coleta (`driver_arriving`)**
- Mapa com localização do motorista em tempo real (atualiza a cada ~5 seg)
- Nome, foto, placa e modelo do veículo
- ETA dinâmico ("Chega em X min")
- Botão **Chat** → `ChatScreen`
- Botão **Cancelar** (taxa de cancelamento pode se aplicar)
- Botão **SOS** (emergência)

**Estado: motorista chegou (`arrived`)**
- Alerta "Motorista chegou ao local de coleta!"
- Motorista fotografa o pacote (prova de coleta)
- Motorista valida PIN de coleta (se habilitado)

**Estado: em transporte (`in_progress`)**
- Mapa com rota até destino
- "Em rota para o destinatário"
- Barra de progresso da rota
- Chat disponível

**Estado: entregue (`completed`)**
- Motorista fotografou entrega + validou PIN do destinatário
- Navega para `RideCompleted`

**Estado: falha na entrega (`delivery_failed`)**
- Destinatário ausente / endereço errado / recusou receber
- Motorista inicia devolução ao remetente
- Cliente é informado e cobra tarifa de retorno

---

### 9. `RideCompleted` (Entrega)
Exibe:
- Resumo da entrega (origem, destino, distância)
- Valor cobrado
- Método de pagamento usado
- Botão **Avaliar motorista** → `ClientRateDriver`
- Botão **Ver comprovante** → `Receipts`
- Botão **Pedir de novo** (repete os endereços)

---

### 10. `ClientRateDriver`
- 1–5 estrelas
- Comentário opcional
- Tags rápidas (ex: "Cuidadoso", "Pontual", "Comunicativo")
- Botão **Dar gorjeta** → `TipDriver`

---

## Eventos WebSocket Relevantes

| Evento recebido | Quando | O que fazer |
|----------------|--------|-------------|
| `new-offer` | Motorista enviou oferta | Adiciona na lista do marketplace |
| `offer-updated` | Motorista atualizou oferta | Atualiza item na lista |
| `delivery-accepted` | Oferta selecionada confirmada | Navega para DeliveryTracking |
| `driver-location-updated` | GPS do motorista | Atualiza marcador no mapa |
| `ride-status-updated` | Status mudou | Atualiza HUD e ações disponíveis |
| `new-message` | Motorista enviou mensagem | Badge no botão Chat |
| `delivery-completed` | Entrega finalizada | Navega para RideCompleted |
| `balance_updated` | Saldo LevaPay mudou | Atualiza display do saldo |

---

## Regras de Negócio Importantes

1. **PIN de entrega** é gerado pelo app, passado pelo cliente ao destinatário por fora (WhatsApp, telefone). Motorista digita o PIN ao entregar — invalida a tentativa de fraude.

2. **Foto de coleta** (pickup proof): motorista fotografa o pacote antes de sair da coleta. Protege o motorista de falsas alegações de não-coleta.

3. **Foto de entrega** (delivery proof): motorista fotografa ao entregar. Prova de que a entrega foi feita.

4. **Escrow** (pagamento LevaPay): o valor é travado na carteira do cliente no momento da seleção da oferta (`selectOffer`). Liberado ao motorista apenas em `completed`. Estornado em `cancelled_*`.

5. **Falha de entrega** (`delivery_failed`): se o destinatário não está / endereço errado / recusou:
   - Motorista registra motivo + foto
   - Status muda para `delivery_failed`
   - Inicia processo de devolução ao remetente
   - Cliente é cobrado pelo percurso (ida + volta)
   - Motorista recebe valor total + bônus

6. **Oferta inicial** do cliente é sugerida pelo sistema baseado no preço calculado. O cliente pode ajustar livremente (modelo InDriver).
