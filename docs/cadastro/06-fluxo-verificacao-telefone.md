# Fluxo de Verificação de Telefone (Google Auth)

## Visão Geral

Após o cadastro via Google, o usuário tem `phone: null` e `phoneVerified: false`. O fluxo força a verificação do telefone antes de selecionar o tipo de conta.

## Fluxo Completo

```
Google Auth (POST /auth/google)
  ↓ retorna user.phone = null, phoneVerified = false
GooglePhonePromptScreen
  ↓ usuário digita telefone
  ↓ sendPhoneVerification(phone, userId) → POST /auth/send-phone-code
PhoneVerificationScreen
  ↓ usuário digita código de 4 dígitos
  ↓ verifyPhoneCode(phone, code) → POST /auth/verify-phone-code
PhoneLocationSetupScreen  ← NOVO
  ↓ pede permissão de localização
  ↓ GPS + reverse geocode → detecta cidade
  ↓ userService.updateProfile({ city }) → PATCH /auth/profile
SelectProfileScreen
  ↓ escolhe "Cliente" ou "Motorista"
  ↓ userService.updateProfile({ userType, phone }) ou registerUser()
authStore.login()
```

---

## Etapa 1 — GooglePhonePromptScreen

Arquivo: `src/screens/(public)/GooglePhonePromptScreen/index.tsx`

### Payload enviado:

```json
POST /auth/send-phone-code
{
  "phone": "11999999999",
  "userId": "664d..."
}
```

**userId** é enviado para vincular o código ao usuário no `PhoneVerification`.

---

## Etapa 2 — Backend `sendPhoneCode`

Arquivo: `backend/src/controllers/auth.controller.js` (linhas 1516-1591)

### O que faz:

1. Normaliza phone
2. Se `userId` veio, verifica se usuário existe (404 se não)
3. Verifica se phone já está em outra conta
4. Rate limit: max 5 tentativas em 5 min
5. Invalida códigos anteriores não usados
6. **Salva no banco**: `PhoneVerification.create({ phone, userId, code, expiresAt })`

### Documento salvo no MongoDB:

```json
{
  "_id": "ObjectId(...)",
  "phone": "11999999999",
  "userId": "ObjectId('664d...')",
  "code": "4821",
  "expiresAt": "2026-05-21T22:10:00.000Z",
  "used": false,
  "attempts": 0,
  "createdAt": "2026-05-21T22:00:00.000Z"
}
```

---

## Etapa 3 — PhoneVerificationScreen

Arquivo: `src/screens/(public)/PhoneVerificationScreen/index.tsx`

Usuário digita código. Ao verificar:

```json
POST /auth/verify-phone-code
{
  "phone": "11999999999",
  "code": "4821"
}
```

---

## Etapa 4 — Backend `verifyPhoneCode`

Arquivo: `backend/src/controllers/auth.controller.js` (linhas 1593-1644)

### O que faz:

1. Normaliza phone, trim code
2. Busca `PhoneVerification` não usado mais recente para este phone
3. Valida expiração e código
4. Se correto:
   - Marca `used: true`, `verifiedAt: Date.now()`
   - **Se tem userId vinculado**: atualiza o User:
     ```js
     User.findByIdAndUpdate(userId, {
       phone: normalizedPhone,
       phoneVerified: true
     })
     ```
   - **Retorna o documento User atualizado + novo token**

### Resposta do backend:

```json
{
  "success": true,
  "message": "Telefone verificado com sucesso",
  "data": {
    "verified": true,
    "phone": "11999999999",
    "user": {
      "_id": "664d...",
      "name": "João Silva",
      "email": "joao@gmail.com",
      "phone": "11999999999",
      "phoneVerified": true,
      "city": null,
      "...": "..."
    },
    "token": "eyJhbGciOi..."
  }
}
```

---

## Etapa 5 — PhoneLocationSetupScreen (NOVO)

Arquivo: `src/screens/(public)/PhoneLocationSetupScreen/index.tsx`

### O que faz:

1. Mostra tela de permissão de localização com animação radar
2. **"Permitir Localização"**:
   - `Location.requestForegroundPermissionsAsync()`
   - `Location.getCurrentPositionAsync()`
   - `obterEnderecoPorCoordenadas()` → extrai `city`
   - `userService.updateProfile({ city })` → `PATCH /auth/profile`
3. Navega para `SelectProfile` com `user` + `token` atualizados
4. **"Agora Não"**: pula, vai direto para SelectProfile

### Payload salvo:

```json
PATCH /auth/profile
{ "city": "São Paulo" }
```

---

## Etapa 6 — SelectProfileScreen

Arquivo: `src/screens/(public)/SelectProfileScreen/index.tsx`

Usuário escolhe "Cliente" ou "Motorista". O user já tem `phone`, `phoneVerified: true` e `city`.

### Se veio do Google (tem `_id`):

```json
PATCH /auth/profile
{ "phone": "11999999999", "userType": "client" }
```

### AuthStore.login() e segue para Home.

---

## Resumo do Estado do Usuário

| Campo | Após Google Auth | Após verifyPhone | Após Location | Após SelectProfile |
|---|---|---|---|---|
| `phone` | null | "11999999999" | "11999999999" | "11999999999" |
| `phoneVerified` | false | true | true | true |
| `city` | null | null | "São Paulo" | "São Paulo" |
| `userType` | undefined | undefined | undefined | "client" |
