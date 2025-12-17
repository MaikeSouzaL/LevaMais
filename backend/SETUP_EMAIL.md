# 🚀 Setup Rápido - Sistema de Email

## 1. Instalar Dependências

```bash
cd backend
npm install
```

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` (copie do `.env.example` se existir):

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/leva-mais
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRE=7d

# Configurações SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

## 3. Configurar Gmail (Recomendado)

1. Ative verificação em duas etapas: https://myaccount.google.com/security
2. Gere senha de app: https://myaccount.google.com/apppasswords
3. Use a senha de 16 caracteres no `SMTP_PASS`

## 4. Testar

```bash
npm run dev
```

Você deve ver: `✅ Servidor de email configurado com sucesso`

## 5. Endpoints Criados

- `POST /api/auth/forgot-password` - Solicita código
- `POST /api/auth/verify-reset-code` - Verifica código
- `POST /api/auth/reset-password` - Redefine senha

Veja `CONFIGURACAO_EMAIL.md` para mais detalhes!
