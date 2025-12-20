# ⚠️ SOLUÇÃO RÁPIDA - Erro "Failed to fetch purposes"

## 🔴 Problema

O Leva-Web não consegue conectar à API do backend.

## ✅ Solução

### 1. Verificar se o Backend está rodando

Abra um terminal e execute:

```bash
cd backend
npm run dev
```

Você deve ver:

```
✅ MongoDB conectado com sucesso
🚀 Servidor rodando na porta 3000
📍 http://localhost:3000
```

---

### 2. Testar a API no navegador

Abra no navegador:

```
http://localhost:3000/api/health
```

Deve retornar:

```json
{
  "status": "ok",
  "message": "Servidor está funcionando",
  "timestamp": "2024-12-20T..."
}
```

---

### 3. Testar a rota de purposes

Abra no navegador:

```
http://localhost:3000/api/purposes
```

Deve retornar:

```json
[]
```

(Array vazio é normal, o banco está vazio!)

---

### 4. Se a porta 3000 já estiver em uso

**Windows:**

```bash
# Descobrir qual processo está usando a porta
netstat -ano | findstr :3000

# Parar o processo (substitua PID pelo número encontrado)
taskkill //PID NUMERO_DO_PID //F
```

**Mac/Linux:**

```bash
# Descobrir processo
lsof -i :3000

# Parar processo
kill -9 PID
```

---

### 5. Verificar MongoDB

Certifique-se que o MongoDB está rodando:

**Windows:**

- MongoDB Compass aberto
- Ou serviço MongoDB ativo

**Mac/Linux:**

```bash
# Verificar se está rodando
mongod --version

# Iniciar se necessário
mongod
```

---

### 6. Recarregar o Leva-Web

Depois que o backend estiver rodando:

1. Vá até o navegador com o Leva-Web aberto
2. Pressione **F5** ou **Ctrl+R** para recarregar
3. O erro deve desaparecer

---

## 🎯 Teste Rápido

Execute estes comandos em ordem:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Leva-Web
cd leva-mais-web
npm run dev

# Navegador
# Abra: http://localhost:3001
```

---

## 🔍 Se ainda não funcionar

### Verifique o arquivo .env do backend

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/levamais
```

### Verifique a URL no Leva-Web

Arquivo: `leva-mais-web/services/purposesService.ts`

```typescript
const API_URL = "http://localhost:3000/api/purposes";
```

Deve estar apontando para `localhost:3000`.

---

## ✅ Checklist

- [ ] MongoDB está rodando
- [ ] Backend iniciado sem erros
- [ ] Porta 3000 livre
- [ ] URL da API está correta (`http://localhost:3000`)
- [ ] Leva-Web recarregado (F5)

---

**Após seguir estes passos, o erro deve sumir e você poderá cadastrar serviços!**
