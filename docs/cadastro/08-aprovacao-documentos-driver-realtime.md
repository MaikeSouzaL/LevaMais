# 08 - Aprovação de Documentos do Motorista (Realtime)

## Escopo
- Web Admin: aprovação/reprovação **individual** de documentos do motorista
- Backend: endpoint dedicado para atualização granular + recomposição de status geral
- App motorista: atualização em tempo real via WebSocket no onboarding

## Endpoint Admin
Rota:
- `PATCH /auth/users/:id/driver-verification`

Autorização:
- `requireAdmin` (JWT admin ou `x-admin-key`)

Payload:
```json
{
  "field": "cnhFrontStatus|cnhBackStatus|selfieStatus",
  "status": "approved|rejected|pending|none",
  "reason": "opcional"
}
```

## Regras de Negócio (Backend)
Arquivo:
- `backend/src/controllers/auth.controller.js`

Lógica:
1. Atualiza apenas o campo indicado (`cnhFrontStatus`, `cnhBackStatus` ou `selfieStatus`) em `driverDocuments`.
2. Registra auditoria em:
   - `driverDocuments.reviewedAt`
   - `driverDocuments.reviewedBy`
   - `driverDocuments.reviewHistory[]`
3. Recalcula `driverStatus`:
   - `rejected` se qualquer documento estiver `rejected`
   - `approved` se os 3 estiverem `approved`
   - `pending` nos demais casos
4. Salva no banco e retorna estado atualizado.

## Evento WebSocket
Evento emitido para a sala do motorista:
- `driver-verification-updated`

Payload emitido:
```json
{
  "userId": "driverId",
  "driverStatus": "pending|approved|rejected|none",
  "driverDocuments": { "...": "..." },
  "approved": true
}
```

## Web Admin
Arquivo:
- `leva-mais-web/app/verification/drivers/page.tsx`
- `leva-mais-web/services/verificationAdminService.ts`

Fluxo:
1. No drawer de auditoria do motorista, cada cartão (`Selfie CNH`, `CNH Frente`, `CNH Verso`) tem botões próprios:
   - `Aprovar`
   - `Reprovar`
2. Cada ação chama `PATCH /auth/users/:id/driver-verification`.
3. UI atualiza localmente e recarrega lista para refletir status global.

Padronização aplicada:
- Aprovação de cliente usa endpoint granular (`/client-verification`) em vez de patch genérico.
- Aprovação de motorista usa endpoint granular (`/driver-verification`) para cada documento.
- Ações HTTP de verificação foram centralizadas em `verificationAdminService`.

## App Motorista
Arquivo:
- `src/components/driver/home/DriverOnboardingDashboard.tsx`

Fluxo:
1. Conecta no WebSocket.
2. Escuta `driver-verification-updated`.
3. Ao receber:
   - atualiza `driverStatus` local/store
   - recarrega checklist de onboarding
4. Resultado:
   - mantém estado de “em análise” até aprovação
   - quando aprovado, onboarding avança automaticamente para estado liberado.
