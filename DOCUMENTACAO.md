# 📖 Documentação Leva Mais

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura do Sistema](#-arquitetura-do-sistema)
3. [Aplicativo Mobile](#-aplicativo-mobile-react-native)
4. [Backend API](#-backend-api-nodejs)
5. [Painel Web Admin](#-painel-web-admin-nextjs)
6. [Modelos de Dados](#-modelos-de-dados)
7. [Fluxos de Autenticação](#-fluxos-de-autenticação)
8. [Configuração e Instalação](#-configuração-e-instalação)
9. [Estrutura de Pastas](#-estrutura-de-pastas)
10. [Tecnologias Utilizadas](#-tecnologias-utilizadas)

---

## 🎯 Visão Geral

**Leva Mais** é uma plataforma completa de transporte e logística que conecta clientes a motoristas para diferentes tipos de serviços de transporte. O sistema é composto por três componentes principais:

### **Componentes do Sistema:**

- 🚀 **Aplicativo Mobile** (React Native + Expo) - Interface para clientes e motoristas
- ⚙️ **Backend API** (Node.js + Express + MongoDB) - Lógica de negócio e persistência de dados
- 💻 **Painel Web Admin** (Next.js) - Gestão administrativa do sistema

### **Objetivo Principal:**

Facilitar a solicitação e gestão de serviços de transporte para diversos tipos de veículos (moto, carro, van, caminhão) com diferentes finalidades (entrega, mudança, transporte de passageiros, etc.).

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    LEVA MAIS PLATFORM                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │      │                  │
│  Mobile App      │◄────►│   Backend API    │◄────►│   Web Admin      │
│  React Native    │      │   Node.js/       │      │   Next.js        │
│  + Expo          │      │   Express        │      │                  │
│                  │      │                  │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                         │                          │
        │                         │                          │
        ▼                         ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Clientes &      │      │    MongoDB       │      │  Gerenciamento   │
│  Motoristas      │      │    Database      │      │  de Tipos de     │
│                  │      │                  │      │  Serviço         │
└──────────────────┘      └──────────────────┘      └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SERVIÇOS EXTERNOS                        │
├─────────────────────────────────────────────────────────────┤
│  • Google Maps API (Mapas e Geolocalização)                │
│  • Google Sign-In (Autenticação OAuth)                     │
│  • Expo Notifications (Push Notifications)                 │
│  • Nodemailer (Envio de E-mails)                           │
└─────────────────────────────────────────────────────────────┘
```

### **Comunicação entre Componentes:**

- **Mobile ↔ Backend**: REST API (HTTP/HTTPS)
- **Web Admin ↔ Backend**: REST API (HTTP/HTTPS)
- **Backend ↔ MongoDB**: Mongoose ODM
- **Backend ↔ Serviços Externos**: APIs de terceiros

---

## 📱 Aplicativo Mobile (React Native)

### **Visão Geral**

Aplicativo multiplataforma (Android e iOS) desenvolvido com React Native e Expo, oferecendo interfaces distintas para clientes e motoristas.

### **Principais Funcionalidades**

#### **Para Clientes:**

- ✅ Cadastro e login (email/senha ou Google)
- 🗺️ Visualização de mapa em tempo real
- 📍 Seleção de localização (origem e destino)
- 🚗 Seleção de tipo de veículo (moto, carro, van, caminhão)
- 🎯 Seleção de finalidade do serviço
- ⭐ Gerenciamento de locais favoritos
- 🔔 Notificações push
- 👤 Perfil e configurações

#### **Para Motoristas (em desenvolvimento):**

- ✅ Cadastro específico para motoristas
- 🚗 Gerenciamento de veículo
- 📋 Aceitação de corridas
- 📊 Histórico de viagens

### **Tecnologias Principais**

```json
{
  "framework": "React Native 0.81.5",
  "runtime": "Expo ~54.0.29",
  "navigation": "@react-navigation/native 7.x",
  "maps": "expo-maps + react-native-maps",
  "state": "zustand 5.x",
  "styling": "NativeWind (Tailwind CSS)",
  "validation": "Zod 3.x",
  "http": "Axios 1.13.x"
}
```

### **Estrutura de Telas**

#### **Telas Públicas** (`src/screens/(public)/`)

- `IntroScreen` - Tela de boas-vindas
- `SignInScreen` - Login
- `SignUpScreen` - Cadastro
- `SelectProfileScreen` - Seleção de perfil (Cliente/Motorista)
- `CompleteRegistrationScreen` - Completar cadastro
- `ForgotPasswordScreen` - Recuperação de senha
- `VerifyCodeScreen` - Verificação de código
- `NewPasswordScreen` - Nova senha
- `TermsScreen` - Termos e condições
- `NotificationPermissionScreen` - Permissões de notificação

#### **Telas Autenticadas** (`src/screens/(authenticated)/Client/`)

- `HomeScreen` - Tela principal do cliente
  - Mapa interativo
  - Seleção de veículos
  - Busca de motoristas
- `LocationPickerScreen` - Seleção de endereço
- `MapLocationPickerScreen` - Seleção via mapa

### **Componentes Principais**

```
src/components/
├── GlobalMap/              # Componente de mapa reutilizável
├── LocationHeader/         # Cabeçalho com localização
├── MapActionButtons/       # Botões de ação do mapa
├── FavoriteBottomSheet/    # Modal de favoritos
├── Modal/                  # Modais genéricos
├── SideSheet/              # Menu lateral
├── PasswordStrengthIndicator/  # Indicador de força de senha
└── Loading/                # Tela de carregamento
```

### **Serviços** (`src/services/`)

- `api.ts` - Cliente HTTP configurado (Axios)
- `auth.service.ts` - Autenticação
- `favorite.service.ts` - Gerenciamento de favoritos
- `notification.service.ts` - Notificações push
- `purposes.ts` - Tipos de serviço

### **Gerenciamento de Estado**

```typescript
// authStore.ts (Zustand)
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  // ...
}
```

### **Validação de Dados**

Utiliza **Zod** para validação:

- `auth.schema.ts` - Validação de login/cadastro
- `registration.schema.ts` - Validação de registro

---

## ⚙️ Backend API (Node.js)

### **Visão Geral**

API RESTful desenvolvida em Node.js com Express, utilizando MongoDB como banco de dados. Fornece endpoints para autenticação, gerenciamento de usuários, tipos de serviço e favoritos.

### **Principais Recursos**

- 🔐 Autenticação JWT
- 🔑 Login com Google OAuth
- 📧 Reset de senha via email
- 👥 Gestão de usuários (clientes, motoristas, admin)
- 🎯 CRUD de tipos de serviço (purposes)
- ⭐ CRUD de locais favoritos
- 🔔 Notificações push via Expo

### **Endpoints da API**

#### **Autenticação** (`/api/auth`)

```
POST   /api/auth/register           # Cadastro (email/senha)
POST   /api/auth/login              # Login (email/senha)
POST   /api/auth/google             # Login/Cadastro Google
POST   /api/auth/forgot-password    # Solicitar reset de senha
POST   /api/auth/verify-code        # Verificar código de reset
POST   /api/auth/reset-password     # Resetar senha
GET    /api/auth/me                 # Obter usuário autenticado
PUT    /api/auth/update-profile     # Atualizar perfil
```

#### **Tipos de Serviço** (`/api/purposes`)

```
GET    /api/purposes                # Listar todos
GET    /api/purposes/:vehicleType   # Listar por tipo de veículo
POST   /api/purposes                # Criar (admin)
PUT    /api/purposes/:id            # Atualizar (admin)
DELETE /api/purposes/:id            # Deletar (admin)
```

#### **Favoritos** (`/api/favorites`)

```
GET    /api/favorites               # Listar favoritos do usuário
POST   /api/favorites               # Criar favorito
PUT    /api/favorites/:id           # Atualizar favorito
DELETE /api/favorites/:id           # Deletar favorito
```

#### **Health Check**

```
GET    /api/health                  # Status do servidor
```

### **Estrutura do Backend**

```
backend/
├── server.js                   # Entry point
├── package.json                # Dependências
├── .env                        # Variáveis de ambiente
└── src/
    ├── config/
    │   └── database.js         # Conexão MongoDB
    ├── models/
    │   ├── User.js             # Schema de usuário
    │   ├── Purpose.js          # Schema de tipos de serviço
    │   ├── Favorite.js         # Schema de favoritos
    │   └── PasswordReset.js    # Schema de reset de senha
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── purpose.controller.js
    │   └── favorite.controller.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── purpose.routes.js
    │   └── favorite.routes.js
    ├── middlewares/
    │   └── auth.middleware.js  # Verificação de JWT
    ├── services/
    │   ├── email.service.js    # Envio de emails
    │   └── notification.service.js  # Push notifications
    ├── templates/
    │   └── email/              # Templates de email
    └── scripts/
        └── fix-purpose-indexes.js
```

### **Variáveis de Ambiente**

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/leva-mais

# JWT
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRE=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app

# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com

# Expo Push Notifications
EXPO_ACCESS_TOKEN=seu_expo_token
```

### **Tecnologias Backend**

```json
{
  "runtime": "Node.js",
  "framework": "Express 4.18.x",
  "database": "MongoDB via Mongoose 8.x",
  "auth": "JWT (jsonwebtoken 9.x)",
  "password": "bcryptjs 2.4.x",
  "email": "Nodemailer 6.10.x",
  "push": "expo-server-sdk 4.x"
}
```

---

## 💻 Painel Web Admin (Next.js)

### **Visão Geral**

Painel administrativo web desenvolvido em Next.js 16 para gerenciamento de configurações do sistema.

### **Status Atual**

✅ **MVP Implementado**: Módulo de Tipos de Serviço (Purposes)

### **Funcionalidades Implementadas**

- 📋 CRUD completo de tipos de serviço
- 🚗 Gestão por tipo de veículo (moto, carro, van, caminhão)
- 🎨 Interface moderna com Tailwind CSS
- 📱 Design responsivo
- 🔍 Visualização organizada por categorias

### **Estrutura Web**

```
leva-mais-web/
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── layout.tsx            # Layout global
│   ├── globals.css           # Estilos globais
│   └── settings/
│       └── purposes/
│           ├── page.tsx      # Listagem de purposes
│           ├── new/
│           │   └── page.tsx  # Criar purpose
│           └── [id]/
│               └── edit/
│                   └── page.tsx  # Editar purpose
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── ui/
│       └── purpose-form.tsx  # Formulário de purpose
├── services/
│   └── purposesService.ts    # Cliente da API
├── types/
│   └── index.ts              # TypeScript types
└── lib/
    └── utils.ts              # Utilitários
```

### **Tecnologias Web**

```json
{
  "framework": "Next.js 16.1.0",
  "react": "19.2.3",
  "styling": "Tailwind CSS 4.x",
  "icons": "Lucide React",
  "http": "Fetch API nativo",
  "utils": "clsx, tailwind-merge"
}
```

### **Páginas Principais**

- `/` - Dashboard (Em desenvolvimento)
- `/settings/purposes` - Gerenciamento de tipos de serviço
- `/settings/purposes/new` - Criar novo tipo de serviço
- `/settings/purposes/[id]/edit` - Editar tipo de serviço

---

## 📊 Modelos de Dados

### **User (Usuário)**

```javascript
{
  _id: ObjectId,
  name: String,               // Nome completo
  email: String,              // Email único
  password: String,           // Hash bcrypt (opcional se Google)
  phone: String,              // Telefone
  city: String,               // Cidade

  // Documentos
  cpf: String,                // CPF (pessoa física)
  cnpj: String,               // CNPJ (pessoa jurídica)

  // Dados empresa
  companyName: String,
  companyPhone: String,
  companyAddress: String,

  // Dados motorista
  driverLicense: String,      // CNH
  vehicleInfo: {
    type: String,             // motorcycle, car, van, truck
    plate: String,
    model: String,
    year: Number,
    color: String
  },

  // Google OAuth
  googleId: String,

  // Tipo de usuário
  userType: String,           // "client", "driver", "admin"

  // Controle
  isActive: Boolean,
  acceptedTerms: Boolean,
  profileCompleted: Boolean,

  // Push Notifications
  expoPushToken: String,

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### **Purpose (Tipo de Serviço)**

```javascript
{
  _id: ObjectId,
  vehicleType: String,        // "motorcycle", "car", "van", "truck"
  id: String,                 // ID único dentro do vehicleType
  title: String,              // Título do serviço
  subtitle: String,           // Descrição
  icon: String,               // Nome do ícone (Lucide)
  badges: [String],           // Tags (ex: ["Rápido", "Econômico"])
  isActive: Boolean,          // Status
  createdAt: Date,
  updatedAt: Date
}
```

### **Favorite (Local Favorito)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Referência ao usuário
  label: String,              // "Casa", "Trabalho", etc.
  icon: String,               // "home", "briefcase", etc.
  address: String,            // Endereço completo
  latitude: Number,           // Coordenada
  longitude: Number,          // Coordenada
  createdAt: Date,
  updatedAt: Date
}
```

### **PasswordReset (Reset de Senha)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Referência ao usuário
  code: String,               // Código de 6 dígitos
  expiresAt: Date,            // Validade (10 minutos)
  used: Boolean,              // Se foi utilizado
  createdAt: Date
}
```

---

## 🔐 Fluxos de Autenticação

### **1. Cadastro com Email/Senha**

```
Cliente → [POST /api/auth/register]
    ↓
Validação de dados
    ↓
Hash de senha (bcrypt)
    ↓
Salvar usuário no MongoDB
    ↓
Gerar JWT token
    ↓
← Retornar { user, token }
```

### **2. Login com Email/Senha**

```
Cliente → [POST /api/auth/login]
    ↓
Buscar usuário por email
    ↓
Comparar senha (bcrypt)
    ↓
Gerar JWT token
    ↓
← Retornar { user, token }
```

### **3. Login com Google**

```
Cliente → [Google Sign-In]
    ↓
Obter Google ID Token
    ↓
Cliente → [POST /api/auth/google] { idToken }
    ↓
Verificar token no Google
    ↓
Buscar/Criar usuário por googleId
    ↓
Gerar JWT token
    ↓
← Retornar { user, token }
```

### **4. Reset de Senha**

```
[Esqueci Senha]
Cliente → [POST /api/auth/forgot-password] { email }
    ↓
Gerar código de 6 dígitos
    ↓
Salvar no PasswordReset (expires: 10min)
    ↓
Enviar email com código
    ↓
← Código enviado

[Verificar Código]
Cliente → [POST /api/auth/verify-code] { email, code }
    ↓
Validar código e expiração
    ↓
← Código válido

[Nova Senha]
Cliente → [POST /api/auth/reset-password] { email, code, newPassword }
    ↓
Validar código novamente
    ↓
Hash nova senha
    ↓
Atualizar senha do usuário
    ↓
Marcar código como usado
    ↓
← Senha atualizada
```

---

## 🛠️ Configuração e Instalação

### **Pré-requisitos**

- Node.js 14+ (recomendado: 18+)
- npm ou yarn
- MongoDB 4.4+ (local ou Atlas)
- Expo CLI (para mobile)
- Android Studio / Xcode (para emuladores)

### **1. Configurar Backend**

```bash
# Navegar para o diretório
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Iniciar servidor
npm run dev          # Modo desenvolvimento
# ou
npm start            # Modo produção
```

**Variáveis necessárias no `.env`:**

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/leva-mais
JWT_SECRET=chave_secreta_super_segura
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app_google
```

### **2. Configurar Mobile**

```bash
# No diretório raiz do projeto
npm install

# Configurar API URL
# Editar src/services/api.ts
# Trocar IP para seu IP local ou servidor

# Iniciar Expo
npm start

# Executar em emulador/dispositivo
npm run android      # Android
npm run ios          # iOS (apenas macOS)
```

**Configurar Google Sign-In:**

1. Criar projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Google Sign-In API
3. Criar credenciais OAuth 2.0:
   - Web Client ID (para backend)
   - Android Client ID
   - iOS Client ID
4. Baixar arquivos de configuração:
   - `client_secret_Web.json` → renomear e colocar na raiz
   - `client_secret_Android.json` → renomear e colocar na raiz
   - `client_IOS.plist` → renomear e colocar na raiz

**Configurar Google Maps:**

1. Habilitar Maps SDK no Google Cloud
2. Gerar API Key
3. Adicionar no `app.json` (já configurado com uma chave de exemplo)

### **3. Configurar Web Admin**

```bash
# Navegar para o diretório
cd leva-mais-web

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev          # Porta 3001

# Build para produção
npm run build
npm start
```

Acessar: `http://localhost:3001`

### **4. Popular Banco de Dados (Opcional)**

```bash
# No diretório backend
node seed-simple.js
```

---

## 📁 Estrutura de Pastas Completa

```
Leva_Mais/
│
├── android/                        # Configurações Android
├── ios/                            # Configurações iOS (se gerado)
├── assets/                         # Imagens e recursos
│
├── src/                            # Código fonte mobile
│   ├── assets/                     # Assets específicos
│   ├── components/                 # Componentes reutilizáveis
│   │   ├── FavoriteBottomSheet/
│   │   ├── GlobalMap/
│   │   ├── LocationHeader/
│   │   ├── MapActionButtons/
│   │   ├── Modal/
│   │   ├── PasswordStrengthIndicator/
│   │   └── SideSheet/
│   ├── context/                    # Context API / Stores
│   │   └── authStore.ts
│   ├── routes/                     # Navegação
│   │   ├── index.tsx
│   │   ├── auth.routes.tsx
│   │   └── drawer.cliente.routes.tsx
│   ├── schemas/                    # Validações Zod
│   │   ├── auth.schema.ts
│   │   └── registration.schema.ts
│   ├── screens/                    # Telas
│   │   ├── (public)/
│   │   │   ├── IntroScreen/
│   │   │   ├── SignInScreen/
│   │   │   ├── SignUpScreen/
│   │   │   ├── SelectProfileScreen/
│   │   │   ├── CompleteRegistrationScreen/
│   │   │   ├── ForgotPasswordScreen/
│   │   │   ├── VerifyCodeScreen/
│   │   │   ├── NewPasswordScreen/
│   │   │   ├── TermsScreen/
│   │   │   └── NotificationPermissionScreen/
│   │   └── (authenticated)/
│   │       └── Client/
│   │           └── HomeScreen/
│   ├── services/                   # Serviços e APIs
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── favorite.service.ts
│   │   ├── notification.service.ts
│   │   └── purposes.ts
│   ├── theme/                      # Tema e cores
│   ├── types/                      # TypeScript types
│   │   ├── api.d.ts
│   │   ├── env.d.ts
│   │   ├── navigation.d.ts
│   │   └── registration.d.ts
│   └── utils/                      # Utilitários
│       ├── iconMapper.ts
│       ├── location.ts
│       └── pinGeocode.ts
│
├── backend/                        # Backend Node.js
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── purpose.controller.js
│   │   │   └── favorite.controller.js
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Purpose.js
│   │   │   ├── Favorite.js
│   │   │   └── PasswordReset.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── purpose.routes.js
│   │   │   └── favorite.routes.js
│   │   ├── services/
│   │   │   ├── email.service.js
│   │   │   └── notification.service.js
│   │   ├── templates/
│   │   │   └── email/
│   │   └── scripts/
│   │       └── fix-purpose-indexes.js
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── README.md
│   ├── CONFIGURACAO_EMAIL.md
│   ├── SETUP_EMAIL.md
│   ├── TESTE_EMAIL.md
│   ├── PROXIMOS_PASSOS.md
│   ├── seed-simple.js
│   ├── test-email.js
│   └── check-db.js
│
├── leva-mais-web/                  # Painel Admin Next.js
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── settings/
│   │       └── purposes/
│   │           ├── page.tsx
│   │           ├── new/
│   │           │   └── page.tsx
│   │           └── [id]/
│   │               └── edit/
│   │                   └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       └── purpose-form.tsx
│   ├── services/
│   │   └── purposesService.ts
│   ├── types/
│   │   └── index.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.mjs
│   ├── README.md
│   └── RESPONSIVIDADE.md
│
├── App.tsx                         # Entry point mobile
├── index.ts
├── app.json                        # Configuração Expo
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
├── global.css
└── nativewind-env.d.ts
```

---

## 🚀 Tecnologias Utilizadas

### **Mobile (React Native)**

| Tecnologia         | Versão   | Propósito               |
| ------------------ | -------- | ----------------------- |
| React Native       | 0.81.5   | Framework mobile        |
| Expo               | ~54.0.29 | Toolchain e runtime     |
| React Navigation   | 7.x      | Navegação entre telas   |
| Zustand            | 5.x      | Gerenciamento de estado |
| Axios              | 1.13.x   | Cliente HTTP            |
| Zod                | 3.x      | Validação de dados      |
| NativeWind         | 4.x      | Tailwind CSS para RN    |
| React Native Maps  | 1.20.1   | Integração com mapas    |
| Expo Location      | 19.x     | Geolocalização          |
| Expo Notifications | 0.32.x   | Push notifications      |
| Google Sign-In     | 16.x     | Autenticação Google     |
| Bottom Sheet       | 5.x      | Modais deslizantes      |

### **Backend (Node.js)**

| Tecnologia      | Versão | Propósito                     |
| --------------- | ------ | ----------------------------- |
| Node.js         | 14+    | Runtime JavaScript            |
| Express         | 4.18.x | Framework web                 |
| MongoDB         | 8.x    | Banco de dados NoSQL          |
| Mongoose        | 8.x    | ODM para MongoDB              |
| JWT             | 9.x    | Autenticação token            |
| bcryptjs        | 2.4.x  | Hash de senhas                |
| Nodemailer      | 6.10.x | Envio de emails               |
| Expo Server SDK | 4.x    | Push notifications            |
| CORS            | 2.8.x  | Cross-Origin Resource Sharing |
| dotenv          | 16.x   | Variáveis de ambiente         |

### **Web Admin (Next.js)**

| Tecnologia   | Versão  | Propósito            |
| ------------ | ------- | -------------------- |
| Next.js      | 16.1.0  | Framework React SSR  |
| React        | 19.2.3  | Biblioteca UI        |
| TypeScript   | 5.x     | Tipagem estática     |
| Tailwind CSS | 4.x     | Framework CSS        |
| Lucide React | 0.562.x | Ícones               |
| date-fns     | 4.1.x   | Manipulação de datas |

### **DevOps e Ferramentas**

- Git (Controle de versão)
- ESLint (Linting)
- Prettier (Formatação - implícito)
- Nodemon (Auto-reload backend)
- TypeScript (Tipagem)

---

## 📝 Fluxo de Uso da Aplicação

### **Jornada do Cliente:**

1. **Onboarding**

   - Tela de introdução
   - Seleção de perfil (Cliente)
   - Cadastro ou Login
   - Permissão de notificações

2. **Tela Principal**

   - Visualizar mapa
   - Ver localização atual
   - Adicionar locais favoritos

3. **Solicitar Corrida**

   - Selecionar origem (atual ou favorito)
   - Selecionar destino
   - Escolher tipo de veículo
   - Escolher finalidade do serviço
   - Confirmar solicitação

4. **Acompanhamento** (em desenvolvimento)

   - Ver motorista se aproximando
   - Chat com motorista
   - Rastreamento em tempo real

5. **Finalização** (em desenvolvimento)
   - Avaliação do serviço
   - Histórico de corridas

### **Jornada do Motorista:** (em desenvolvimento)

1. Cadastro específico com CNH e veículo
2. Aceitar/rejeitar corridas
3. Navegar até o cliente
4. Finalizar corrida
5. Receber pagamento

### **Jornada do Admin:**

1. Acessar painel web
2. Gerenciar tipos de serviço
3. Adicionar/editar/remover purposes
4. Visualizar estatísticas (futuro)

---

## 🔄 Próximos Passos e Roadmap

### **MVP Implementado** ✅

- ✅ Autenticação completa (email, Google, reset de senha)
- ✅ Cadastro de clientes
- ✅ Interface de mapa
- ✅ Seleção de veículos
- ✅ Gerenciamento de favoritos
- ✅ CRUD de tipos de serviço (admin)
- ✅ Notificações push
- ✅ Painel admin básico

### **Em Desenvolvimento** 🚧

- 🚧 Sistema de corridas completo
- 🚧 Interface para motoristas
- 🚧 Matching cliente-motorista
- 🚧 Cálculo de preços
- 🚧 Chat em tempo real
- 🚧 Rastreamento de corrida

### **Planejado** 📋

- 📋 Sistema de pagamentos
- 📋 Avaliações e reviews
- 📋 Histórico de corridas
- 📋 Dashboard de estatísticas (admin)
- 📋 Gerenciamento de usuários (admin)
- 📋 Relatórios financeiros
- 📋 Suporte a múltiplas cidades

---

## 🐛 Troubleshooting

### **Problemas Comuns:**

#### **Backend não conecta ao MongoDB**

```bash
# Verificar se MongoDB está rodando
mongod --version

# Verificar conexão
node backend/check-db.js
```

#### **Mobile não conecta à API**

- Verificar IP no `src/services/api.ts`
- Garantir que backend está rodando
- Verificar firewall
- Para emulador Android: usar `10.0.2.2` em vez de `localhost`

#### **Google Sign-In não funciona**

- Verificar se os arquivos de credenciais estão na raiz
- Verificar SHA-1 do debug.keystore
- Verificar Client IDs no Google Cloud Console

#### **Erro de CORS**

- Verificar configuração de CORS no backend
- Adicionar origem do frontend em `cors()`

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 👥 Equipe

- **Desenvolvedor**: Maike Souza Leite
- **Repositório**: LevaMais
- **Organização**: MaikeSouzaL

---

## 📞 Suporte

Para dúvidas ou suporte, consulte a documentação específica de cada módulo:

- `backend/README.md` - Documentação do backend
- `backend/CONFIGURACAO_EMAIL.md` - Configuração de emails
- `leva-mais-web/README.md` - Documentação do painel web
- `leva-mais-web/RESPONSIVIDADE.md` - Guia de responsividade

---

**Última atualização**: 24 de dezembro de 2025
