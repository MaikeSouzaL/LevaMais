# 09 - Web Dashboard: Correção de Serviços Ausentes

## Contexto
Ao buildar o `leva-mais-web`, a página `app/dashboard/page.tsx` falhava com:
- `Module not found: Can't resolve '@/services/driverLocationService'`

Também havia import para `@/services/ridesService` sem arquivo correspondente.

## Ajuste aplicado
Foram criados os serviços faltantes:
- `leva-mais-web/services/driverLocationService.ts`
- `leva-mais-web/services/ridesService.ts`

## Contratos adicionados
### `ridesService`
- `getAll(): Promise<Ride[]>`
- Faz `GET /rides`
- Normaliza retorno para:
  - `res.data` (array) ou
  - `res.data.rides` (array)

### `driverLocationService`
- `getAll(): Promise<DriverLocation[]>`
- Faz `GET /driver-location/all`
- Normaliza retorno para:
  - `res.data` (array) ou
  - `res.data.locations` (array)

## Fallback operacional
Ambos serviços usam fallback para `[]` em erro, evitando quebra de runtime no dashboard
enquanto a autenticação administrativa dessas rotas não é padronizada no backend.

## Resultado
- Resolve erro de módulo ausente no build.
- Dashboard volta a compilar com imports válidos.
