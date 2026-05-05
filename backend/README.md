# Leva Mais - Backend API

Backend API desenvolvida em Node.js com Express e MongoDB para o aplicativo Leva Mais.

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- MongoDB (local ou Atlas)
- npm ou yarn

## 🚀 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Edite o arquivo `.env` com suas configurações:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/leva-mais
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRE=7d
```

## 🏃 Executando

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # Configuração do MongoDB
│   ├── models/
│   │   └── User.js           # Modelo de usuário
│   ├── controllers/
│   │   └── auth.controller.js # Controller de autenticação
│   ├── routes/
│   │   └── auth.routes.js    # Rotas de autenticação
│   └── middlewares/
│       └── auth.middleware.js # Middleware de autenticação
├── server.js                 # Arquivo principal do servidor
├── package.json
└── .env                      # Variáveis de ambiente (não versionado)
```

## 🔌 Endpoints da API

### Autenticação

#### POST /api/auth/register
Cadastrar novo usuário com email e senha.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "phone": "11999999999",
  "city": "São Paulo",
  "userType": "client",
  "acceptedTerms": true
}
```

#### POST /api/auth/login
Login com email e senha.

**Body:**
```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### POST /api/auth/google
Login ou cadastro com Google.

**Body:**
```json
{
  "googleId": "123456789",
  "email": "joao@gmail.com",
  "name": "João Silva",
  "profilePhoto": "https://..."
}
```

#### GET /api/auth/profile
Buscar perfil do usuário autenticado (requer token).

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

#### GET /api/health
Verificar se o servidor está funcionando.

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Após login bem-sucedido, você receberá um token que deve ser enviado no header `Authorization`:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 📝 Modelo de Usuário

```javascript
{
  name: String (obrigatório),
  email: String (obrigatório, único),
  password: String (obrigatório se não for Google),
  phone: String,
  city: String,
  userType: ['client', 'driver', 'admin'],
  googleId: String (para login com Google),
  profilePhoto: String,
  acceptedTerms: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ Tecnologias Utilizadas

- **Express**: Framework web para Node.js
- **MongoDB + Mongoose**: Banco de dados NoSQL
- **JWT**: Autenticação baseada em tokens
- **bcryptjs**: Hash de senhas
- **dotenv**: Gerenciamento de variáveis de ambiente
- **cors**: Habilita CORS

## 📄 Licença

ISC

