# 🏗️ Arquitetura do Sistema Leva Mais

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEVA MAIS PLATFORM                                  │
│                    Sistema de Transporte e Logística                       │
└─────────────────────────────────────────────────────────────────────────────┘

                                    CAMADA DE APRESENTAÇÃO
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────────┐              ┌─────────────────────────────────┐  │
│  │   MOBILE APP        │              │   WEB ADMIN PANEL               │  │
│  │   React Native      │              │   Next.js 16                    │  │
│  │   + Expo            │              │                                 │  │
│  │                     │              │   ┌──────────────────────────┐  │  │
│  │  ┌──────────────┐   │              │   │  Dashboard               │  │  │
│  │  │ Cliente      │   │              │   │  • Estatísticas          │  │  │
│  │  │ • Home       │   │              │   │  • Resumo geral          │  │  │
│  │  │ • Mapa       │   │              │   └──────────────────────────┘  │  │
│  │  │ • Favoritos  │   │              │                                 │  │
│  │  │ • Perfil     │   │              │   ┌──────────────────────────┐  │  │
│  │  └──────────────┘   │              │   │  Configurações           │  │  │
│  │                     │              │   │  • Tipos de Serviço ✅   │  │  │
│  │  ┌──────────────┐   │              │   │  • Usuários (futuro)     │  │  │
│  │  │ Motorista    │   │              │   │  • Relatórios (futuro)   │  │  │
│  │  │ • Dashboard  │   │              │   └──────────────────────────┘  │  │
│  │  │ • Corridas   │   │              │                                 │  │
│  │  │ • Histórico  │   │              └─────────────────────────────────┘  │
│  │  └──────────────┘   │                                                   │
│  └─────────────────────┘                                                   │
│           │                                          │                      │
│           │                                          │                      │
└───────────┼──────────────────────────────────────────┼──────────────────────┘
            │                                          │
            │         REST API (HTTP/HTTPS)            │
            │                                          │
            └──────────────┬───────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAMADA DE NEGÓCIO                                 │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        BACKEND API (Node.js)                          │  │
│  │                                                                        │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         ROUTES                                 │  │  │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │  │  │
│  │  │  │   /auth     │  │  /purposes   │  │    /favorites      │   │  │  │
│  │  │  │  • register │  │  • list      │  │    • list          │   │  │  │
│  │  │  │  • login    │  │  • create    │  │    • create        │   │  │  │
│  │  │  │  • google   │  │  • update    │  │    • update        │   │  │  │
│  │  │  │  • forgot   │  │  • delete    │  │    • delete        │   │  │  │
│  │  │  └─────────────┘  └──────────────┘  └────────────────────┘   │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                  │                                     │  │
│  │                                  ▼                                     │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                      MIDDLEWARES                               │  │  │
│  │  │  • Auth Middleware (JWT Verification)                          │  │  │
│  │  │  • Error Handler                                               │  │  │
│  │  │  • CORS                                                         │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                  │                                     │  │
│  │                                  ▼                                     │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                      CONTROLLERS                               │  │  │
│  │  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐   │  │  │
│  │  │  │   Auth       │  │   Purpose     │  │    Favorite      │   │  │  │
│  │  │  │  Controller  │  │   Controller  │  │    Controller    │   │  │  │
│  │  │  └──────────────┘  └───────────────┘  └──────────────────┘   │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                  │                                     │  │
│  │                                  ▼                                     │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        SERVICES                                │  │  │
│  │  │  ┌────────────────┐         ┌──────────────────────────┐      │  │  │
│  │  │  │  Email Service │         │  Notification Service    │      │  │  │
│  │  │  │  • Nodemailer  │         │  • Expo Push Tokens      │      │  │  │
│  │  │  │  • Templates   │         │  • Send Notifications    │      │  │  │
│  │  │  └────────────────┘         └──────────────────────────┘      │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                  │                                     │  │
│  └──────────────────────────────────┼─────────────────────────────────────┘  │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAMADA DE DADOS                                    │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     MONGODB DATABASE                                  │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                        COLLECTIONS                              │ │  │
│  │  │                                                                  │ │  │
│  │  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────┐ │ │  │
│  │  │  │   users    │  │  purposes  │  │  favorites  │  │ password │ │ │  │
│  │  │  │            │  │            │  │             │  │  resets  │ │ │  │
│  │  │  │ • _id      │  │ • _id      │  │ • _id       │  │          │ │ │  │
│  │  │  │ • name     │  │ • vehicle  │  │ • userId    │  │ • userId │ │ │  │
│  │  │  │ • email    │  │   Type     │  │ • label     │  │ • code   │ │ │  │
│  │  │  │ • password │  │ • title    │  │ • address   │  │ • expire │ │ │  │
│  │  │  │ • phone    │  │ • subtitle │  │ • lat/lng   │  │          │ │ │  │
│  │  │  │ • userType │  │ • icon     │  │             │  │          │ │ │  │
│  │  │  │ • googleId │  │ • badges   │  │             │  │          │ │ │  │
│  │  │  │ • vehicle  │  │            │  │             │  │          │ │ │  │
│  │  │  │   Info     │  │            │  │             │  │          │ │ │  │
│  │  │  └────────────┘  └────────────┘  └─────────────┘  └──────────┘ │ │  │
│  │  │                                                                  │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                       MONGOOSE MODELS                           │ │  │
│  │  │  • User.js        • Purpose.js                                  │ │  │
│  │  │  • Favorite.js    • PasswordReset.js                            │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVIÇOS EXTERNOS                                    │
│                                                                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  Google Maps    │  │  Google OAuth    │  │  Expo Push Service       │  │
│  │  • Geocoding    │  │  • Sign In       │  │  • Push Notifications    │  │
│  │  • Directions   │  │  • User Info     │  │                          │  │
│  │  • Places       │  │                  │  │                          │  │
│  └─────────────────┘  └──────────────────┘  └──────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SMTP Server (Nodemailer)                                           │   │
│  │  • Gmail / Outros provedores                                        │   │
│  │  • Reset de senha                                                   │   │
│  │  • Notificações por email                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### 1. Autenticação com Email/Senha

```
Mobile App
    │
    ├─→ POST /api/auth/register { name, email, password, ... }
    │       │
    │       ├─→ AuthController.register()
    │       │       │
    │       │       ├─→ Validar dados
    │       │       ├─→ Hash senha (bcrypt)
    │       │       ├─→ User.create()
    │       │       │       │
    │       │       │       └─→ MongoDB: INSERT into users
    │       │       │
    │       │       ├─→ Gerar JWT token
    │       │       └─→ Retornar { user, token }
    │       │
    │       └─→ Mobile: Salvar token + navegar
    │
    └─→ POST /api/auth/login { email, password }
            │
            ├─→ AuthController.login()
            │       │
            │       ├─→ User.findOne({ email }).select('+password')
            │       │       │
            │       │       └─→ MongoDB: FIND user
            │       │
            │       ├─→ bcrypt.compare(password, user.password)
            │       ├─→ Gerar JWT token
            │       └─→ Retornar { user, token }
            │
            └─→ Mobile: Salvar token + navegar
```

### 2. Autenticação com Google

```
Mobile App
    │
    ├─→ Google Sign In SDK
    │       │
    │       └─→ Obter idToken
    │
    └─→ POST /api/auth/google { idToken }
            │
            ├─→ AuthController.googleAuth()
            │       │
            │       ├─→ Verificar idToken no Google
            │       │       │
            │       │       └─→ Google API: Validar token
            │       │
            │       ├─→ User.findOne({ googleId })
            │       │   OU
            │       │   User.create({ googleId, email, name, ... })
            │       │       │
            │       │       └─→ MongoDB: FIND or CREATE
            │       │
            │       ├─→ Gerar JWT token
            │       └─→ Retornar { user, token }
            │
            └─→ Mobile: Salvar token + navegar
```

### 3. Buscar Tipos de Serviço

```
Mobile App (HomeScreen)
    │
    └─→ GET /api/purposes/motorcycle
            │
            ├─→ PurposeController.getByVehicleType('motorcycle')
            │       │
            │       ├─→ Purpose.find({ vehicleType: 'motorcycle', isActive: true })
            │       │       │
            │       │       └─→ MongoDB: FIND purposes
            │       │
            │       └─→ Retornar [{ id, title, subtitle, icon, badges }, ...]
            │
            └─→ Mobile: Renderizar lista de opções
```

### 4. Gerenciar Favoritos

```
Mobile App
    │
    ├─→ GET /api/favorites
    │       │ (Header: Authorization: Bearer <token>)
    │       │
    │       ├─→ Auth Middleware: Verificar JWT
    │       │       │
    │       │       └─→ Decodificar token → req.userId
    │       │
    │       ├─→ FavoriteController.list()
    │       │       │
    │       │       ├─→ Favorite.find({ userId: req.userId })
    │       │       │       │
    │       │       │       └─→ MongoDB: FIND favorites
    │       │       │
    │       │       └─→ Retornar [{ label, icon, address, lat, lng }, ...]
    │       │
    │       └─→ Mobile: Exibir favoritos
    │
    └─→ POST /api/favorites { label, icon, address, latitude, longitude }
            │ (Header: Authorization: Bearer <token>)
            │
            ├─→ Auth Middleware: Verificar JWT
            │
            ├─→ FavoriteController.create()
            │       │
            │       ├─→ Favorite.create({ userId, label, icon, ... })
            │       │       │
            │       │       └─→ MongoDB: INSERT into favorites
            │       │
            │       └─→ Retornar novo favorito
            │
            └─→ Mobile: Atualizar lista
```

### 5. Reset de Senha

```
Mobile App
    │
    ├─→ [1] POST /api/auth/forgot-password { email }
    │       │
    │       ├─→ AuthController.forgotPassword()
    │       │       │
    │       │       ├─→ User.findOne({ email })
    │       │       ├─→ Gerar código 6 dígitos
    │       │       ├─→ PasswordReset.create({ userId, code, expiresAt })
    │       │       │       │
    │       │       │       └─→ MongoDB: INSERT
    │       │       │
    │       │       ├─→ EmailService.sendPasswordReset(email, code)
    │       │       │       │
    │       │       │       └─→ SMTP: Enviar email
    │       │       │
    │       │       └─→ Retornar { message: "Código enviado" }
    │       │
    │       └─→ Mobile: Navegar para tela de verificação
    │
    ├─→ [2] POST /api/auth/verify-code { email, code }
    │       │
    │       ├─→ AuthController.verifyCode()
    │       │       │
    │       │       ├─→ User.findOne({ email })
    │       │       ├─→ PasswordReset.findOne({ userId, code, used: false })
    │       │       ├─→ Verificar expiração
    │       │       └─→ Retornar { valid: true }
    │       │
    │       └─→ Mobile: Navegar para nova senha
    │
    └─→ [3] POST /api/auth/reset-password { email, code, newPassword }
            │
            ├─→ AuthController.resetPassword()
            │       │
            │       ├─→ Validar código novamente
            │       ├─→ Hash nova senha
            │       ├─→ User.updateOne({ email }, { password: hashedPassword })
            │       │       │
            │       │       └─→ MongoDB: UPDATE user
            │       │
            │       ├─→ PasswordReset.updateOne({ used: true })
            │       └─→ Retornar { message: "Senha atualizada" }
            │
            └─→ Mobile: Navegar para login
```

### 6. Push Notifications

```
Mobile App (Startup)
    │
    ├─→ Expo.Notifications.getExpoPushTokenAsync()
    │       │
    │       └─→ Obter pushToken
    │
    └─→ PUT /api/auth/update-profile { expoPushToken }
            │
            ├─→ User.updateOne({ _id }, { expoPushToken })
            │       │
            │       └─→ MongoDB: UPDATE user
            │
            └─→ Salvo!

Backend (Evento)
    │
    └─→ NotificationService.sendPushNotification(userId, { title, body })
            │
            ├─→ User.findById(userId).select('expoPushToken')
            │
            ├─→ Expo.sendPushNotificationsAsync([{
            │       to: user.expoPushToken,
            │       title, body
            │   }])
            │       │
            │       └─→ Expo Push Service: Enviar notificação
            │
            └─→ Mobile: Receber notificação
```

## Segurança

### Autenticação e Autorização

```
┌────────────────────────────────────────────────────┐
│           FLUXO DE AUTENTICAÇÃO JWT                │
└────────────────────────────────────────────────────┘

1. Login bem-sucedido
   └─→ Gerar JWT token
       • Payload: { userId, userType, email }
       • Secret: process.env.JWT_SECRET
       • Expiration: 7 dias

2. Armazenar token no cliente
   └─→ AsyncStorage (mobile)
       Cookies/LocalStorage (web)

3. Requisições autenticadas
   └─→ Header: Authorization: Bearer <token>

4. Middleware de autenticação
   └─→ jwt.verify(token, SECRET)
       • Decodificar payload
       • Verificar expiração
       • Injetar req.userId

5. Controllers protegidos
   └─→ Usar req.userId para operações
```

### Proteção de Senha

```
┌────────────────────────────────────────────────────┐
│            HASH DE SENHA (bcrypt)                  │
└────────────────────────────────────────────────────┘

Cadastro:
  plainPassword → bcrypt.hash(password, 10) → hashedPassword
                                               ↓
                                          Salvar no DB

Login:
  plainPassword → bcrypt.compare(plain, hashed) → true/false
                                                   ↓
                                              Gerar token
```

### Validação de Dados

```
┌────────────────────────────────────────────────────┐
│          VALIDAÇÃO COM ZOD (Mobile)                │
└────────────────────────────────────────────────────┘

Schema:
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });

Uso:
  loginSchema.parse(formData)
    ↓ Se válido
  POST /api/auth/login
    ↓ Se inválido
  Exibir erros no formulário
```

## Performance e Otimizações

### Backend

- ✅ Índices no MongoDB (email, googleId, vehicleType)
- ✅ Connection pooling (Mongoose)
- ✅ Compressão de resposta (futuro)
- ✅ Cache de queries frequentes (futuro)

### Mobile

- ✅ Lazy loading de componentes
- ✅ Memoização com React.memo
- ✅ Otimização de re-renders (Zustand)
- ✅ Image optimization (Expo)

### Web

- ✅ Server-side rendering (Next.js)
- ✅ Static generation (quando aplicável)
- ✅ Code splitting automático
- ✅ Image optimization (next/image - futuro)

---

**Última atualização**: 24 de dezembro de 2025
