# Entregas Concluidas - App e Backend
## 1) Onboarding e autenticacao (app + backend)
- Verificacao de telefone com endpoints dedicados
- Validacoes fortes em login e cadastro (email, telefone, conta inativa)
- Reenvio de codigo e fluxo de recuperacao de senha melhorado
- Pos-cadastro motorista alinhado com permissao de notificacao
- Fallback manual de localizacao (UF/cidade) no cadastro
- Intro com acao explicita de pular
## 2) Cliente (app)
- Melhorias no fluxo de busca de motorista e resiliencia de tracking
- Reconexao e rejoin em cenarios de instabilidade de socket
- Melhor consistencia dos estados terminais de corrida
## 3) Motorista (app)
- Retomada de corrida ativa ao voltar do background (Home + Ride)
- Fluxo operacional consolidado: accepted -> driver_arriving -> arrived -> in_progress -> completed
- Auto-sincronizacao para estado "a caminho" apos aceite
## 4) Backend de corridas
- Padronizacao inicial de erros HTTP em endpoints criticos
- Normalizacao de metodo de pagamento
- Ajustes de transicao de status e regras de permissao
- Hardening em leitura/cancelamento de corrida
## 5) Financeiro motorista (backend)
- Calculo de ganhos/saldo/extrato priorizando pricing.driverValue
- Fallback legada para 80% quando necessario
- Alinhamento em wallet e estatisticas de ganhos
- Normalizacao de saque (valor, chave PIX e tipo), incluindo compatibilidade `evp` -> `random`
- Paginacao de extrato com metadados (`page`, `limit`, `total`, `hasNext`)
## 6) Chat e seguranca por corrida (backend + realtime)
- Validacao de acesso por participante da corrida em HTTP
- Validacao de acesso por participante da corrida em WebSocket
- Emissao de mensagem para destinatario e remetente (multidispositivo)
- Marcacao de mensagens lidas
- Padrao de erro unificado no modulo chat
## 7) Telas financeiras do motorista (app)
- Correcao de tipo de chave PIX aleatoria para contrato do backend (`random`)
- Extrato com paginacao incremental (carregar mais ao rolar)
- Pull-to-refresh preservado com recarga completa da primeira pagina
## 8) Hardening backend adicional
- `driverLocation.controller`: validacoes de coordenadas/status/servicos, permissao por perfil e erros padronizados
- `driverLocation.routes`: ajuste da ordem de rotas para evitar conflito de `/:driverId` com `/nearby/search`
- `favorite.controller`: validacoes de payload/IDs, bloqueio de duplicidade basica e erros padronizados
- `favoriteAddress.controller`: validacoes fortes de coordenadas/campos, correcoes para valores `0` e padrao de erro
- `city.controller`: validacoes de query/body/ID, regras de duplicidade robustas e padrao de erro
- `city.routes`: ordenacao de rotas para reduzir ambiguidade em endpoints dinamicos
## 9) Revisao de fluxos Cliente/Motorista (app)
- Retomada de corrida ativa do cliente corrigida no boot (`RideTracking` com `rideId` inicial)
- Busca de motorista alinhada com timeout do backend (60s)
- Ajustes de validacao de coordenadas no app para nao falhar com latitude/longitude `0`
- Fluxo motorista ajustado para permitir cancelamento em `driver_arriving`
- Cancelamento de corrida no app passou a usar retorno real da API (taxa de cancelamento)
## 10) Integracoes reais que estavam em mock
- Gorjeta integrada com endpoint real (`POST /rides/:rideId/tip`)
- Cartao de pagamento integrado (adicao/listagem/remocao em `/auth/payment-methods`)
- Carteira do cliente integrada (`/auth/wallet` e `/auth/wallet/topup`)
- Notificacoes integradas (`GET /auth/notifications`)
- Telas cliente atualizadas para consumir backend real (Wallet, AddPaymentMethod, TipDriver, NotificationsCenter)
## 11) Menus e telas expandidas (cliente + motorista)
- Cliente:
  - Inclusao e conexao de telas de `Pagamentos`, `Cupons`, `Comprovantes`, `Suporte`, `Privacidade` e `Convidar amigos`
  - Atualizacao do `ProfileView` e do drawer para expor rotas no padrao de super-app (corrida + entrega)
- Motorista:
  - Inclusao e conexao de telas `Preferencias de trabalho`, `Documentos`, `Avaliacoes` e `Central de suporte`
  - Stack financeiro expandido com `Repasses` e `Incentivos`
  - Drawer reorganizado com menu operacional mais completo
- Navegacao:
  - Rotas adicionadas e tipadas no stack cliente
  - Validacao de compilacao sem erros com `npx tsc --noEmit`
## 12) Regressao automatizada minima (backend)
- Base de testes com `jest` + `supertest` criada no backend
- Refatoracao do bootstrap para modo testavel (`backend/src/createServer.js`)
- Smoke tests cobrindo disponibilidade e protecao por token:
  - `GET /api/health` (200)
  - `GET /api/auth/profile` sem token (401)
  - `GET /api/rides/active` sem token (401)
  - `GET /api/driver-location/me` sem token (401)
- Script de execucao pronto:
  - `npm test`
  - `npm run test:smoke`
- Correcao de warning de schema Mongo:
  - remocao de indice duplicado em `DriverLocation`
