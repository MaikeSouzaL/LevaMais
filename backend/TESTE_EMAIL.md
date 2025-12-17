# 🧪 Teste do Sistema de Email

## ✅ Checklist Antes de Testar

- [ ] Arquivo `.env` configurado com as credenciais SMTP
- [ ] MongoDB rodando e conectado
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor iniciado (`npm run dev`)

## 🚀 Passos para Testar

### 1. Iniciar o Servidor

```bash
cd backend
npm run dev
```

**Verifique no console:**
- ✅ `✅ MongoDB conectado com sucesso`
- ✅ `✅ Servidor de email configurado com sucesso`
- ✅ `🚀 Servidor rodando na porta 3000`

### 2. Testar o Endpoint de Esqueceu Senha

**Opção 1: Usando curl (Terminal)**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"seu-email@exemplo.com\"}"
```

**Opção 2: Usando Postman/Insomnia**
- Método: `POST`
- URL: `http://localhost:3000/api/auth/forgot-password`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "email": "seu-email@exemplo.com"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Código de verificação enviado para seu email"
}
```

### 3. Verificar o Email

1. Abra a caixa de entrada do email informado
2. Verifique também a pasta de **SPAM/LIXO ELETRÔNICO**
3. Você deve receber um email com:
   - Assunto: `🔐 Código de Verificação - Redefinição de Senha`
   - Código de 6 dígitos destacado
   - Design bonito com cores do Leva+

### 4. Testar Verificação de Código

**Usando curl:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"seu-email@exemplo.com\",\"code\":\"123456\"}"
```

**Body (JSON):**
```json
{
  "email": "seu-email@exemplo.com",
  "code": "123456"
}
```

### 5. Testar Reset de Senha

**Usando curl:**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"seu-email@exemplo.com\",\"code\":\"123456\",\"newPassword\":\"novasenha123\"}"
```

**Body (JSON):**
```json
{
  "email": "seu-email@exemplo.com",
  "code": "123456",
  "newPassword": "novasenha123"
}
```

## 🐛 Problemas Comuns

### ❌ "Servidor de email configurado com sucesso" não aparece

**Solução:**
- Verifique se as variáveis SMTP estão no `.env`
- Verifique se o arquivo `.env` está na pasta `backend/`
- Reinicie o servidor após alterar o `.env`

### ❌ "Invalid login" ou "Authentication failed"

**Solução:**
- Para Gmail: Use senha de app, não a senha normal
- Verifique se copiou a senha corretamente (sem espaços extras)
- Verifique se a verificação em duas etapas está ativada

### ❌ Email não chega

**Solução:**
- Verifique a pasta de SPAM
- Verifique se o email de destino está correto
- Verifique os logs do servidor para erros
- Aguarde alguns minutos (pode haver delay)

### ❌ "Código inválido ou expirado"

**Solução:**
- O código expira em 10 minutos
- Cada código só pode ser usado uma vez
- Solicite um novo código

## 📊 Verificar Logs

No console do servidor, você deve ver:
- `✅ Email enviado com sucesso: <messageId>` - Email enviado
- `❌ Erro ao enviar email: <erro>` - Problema no envio

## ✅ Próximos Passos

Após confirmar que o email está funcionando:

1. **Teste no app mobile:**
   - Abra o app
   - Vá em "Esqueceu a senha"
   - Digite um email cadastrado
   - Verifique se recebe o código
   - Cole o código na tela de verificação
   - Redefina a senha

2. **Teste completo do fluxo:**
   - Esqueceu senha → Recebe código → Verifica código → Nova senha → Login com nova senha

## 🎉 Tudo Funcionando?

Se você viu:
- ✅ Servidor de email configurado
- ✅ Email recebido com código
- ✅ Código verificado com sucesso
- ✅ Senha redefinida

**Parabéns! O sistema está funcionando perfeitamente! 🚀**

