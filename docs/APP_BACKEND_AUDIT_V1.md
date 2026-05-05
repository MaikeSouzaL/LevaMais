# App + Backend Audit V1 (app + back first)

## Objetivo deste ciclo
- Mapear o estado real do app e backend
- Detectar lacunas para padrao Uber/99/iFood
- Corrigir bloqueios criticos de onboarding e autenticacao

## Entregue neste ciclo
- [x] Inventario de telas e rotas do app (publico, cliente, motorista)
- [x] Inventario de modulos/rotas principais do backend
- [x] Correcao de bloqueio de verificacao de telefone no onboarding
- [x] Ajustes iniciais de copy e consistencia no fluxo de escolha de perfil
- [x] Bloqueio de login Google para contas desativadas

## Diagnostico por fluxo (status)

### 1) Fluxo publico (onboarding + auth)
- `IntroScreen`: funcional, precisa revisao de copy e CTA final.
- `SignIn`: funcional, precisa limpeza de estado legado e textos.
- `SignUp`: funcional, com validacao de telefone corrigida.
- `PhoneVerification`: funcional apos implementacao de envio/validacao de codigo.
- `SelectProfile`: funcional, copy atualizada para multiuso (corrida + entrega + comercio).
- `CompleteRegistrationClient`: funcional, mas precisa padronizar validacoes e linguagem.
- `CompleteRegistrationDriver`: funcional, precisa reforco de validacoes finais e UX de conclusao.
- `ForgotPassword / VerifyCode / NewPassword`: funcional basico, precisa hardening.

### 2) Fluxo cliente (app autenticado)
- Home e solicitacao de corrida: base implementada.
- Rastreio e chat: base implementada.
- Historico, carteira, favoritos, seguranca: existem telas e rotas.
- Gaps principais:
- [ ] Revisao de coerencia entre ride e delivery no mesmo fluxo de descoberta.
- [ ] Padronizacao dos estados de busca de motorista e fallback.
- [ ] Consolidacao do contrato de pagamento e metodos.

### 3) Fluxo motorista (app autenticado)
- Home, requests, ride screen, ganhos, historico, saque: base implementada.
- Gaps principais:
- [ ] Revisao das transicoes de status operacionais.
- [ ] Revisao de UX em cenarios de reconexao e corrida ativa ao reabrir app.
- [ ] Consolidacao das regras financeiras (ganhos/extrato/saque).

### 4) Backend
- Auth: funcional com novos endpoints de telefone.
- Ride: amplo, com websocket e matching.
- Pricing/city/platformConfig/wallet/chat: existentes.
- Gaps principais:
- [ ] Revisao completa de contratos HTTP (shape de resposta e erros).
- [ ] Normalizacao final de status de corrida entre app e backend.
- [ ] Testes de regressao minimos para onboarding e corrida.

## Lacunas criticas identificadas
- [x] Endpoint de verificacao de telefone ausente no backend (corrigido)
- [x] Onboarding permitia seguir sem telefone valido (corrigido)
- [x] Login Google permitia conta desativada (corrigido)
- [ ] Auditar consistencia de payloads em todas as telas de cadastro
- [ ] Auditar todos os caminhos de erro de rede/offline nos fluxos centrais

## Proxima execucao recomendada (fase imediata)
- [ ] Fechar fluxo onboarding ponta a ponta (sem estados mortos)
- [ ] Revisar "Home cliente" para entrada clara: corrida, entrega, comercio
- [ ] Revisar fluxo motorista de aceite -> execucao -> conclusao
- [ ] Padronizar componentes de header, botoes, cards e feedback de loading/erro
- [ ] Iniciar bateria de testes manuais guiados e registrar evidencias no docs
