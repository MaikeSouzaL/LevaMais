# 06 - Verificacao de telefone (send/verify)

## Frontend
Arquivo: `src/services/auth.service.ts`

### sendPhoneVerification(phone, userId?)
- normaliza telefone
- valida tamanho 10-11
- envia para `POST /auth/send-phone-code`

Payload:
```json
{ "phone": "11999999999", "userId": "optional" }
```

### verifyPhoneCode(phone, code)
- normaliza telefone
- envia para `POST /auth/verify-phone-code`

Payload:
```json
{ "phone": "11999999999", "code": "1234" }
```

## Backend
Arquivo: `backend/src/controllers/auth.controller.js`

### POST /auth/send-phone-code
Regras:
1. valida telefone
2. se `userId`, valida existencia
3. bloqueia telefone ja usado por outra conta
4. rate limit: max 5 tentativas em 5 minutos
5. invalida codigos anteriores nao usados
6. gera codigo 4 digitos, expira em 10 min
7. salva em `PhoneVerification`

Resposta:
```json
{
  "success": true,
  "message": "Codigo de verificacao enviado",
  "data": { "devCode": "1234" }
}
```
`devCode` so aparece fora de producao.

### POST /auth/verify-phone-code
Regras:
1. busca ultimo codigo ativo (`used=false`)
2. valida expiracao
3. valida tentativas (max 5)
4. se correto: marca `used=true` e `verifiedAt`
5. se havia `userId` no registro, atualiza usuario (`phone`, `phoneVerified`) e retorna token novo

Resposta sem user vinculado:
```json
{
  "success": true,
  "message": "Telefone verificado com sucesso",
  "data": { "verified": true, "phone": "11999999999" }
}
```

Resposta com user vinculado:
```json
{
  "success": true,
  "message": "Telefone verificado com sucesso",
  "data": {
    "verified": true,
    "phone": "11999999999",
    "user": { "_id": "..." },
    "token": "jwt..."
  }
}
```

## Encadeamento atual no app
`SignUpScreen -> PhoneVerificationScreen -> PhoneLocationSetupScreen -> SelectProfileScreen`.
