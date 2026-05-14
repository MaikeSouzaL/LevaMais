# Auditoria App + Backend - 2026-05-14

## Escopo auditado

Foco deste ciclo:

- App mobile Expo/React Native
- Backend Node/Express/Mongo
- Fluxos críticos pedidos: cadastro, escolha de perfil, motorista, pagamentos, saques, privacidade/LGPD

## Evidências principais

### 1. Cadastro e escolha de perfil

Status: `parcialmente implementado`

Evidências:

- Cadastro manual e login: `backend/src/controllers/auth.controller.js`
- Login Google: `backend/src/controllers/auth.controller.js`
- Seleção de perfil: `src/screens/(public)/SelectProfileScreen/index.tsx`
- Gate de motorista aprovado x pendente: `src/routes/index.tsx`
- Envio de documentos do motorista: `backend/src/controllers/auth.controller.js`

Leitura:

- O fluxo base de autenticação existe e está funcional no backend.
- Há distinção entre cliente e motorista.
- O gate de aprovação do motorista existe e evita acesso total sem análise.

Gap:

- Não há versionamento de consentimento/termos aceitos.
- Não há trilha robusta de auditoria do aceite de LGPD.

### 2. LGPD / dados pessoais

Status: `funcional no fluxo principal, ainda sem política operacional completa`

Evidências:

- Tela de termos e política com referência a LGPD: `src/screens/(public)/TermsScreen/index.tsx`
- Campo `acceptedTerms` no usuário: `backend/src/models/User.js`
- Exportação de dados pessoais: `backend/src/controllers/auth.controller.js` em `exportPrivacyData`
- Tela de privacidade do cliente: `src/screens/(authenticated)/Client/Profile/PrivacyDataScreen.tsx`

Leitura:

- O app já oferece aceite de termos e exportação de dados.
- Isso cobre parte do direito de acesso.

Correções feitas neste ciclo:

- Versionamento e trilha básica de consentimento no usuário:
  - `backend/src/models/User.js`
- Endpoints novos:
  - `POST /api/auth/privacy-consent`
  - `POST /api/auth/privacy-revoke`
  - `POST /api/auth/account-delete`
- Tela atualizada:
  - `src/screens/(authenticated)/Client/Profile/PrivacyDataScreen.tsx`
- Testes:
  - `backend/tests/auth.privacy.controller.test.js`

Gap:

- Ainda não existe política técnica formal de retenção/minimização registrada no sistema.
- Ainda não existe workflow administrativo de revisão de solicitações de exclusão.
- Ainda não existe versionamento separado entre termo de uso e política de privacidade por documento.

### 3. Escolha de veículo e preferências do motorista

Status: `fluxo principal saneado, matching ainda requer auditoria final`

Evidências:

- Tipo principal de veículo: `backend/src/models/User.js`
- Preferências persistentes do motorista: `backend/src/models/User.js`
- Tela de veículo: `src/screens/(authenticated)/Driver/DriverVehicleScreen.tsx`
- Tela de preferências: `src/screens/(authenticated)/Driver/DriverWorkPreferencesScreen.tsx`
- Preferências extras do motorista: `backend/src/controllers/driver.controller.js`
- Disponibilidade operacional em tempo real: `backend/src/controllers/driverLocation.controller.js`

Leitura:

- O motorista consegue escolher o veículo principal.
- Existem preferências operacionais de raio, corridas e entregas.
- Neste ciclo, as preferências persistentes foram movidas para `driverPreferences`, saindo de `driverBalance`.
- `DriverLocation` continua sendo a fonte operacional em tempo real para disponibilidade e proximidade, mas agora recebe defaults das preferências persistidas do usuário.

Correções feitas neste ciclo:

- Novo bloco persistente `driverPreferences`:
  - `backend/src/models/User.js`
- Atualização de perfil do motorista sincronizando veículo principal:
  - `backend/src/controllers/auth.controller.js`
- Atualização de preferências do motorista:
  - `backend/src/controllers/driver.controller.js`
- Defaults de preferências aplicados na disponibilidade operacional:
  - `backend/src/controllers/driverLocation.controller.js`
- App ajustado para salvar preferências no backend:
  - `src/services/driver.service.ts`
  - `src/screens/(authenticated)/Driver/DriverWorkPreferencesScreen.tsx`
- Teste:
  - `backend/tests/driver.preferences.controller.test.js`

Gap:

- Ainda falta revisar ponta a ponta o matching para confirmar se todas as consultas de corridas e entregas respeitam completamente `serviceTypes`, `vehicleType` e cenários híbridos.
- Ainda existem inicializações legadas de arrays antigos em alguns pontos financeiros do backend, embora não sejam mais a fonte correta das preferências.

### 4. Matching de corridas e entregas

Status: `backend protegido nas regras principais`

Evidências:

- Busca e despacho de motoristas:
  - `backend/src/controllers/ride.controller.js`
  - `backend/src/models/DriverLocation.js`
- Normalização de disponibilidade por veículo:
  - `backend/src/controllers/driverLocation.controller.js`
- Ajuste de criação/aceite:
  - `backend/src/controllers/ride.controller.js`
- Teste:
  - `backend/tests/ride.matching.controller.test.js`

Leitura:

- O backend agora bloqueia pedidos incompatíveis entre `serviceType` e `vehicleType`.
- O backend também bloqueia aceite de corrida quando o veículo/serviço do motorista não é compatível ou não está ativo.
- A API de disponibilidade do motorista filtra `serviceTypes` incompatíveis com o veículo.

Gap:

- Ainda falta revisar fluxos de plantões e negociação para confirmar que todos os atalhos respeitam exatamente as mesmas restrições de compatibilidade.

### 4. Pagamentos

Status antes deste ciclo: `quebrado por contrato`

Problema encontrado:

- O app chamava `/payments/*`, mas o backend não expunha essas rotas.
- A tela `PaymentEnhanced` exigia PIX sem coletar chave.
- O botão de confirmação disparava validação com efeito colateral durante o render.

Correções feitas neste ciclo:

- Compatibilidade backend criada:
  - `backend/src/controllers/payment.controller.js`
  - `backend/src/routes/payments.routes.js`
- Tela do app ajustada:
  - `src/screens/(authenticated)/Client/Ride/Request/PaymentEnhanced/index.tsx`
  - `src/hooks/usePaymentForm.ts`

Leitura:

- O fluxo agora está coerente para cartão, carteira, dinheiro e PIX em modo MVP interno.

Observação crítica:

- Não existe integração real com Stripe neste projeto hoje.
- O backend atual opera com uma fachada interna de autorização/registro, não com adquirência real.

Conclusão objetiva sobre Stripe:

- `não está integrado corretamente` porque, no estado atual, `não está integrado`.

### 5. Saques do motorista

Status antes deste ciclo: `quebrado por contrato`

Problema encontrado:

- O app chamava `/withdraws/*`, mas o backend expunha apenas `/wallet/*` e `/drivers/balance/withdrawal-request`.

Correções feitas neste ciclo:

- Compatibilidade backend criada:
  - `backend/src/controllers/withdraw.controller.js`
  - `backend/src/routes/withdraw.routes.js`
- Modelo ampliado para histórico/agendamento/cancelamento:
  - `backend/src/models/Withdrawal.js`

Leitura:

- O app agora tem contrato de saque compatível com o backend.
- Histórico, cancelamento, limites e validação de chave PIX passaram a existir no backend.

### 6. Cobertura de testes

Status antes deste ciclo: `muito fraca`

Evidências:

- Smoke anterior só cobria healthcheck e 401: `backend/tests/api.smoke.test.js`

Correções feitas neste ciclo:

- Testes de controllers adicionados:
  - `backend/tests/payment-withdraw.controller.test.js`

Cobertura nova:

- Pagamento por carteira com débito de saldo
- Bloqueio por saldo insuficiente
- Solicitação de saque
- Cancelamento de saque com estorno

### 7. Qualidade de build do app

Status antes deste ciclo: `com erro de tipagem`

Correção feita:

- Ajuste em `src/screens/(authenticated)/Driver/DriverProfileScreen.tsx`

Validação:

- `npx tsc --noEmit` passou em `2026-05-14`

### 8. Menus e suporte

Status: `rotas principais presentes, suporte agora configurável`

Evidências:

- Menu cliente: `src/routes/drawer.cliente.routes.tsx`
- Menu motorista: `src/routes/drawer.driver.routes.tsx`
- Ajuda cliente: `src/screens/(authenticated)/Client/Profile/Help/index.tsx`
- Suporte cliente: `src/screens/(authenticated)/Client/Profile/SupportCenterScreen.tsx`
- Suporte motorista: `src/screens/(authenticated)/Driver/DriverSupportCenterScreen.tsx`
- Configuração pública de canais:
  - `backend/src/routes/config.routes.js`
  - `backend/src/controllers/config.controller.js`
  - `backend/src/models/PlatformConfig.js`
  - `src/services/config.service.ts`

Leitura:

- Os menus principais do app estão conectados a rotas reais.
- Havia dependência de telefone, e-mail e WhatsApp hardcoded.
- Isso foi substituído por canais vindos da configuração pública do backend.

Gap:

- Ainda falta auditar, tela a tela, quais páginas estão completas versus apenas ilustrativas.
- Ainda falta revisar o dashboard web para permitir editar esses canais sem mexer no banco/manual.

### 9. Menus do cliente: pagamentos, carteira e convite

Status: `melhorados e mais coerentes com o estado real do produto`

Evidências:

- Definição de cartão padrão:
  - `backend/src/routes/auth.routes.js`
  - `backend/src/controllers/auth.controller.js`
  - `src/services/auth.service.ts`
  - `src/screens/(authenticated)/Client/Profile/PaymentsCenter.tsx`
- Carteira apontando para gerenciamento de pagamentos:
  - `src/screens/(authenticated)/Client/Profile/Wallet/index.tsx`
- Tela de adicionar cartão com mensagem honesta sobre o estágio da integração:
  - `src/screens/(authenticated)/Client/Profile/AddPaymentMethod/index.tsx`
- Convite sem promessa financeira inexistente:
  - `src/screens/(authenticated)/Client/Profile/InviteFriendsScreen.tsx`

Leitura:

- O cliente agora consegue definir cartão padrão pelo app.
- A carteira passa a direcionar para uma central de pagamentos mais coerente.
- O texto de integração financeira foi ajustado para não sugerir um gateway finalizado quando ele ainda não existe.
- A tela de convite continua útil para compartilhamento, mas sem afirmar um programa de indicação que o backend ainda não sustenta.

Gap:

- Ainda não existe integração real com gateway para tokenização/captura.
- Ainda não existe programa de indicação com apuração de bônus no backend.

## Mudanças realizadas neste ciclo

- Criadas rotas compatíveis de pagamentos no backend
- Criadas rotas compatíveis de saques no backend
- Ajustado o modelo de saque para histórico/cancelamento/agendamento
- Corrigida a tela de pagamento avançado no app
- Corrigido o hook de pagamento para não mutar estado durante render
- Corrigido um erro de tipagem no perfil do motorista
- Testes backend ampliados
- LGPD operacionalizada com consentimento, revogação e exclusão/anonimização
- Canais de ajuda e suporte tornados configuráveis via backend público
- Preferências persistentes do motorista desacopladas da carteira/saldo
- Menus críticos do cliente alinhados ao estado real do produto

## Testes executados

- `backend\\npm test`
- `npx tsc --noEmit`

## Próximos blocos prioritários

1. Normalizar preferências do motorista fora de `driverBalance`
2. Fechar LGPD com exclusão de conta, revogação de consentimento e versionamento de política
3. Definir estratégia real de pagamentos:
   - Stripe Connect / gateway equivalente
   - tokenização real de cartão
   - PIX real
   - webhooks
   - conciliação
4. Auditar todas as telas de menu do cliente e motorista para identificar placeholders, fluxos órfãos e navegações incompletas
5. Revisar regras de aceite de corrida/entrega por tipo de veículo e por categoria operacional
