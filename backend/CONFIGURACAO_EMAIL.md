# 📧 Configuração de Email - Leva+

Este guia explica como configurar o envio de emails para o sistema de recuperação de senha.

## 🔧 Configuração SMTP

### 1. Gmail (Recomendado para desenvolvimento)

1. **Ative a verificação em duas etapas** na sua conta Google
2. **Gere uma senha de app**:

   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" e "Outro (nome personalizado)"
   - Digite "Leva Mais Backend"
   - Clique em "Gerar"
   - Copie a senha gerada (16 caracteres)= rsiw ctuh iuvn sdtc

3. **Configure no `.env`**:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

### 2. Outlook/Hotmail

1. **Use sua senha normal** ou crie uma senha de app
2. **Configure no `.env`**:

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
```

### 3. Servidor Próprio

Se você tem um servidor de email próprio:

```env
SMTP_HOST=smtp.seuservidor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seuservidor.com
SMTP_PASS=sua-senha
```

### 4. Outros Provedores

#### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua-api-key-do-sendgrid
```

#### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASS=sua-senha-do-mailgun
```

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` com as seguintes variáveis:

```env
# Porta do servidor
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/leva-mais

# JWT
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRE=7d

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

## ✅ Testando a Configuração

1. **Instale as dependências**:

```bash
cd backend
npm install
```

2. **Configure o `.env`** com suas credenciais

3. **Inicie o servidor**:

```bash
npm run dev
```

4. **Teste o endpoint**:

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@exemplo.com"}'
```

5. **Verifique o console**:
   - ✅ "Servidor de email configurado com sucesso" = Tudo certo!
   - ❌ Erro = Verifique as credenciais

## 🔒 Segurança

- **NUNCA** commite o arquivo `.env` no Git
- Use senhas de app quando possível (Gmail, Outlook)
- Para produção, considere usar serviços como SendGrid ou Mailgun
- Mantenha as credenciais seguras e rotacione-as periodicamente

## 🐛 Problemas Comuns

### "Invalid login"

- Verifique se o email e senha estão corretos
- Para Gmail, use senha de app, não a senha normal
- Verifique se a verificação em duas etapas está ativada (Gmail)

### "Connection timeout"

- Verifique se a porta está correta (587 para TLS, 465 para SSL)
- Verifique se o firewall não está bloqueando
- Tente usar `SMTP_SECURE=true` com porta 465

### "Email não chega"

- Verifique a pasta de spam
- Verifique se o email de destino está correto
- Verifique os logs do servidor para erros

## 📚 Recursos

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Outlook App Passwords](https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944)
