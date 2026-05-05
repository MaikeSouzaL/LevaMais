# Refatoracao Masterplan V2 - Leva_Mais

## Objetivo
Levar o Leva_Mais para operacao estavel de producao, mantendo a base atual e finalizando os fluxos criticos de cliente e motorista com qualidade de produto e engenharia.

## Escopo
- Mobile (React Native + Expo)
- Backend (Node + Express + MongoDB + WebSocket)
- Integração backend/mobile

## Principios de execucao
- Nao reescrever por reescrever: consolidar o que ja funciona.
- Priorizar fluxos transacionais completos ponta a ponta.
- Unificar contratos API e estados de tela.
- Entregar em sprints curtas com criterio de pronto.

## Diagnostico objetivo (estado atual)
- Projeto ja possui boa estrutura de dominios e documentacao.
- Backend ja contem modulos de auth, rides, pricing, favorites, wallet, cidade e websocket.
- Fluxos de autenticacao e onboarding estao adiantados.
- Ainda existem partes em desenvolvimento no ciclo operacional de corrida:
  - matching e atribuicao robusta,
  - rastreio/atualizacao de corrida em tempo real completo,
  - fechamento de corrida com regras consistentes.
- Workspace possui algumas rotas/telas em paralelo (estrutura antiga e estrutura nova), o que aumenta risco de divergencia.

## Decisoes de produto
1. Selecao de perfil (cliente/motorista) continua no inicio apos autenticacao.
2. Troca de perfil continua permitida dentro do app em configuracoes.
3. Cliente segue com fluxo orientado por mapa + selecao de servico por tipo de veiculo.
4. Motorista segue com fluxo online/offline, aceite, execucao, finalizacao e ganhos.

## Fluxo oficial alvo
1. Intro (uma vez) -> SignIn/SignUp.
2. Selecao de perfil.
3. Completar cadastro por perfil.
4. Termos e permissoes (localizacao e notificacao).
5. Operacao:
   - Cliente: solicitar -> oferta/preco -> confirmar -> buscar motorista -> tracking -> conclusao/cancelamento.
   - Motorista: online -> receber oferta -> aceitar/recusar -> coleta -> entrega -> fechamento.

## Metas tecnicas
- Um unico fluxo oficial por papel (remover duplicidades de tela/rota legada).
- Contratos de API versionados e validados.
- Estado de sessao e corrida coerente entre store, cache e socket.
- Tratamento de erro de rede e reconexao sem travar UX.
- Monitoramento de erros e logs operacionais.

## Fases de entrega
1. Fase 1: Consolidacao de arquitetura ativa (rotas, telas e services em uso real).
2. Fase 2: Jornada Cliente completa e confiavel.
3. Fase 3: Jornada Motorista completa e confiavel.
4. Fase 4: Tempo real, resiliencia e reconciliacao de estado.
5. Fase 5: Testes E2E, hardening e release.
