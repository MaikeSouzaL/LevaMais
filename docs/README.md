# Leva Mais — Documentação Técnica

> Documentação completa do aplicativo Leva Mais: fluxos, telas, regras de negócio e arquitetura.

## Índice

| # | Documento | Descrição |
|---|-----------|-----------|
| 01 | [Visão Geral](./01-visao-geral.md) | Arquitetura, stack, modelo de dados, WebSocket |
| 02 | [Autenticação e Cadastro](./02-autenticacao-cadastro.md) | Fluxo de login, registro de cliente e motorista |
| 03 | [Fluxo de Entrega (Cliente)](./03-fluxo-entrega-cliente.md) | Solicitar entrega, marketplace de ofertas, tracking |
| 04 | [Fluxo de Corrida (Cliente)](./04-fluxo-corrida-cliente.md) | Categorias, bid, busca de motorista, tracking |
| 05 | [Fluxo do Motorista](./05-fluxo-motorista.md) | Online/offline, aceitar pedidos, executar, finalizar |
| 06 | [Pagamentos](./06-pagamentos.md) | LevaPay (escrow), PIX, dinheiro, taxa de plataforma |
| 07 | [Cancelamentos e Taxas](./07-cancelamentos-taxas.md) | Regras de cancelamento, multas, janela grátis |
| 08 | [Chat e Comunicação](./08-chat-comunicacao.md) | Mensagens em tempo real, WebSocket |
| 09 | [Avaliações e Gorjetas](./09-avaliacoes-gorjetas.md) | Rating bidirecional, tips, histórico |
| 10 | [Segurança e Confiança](./10-seguranca-confianca.md) | PIN, fotos de prova, SOS, rastreamento público |
| 11 | [Saldo do Motorista](./11-saldo-motorista.md) | Depósito, saques, histórico de transações |
| 12 | [Saldo do Cliente (LevaPay)](./12-saldo-cliente.md) | Carteira, recarga, escrow, dívida pendente |
| 13 | [Regras de Precificação](./13-precificacao.md) | Entrega, corrida, surge, multipliers |
| 14 | [Telas — Referência Completa](./14-telas-referencia.md) | Todas as telas, parâmetros de navegação |
| 15 | [WebSocket — Eventos](./15-websocket-eventos.md) | Todos os eventos de tempo real |
| 16 | [API — Referência de Endpoints](./16-api-endpoints.md) | Todos os endpoints REST |
| 17 | [Como Deve Funcionar (Produto)](./17-produto-como-deve-funcionar.md) | Visão de produto, comparação com Uber/99/InDriver/Lalamove |

---

## Convenções

- **Cliente** = usuário que solicita corrida ou entrega
- **Motorista** = prestador de serviço (moto, carro, van, caminhão)
- **Ride** = documento único no MongoDB que representa tanto corridas quanto entregas (`serviceType: "ride" | "delivery"`)
- **LevaPay** = carteira digital interna do app
- **driverBalance** = saldo pré-pago do motorista (depósito + recebimentos)
- **Escrow** = valor retido da carteira do cliente e liberado ao motorista após conclusão

---

*Gerado em: 2026-06-08*
