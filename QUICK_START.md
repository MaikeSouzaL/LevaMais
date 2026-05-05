# 🚀 QUICK START - Leva+ Dashboard

## ⚡ Início Rápido (3 Passos)

### **1️⃣ Iniciar Backend**

```bash
cd backend
npm start
```

✅ **Deve mostrar:** "🚀 Servidor rodando na porta 3001"

---

### **2️⃣ Iniciar Frontend**

```bash
cd leva-mais-web
npm run dev
```

✅ **Deve mostrar:** "✓ Ready in XXXms"

---

### **3️⃣ Acessar Dashboard**

Abra no navegador: **http://localhost:3000**

---

## 📍 URLs Importantes

| Recurso              | URL                                        |
| -------------------- | ------------------------------------------ |
| **Dashboard**        | http://localhost:3000                      |
| **Cidades**          | http://localhost:3000/cities               |
| **Preços**           | http://localhost:3000/settings/pricing     |
| **Tipos de Serviço** | http://localhost:3000/settings/purposes    |
| **Motoristas**       | http://localhost:3000/drivers              |
| **Clientes**         | http://localhost:3000/clients              |
| **Verificação**      | http://localhost:3000/verification/drivers |
| **API Health**       | http://localhost:3001/api/health           |

---

## 🔄 Popular Banco de Dados

Se o banco estiver vazio:

```bash
cd backend
node seed-dashboard.js
```

Isso criará:

- ✅ 5 cidades
- ✅ 20 regras de preço
- ✅ 23 tipos de serviço

---

## 🛠️ Comandos Úteis

### **Parar Servidor**

```bash
Ctrl + C
```

### **Limpar Cache do Frontend**

```bash
cd leva-mais-web
rm -rf .next
npm run dev
```

### **Ver Logs do MongoDB**

```bash
mongo
use leva-mais
db.cities.find().pretty()
db.pricingrules.find().pretty()
```

### **Resetar Banco**

```bash
cd backend
node seed-dashboard.js
```

---

## ✅ Checklist de Funcionamento

Antes de começar a usar, verifique:

- [ ] MongoDB está rodando (porta 27017)
- [ ] Backend rodando (porta 3001)
- [ ] Frontend rodando (porta 3000)
- [ ] Banco populado com seed
- [ ] Consegue acessar http://localhost:3000
- [ ] API responde em http://localhost:3001/api/health

---

## 🐛 Problemas Comuns

### **Erro: MongoDB connection failed**

**Solução:** Inicie o MongoDB

```bash
mongod
```

### **Erro: Port 3001 already in use**

**Solução:** Mate o processo ou mude a porta

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### **Erro: Cannot find module**

**Solução:** Reinstale dependências

```bash
cd backend
npm install

cd ../leva-mais-web
npm install
```

### **Cidades não aparecem**

**Solução:** Execute o seed

```bash
cd backend
node seed-dashboard.js
```

---

## 📊 O Que Está Funcionando

### **✅ Backend (100%)**

- API RESTful completa
- MongoDB conectado
- WebSocket ativo
- CRUD de cidades
- CRUD de preços
- Cálculo de preços
- Seed data funcionando

### **✅ Frontend (70%)**

- Dashboard responsivo
- Página de cidades
- Página de preços
- Página de tipos de serviço
- Menu lateral com navegação
- Toast notifications
- Modais interativos

### **⏳ Em Desenvolvimento**

- Integração completa dos formulários
- Backend de motoristas
- Backend de clientes
- Backend de verificação
- Upload de documentos
- Autenticação de admin

---

## 🎯 Fluxo de Teste Recomendado

1. **Acesse o dashboard:** http://localhost:3000
2. **Vá para Cidades:** Veja as 5 cidades cadastradas
3. **Vá para Preços:** Veja as 20 regras de preço
4. **Vá para Tipos de Serviço:** Veja os 23 tipos cadastrados
5. **Vá para Motoristas:** Veja a interface (ainda sem dados do backend)
6. **Vá para Verificação:** Veja o sistema de aprovação (mock data)

---

## 📚 Documentação Completa

- `INTEGRACAO_BACKEND_FRONTEND.md` - Guia técnico detalhado
- `RESUMO_INTEGRACAO.md` - Visão geral do projeto
- `QUICK_START.md` - Este arquivo

---

## 🚀 Pronto para Usar!

Agora você pode:

- ✅ Gerenciar cidades
- ✅ Configurar preços por cidade e veículo
- ✅ Gerenciar tipos de serviço
- ✅ Ver interface completa do dashboard

**Próximo passo:** Conectar os formulários e implementar backend completo!

---

**Desenvolvido para Leva+**  
v1.0 - Dezembro 2024
