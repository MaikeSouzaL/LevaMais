# 21 - Central de Configuracoes da Plataforma (Web + Backend)

## Objetivo
Concentrar configuracoes operacionais em `platformconfigs` e expor uma tela unica no web para administracao.

## Mapeamento feito no backend
Foram mapeadas configuracoes em:
- `auth.controller` (modo DEV/PROD para validacao CPF/CNPJ)
- `driver.controller` (taxa usada no bloqueio/debito e validacao de placa)
- `ride.controller` (taxa, timeout de busca, meta e bonus diario)
- `config/pricing.js` e variaveis `process.env` (fallbacks)

## Estrutura consolidada em PlatformConfig
Colecao: `platformconfigs`

Campos persistidos:
- `isDevelopmentMode` (boolean)
- `appFeePercentage` (number)
- `rideSearchTimeoutSeconds` (number)
- `driverDailyGoalRides` (number)
- `driverDailyBonusAmount` (number)
- `appTimeZone` (string)
- `supportChannels`:
  - `phone`
  - `email`
  - `whatsapp`
  - `helpCenterUrl`
- `policyVersions`:
  - `termsVersion`
  - `privacyPolicyVersion`
  - `consentVersion`

## Backend - servico central de configuracao
Novo arquivo:
- `backend/src/services/platformConfig.service.js`

Responsabilidades:
- definir defaults (`DEFAULT_PLATFORM_CONFIG`)
- garantir documento unico inicial (`ensureConfigDocument`)
- resolver runtime com fallback seguro (`getRuntimeConfig`)

## Endpoints de configuracao
Ja existentes em `auth.routes`:
- `GET /api/auth/platform-config`
- `PATCH /api/auth/platform-config`

Agora o `PATCH` aceita e salva os campos da estrutura consolidada acima.

## Pagina nova no Front-end Web
Nova rota:
- `/settings/platform`

Arquivo:
- `leva-mais-web/app/settings/platform/page.tsx`

Funcionalidades:
- carregar configuracoes atuais
- editar configuracoes operacionais
- salvar em `platformconfigs`
- recarregar valores
- disparar evento `platform-config-updated` para sincronia do restante da UI

## Menu novo no Web
Arquivo alterado:
- `leva-mais-web/components/layout/Sidebar.tsx`

Novo item:
- `Configuracoes` -> `/settings/platform`

## Integracoes aplicadas no runtime do backend
- `auth.controller` usa `getRuntimeConfig()` para validar modo DEV/PROD de CPF/CNPJ.
- `driver.controller` usa `getRuntimeConfig()` para:
  - validar se consulta de placa deve ser bypass (dev mode)
  - aplicar `appFeePercentage` em deducao/canAccept/goOnline.
- `ride.controller` usa `getRuntimeConfig()` para:
  - `appFeePercentage`
  - `rideSearchTimeoutSeconds`
  - `driverDailyGoalRides`
  - `driverDailyBonusAmount`

## Observacoes
- Segredos tecnicos (JWT, SMTP, webhook secret, conexao DB) continuam em `.env` por seguranca.
- Quando nao houver documento em `platformconfigs`, o backend cria com defaults automaticamente.
