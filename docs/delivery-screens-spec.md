# Especificacao De Telas E Fluxos Delivery

Data: 2026-05-19
Branch base: `feature-add-new-features`
Documento complementar: `docs/delivery-negotiation-flow-plan.md`
Escopo: app cliente, app motorista e admin web para fluxo de entrega negociavel.

## 1. Objetivo Deste Documento

Este documento define como cada tela deve ser construida ou refatorada com foco em:

- Layout e hierarquia visual.
- Componentes por bloco.
- Estados de carregamento, vazio, erro e sucesso.
- Regras de navegacao.
- Regras de negocio por tela.
- Eventos e dados enviados ao backend.

Meta: deixar o time de frontend e backend com especificacao pronta para implementacao.

## 2. Principios De Interface

- Priorizar clareza operacional: usuario sempre precisa saber o proximo passo.
- Evitar sobrecarga visual: uma acao primaria por tela.
- Exibir status em linguagem humana: `A caminho da coleta`, `Pacote coletado`.
- Sempre mostrar feedback de rede/processamento.
- Todos os valores financeiros exibidos devem vir do backend.
- Metodos de pagamento no fluxo de entrega entram apos acordo da proposta.

## 3. Convencao De Estrutura Para Cada Tela

Cada tela abaixo usa este formato:

- Objetivo.
- Quando aparece.
- Layout.
- Componentes.
- Estados de UI.
- Validacoes e regras.
- Acoes e navegacao.
- Integracao backend.

## 4. Fluxo Cliente - Entrega

### 4.1 Tela Cliente Home

Objetivo:

- Escolher servico e iniciar fluxo.

Quando aparece:

- Entrada do cliente autenticado.

Layout:

- Header com saudacao, cidade atual e atalhos.
- Bloco principal com cards de servico.
- Atalhos inferiores: historico, carteira, suporte.

Componentes:

- Card `Corrida`.
- Card `Entrega`.
- CTA secundaria `Ver pedidos ativos`.

Estados de UI:

- Loading inicial da cidade e disponibilidade.
- Erro de cidade indisponivel.
- Estado normal com cards ativos.

Validacoes e regras:

- Card `Entrega` so habilita com cidade atendida.

Acoes e navegacao:

- Toque em `Entrega` -> `DestinationSearch` com `serviceType: delivery`.

Integracao backend:

- Busca disponibilidade por cidade/servico.

### 4.2 Tela Enderecos (DestinationSearch)

Objetivo:

- Definir coleta e entrega.

Quando aparece:

- Depois de selecionar `Entrega`.

Layout:

- Header com voltar e titulo.
- Campo de coleta.
- Campo de entrega.
- Sugestoes/favoritos.
- Rodape com CTA `Continuar`.

Componentes:

- Input coleta com autocomplete.
- Input entrega com autocomplete.
- Card de resumo de distancia e tempo.

Estados de UI:

- Carregando sugestoes.
- Sem resultado.
- Endereco invalido.

Validacoes e regras:

- Coleta e entrega obrigatorios.
- Endereco precisa ter lat/lng.

Acoes e navegacao:

- `Continuar` -> `DeliverySetup`.

Integracao backend:

- Geocode/reverse geocode.
- Validacao de area atendida.

### 4.3 Tela Definir Entrega (DeliverySetup)

Objetivo:

- Configurar pacote e oferta inicial.

Quando aparece:

- Após informar enderecos.

Layout:

- Header com titulo.
- Card de resumo de rota (coleta/destino/tempo/km).
- Secao de veiculo.
- Secao tipo de entrega.
- Secao descricao do pacote.
- Secao prioridade.
- Secao oferta do cliente.
- CTA `Revisar pedido`.

Componentes:

- `VehicleSelector`.
- `DeliveryTypeSelector`.
- `CargoSizeSelector`.
- `HelperSwitch`.
- `CargoDescriptionInput`.
- `DeliveryPrioritySelector`.
- `DeliveryOfferCard`.

Estados de UI:

- Loading de cotacao backend.
- Erro de cotacao.
- Estado normal com faixa sugerida.

Validacoes e regras:

- Nao permitir criar pedido sem cotacao valida.
- Nao ter selecao de pagamento aqui.
- Oferta deve respeitar `allowedMin/allowedMax` backend.

Acoes e navegacao:

- `Revisar pedido` -> `DeliveryReviewScreen`.

Integracao backend:

- `POST /rides/calculate-price` (ou quote endpoint).

### 4.4 Tela Revisar Entrega (Nova)

Objetivo:

- Confirmar dados antes de publicar.

Quando aparece:

- Antes de enviar para entregadores.

Layout:

- Header.
- Bloco `Rota`.
- Bloco `Pacote`.
- Bloco `Veiculo e prioridade`.
- Bloco `Oferta e faixa sugerida`.
- CTA `Enviar para entregadores`.

Componentes:

- Cards de resumo com icones.
- Alertas de risco (`pacote fragil`, `peso alto`).

Estados de UI:

- Estado normal.
- Erro de dados desatualizados (quote expirada).

Validacoes e regras:

- Se quote expirar, voltar para setup com recotacao.

Acoes e navegacao:

- Publicar -> cria ride e navega para `SearchingDriver`.

Integracao backend:

- `POST /rides`.

### 4.5 Tela Buscando Entregadores (SearchingDriver)

Objetivo:

- Mostrar busca e negociacao em andamento.

Quando aparece:

- Depois de publicar a entrega.

Layout:

- Mapa de contexto.
- Card principal de status da busca.
- Oferta atual.
- Tempo restante.
- CTA `Aumentar oferta`.
- CTA `Cancelar`.

Componentes:

- Bottom sheet com progresso.
- Indicador de motoristas notificados.

Estados de UI:

- Buscando.
- Propostas chegando.
- Timeout.
- Sem motorista.

Validacoes e regras:

- Se entrar em `payment_pending`, ir para tela de pagamento, nao tracking.

Acoes e navegacao:

- Propostas recebidas -> `RideOffersMarketplace`.

Integracao backend:

- Polling/socket de ofertas e status.

### 4.6 Tela Marketplace De Propostas (RideOffersMarketplace)

Objetivo:

- Escolher proposta do motorista.

Quando aparece:

- Quando houver ofertas.

Layout:

- Header com oferta do cliente.
- Lista de cards de motoristas.
- Acoes por card.

Componentes do card:

- Foto/nome/nota.
- Valor proposto.
- ETA ate coleta.
- Distancia ate coleta.
- Veiculo.
- Acoes: aceitar, contrapropor, recusar.

Estados de UI:

- Lista vazia.
- Lista carregada.
- Enviando resposta.

Validacoes e regras:

- Aceite de proposta nao inicia corrida.
- Deve ir para `payment_pending`.

Acoes e navegacao:

- Aceitar -> `DeliveryPaymentConfirmScreen`.

Integracao backend:

- `POST /rides/:rideId/offers/select`.
- `POST /rides/:rideId/offers/client-counter`.
- `POST /rides/:rideId/offers/decline`.

### 4.7 Tela Confirmar Pagamento (Nova)

Objetivo:

- Confirmar metodo e finalizar pre-contrato.

Quando aparece:

- Apos escolher proposta.

Layout:

- Header.
- Card do motorista selecionado.
- Resumo financeiro.
- Lista de metodos.
- CTA `Confirmar pagamento`.

Componentes:

- Metodo `Dinheiro`.
- Metodo `Cartao no app`.
- Metodo `Cartao com motorista`.
- Metodo `Carteira`.
- Metodo `Pix no app`.

Estados de UI:

- Loading de confirmacao.
- Falha de pagamento.
- Expirado.

Validacoes e regras:

- Sem confirmacao, motorista nao inicia entrega.
- Se timeout, liberar motorista e voltar para propostas.

Acoes e navegacao:

- Sucesso -> `RideTracking`.

Integracao backend:

- `POST /rides/:rideId/payment/confirm`.

### 4.8 Tela Tracking Cliente (RideTracking)

Objetivo:

- Acompanhar toda operacao ao vivo.

Quando aparece:

- Depois de pagamento confirmado e motorista atribuido.

Layout:

- Mapa full.
- Marcador motorista.
- Marcador coleta/destino.
- Card de status fixo inferior.
- Acoes: chat, ligar, compartilhar, cancelar.

Status visiveis:

- Motorista a caminho da coleta.
- Motorista chegou na coleta.
- Pacote coletado.
- Motorista a caminho da entrega.
- Motorista chegou ao destino.
- Entrega concluida.

Estados de UI:

- Sem localizacao temporaria.
- Reconnect websocket.
- Pedido cancelado.

Validacoes e regras:

- Cancelamento depende da fase.

Acoes e navegacao:

- Concluida -> `RideCompleted` -> `RateDriver`.

Integracao backend:

- `GET /rides/:rideId`.
- Eventos socket de status/localizacao.

### 4.9 Tela Cancelamento Cliente (ClientCancelRide)

Objetivo:

- Cancelar com transparencia de taxa.

Quando aparece:

- Cliente decide cancelar.

Layout:

- Header.
- Card de aviso.
- Lista de motivos.
- Taxa prevista.
- CTA de confirmacao.

Estados de UI:

- Com taxa.
- Sem taxa.
- Bloqueado (quando pacote ja coletado).

Validacoes e regras:

- Se pacote coletado, rota vira `Suporte` em vez de cancelamento direto.

Acoes e navegacao:

- Confirmar -> `CancelFee` ou `Home`.

Integracao backend:

- `POST /rides/:rideId/cancel`.

### 4.10 Tela Pos-Entrega Cliente

Objetivo:

- Fechar ciclo com comprovantes e avaliacao.

Telas:

- `RideCompleted` com resumo final.
- `RateDriver` com estrelas e comentario.

## 5. Fluxo Motorista - Entrega

### 5.1 Tela Home Motorista

Objetivo:

- Controle de disponibilidade.

Layout:

- Mapa.
- Switch online/offline.
- Card de saldo.
- CTA recarga.

Validacoes e regras:

- Sem saldo, nao fica online.
- Sem documentos/veiculo aprovados, nao fica online.

Integracao backend:

- `/drivers/go-online`.
- `/drivers/balance`.
- `/driver-location/status`.

### 5.2 Tela Solicitacoes Motorista

Objetivo:

- Mostrar pedidos disponiveis e negociacoes pendentes.

Layout:

- Lista de cards.
- Tabs: `Novos pedidos`, `Negociacoes`.

Card deve mostrar:

- Oferta do cliente.
- Taxa estimada da plataforma.
- Saldo necessario.
- Forma de pagamento prevista.
- Distancias.

Acoes:

- Aceitar.
- Contrapropor.
- Recusar.

### 5.3 Tela Aguardando Pagamento Cliente (Nova/Estado)

Objetivo:

- Segurar motorista após selecao da proposta.

Layout:

- Card full-screen ou modal forte.
- Status `Cliente escolheu voce`.
- Timer.
- Valor acordado.

Regras:

- Nao exibir botoes de iniciar rota.
- Se timeout, voltar para disponibilidade.

### 5.4 Tela Entrega Ativa Motorista (DriverRide)

Objetivo:

- Operar coleta e entrega.

Layout:

- Mapa com rota.
- HUD lateral (eta, km, velocidade).
- Card inferior de status e botoes.

Acoes por fase:

- `Cheguei na coleta`.
- `Iniciar entrega` (apos prova de coleta).
- `Cheguei no destino` (novo evento recomendado).
- `Finalizar entrega` (apos prova de entrega).

Regras:

- Delivery exige prova coleta antes de iniciar trecho final.
- Delivery exige prova entrega antes de finalizar.

Tracking:

- Enviar coordenadas periodicamente com fase atual.

### 5.5 Tela Cancelamento Motorista

Objetivo:

- Registrar motivo e executar cancelamento com regra da fase.

Layout:

- Lista de motivos.
- Campo observacao opcional.
- Aviso sobre impacto.
- CTA confirmar.

Regra:

- Apos coleta, direcionar para suporte/devolucao quando aplicavel.

### 5.6 Tela Avaliacao Cliente Pelo Motorista

Objetivo:

- Fechar atendimento e gerar qualidade da base.

Layout:

- Nota em estrelas.
- Tags rapidas.
- Comentario.
- CTA enviar/pular.

## 6. Fluxo Admin Web - Entregas

### 6.1 Tela Lista De Entregas (`/rides`)

Objetivo:

- Monitorar operacao em massa.

Layout:

- Filtros: status, cidade, periodo, metodo pagamento, motorista.
- Tabela com colunas chave.

Colunas obrigatorias:

- ID pedido.
- Cliente.
- Motorista.
- Status.
- Valor final.
- Taxa app.
- Metodo pagamento.
- Criacao/atualizacao.

### 6.2 Drawer Detalhe Da Entrega

Objetivo:

- Auditoria operacional completa.

Abas recomendadas:

- Resumo.
- Financeiro.
- Negociacao.
- Timeline.
- Rota percorrida.
- Provas.
- Cancelamento/disputa.

### 6.3 Tela Mapa Da Rota Percorrida (Nova aba)

Objetivo:

- Ver trajeto real do motorista por fase.

Layout:

- Mapa com camadas.
- Painel lateral de eventos.

Camadas:

- Rota estimada.
- Rota real ate coleta.
- Rota real ate entrega.
- Marcadores de eventos.

Dados exibidos:

- Tempo ate coleta.
- Tempo coleta->entrega.
- Distancia real.
- Divergencia de rota.

## 7. Estados, Mensagens E Erros Padrao

Todas as telas criticas devem padronizar:

- Loading: spinner + texto explicito.
- Erro recuperavel: mensagem + CTA `Tentar novamente`.
- Erro bloqueante: mensagem + CTA `Falar com suporte`.
- Sem dados: estado vazio com acao sugerida.

Mensagens devem ser objetivas e orientadas a acao.

## 8. Contrato De Navegacao Recomendado

Cliente:

```text
Home
-> DestinationSearch
-> DeliverySetup
-> DeliveryReviewScreen
-> SearchingDriver
-> RideOffersMarketplace
-> DeliveryPaymentConfirmScreen
-> RideTracking
-> RideCompleted
-> RateDriver
```

Motorista:

```text
DriverHome
-> DriverRequests
-> DeliveryOfferScreen
-> DriverAwaitingClientPayment
-> DriverRide
-> DriverRateClient
```

## 9. Backlog De Construcoes E Refatoracoes

### 9.1 Construir

- `DeliveryReviewScreen`.
- `DeliveryPaymentConfirmScreen`.
- Estado/tela `DriverAwaitingClientPayment`.
- Aba de rota percorrida no admin web.

### 9.2 Refatorar

- `DeliverySetup`: remover pagamento inicial e reforcar quote backend.
- `RideOffersMarketplace`: apos aceite, navegar para pagamento.
- `DriverRide`: incluir evento `cheguei ao destino`.
- `ClientCancelRide` e `DriverCancelRide`: regras por fase.
- `RideTracking`: timeline mais detalhada por fase.

### 9.3 Integrar Backend

- Persistencia de trilha GPS por ride.
- Eventos operacionais por fase.
- Cancelamento configuravel por fase.
- Confirmacao de pagamento pos-negociacao.

## 10. Checklist De Pronto Para Construir

Critério de pronto para cada tela:

- Objetivo da tela definido.
- Componentes definidos.
- Estados definidos.
- Validacoes definidas.
- Navegacao definida.
- Endpoint/eventos mapeados.
- Regras de negocio aprovadas.

## 11. Checklist Final De Aceite UX

- Usuario sempre sabe em qual fase da entrega esta.
- Cliente nao paga antes de fechar proposta.
- Motorista nao inicia sem confirmacao de pagamento/metodo.
- Coleta e entrega exigem comprovacao configuravel.
- Cancelamentos mostram taxa e consequencia.
- Avaliacao ocorre no fechamento dos dois lados.
- Admin enxerga timeline e rota real.
- Todos os valores exibidos vem do backend.
