# 🚀 Guia Rápido - Sistema de Purposes

## ⚡ Como Começar (3 passos)

### 1️⃣ Iniciar o Backend

```bash
cd backend
npm run dev
```

✅ Backend rodando em `http://localhost:3000`

---

### 2️⃣ Iniciar o Leva-Web (Painel Admin)

```bash
cd leva-mais-web
npm run dev
```

✅ Painel admin em `http://localhost:3001`

---

### 3️⃣ Cadastrar Serviços

Acesse o Leva-Web e cadastre os serviços para cada veículo:

#### 🏍️ **MOTO** (Sugestões)

```
✓ Entrega de Delivery
✓ Documentos
✓ Compras de Supermercado (leves)
✓ Expresso
✓ Farmácia
✓ Pet Shop
✓ Correios/Cartório
✓ Refeições/Restaurantes
✓ E-commerce/Loja
✓ Material de escritório
✓ Peças leves
✓ Bancos/Financeiro
✓ Presentes/Floricultura
✓ Retirada agendada
✓ Multi-paradas (2-3 endereços)
✓ Urgente 1h
```

#### 🚗 **CARRO** (Sugestões)

```
✓ Entrega de Delivery
✓ Documentos
✓ Compras de Supermercado (médias)
✓ Expresso
✓ E-commerce/Loja
✓ Multi-paradas (3-5 endereços)
✓ Itens frágeis
✓ Proteção contra chuva
✓ Retirada agendada
✓ Presentes/Floricultura
✓ Correios/Cartório
```

#### 🚐 **VAN** (Sugestões)

```
✓ Mudança leve
✓ Compras volumosas
✓ Coleta de grandes volumes
✓ Multi-paradas
✓ Frágeis com proteção
```

#### 🚚 **CAMINHÃO** (Sugestões)

```
✓ Mudanças
✓ Carga comercial
✓ Materiais de construção
✓ Longa distância
```

---

## 📱 Testar no App Mobile

### 1. Configure a URL da API

Edite `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? "http://SEU_IP_AQUI:3000/api" // ⚠️ Coloque seu IP
  : "https://sua-api-producao.com/api";
```

**Para descobrir seu IP:**

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

**Exemplos:**

- Emulador Android: `http://10.0.2.2:3000/api`
- Device Android: `http://192.168.1.5:3000/api`
- iOS: `http://localhost:3000/api` ou `http://192.168.1.5:3000/api`

### 2. Inicie o app

```bash
# Android
npm run android

# iOS
npm run ios
```

### 3. Teste a tela de seleção de veículo

O app agora vai buscar os serviços diretamente da API!

---

## 🎨 Exemplo de Cadastro no Leva-Web

### Cadastrando "Entrega de Delivery" para Moto:

1. **Acesse:** `http://localhost:3001`
2. **Selecione:** "Motorcycle"
3. **Clique:** "Adicionar Novo"
4. **Preencha:**
   - **ID:** `delivery` (único, sem espaços)
   - **Título:** `Entrega de Delivery`
   - **Subtítulo:** `Entregar pacotes e encomendas`
   - **Ícone:** `local-shipping` (Material Icons)
   - **Badges:** `Rápido` (opcional)
   - **Status:** ✅ Ativo
5. **Salve!**

Pronto! Esse serviço estará disponível no app imediatamente.

---

## 🔍 Verificar se está funcionando

### Testar a API direto no navegador:

```
http://localhost:3000/api/purposes?vehicleType=motorcycle
```

Deve retornar JSON com os serviços cadastrados.

### Testar no app:

```typescript
// Em qualquer componente
import { getPurposesByVehicleType } from "@/services/purposes";

const services = await getPurposesByVehicleType("motorcycle");
console.log("Serviços:", services);
```

---

## ⚠️ Problemas Comuns

### ❌ "Não foi possível carregar os tipos de serviço"

**Checklist:**

- [ ] Backend está rodando? (`cd backend && npm run dev`)
- [ ] MongoDB está rodando?
- [ ] Já cadastrou serviços no Leva-Web?
- [ ] URL da API está correta no app?
- [ ] Internet/WiFi funcionando?

### ❌ "Connection refused" no app

**Problema:** URL da API está errada

**Solução:**

1. Descubra seu IP: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. Use `http://SEU_IP:3000/api` no arquivo `api.ts`
3. Para emulador Android: `http://10.0.2.2:3000/api`

### ❌ Leva-Web não abre

```bash
cd leva-mais-web
npm install  # Instalar dependências
npm run dev  # Iniciar
```

---

## 📊 Status dos Serviços

### Verificar no Leva-Web:

- ✅ Verde = Ativo (aparece no app)
- ⭕ Cinza = Inativo (não aparece no app)

### Ativar/Desativar:

Clique no botão de toggle ao lado de cada serviço.

---

## 🎯 Resumo

```
┌──────────────┐
│  LEVA-WEB    │  ← Cadastre aqui os serviços
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   BACKEND    │  ← Armazena no MongoDB
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  APP MOBILE  │  ← Busca e exibe os serviços
└──────────────┘
```

**Não há mais dados mockados no app!**  
**Tudo vem do banco de dados.**

---

**Dúvidas?** Consulte `PURPOSES_ARCHITECTURE.md` para detalhes técnicos.
