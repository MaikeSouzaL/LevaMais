# Matriz de Telas - App (Cliente + Motorista)
Data de atualizacao: 2026-05-05

## Objetivo
Consolidar o plano completo de telas e o status de implementacao do app, com base nos fluxos de Uber/99/iFood.

## 1) Cliente - Fluxo principal
- [x] Apresentacao / Intro
- [x] Login
- [x] Cadastro
- [x] Verificacao de telefone
- [x] Home com mapa e busca
- [x] Selecao de servico (corrida/entrega)
- [x] Selecao de veiculo
- [x] Confirmacao de coleta e destino
- [x] Resumo final do pedido
- [x] Pagamento
- [x] Busca de motorista
- [x] Tracking da corrida/entrega
- [x] Chat em corrida
- [x] Cancelamento com regra de taxa
- [x] Finalizacao
- [x] Avaliacao do motorista
- [x] Gorjeta

## 2) Cliente - Menus e suporte
- [x] Historico
- [x] Comprovantes
- [x] Pedidos ativos
- [x] Favoritos
- [x] Carteira
- [x] Pagamentos (cartoes)
- [x] Cupons
- [x] Notificacoes
- [x] Seguranca
- [x] Suporte
- [x] Privacidade e dados
- [x] Convidar amigos
- [x] Configuracoes

## 3) Motorista - Fluxo operacional
- [x] Home operacional (online/offline)
- [x] Solicitacoes em tempo real
- [x] Aceitar / Recusar
- [x] Navegacao de corrida ativa
- [x] Chat com cliente
- [x] Cancelamento
- [x] Finalizacao
- [x] Avaliar cliente
- [x] Retomada de corrida ativa ao reabrir app

## 4) Motorista - Menus e gestao
- [x] Ganhos
- [x] Saque
- [x] Extrato
- [x] Repasses
- [x] Incentivos
- [x] Historico
- [x] Avaliacoes
- [x] Veiculo
- [x] Documentos
- [x] Preferencias de trabalho
- [x] Perfil
- [x] Seguranca
- [x] Suporte
- [x] Ajuda rapida
- [x] Configuracoes

## 5) Backend para suportar telas
- [x] Auth e perfil com validacoes
- [x] Corridas com transicoes robustas
- [x] Chat seguro por corrida (HTTP e WebSocket)
- [x] Financeiro do motorista (saldo, extrato, saque)
- [x] Pagamentos cliente (cartoes)
- [x] Carteira cliente (saldo e recarga)
- [x] Notificacoes cliente via API
- [ ] Gateway de pagamento real (cartao/pix) em producao

## 6) Observacoes
- O app esta funcional em fluxo completo MVP para cliente e motorista.
- O principal gap restante para producao e integracao com gateway financeiro real e testes E2E completos.
