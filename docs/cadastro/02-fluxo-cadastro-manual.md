# Fluxo de Cadastro Manual (Email/Senha)

## Visão Geral — Passo a Passo

```
Tela SignUp → PhoneVerification → SelectProfile → Backend Register → MongoDB
```

## Etapa 1 — Tela de Cadastro: `SignUpScreen`

Arquivo: `src/screens/(public)/SignUpScreen/index.tsx` (linhas 341-375)

### Dados do formulário (React Hook Form + Zod):

```typescript
// schema zod (linhas 59-68 do SignUpScreen)
{
  phone: "(11) 99999-9999",     // com máscara
  name: "João Silva",
  email: "joao@gmail.com",
  password: "123456",
  confirmPassword: "123456"
}
```

### Ao clicar em "Criar conta" (`handleSubmit(onSubmit)`) — linha 342:

```typescript
async function onSubmit(data: SignUpFormValues) {
  const sanitizedPhone = data.phone.replace(/\D/g, "");  // "11999999999"

  const userData = {
    _id: "",                           // vazio = novo usuário
    name: "João Silva",
    email: "joao@gmail.com",
    password: "123456",
    phone: "11999999999",              // já sem máscara
    city: "São Paulo",                 // detectado via GPS ou vazio
    userType: undefined,               // será escolhido depois
    googleId: undefined,
    profilePhoto: undefined,
    acceptedTerms: false,
  };

  navigation.navigate("PhoneVerification", {
    phone: "11999999999",
    nextScreen: "SelectProfile",
    nextParams: { user: userData, token: "" },
  });
}
```

**OBS**: Nesta etapa o cadastro AINDA NÃO foi enviado ao backend. Os dados ficam salvos apenas na navegação (`route.params`).

---

## Etapa 2 — Verificação de Telefone: `PhoneVerificationScreen`

Arquivo: `src/screens/(public)/PhoneVerificationScreen/index.tsx`

### Passos:

1. **Envia código SMS** (linha 74):
   ```typescript
   sendPhoneVerification("11999999999")
   // → POST /auth/send-phone-code { phone: "11999999999" }
   ```

2. **Usuário digita código de 4 dígitos** (OTP)

3. **Verifica código** (linha 182):
   ```typescript
   verifyPhoneCode("11999999999", "1234")
   // → POST /auth/verify-phone-code { phone: "11999999999", code: "1234" }
   ```

4. **Se sucesso, avança para SelectProfile** (linha 186):
   ```typescript
   navigation.navigate("SelectProfile", {
     user: {
       _id: "",
       name: "João Silva",
       email: "joao@gmail.com",
       password: "123456",
       phone: "11999999999",
       city: "São Paulo",
       userType: undefined,
       googleId: undefined,
       profilePhoto: undefined,
       acceptedTerms: false,
     },
     token: "",
   });
   ```

---

## Etapa 3 — Escolha do Perfil: `SelectProfileScreen`

Arquivo: `src/screens/(public)/SelectProfileScreen/index.tsx`

### Usuário escolhe "Cliente" ou "Motorista"

### Ao clicar em "Acessar como cliente" / "Quero trabalhar" — `handleProceed()` (linha 64):

**Cenário B — Cadastro Manual** (linhas 113-123):

```typescript
// Se o usuário NÃO veio do Google (user._id é vazio):
const response = await registerUser({
  name: "João Silva",
  email: "joao@gmail.com",
  password: "123456",
  phone: "11999999999",
  city: "São Paulo",
  userType: "client",           // ou "driver"
  acceptedTerms: false,
  googleId: undefined,
  profilePhoto: undefined,
});
```

---

## Etapa 4 — Payload JSON Enviado ao Backend

### POST `/auth/register`

Arquivo frontend: `src/services/auth.service.ts` (linhas 13-49)
Arquivo backend: `backend/src/controllers/auth.controller.js` (linhas 279-431)

### JSON que o frontend monta e envia:

```json
{
  "name": "João Silva",
  "email": "joao@gmail.com",
  "password": "123456",
  "phone": "11999999999",
  "city": "São Paulo",
  "userType": "client",
  "acceptedTerms": false,
  "googleId": null,
  "profilePhoto": null
}
```

### Validação Zod (antes de enviar):

Arquivo: `src/schemas/auth.schema.ts` (linhas 4-117)
- `name`: string, 2-100 chars (obrigatório)
- `email`: email válido, lowercase, trim (obrigatório)
- `password`: string, 6-50 chars (obrigatório)
- `phone`: opcional, min 10 chars
- `city`: opcional, max 100 chars
- `userType`: enum "client"|"driver"|"admin", default "client"
- `acceptedTerms`: boolean, default false

---

## Etapa 5 — O Que o Backend Faz

Arquivo: `backend/src/controllers/auth.controller.js` (linhas 279-431)

### Fluxo de validação:

```
1. Normaliza dados:
   - email → lowercase
   - phone → apenas dígitos, remove prefixo 55 e zero inicial
   - userType → "client" se inválido
   - preferredPayment → normaliza ("credit" → "card")

2. Validações (erro 400 em cada):
   - name, email, password obrigatórios
   - email regex /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
   - phone com 10-11 dígitos
   - phone não duplicado (User.findOne({ phone }))
   - email não duplicado (User.findOne({ email }))

3. Monta objeto userData para criação
```

### Objeto montado para salvar no MongoDB:

```json
{
  "name": "João Silva",
  "email": "joao@gmail.com",
  "password": "<hash bcrypt>",
  "userType": "client",
  "acceptedTerms": false,
  "phone": "11999999999",
  "city": "São Paulo"
}
```

### O que acontece com a senha:

No `pre("save")` do modelo User (arquivo `User.js` linha 492):
```javascript
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);
```

### O que NÃO é salvo no cadastro inicial:
- `cpf`, `cnpj` — documentos
- `address` — endereço
- `vehicleType`, `vehicleInfo` — veículo
- `driverDocuments` — CNH, CRLV
- `profilePhoto` — foto de perfil (Google manda, mas cadastro manual não)
- `acceptedTermsAt`, `acceptedPrivacyAt` — timestamps (só salvos se acceptedTerms=true)

---

## Etapa 6 — Resposta e Login

### Resposta do backend (200 OK):

```json
{
  "success": true,
  "message": "Usuário cadastrado com sucesso",
  "data": {
    "user": {
      "_id": "664d...",
      "name": "João Silva",
      "email": "joao@gmail.com",
      "phone": "11999999999",
      "city": "São Paulo",
      "userType": "client",
      "acceptedTerms": false,
      "profilePhoto": null,
      "createdAt": "2026-05-20T...",
      "updatedAt": "2026-05-20T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Frontend recebe e faz login:

```typescript
// SelectProfileScreen linha 127
const { user: registeredUser, token } = response.data;

useAuthStore.getState().login(
  "client",                        // userType
  {
    id: registeredUser._id,
    name: registeredUser.name,
    nome: registeredUser.name,
    email: registeredUser.email,
    telefone: registeredUser.phone || "",
    cidade: registeredUser.city || "",
    fotoPerfil: registeredUser.profilePhoto,
    googleId: registeredUser.googleId,
    aceitouTermos: false,
    driverStatus: "none",          // se for "driver"
  },
  token,
);
```

### Comportamento do authStore.login():

- Salva `token` no estado + AsyncStorage
- Salva `userData` no estado + AsyncStorage
- O roteador (`routes/index.tsx`) detecta a mudança e redireciona para:
  - **Cliente** → `HomeScreen` (fluxo de pedidos)
  - **Motorista** → `DriverHomeScreen` (fluxo de trabalho)

---

## Documento Final no MongoDB

Após todas as transformações (bcrypt, normalização), o documento salvo na collection `users` fica assim:

```json
{
  "_id": "ObjectId('664d...')",
  "name": "João Silva",
  "email": "joao@gmail.com",
  "password": "$2a$10$...hash_bcrypt...",
  "userType": "client",
  "acceptedTerms": false,
  "consentVersion": "2026-05-14",
  "termsVersion": "2026-05-14",
  "privacyPolicyVersion": "2026-05-14",
  "phone": "11999999999",
  "city": "São Paulo",
  "isActive": true,
  "notificationsEnabled": true,
  "createdAt": "2026-05-20T22:00:00.000Z",
  "updatedAt": "2026-05-20T22:00:00.000Z",
  "driverStatus": "none",
  "ratingStats": {
    "averageStars": 0,
    "totalRatings": 0,
    "starDistribution": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
  }
}
```

**Campos com default e NÃO populados no cadastro inicial:**
- `cpf`, `cpnj` — não salvos
- `address` — não salvo
- `vehicleType`, `vehicleInfo` — não salvos
- `activeVehicleId`, `vehicles` — não salvos
- `profilePhoto` — não salvo (cadastro manual)
- `googleId` — não salvo (cadastro manual)
- `pushToken` — não salvo (vai ser preenchido depois)
- `wallet`, `driverBalance` — defaults vazios
- `favoriteAddresses`, `paymentMethods` — arrays vazios
- `onlineStats` — defaults zerados
