# 02 - Fluxo Cadastro Manual (Email/Senha)

## Escopo
- Frontend mobile: `SignUpScreen -> PhoneVerification -> PhoneLocationSetup -> SelectProfile`
- Backend: `POST /auth/register`

## Etapa 1 - SignUpScreen
Arquivo: `src/screens/(public)/SignUpScreen/index.tsx`

Campos locais:
- `phone`
- `name`
- `email`
- `password`
- `confirmPassword`

Ao enviar:
1. Sanitiza telefone (`replace(/\\D/g, "")`).
2. Valida e-mail no backend via `checkEmailExists(email)` -> `POST /auth/check-email`.
3. Se o e-mail ja existir:
   - mostra erro "E-mail já cadastrado"
   - redireciona para `SignIn`
   - nao segue para verificacao de telefone.
4. Se o e-mail nao existir:
   - monta `userData` em memoria (ainda sem salvar no backend)
   - navega para `PhoneVerification` com:
```json
{
  "phone": "11999999999",
  "nextScreen": "PhoneLocationSetup",
  "nextParams": {
    "user": {
      "_id": "",
      "name": "...",
      "email": "...",
      "password": "...",
      "phone": "11999999999",
      "city": null,
      "userType": null,
      "googleId": null,
      "profilePhoto": null,
      "acceptedTerms": false
    },
    "token": ""
  }
}
```

## Etapa 2 - Verificacao de telefone
Arquivo: `src/screens/(public)/PhoneVerificationScreen/index.tsx`

Envio de codigo:
- `sendPhoneVerification(phone)` -> `POST /auth/send-phone-code`

Verificacao:
- `verifyPhoneCode(phone, code)` -> `POST /auth/verify-phone-code`

Se sucesso:
- navega para `nextScreen` recebido (hoje: `PhoneLocationSetup`).

## Etapa 3 - PhoneLocationSetup
Arquivo: `src/screens/(public)/PhoneLocationSetupScreen/index.tsx`

1. Pede permissao de localizacao.
2. Tenta detectar cidade via GPS/reverse geocode.
3. Se existir token (fluxo Google), atualiza backend com `city`.
4. Navega/reset para `SelectProfile` com `user` atualizado.

## Etapa 4 - SelectProfile
Arquivo: `src/screens/(public)/SelectProfileScreen/index.tsx`

Escolha: `client` ou `driver`.

### Caso A: usuario ja existe (`user._id` presente, ex: Google)
- chama `userService.updateProfile({ phone, userType })`
- faz `authStore.login(...)` com token recebido antes

### Caso B: cadastro manual (`user._id` vazio)
- chama `registerUser(...)` -> `POST /auth/register`

Payload do `registerUser`:
```json
{
  "name": "...",
  "email": "...",
  "password": "...",
  "phone": "11999999999",
  "city": "...",
  "userType": "client|driver",
  "acceptedTerms": false,
  "googleId": null,
  "profilePhoto": null
}
```

## Backend `POST /auth/register`
Arquivo: `backend/src/controllers/auth.controller.js` (`register`)

Validacoes principais:
- `name, email, password` obrigatorios
- email valido e unico
- phone (se enviado) valido e unico
- se `userType=driver`: `vehicleType` obrigatorio

Normalizacoes:
- email lowercase
- phone normalizado
- userType fallback `client`

Se `driver`:
- seta `driverPreferences` iniciais com servicos compativeis com veiculo

Resposta (201):
```json
{
  "success": true,
  "message": "Usuario cadastrado com sucesso",
  "data": {
    "user": { "_id": "...", "userType": "client|driver", "...": "..." },
    "token": "jwt..."
  }
}
```
