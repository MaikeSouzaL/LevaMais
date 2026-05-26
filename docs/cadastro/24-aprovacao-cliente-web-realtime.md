# Fluxo 24 - Aprovação de Cliente no Web e Liberação em Tempo Real

## Objetivo
Corrigir o fluxo de auditoria do cliente para seguir a regra atual do produto: cliente envia dados cadastrais e selfie; quando ambos existem, o painel web libera os botões de aprovar ou reprovar.

## Front-end web
Arquivo principal: `leva-mais-web/app/verification/drivers/page.tsx`.

### Entrada exibida na auditoria
- Nome completo.
- Telefone principal.
- CPF ou CNPJ informado.
- Cidade/região.
- Selfie do usuário.

### Regra para liberar ações
O cliente fica pronto para auditoria quando:
- Existe selfie em `clientVerification.documents.selfie`.
- Existem dados cadastrais mínimos: `name`, `phone`, `city` e `cpf` ou `cnpj`.

Não é mais obrigatório enviar RG frente/verso no fluxo de cliente.

### Ações
Ao aprovar:
- O web envia `PATCH /api/auth/users/:id`.
- Payload define `isActive: true`.
- Payload define `clientVerification.status: "approved"`.
- Payload define `clientVerification.selfieStatus: "approved"`.
- Payload define `clientVerification.cpfStatus: "valid"`.

Ao reprovar:
- O web envia `PATCH /api/auth/users/:id`.
- Payload define `isActive: false`.
- Payload define `clientVerification.status: "rejected"`.
- Payload define `clientVerification.selfieStatus: "rejected"`.
- Payload salva `rejectionReason`.

## Backend
Arquivo principal: `backend/src/controllers/auth.controller.js`.

Quando `updateUserById` recebe atualização de `clientVerification` para usuário cliente:
- Salva os dados no MongoDB.
- Emite WebSocket para a sala `client-<userId>`.
- Evento emitido: `client-verification-updated`.
- Payload emitido: `userId`, `clientVerification`, `approved` e `isActive`.

## App cliente
Arquivo principal: `src/components/client/home/ClientOnboardingDashboard.tsx`.

O app escuta `client-verification-updated`.
Quando recebe aprovação:
- Atualiza `clientVerification` no `authStore`.
- Atualiza `isActive` quando o backend envia esse campo.
- Mostra a tela de parabéns em tempo real.
- O botão `Continuar` leva o cliente para a home pelo fluxo já existente do componente.

## Layout corrigido
- O painel lateral de auditoria não escurece mais a tela principal com overlay preto.
- A tela de fundo permanece visível durante a auditoria.
- Textos do fluxo devem permanecer com acentuação real em português, sem mojibake.
