# 05 — Fluxo do Motorista

## Visão Geral

O motorista usa o app para receber pedidos, executar a corrida/entrega e receber pagamento. O modelo de negócio é de **pré-pagamento**: o motorista mantém saldo (`driverBalance`) e a taxa da plataforma é debitada desse saldo ao completar cada corrida.

---

## Pré-requisitos para Trabalhar

1. `driverStatus: "approved"` — documentos aprovados pelo admin
2. `driverBalance.balance > 0` — saldo positivo na conta (depósito operacional)
3. Pelo menos 1 veículo aprovado e ativo
4. App aberto e online

---

## Tela Principal do Motorista

### `DriverScreen` (componente central)
- **Botão Online/Offline** (toggle switch)
  - Online: GPS começa a ser compartilhado, pedidos chegam
  - Offline: invisível para clientes, sem pedidos
- Mapa com posição atual
- HUD com status do pedido ativo
- Saldo atual `driverBalance.balance`
- Estatísticas do dia (corridas, ganhos, tempo online)

---

## Ficar Online

```
POST /api/driver/go-online
```
- Valida `driverStatus === "approved"`
- Valida `driverBalance.balance >= minRequiredBalance` (configurável)
- Inicia heartbeat de localização (GPS a cada ~5 seg)
- Motorista aparece no mapa dos clientes

```
POST /api/driver/go-offline
```
- Para de receber pedidos
- Para o heartbeat de GPS

---

## Fluxo de Recebimento de Pedido

### Para Corridas (Preço Fixo)
```
[Notificação push] + WebSocket: "new-ride-request"
    ↓
DriverRequestCard aparece no mapa
    (nome do cliente, distância, endereço, valor)
    ↓
⏱️ Timer de 30 segundos para aceitar
    ↓
[Aceitar] → POST /api/rides/:id/accept
[Rejeitar] → POST /api/rides/:id/reject (ou ignora → timeout → próximo motorista)
```

### Para Entregas (Marketplace/Negociação)
```
GET /api/rides/available-requests   (poll ou WebSocket: "new-delivery-available")
    ↓
DriverShiftOffersScreen  ou  lista no mapa
    (endereços, distância, tamanho da carga, valor do cliente)
    ↓
[Fazer Oferta] → POST /api/rides/:id/offers/respond
    { amount: 45.00, message: "Posso buscar em 10 min" }
    ↓
Cliente analisa ofertas no marketplace e seleciona
    ↓
WebSocket: "offer-selected"  (motorista selecionado é notificado)
    ↓
Status muda para accepted → motorista inicia execução
```

**Negociações pendentes:**
```
GET /api/rides/negotiations/pending
```
Lista todas as corridas/entregas onde o motorista já fez oferta e aguarda resposta do cliente.

---

## Execução da Corrida/Entrega

### Estados e Ações do Motorista

```
accepted
    ↓ motorista se desloca ao pickup
    [Botão: "Cheguei ao local"] → PATCH /api/rides/:id/status { status: "arrived" }
    
arrived
    ↓ cliente entra no carro (corrida) / motorista coleta o pacote (entrega)
    [Para corrida] → [Iniciar corrida] → status: "in_progress"
    [Para entrega] →
        1. Fotografia do pacote (POST /api/rides/:id/proof/pickup)
        2. Validar PIN de coleta (POST /api/rides/:id/validate-pin { pin, phase: "pickup" })
        3. [Iniciar entrega] → status: "in_progress"

in_progress
    ↓ motorista navega até o destino
    [Para corrida] → [Finalizar corrida] → status: "completed"
    [Para entrega] →
        1. Fotografia da entrega (POST /api/rides/:id/proof/delivery)
        2. Validar PIN do destinatário (POST /api/rides/:id/validate-pin { pin, phase: "delivery" })
        3. [Confirmar entrega] → status: "completed"
        4. [Problema no destino] → POST /api/rides/:id/delivery-problem
```

### Navegação
- O app abre o Google Maps / Waze com a rota automaticamente
- `NavigationModeOverlay` exibe botões flutuantes durante a navegação
- `PickupProgressIndicator` mostra progresso até o ponto de coleta

---

## Falha na Entrega (`delivery_failed`)

Quando o destinatário não está, endereço errado ou recusou:

```
POST /api/rides/:id/delivery-problem
{
  reason: "recipient_absent" | "wrong_address" | "refused" | "inaccessible" | "other",
  note: "...",
  photoUrl: "..."  (foto opcional da situação)
}
```

**O que acontece:**
1. Status muda para `delivery_failed`
2. Motorista inicia rota de devolução ao remetente
3. Cliente é notificado
4. Motorista recebe pagamento total + bônus de retorno
5. Cliente é cobrado pelo percurso completo (ida + volta)

---

## Comunicação com o Cliente

### Chat em Tempo Real
- `DriverChatScreen` (idêntico ao `ChatScreen` do cliente)
- Mensagens via WebSocket (`new-message`)
- Histórico persistido no banco (`ChatMessage`)
- Ícone de mensagem no HUD do motorista

### Ligação Telefônica
- Botão para ligar ao cliente (abre discador nativo)
- Número mascarado (privacidade) — planejado

---

## Conclusão e Pagamento

Ao finalizar (`status: "completed"`), o sistema:

1. **Credita** o valor total da corrida/entrega no `driverBalance`
2. **Debita** a taxa da plataforma do `driverBalance`
3. Envia evento WebSocket `balance_updated` ao motorista
4. Cria registro de transação no histórico

**Exemplo de corrida R$ 30,00 (taxa 15%):**
```
driverBalance.balance += R$ 30,00   (crédito do pagamento)
driverBalance.balance -= R$ 4,50    (taxa da plataforma)
Resultado líquido: + R$ 25,50
```

**Pagamentos por método:**
| Método | Crédito | Taxa |
|--------|---------|------|
| LevaPay | Escrow liberado → `driverBalance` | Debitada do `driverBalance` |
| PIX | Creditado em `driverBalance` | Debitada do `driverBalance` |
| Dinheiro | Dinheiro físico com o motorista | Taxa debitada do `driverBalance` |
| Maquininha | Motorista recebe na maquininha | Taxa debitada do `driverBalance` |

---

## Tela de Conclusão do Motorista

### `RideCompletedDriverScreen`
- Valor ganho nesta corrida (líquido após taxa)
- Detalhamento: valor bruto, taxa, valor líquido
- Saldo total atualizado
- Botão **Avaliar cliente** → `DriverRateClientScreen`
- Botão **Ver histórico**

---

## Avaliação do Cliente

### `DriverRateClientScreen`
- 1–5 estrelas
- Tags rápidas (ex: "Pontual", "Educado", "Difícil de localizar")
- Comentário opcional

---

## Telas de Gestão do Motorista

### `DriverEarningsScreen`
- Ganhos do dia / semana / mês
- Gráfico de barras dos últimos 7 dias
- Número de corridas realizadas
- Taxa média de aceitação

Endpoint: `GET /api/rides/earnings-history`

### `DriverStatementScreen`
- Extrato completo de transações
- Filtros por período
- Exportar comprovante

Endpoint: `GET /api/driver/balance/history`

### `DriverWithdrawScreen`
- Solicitar saque para conta bancária/PIX
- Mínimo e máximo configuráveis
- Histórico de saques anteriores
- Status: pendente → processado → pago

Endpoint: `POST /api/driver/balance/withdrawal-request`

### `DriverRatingsScreen`
- Rating médio com estrelas
- Distribuição 1–5 estrelas (gráfico pizza/barras)
- Lista de comentários recebidos

### `DriverHistoryScreen` / `DriverHistoryRideDetailsScreen`
- Lista paginada de corridas
- Detalhes de cada corrida: rota, valor, cliente, avaliação

### `DriverIncentivesScreen`
- Promoções ativas (ex: "Faça 10 corridas hoje, ganhe R$50")
- Metas de corridas/entregas
- Ranking regional

---

## HUD em Tempo Real (durante execução)

### `DriverTopHud`
- Tempo online
- Ganhos do dia
- Corridas do dia

### `ActiveDeliveryHeader`
- Nome do destinatário
- Endereço de entrega
- Status atual com ícone

### `DeliveryQuickStats`
- Distância restante
- ETA atualizado
- Velocidade atual

### `LivePaymentStatus`
- Método de pagamento da corrida atual
- Valor que será recebido

### `OperationalTimeline`
- Linha do tempo com etapas: Coleta → Em rota → Entregue

---

## Preferências do Motorista

### `DriverWorkPreferencesScreen`
Configurações:
- **Tipos de serviço**: aceita corridas, entregas, ou ambos
- **Veículos ativos**: qual veículo usar hoje
- **Raio de busca**: 1–300 km (padrão 15 km)
- **Auto-aceitar**: sim/não
- **Aceita dinheiro**: sim/não
- **Aceita PIX**: sim/não
- **Aceita maquininha**: sim/não

Endpoint: `PUT /api/driver/preferences`

---

## Segurança do Motorista

### `DriverSafetyScreen`
- Botão SOS
- Compartilhamento de localização com contato de emergência
- Checklist de segurança pré-viagem

### Verificações Contínuas
- `canAcceptRide` verifica antes de exibir pedidos:
  - `driverStatus === "approved"`
  - `driverBalance.balance > 0`
  - Veículo ativo aprovado
  - Conta não bloqueada/suspensa
