# 01 - Fluxo Google Auth (App -> Backend)

## Escopo
- Frontend mobile: `SignInScreen` e `SignUpScreen`
- Backend: `POST /auth/google`
- Pós-autenticação: `GooglePhonePrompt` / `SelectProfile` / `authStore.login`

## Frontend: clique no Google
Arquivos:
- `src/screens/(public)/SignInScreen/index.tsx`
- `src/screens/(public)/SignUpScreen/index.tsx`

Passos:
1. `GoogleSignin.hasPlayServices(...)`
2. `GoogleSignin.signOut()` para forçar seletor de conta
3. `GoogleSignin.signIn()`
4. Extrai `id, email, name, photo`
5. Normaliza email: `trim().toLowerCase()`
6. Chama `googleAuth()` em `src/services/auth.service.ts`

Payload enviado ao backend:
```json
{
  "googleId": "string",
  "email": "email@dominio.com",
  "name": "Nome Usuario",
  "profilePhoto": "https://..." 
}
```

## Backend: `POST /auth/google`
Arquivos:
- `backend/src/routes/auth.routes.js`
- `backend/src/controllers/auth.controller.js` (`googleAuth`)

Entrada esperada:
- `googleId` (obrigatorio)
- `email` (obrigatorio)
- `name` (opcional)
- `profilePhoto` (opcional)
- `userType` (opcional)

Regras:
1. Valida `googleId` e `email`.
2. Busca usuario por `googleId` OU `email`.
3. Se encontrar:
- preenche `googleId` se vazio
- preenche `profilePhoto` se vazio
- atualiza `userType` se vier no body e for `client|driver`
4. Se nao encontrar:
- cria usuario com `googleId, email, name, profilePhoto, phone:null`
5. Gera JWT e retorna `user + token`.

Resposta:
```json
{
  "success": true,
  "message": "Autenticacao Google realizada com sucesso",
  "data": {
    "user": { "_id": "...", "email": "...", "phone": null, "userType": "..." },
    "token": "jwt..."
  }
}
```

## Decisao de fluxo no app (apos resposta)
No `SignInScreen` e `SignUpScreen`:
1. Se `phone` vazio -> navega para `GooglePhonePrompt`.
2. Se `userType` vazio -> navega para `SelectProfile`.
3. Se `userType` em `client|driver` -> login direto no `authStore`.

## Divergencia importante
- O backend **nao retorna** `isNewUser` hoje.
- O app decide fluxo por `phone` e `userType`.
