# 22 - Migracao de Pricing para PlatformConfig

## Objetivo
Eliminar valores fixos de pricing no backend e mover para configuracao editavel via Web Admin.

## Mudancas realizadas

### 1) Remocao de arquivo de pricing fixo
- Removido:
  - `backend/src/config/pricing.js`

Esse arquivo mantinha valores hardcoded de:
- km minimo
- taxa minima
- preco por km
- taxa da plataforma

### 2) PlatformConfig expandido para pricing operacional
Atualizado:
- `backend/src/models/PlatformConfig.js`
- `backend/src/services/platformConfig.service.js`

Novos campos:
- `suggestedMinPricePercent`
- `vehiclePricing`:
  - `motorcycle`, `car`, `van`, `truck`
  - cada um com `minimumKm`, `minimumFee`, `pricePerKm`
- `logisticsMultipliers`:
  - prioridades, tamanho de carga, fragil, ajudante e faixas de peso

### 3) Backend consumindo config do banco
- `backend/src/controllers/ride.controller.js`
  - fallback global de regra de preco agora usa `PlatformConfig.vehiclePricing`
  - percentual sugerido de negociacao usa `suggestedMinPricePercent`
  - smart pricing de delivery usa `logisticsMultipliers`
  - taxa da plataforma segue `appFeePercentage` de `PlatformConfig`

- `backend/src/controllers/driver.controller.js`
  - validacao de saldo/taxa usa `appFeePercentage` da config runtime

- `backend/src/controllers/auth.controller.js`
  - `PATCH /api/auth/platform-config` agora aceita tambem:
    - `suggestedMinPricePercent`
    - `vehiclePricing`
    - `logisticsMultipliers`

### 4) Web Admin para editar pricing
Atualizado:
- `leva-mais-web/app/settings/platform/page.tsx`
- `leva-mais-web/services/platformConfigService.ts`

Agora a tela de configuracoes permite editar:
- tabela de preco por veiculo (moto/carro/van/truck)
- percentual minimo sugerido de negociacao
- multiplicadores de logistica

## Resultado
Pricing operacional deixa de ser fixo em arquivo de codigo e passa a ser alteravel pelo painel web, persistido em `platformconfigs`.
