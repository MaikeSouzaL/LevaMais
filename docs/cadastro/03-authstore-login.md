# 03 - authStore.login e Persistencia

Arquivo: `src/context/authStore.ts`

## O que `login()` faz
```ts
login(userType, userData, token)
```
- `isAuthenticated = true`
- salva `userType`
- normaliza `userData` via `normalizeUserData`
- salva `token`

## normalizeUserData
Campos normalizados:
- `id`/`_id`
- `name` e `nome`
- `cidade` e `city`
- `telefone` e `phone`
- `email` em lowercase
- `aceitouTermos` e `acceptedTerms`

## Persistencia
Middleware `persist` + `AsyncStorage` chave `auth-storage`.
Persistido:
- `isAuthenticated`
- `userType`
- `userData`
- `token`
- `walletBalance`

## Logout
`logout()`:
- chama `GoogleSignin.signOut()` (best effort)
- limpa estado de autenticacao e wallet.
