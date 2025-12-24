# 🚗 Leva Mais - Plataforma de Transporte e Logística

<div align="center">

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20Web-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

**Conectando clientes a motoristas para serviços de transporte versáteis**

[Documentação Completa](./DOCUMENTACAO.md) • [Backend](./backend/README.md) • [Web Admin](./leva-mais-web/README.md)

</div>

---

## 📖 Sobre o Projeto

**Leva Mais** é uma plataforma completa de transporte e logística que facilita a conexão entre clientes e motoristas para diversos tipos de serviços. O sistema suporta múltiplos tipos de veículos (moto, carro, van, caminhão) e oferece uma ampla gama de finalidades de serviço.

### 🎯 Objetivos Principais

- Facilitar solicitação de serviços de transporte
- Conectar clientes e motoristas de forma eficiente
- Oferecer flexibilidade com diferentes tipos de veículos
- Gerenciar tipos de serviço de forma dinâmica
- Proporcionar experiência intuitiva e moderna

---

## 🏗️ Arquitetura

O projeto é dividido em três componentes principais:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Mobile App    │      │   Backend API   │      │   Web Admin     │
│  React Native   │◄────►│   Node.js +     │◄────►│    Next.js      │
│   + Expo        │      │   Express       │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │   MongoDB   │
                         └─────────────┘
```

### 📱 **Aplicativo Mobile**

- Framework: React Native + Expo
- Interfaces para clientes e motoristas
- Mapas em tempo real
- Notificações push
- Autenticação Google

### ⚙️ **Backend API**

- Node.js + Express
- MongoDB com Mongoose
- Autenticação JWT
- APIs RESTful
- Envio de emails
- Push notifications

### 💻 **Painel Web Admin**

- Next.js 16 + React 19
- Gerenciamento de tipos de serviço
- Interface moderna com Tailwind CSS
- Design responsivo

---

## ✨ Funcionalidades

### ✅ Implementadas (MVP)

- ✅ Sistema de autenticação completo (email/senha + Google)
- ✅ Cadastro de clientes e motoristas
- ✅ Recuperação de senha via email
- ✅ Visualização de mapa interativo
- ✅ Seleção de localização (origem e destino)
- ✅ Gerenciamento de locais favoritos
- ✅ Seleção de tipos de veículo
- ✅ Notificações push
- ✅ CRUD de tipos de serviço (admin)
- ✅ Painel administrativo web

### 🚧 Em Desenvolvimento

- 🚧 Sistema completo de corridas
- 🚧 Matching cliente-motorista
- 🚧 Chat em tempo real
- 🚧 Rastreamento de corrida
- 🚧 Cálculo de preços

### 📋 Planejadas

- 📋 Sistema de pagamentos
- 📋 Avaliações e reviews
- 📋 Histórico de corridas
- 📋 Dashboard com estatísticas
- 📋 Relatórios financeiros

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 14+ (recomendado 18+)
- MongoDB 4.4+
- Expo CLI
- Android Studio / Xcode (para emuladores)

### Instalação

#### 1️⃣ Clone o repositório

```bash
git clone https://github.com/MaikeSouzaL/LevaMais.git
cd LevaMais
```

#### 2️⃣ Configure o Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas configurações
npm run dev
```

#### 3️⃣ Configure o Mobile

```bash
# Na raiz do projeto
npm install
# Edite src/services/api.ts com o IP do backend
npm start
```

#### 4️⃣ Configure o Web Admin

```bash
cd leva-mais-web
npm install
npm run dev
```

### Acesso Rápido

- **Backend API**: http://localhost:3000
- **Web Admin**: http://localhost:3001
- **Mobile**: Expo DevTools

---

## 📚 Documentação

### 📖 Documentação Completa

- 📋 **[INDICE.md](./INDICE.md)** - Índice completo de toda a documentação
- 📄 **[DOCUMENTACAO.md](./DOCUMENTACAO.md)** - Documentação técnica completa
- 🏗️ **[ARQUITETURA.md](./ARQUITETURA.md)** - Arquitetura e diagramas do sistema
- 📡 **[API_REFERENCE.md](./API_REFERENCE.md)** - Referência completa da API
- 📊 **[RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)** - Visão executiva do projeto

### 📘 Documentação por Componente

- 📘 [Backend README](./backend/README.md) - API e configurações
- 📗 [Configuração de Email](./backend/CONFIGURACAO_EMAIL.md) - Setup de envio de emails
- 📙 [Web Admin README](./leva-mais-web/README.md) - Painel administrativo
- 📕 [Responsividade Web](./leva-mais-web/RESPONSIVIDADE.md) - Guia de design responsivo

### 🎯 Guia Rápido

- **Novo no projeto?** → Comece pelo [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)
- **Desenvolvedor?** → Veja o [Setup](#-início-rápido) aqui e depois [API_REFERENCE.md](./API_REFERENCE.md)
- **Arquiteto?** → Consulte [ARQUITETURA.md](./ARQUITETURA.md)
- **Precisa de algo específico?** → Use o [INDICE.md](./INDICE.md)

---

## 🛠️ Tecnologias Principais

<table>
<tr>
<td valign="top" width="33%">

### Mobile

- React Native 0.81.5
- Expo ~54.0.29
- React Navigation 7.x
- Zustand (State)
- NativeWind (Tailwind)
- Axios
- Zod
- Google Maps

</td>
<td valign="top" width="33%">

### Backend

- Node.js
- Express 4.18.x
- MongoDB
- Mongoose 8.x
- JWT
- bcryptjs
- Nodemailer
- Expo Server SDK

</td>
<td valign="top" width="33%">

### Web

- Next.js 16.1.0
- React 19.2.3
- TypeScript 5.x
- Tailwind CSS 4.x
- Lucide React
- date-fns

</td>
</tr>
</table>

---

## 📁 Estrutura do Projeto

```
Leva_Mais/
├── src/                      # Código fonte mobile
│   ├── components/           # Componentes reutilizáveis
│   ├── screens/              # Telas do app
│   ├── routes/               # Navegação
│   ├── services/             # APIs e serviços
│   └── utils/                # Utilitários
│
├── backend/                  # Backend API
│   ├── src/
│   │   ├── controllers/      # Lógica de negócio
│   │   ├── models/           # Schemas MongoDB
│   │   ├── routes/           # Rotas da API
│   │   └── services/         # Serviços (email, notificações)
│   └── server.js             # Entry point
│
├── leva-mais-web/            # Painel Admin
│   ├── app/                  # Páginas Next.js
│   ├── components/           # Componentes React
│   └── services/             # Cliente da API
│
└── assets/                   # Recursos (imagens, ícones)
```

---

## 🔐 Variáveis de Ambiente

### Backend (.env)

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/leva-mais
JWT_SECRET=sua_chave_secreta
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
```

### Mobile (src/services/api.ts)

```typescript
const API_BASE_URL = "http://SEU_IP:3000/api";
```

---

## 📊 API Endpoints

### Autenticação

```
POST   /api/auth/register          # Cadastro
POST   /api/auth/login             # Login
POST   /api/auth/google            # Login Google
POST   /api/auth/forgot-password   # Esqueci senha
POST   /api/auth/verify-code       # Verificar código
POST   /api/auth/reset-password    # Resetar senha
GET    /api/auth/me                # Dados do usuário
```

### Tipos de Serviço

```
GET    /api/purposes               # Listar todos
GET    /api/purposes/:vehicleType  # Por tipo de veículo
POST   /api/purposes               # Criar (admin)
PUT    /api/purposes/:id           # Atualizar (admin)
DELETE /api/purposes/:id           # Deletar (admin)
```

### Favoritos

```
GET    /api/favorites              # Listar
POST   /api/favorites              # Criar
PUT    /api/favorites/:id          # Atualizar
DELETE /api/favorites/:id          # Deletar
```

---

## 🧪 Testando a Aplicação

### Testar Backend

```bash
cd backend
npm run dev

# Em outro terminal, testar health check
curl http://localhost:3000/api/health
```

### Testar Email

```bash
cd backend
npm run test:email
```

### Testar Mobile

```bash
# No emulador Android
npm run android

# No emulador iOS (apenas macOS)
npm run ios

# No navegador
npm run web
```

---

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir:

1. Crie uma branch para sua feature
2. Commit suas mudanças
3. Push para a branch
4. Abra um Pull Request

### Padrões de Código

- Use TypeScript onde aplicável
- Siga os padrões ESLint
- Componentes React em PascalCase
- Arquivos de serviço em camelCase

---

## 🐛 Troubleshooting

### Problema: Backend não conecta ao MongoDB

**Solução**: Verifique se o MongoDB está rodando

```bash
mongod --version
```

### Problema: Mobile não conecta à API

**Solução**:

1. Verifique o IP em `src/services/api.ts`
2. Use `10.0.2.2` para emulador Android
3. Use seu IP local para dispositivo físico

### Problema: Google Sign-In não funciona

**Solução**:

1. Verifique credenciais OAuth no Google Cloud Console
2. Confira se os arquivos de configuração estão na raiz
3. Verifique SHA-1 do debug.keystore

---

## 📝 Changelog

### [1.0.0] - 2025-12-24

#### Adicionado

- Sistema de autenticação completo
- Interface de mapa com geolocalização
- CRUD de tipos de serviço
- Painel administrativo web
- Gerenciamento de favoritos
- Notificações push
- Recuperação de senha via email

---

## 👥 Equipe

- **Desenvolvedor Principal**: Maike Souza Leite
- **Organização**: MaikeSouzaL
- **Repositório**: LevaMais

---

## 📄 Licença

Este projeto é privado e proprietário. Todos os direitos reservados.

---

## 🔗 Links Úteis

- [Documentação Completa](./DOCUMENTACAO.md)
- [Backend README](./backend/README.md)
- [Web Admin README](./leva-mais-web/README.md)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [MongoDB Docs](https://docs.mongodb.com/)

---

<div align="center">

**Desenvolvido com ❤️ para facilitar o transporte e logística**

⭐ Se este projeto foi útil, considere dar uma estrela!

</div>
