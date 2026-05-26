# 17 - Toggle DEV/PROD ligado à validação CPF/CNPJ + ajustes de cards

## Objetivo
- Fazer o toggle amarelo (DEV/PROD) do painel web realmente controlar o backend.
- Ajustar os cards da tela de validação para não misturar cliente com frota.

## Implementação do toggle

### Backend (persistência real)
- Criado model:
  - `backend/src/models/PlatformConfig.js`
- Criados endpoints admin:
  - `GET /api/auth/platform-config`
  - `PATCH /api/auth/platform-config`
- Arquivo:
  - `backend/src/routes/auth.routes.js`
  - `backend/src/controllers/auth.controller.js`

### Regras de validação CPF/CNPJ
- `validateCPFWithFreeAPI` e `validateCNPJWithFreeAPI` agora leem `isDevelopmentMode` do `PlatformConfig`:
  - `isDevelopmentMode = true` (DEV): bypass de API externa (fallback)
  - `isDevelopmentMode = false` (PROD): tenta API externa e aplica validação

## Web: toggle conectado ao backend
- Serviço de config atualizado:
  - `leva-mais-web/services/platformConfigService.ts`
- Agora:
  - busca config no backend (`/auth/platform-config`)
  - atualiza config no backend (`PATCH /auth/platform-config`)
  - mantém fallback em localStorage se backend estiver indisponível

## Ajuste dos cards na validação de contas
- Tela:
  - `leva-mais-web/app/verification/drivers/page.tsx`
- Alterado card roxo:
  - antes: `Total Registros (Frota)` com soma geral
  - agora: `Clientes Ativos`

## Resultado funcional esperado
- Toggle amarelo em `DEV`: CPF/CNPJ não exige API externa.
- Toggle em `PROD` (desmarcado): CPF/CNPJ valida via API externa + fallback definido no backend.
- Cards mostram:
  - Motoristas Pendentes
  - Motoristas Ativos
  - Clientes Pendentes
  - Clientes Ativos
