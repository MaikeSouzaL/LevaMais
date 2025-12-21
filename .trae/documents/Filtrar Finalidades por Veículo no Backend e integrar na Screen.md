## Diagnóstico
- Frontend chama `GET /api/purposes?vehicleType=<tipo>&isActive=true` (src/services/purposes.ts:48-55).
- Backend já possui rotas/controller de propósitos:
  - Modelo: backend/src/models/Purpose.js (campos `vehicleType`, `id`, `title`, `subtitle`, `icon`, `badges`, `isActive`).
  - Controller: backend/src/controllers/purpose.controller.js com `getAll` filtrando apenas por `vehicleType`.
  - Rota: backend/src/routes/purpose.routes.js registrada em backend/server.js sob `/api/purposes`.
- Problema: `getAll` ignora `isActive=true` do frontend; retorna todos do tipo, incluindo inativos.

## Correções Propostas (Backend)
1. Atualizar `getAll` em `purpose.controller.js` para processar os parâmetros:
   - `vehicleType` (string) opcional
   - `isActive` ("true"/"false") opcional
   - Montar `filter` combinando ambos: `{ vehicleType, isActive: true }` quando aplicável.
   - Manter `sort({ updatedAt: -1 })`.
2. (Opcional) Suportar paginação simples via `limit` e `skip` se enviados (não obrigatório agora).
3. Manter endpoint público (sem JWT) para consulta dos propósitos.

## Integração Frontend (Screen)
- `ServicePurposeScreen.tsx` já consome `getPurposesByVehicleType(vehicleType)` que envia `isActive=true`.
- Sem alterações necessárias no serviço; apenas validar que, após correção no backend, os dados refletirão os ativos do veículo selecionado.

## Passos
1. Editar `backend/src/controllers/purpose.controller.js:getAll` para ler `req.query.isActive` e aplicar no `filter`.
2. Não alterar rotas (já corretas) nem `server.js`.
3. Testar: chamar `GET /api/purposes?vehicleType=motorcycle&isActive=true` e verificar lista filtrada.

## Resultado Esperado
- Ao abrir `ServicePurposeScreen`, a lista renderiza dinamicamente os tipos de serviço ativos do veículo selecionado.
- Nenhum item inativo será retornado quando `isActive=true` for enviado.

Confirma que posso aplicar essas mudanças no backend agora?