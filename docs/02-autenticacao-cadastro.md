# 02 — Autenticação e Cadastro

## Telas Públicas (sem login)

```
IntroScreen
    ↓
SelectProfileScreen  (escolhe: Cliente ou Motorista)
    ↓
SignInScreen / SignUpScreen
    ↓
PhoneVerificationScreen   (SMS/WhatsApp)
    ↓
LocationPermissionScreen
    ↓
NotificationPermissionScreen
    ↓
[HomeScreen do papel escolhido]
```

---

## Fluxo de Cadastro — Cliente

### 1. Tela Inicial (`IntroScreen`)
- Apresentação do app com carrossel de benefícios
- Botões: **Entrar** / **Criar conta**

### 2. Seleção de Perfil (`SelectProfileScreen`)
- Usuário escolhe: **Sou Cliente** ou **Sou Motorista**
- Determina o `userType` que será criado

### 3. Registro (`SignUpScreen`)
Campos obrigatórios:
- Nome completo
- E-mail
- Senha (mínimo 6 caracteres)
- Telefone

Login alternativo: **Google OAuth** (`/auth/google`)

Endpoints:
```
POST /api/auth/register
POST /api/auth/google
POST /api/auth/check-email   (verifica se e-mail já existe)
```

### 4. Verificação de Telefone (`PhoneVerificationScreen`)
- Código de 6 dígitos enviado via SMS/WhatsApp
- Limite de tentativas (rate limiting no backend)
- Reenvio disponível após 60 segundos

Endpoints:
```
POST /api/auth/send-phone-code
POST /api/auth/verify-phone-code
```

### 5. Permissões
- **Localização** (`LocationPermissionScreen`) — necessária para mostrar mapa e calcular rotas
- **Notificações** (`NotificationPermissionScreen`) — para receber alertas de status

### 6. Configuração Inicial
- Seleção de cidade atendida (`ClientCityScreen`)
- Tour inicial (onboarding) se `tourSeen === false`

---

## Fluxo de Cadastro — Motorista

### Passos adicionais após o registro básico:
1. Documentos pessoais (CNH frente/verso, selfie, CPF)
2. Dados do veículo (placa, modelo, cor, ano, CRLV frente/verso, foto)
3. **Análise manual** pelo admin (dashboard)
4. Notificação push quando aprovado/rejeitado

Status do motorista (`driverStatus`):
```
none → pending → approved
                → rejected (pode recursar)
                → blocked
                → suspended
```

Endpoint de envio:
```
POST /api/auth/driver-verification
  (multipart: cnhFront, cnhBack, selfie, crlvFront, crlvBack, vehiclePhoto)
```

### KYC (Know Your Customer)
- FaceMatch: comparação selfie ↔ CNH (serviço interno `facematch.service.js`)
- Background check: antecedentes criminais (`background-check.service.js`)
- Verificação de placa via API oficial
- CPF/CNPJ criptografados no banco (AES-256-CBC)
- Admin aprova/rejeita cada documento individualmente

---

## Login

### E-mail + Senha
```
POST /api/auth/login
{ email, password }
→ { token, user }
```

### Google OAuth
```
POST /api/auth/google
{ idToken }
→ { token, user }
```
- Se telefone não cadastrado via Google → `GooglePhonePromptScreen`

### Recuperação de Senha
```
Fluxo:
ForgotPasswordScreen
    → POST /api/auth/forgot-password
    → [código no e-mail]
    → PhoneVerificationScreen (verifica código)
    → NewPasswordScreen
    → POST /api/auth/reset-password
```

---

## Token JWT

- Armazenado no AsyncStorage/SecureStore
- Enviado em todas as requisições: `Authorization: Bearer <token>`
- Expiração configurável no backend (`process.env.JWT_SECRET`)
- Renovação automática: o app reloga silenciosamente quando detecta 401

---

## Perfil e Configurações

### Cliente
- **Editar conta** (`EditAccountScreen`): nome, foto, telefone
- **Endereços favoritos** (`FavoritesScreen`): casa, trabalho, favoritos personalizados
- **Métodos de pagamento** (`AddPaymentMethodScreen`): cartões de crédito/débito
- **Configurações** (`SettingsScreen`): notificações, tema do mapa (claro/escuro)
- **Privacidade** (`PrivacyDataScreen`): exportar dados, revogar consentimento, deletar conta

### Motorista
- **Documentos** (`DriverDocumentsScreen`): reenvio de documentos reprovados
- **Veículos** (`DriverVehicleScreen`): gerenciar frota, ativar veículo
- **Preferências de trabalho** (`DriverWorkPreferencesScreen`):
  - Tipos de serviço aceitos (corrida, entrega)
  - Veículos ativos
  - Raio de busca (1–300 km)
  - Auto-aceitar pedidos
  - Aceita dinheiro, PIX, maquininha
- **Configurações** (`DriverSettingsScreen`)

---

## Segurança da Conta

- Senhas com bcrypt (salt 10)
- CPF/CNPJ criptografados em repouso (AES-256-CBC) + hash SHA-256 para consulta
- `accountStatus`: `active | suspended | blocked` (controlado pelo admin)
- Rate limiting em endpoints sensíveis (verificação de telefone, login)
- Conta pode ser deletada pelo próprio usuário (LGPD)
