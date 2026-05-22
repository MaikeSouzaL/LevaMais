# 20 - Limpeza do PlatformConfig (campos legados)

## Objetivo
Reduzir a colecao `platformconfigs` para manter apenas o campo realmente usado no fluxo atual de validacao de CPF/CNPJ por ambiente:
- `isDevelopmentMode`

## Contexto
Campos antigos ainda estavam no schema e geravam confusao operacional:
- `appFeePercentage`
- `defaultSearchRadius`
- `queueRedispatchInterval`
- `rideSearchTimeoutSeconds`
- `splitRules`
- `driverGoals`

Esses valores nao sao mais gerenciados por `platformconfigs` no fluxo atual.

## O que foi alterado

### Backend
- Arquivo: `backend/src/models/PlatformConfig.js`
  - Schema reduzido para manter apenas `isDevelopmentMode`.

- Arquivo: `backend/src/controllers/auth.controller.js`
  - Endpoint `PATCH /api/auth/platform-config` agora aceita apenas:
    - `isDevelopmentMode`

- Arquivo: `backend/src/controllers/ride.controller.js`
  - Removidas dependencias de `PlatformConfig`.
  - `appFeePercentage` agora usa constante de backend:
    - `process.env.APP_FEE_PERCENTAGE` ou fallback `PRICING.APP_FEE_PERCENTAGE`.
  - `searchTimeoutSeconds` usa:
    - `process.env.RIDE_SEARCH_TIMEOUT_SECONDS` ou fallback `60`.
  - Meta diaria e bonus usam:
    - `process.env.DRIVER_DAILY_GOAL_RIDES` (fallback `10`)
    - `process.env.DRIVER_DAILY_BONUS_AMOUNT` (fallback `20`)

### Web
- Arquivo: `leva-mais-web/services/platformConfigService.ts`
  - Removidos campos legados da tipagem e do `DEFAULT_CONFIG`.
  - Mantido `isDevelopmentMode` para o toggle DEV/PROD.

## Banco de dados
Foi executado cleanup para remover os campos legados em `platformconfigs` com `$unset`.

Resultado na execucao local:
- `cleanup_result 0`
- `docs []`

Isso indica que, no banco apontado pelo ambiente local no momento da execucao, nao havia documentos em `platformconfigs` para limpeza.

## Regra final
- `platformconfigs` permanece apenas para controlar `isDevelopmentMode`.
- Demais configuracoes operacionais ficam no backend (constantes/env), sem depender da colecao.
