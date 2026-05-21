# Fluxo de Cadastro via Google

## Visão Geral

Quando o usuário clica em "Login com Google", o app monta um payload a partir dos dados retornados pela SDK do Google e envia ao backend. O backend faz upsert (create-or-update) e retorna `user + token`. **O backend NÃO define `userType`** — o frontend força `SelectProfile` quando `userType` está ausente.

## Etapa 1 — Frontend: Clique no botão Google

### Tela: `SignInScreen` ou `SignUpScreen`

Arquivos:
- `src/screens/(public)/SignInScreen/index.tsx` (linhas 96-247)
- `src/screens/(public)/SignUpScreen/index.tsx` (linhas 187-339)

### Passos no frontend

```
1. GoogleSignin.hasPlayServices() — verifica Google Play Services
2. GoogleSignin.signOut()         — força seletor de conta (evita login automático)
3. GoogleSignin.signIn()          — abre modal nativo Google
4. isSuccessResponse(userInfo)    — valida resposta
5. Extrai: { id, email, name, photo } = userInfo.data.user
6. normaliza email: email.trim().toLowerCase()
```

### Payload montado

```typescript
{
  googleId: "1234567890",           // userInfo.data.user.id
  email: "joao@gmail.com",          // email normalizado (trim + lowercase)
  name: "João Silva",              // userInfo.data.user.name
  profilePhoto: "https://..."       // userInfo.data.user.photo (opcional)
}
```

### Schema Zod (validação local antes de enviar)

Arquivo: `src/schemas/auth.schema.ts` (linhas 126-134)

```typescript
googleAuthSchema = z.object({
  googleId: z.string().min(1, "Google ID é obrigatório"),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  name: z.string().min(2).max(100),
  profilePhoto: z.string().url("URL da foto inválida").optional(),
})
```

### Chamada à API

Arquivo: `src/services/auth.service.ts` (linhas 116-153)

```typescript
googleAuth(payload) → apiPost("/auth/google", payload)
```

---

## Etapa 2 — Backend: Controller `googleAuth`

Arquivo: `backend/src/controllers/auth.controller.js` (linhas 527-586)

Endpoint: `POST /auth/google`

### Payload recebido

```json
{
  "googleId": "1234567890",
  "email": "joao@gmail.com",
  "name": "João Silva",
  "profilePhoto": "https://lh3.googleusercontent.com/..."
}
```

### Lógica

```
1. Valida: googleId e email são obrigatórios (erro 400 se faltar)

2. Busca usuário existente:
   User.findOne({ $or: [{ googleId }, { email }] })

3. Se EXISTE (usuário já cadastrado):
   - Preenche googleId se estava vazio
   - Preenche profilePhoto se estava vazia
   - ATUALIZA userType se veio no body e usuário não tem
   - user.save()
   - Mantém userType como está (já foi escolhido antes)

4. Se NÃO EXISTE (usuário novo):
     {
       googleId,
       email: email.toLowerCase(),
       name,
       profilePhoto,
       phone: null
     }

5. Gera token JWT: this.generateToken(user)

6. Responde 200 com:
   {
     success: true,
     message: "Autenticação Google realizada com sucesso",
     data: {
       user: { documento completo do User },
       token: "jwt..."
     }
   }
```

### O que NÃO existe mais

| Campo removido | Motivo |
|---|---|
| `isNewUser` | Frontend decide pelo `!userType` |
| `userType: "client"` default no User.create | Backend não toma decisão de perfil |

---

## Etapa 3 — Resposta e Roteamento no Frontend

Arquivo: `SignInScreen/index.tsx` (linhas 130-226) ou `SignUpScreen/index.tsx` (linhas 218-315)

### Fluxo de decisão baseado na resposta:

```
response.data = { user, token }

1. Se user NÃO tem phone → GooglePhonePrompt
   - Tela pede número de telefone obrigatório
   - Passa: { user, token }

2. Se !user.userType → SelectProfile
   - Tela pergunta: "Cliente" ou "Motorista"?
   - Passa: { user, token }
   - ⚠️ Usa só !userType para decidir (isNewUser removido)

3. Se userType for "client" ou "driver":
   - Login direto via useAuthStore.getState().login()
   - Toast "Bem-vindo de volta!"
```

### SelectProfile — persistência final:

Arquivo: `src/screens/(public)/SelectProfileScreen/index.tsx` (linhas 64-163)

```
Se usuário veio do Google (tem _id):
  → userService.updateProfile({ phone, userType }) via API
  → login() no authStore

Se usuário veio do cadastro manual (sem _id):
  → registerUser() via API (cria usuário)
  → login() no authStore
```

---

## Resumo do Payload

| Campo | Origem | Tipo | Obrigatório |
|---|---|---|---|
| `googleId` | `userInfo.data.user.id` | string | Sim |
| `email` | `userInfo.data.user.email` → trim + lowercase | string | Sim |
| `name` | `userInfo.data.user.name` | string | Sim |
| `profilePhoto` | `userInfo.data.user.photo` | string (URL) | Não |

## Resposta do Backend

| Campo | Tipo | Descrição |
|---|---|---|
| `success` | boolean | true se OK |
| `message` | string | Mensagem |
| `data.user` | User object | Documento completo do usuário (userType pode ser undefined) |
| `data.token` | string | JWT token |
