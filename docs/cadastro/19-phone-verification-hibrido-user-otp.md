# 19 - Verificação de Telefone: Modelo Híbrido (User + OTP)

## Decisão aplicada
- Mantido `phoneverifications` para OTP temporário (código, expiração, tentativas).
- Mantido no `users` apenas estado final e metadados de verificação.

## Alterações no `users`
- `phoneVerified` (já existia)
- `phoneVerifiedAt` (novo)
- `lastPhoneVerificationMethod` (novo; `sms|whatsapp|voice|manual`)

Arquivo:
- `backend/src/models/User.js`

## Alterações em `phoneverifications`
- `userId` passou a existir no schema (antes era usado no controller, mas não estava formalizado no model).
- `method` adicionado para rastrear o canal da verificação.
- TTL por `expiresAt` mantido.

Arquivo:
- `backend/src/models/PhoneVerification.js`

## Fluxo atualizado no backend
- `sendPhoneCode` salva `method` e `userId` no documento OTP.
- `verifyPhoneCode` ao validar:
  - atualiza `users.phone`
  - seta `users.phoneVerified = true`
  - seta `users.phoneVerifiedAt`
  - seta `users.lastPhoneVerificationMethod`

Arquivo:
- `backend/src/controllers/auth.controller.js`

## Benefício
- Segurança e rastreabilidade do OTP em coleção efêmera.
- Estado final consolidado no documento do usuário.
