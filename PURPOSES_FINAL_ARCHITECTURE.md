# 🎯 Sistema de Purposes - Arquitetura Final (100% API)

## ✨ **IMPORTANTE: Sem Dados Mockados!**

Este sistema **NÃO TEM NENHUM DADO FIXO** em nenhuma parte.  
Tudo é cadastrado manualmente via **Leva-Web** e armazenado no **MongoDB**.

---

## 📐 Arquitetura

```
┌──────────────────────────────────────────────────┐
│         LEVA-WEB (Painel Administrativo)          │
│                                                   │
│  Interface para cadastrar e gerenciar:           │
│  ✓ Criar novos tipos de serviço                  │
│  ✓ Editar serviços existentes                    │
│  ✓ Deletar serviços                              │
│  ✓ Ativar/Desativar serviços                     │
│  ✓ Organizar por tipo de veículo                 │
│                                                   │
│  Acesso: http://localhost:3001                   │
└────────────────┬─────────────────────────────────┘
                 │
                 │ API Calls (HTTP)
                 │ POST, PUT, DELETE, PATCH
                 ▼
┌──────────────────────────────────────────────────┐
│          BACKEND API (Node.js + Express)          │
│                                                   │
│  Rotas:                                          │
│  • GET    /api/purposes?vehicleType=motorcycle   │
│  • POST   /api/purposes                          │
│  • PUT    /api/purposes/:id                      │
│  • DELETE /api/purposes/:id?vehicleType=...      │
│  • PATCH  /api/purposes/:id/toggle               │
│                                                   │
│  Porta: 3000                                     │
└────────────────┬─────────────────────────────────┘
                 │
                 │ MongoDB Driver
                 ▼
┌──────────────────────────────────────────────────┐
│              MongoDB (Banco de Dados)             │
│                                                   │
│  Collection: purposes                            │
│  Schemas: Purpose Model                          │
│                                                   │
│  ⚠️ COMEÇA VAZIO - Cadastre via Leva-Web        │
└────────────────┬─────────────────────────────────┘
                 │
                 │ HTTP GET Requests
                 ▼
┌──────────────────────────────────────────────────┐
│         APP MOBILE (React Native + Expo)          │
│                                                   │
│  Busca serviços da API:                          │
│  • Filtra por tipo de veículo                    │
│  • Mostra apenas serviços ativos                 │
│  • Sem cache (sempre atualizado)                 │
│  • Sem fallback (sem mocks)                      │
└──────────────────────────────────────────────────┘
```

---

## 🗄️ Schema do MongoDB

### Model: `Purpose`

```javascript
{
  vehicleType: {
    type: String,
    required: true,
    enum: ['motorcycle', 'car', 'van', 'truck']
  },
  id: {
    type: String,      // Slug único (ex: "delivery", "documents")
    required: true
  },
  title: {
    type: String,      // Ex: "Entrega de Delivery"
    required: true
  },
  subtitle: {
    type: String,      // Ex: "Entregar pacotes e encomendas"
    required: true
  },
  icon: {
    type: String,      // Ex: "local-shipping" (Material Icons)
    required: true
  },
  badges: [{
    type: String       // Ex: ["Rápido", "Urgente"]
  }],
  isActive: {
    type: Boolean,     // true = aparece no app
    default: true
  },
  createdAt: Date,     // Auto-gerado
  updatedAt: Date      // Auto-atualizado
}

// Índice único composto: vehicleType + id
// Permite o mesmo ID para veículos diferentes
```

---

## 🚀 Como Iniciar o Sistema

### 1. Iniciar MongoDB

```bash
# Certifique-se que o MongoDB está rodando
# Windows: MongoDB Compass ou serviço MongoDB
# Mac/Linux: mongod
```

### 2. Iniciar Backend

```bash
cd backend
npm install  # Primeira vez
npm run dev
```

✅ Backend rodando em `http://localhost:3000`

### 3. Iniciar Leva-Web

```bash
cd leva-mais-web
npm install  # Primeira vez
npm run dev
```

✅ Leva-Web rodando em `http://localhost:3001`

### 4. Cadastrar Serviços

Acesse `http://localhost:3001` e cadastre os serviços!

---

## 📝 Como Cadastrar um Serviço

### Exemplo: "Entrega de Delivery" para Moto

1. **Acesse** `http://localhost:3001`
2. **Clique na aba** "Moto" (Motorcycle)
3. **Clique** em "+ Adicionar Novo"
4. **Preencha o formulário:**

```
ID (slug):        delivery
Título:           Entrega de Delivery
Subtítulo:        Entregar pacotes e encomendas
Ícone:            local-shipping
Badges:           Rápido
Status:           ✅ Ativo
```

5. **Clique em** "Salvar"

✅ O serviço já está disponível no app mobile!

---

## 🎨 Ícones Disponíveis

O sistema usa **Material Icons** do Google.

### Ícones Populares:

```
local-shipping    - Caminhão de entrega
description       - Documento
shopping-cart     - Carrinho de compras
bolt              - Raio (velocidade)
local-pharmacy    - Farmácia
pets              - Pet
markunread-mailbox - Caixa de correio
restaurant        - Restaurante
store             - Loja
inventory         - Inventário/Caixas
build             - Ferramenta
account-balance   - Banco
redeem            - Presente
event             - Calendário
alt-route         - Rota alternativa
speed             - Velocímetro
storefront        - Fachada de loja
shopping-bag      - Sacola de compras
umbrella          - Guarda-chuva
card-giftcard     - Cartão presente
warehouse         - Armazém
shield            - Escudo
route             - Rota
construction      - Construção
```

**Consulte todos os ícones em:** https://fonts.google.com/icons

---

## 📱 Usando no App Mobile

### Buscar Serviços

```typescript
import { getPurposesByVehicleType } from "@/services/purposes";

// Buscar serviços ativos de moto
const services = await getPurposesByVehicleType("motorcycle", true);

// services = [
//   {
//     _id: "507f1f77bcf86cd799439011",
//     id: "delivery",
//     vehicleType: "motorcycle",
//     title: "Entrega de Delivery",
//     subtitle: "Entregar pacotes e encomendas",
//     icon: "local-shipping",
//     badges: ["Rápido"],
//     isActive: true,
//     createdAt: "2024-12-20T10:30:00.000Z",
//     updatedAt: "2024-12-20T10:30:00.000Z"
//   },
//   // ... mais serviços
// ]
```

### Tratamento de Erros

```typescript
try {
  const services = await getPurposesByVehicleType("car");
  setServices(services);
} catch (error) {
  // Erro: API offline ou sem serviços cadastrados
  Alert.alert(
    "Erro",
    "Não foi possível carregar os tipos de serviço. Verifique sua conexão."
  );
}
```

---

## 🔧 Configuração do App Mobile

### Ajustar URL da API

Edite `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? "http://192.168.1.5:3000/api" // ⚠️ AJUSTE PARA SEU IP
  : "https://api.levamais.com/api";
```

**Como descobrir seu IP:**

```bash
# Windows
ipconfig
# Procure por: IPv4 Address

# Mac
ifconfig
# Procure por: inet

# Linux
hostname -I
```

**URLs por Plataforma:**

| Plataforma       | URL                                          |
| ---------------- | -------------------------------------------- |
| Android Emulator | `http://10.0.2.2:3000/api`                   |
| Android Device   | `http://192.168.x.x:3000/api` (seu IP local) |
| iOS Simulator    | `http://localhost:3000/api`                  |
| iOS Device       | `http://192.168.x.x:3000/api` (seu IP local) |

---

## 📊 Gerenciamento via Leva-Web

### Funcionalidades Disponíveis:

✅ **Criar** novos tipos de serviço  
✅ **Editar** serviços existentes  
✅ **Deletar** serviços  
✅ **Ativar/Desativar** serviços (toggle)  
✅ **Duplicar** serviços  
✅ **Pesquisar** por título ou ID  
✅ **Filtrar** por status (ativo/inativo)  
✅ **Organizar** por tipo de veículo (tabs)  
✅ **Visualizar** estatísticas

---

## ⚠️ Regras Importantes

### 1. **ID Único por Veículo**

```javascript
// ✅ PERMITIDO
{ vehicleType: "motorcycle", id: "delivery" }
{ vehicleType: "car", id: "delivery" }  // Mesmo ID, veículo diferente

// ❌ NÃO PERMITIDO
{ vehicleType: "motorcycle", id: "delivery" }
{ vehicleType: "motorcycle", id: "delivery" }  // ID duplicado no mesmo veículo
```

### 2. **Serviços Inativos**

- Serviços com `isActive: false` **NÃO aparecem no app**
- Use para desabilitar temporariamente sem deletar

### 3. **Badges (Opcional)**

- Array de strings: `["Rápido", "Urgente"]`
- Aparece como tags no app
- Pode ser vazio: `[]`

---

## 🔍 Testando a API

### Via Browser ou Postman:

```bash
# Listar todos os serviços
GET http://localhost:3000/api/purposes

# Listar serviços de moto
GET http://localhost:3000/api/purposes?vehicleType=motorcycle

# Criar novo serviço
POST http://localhost:3000/api/purposes
Content-Type: application/json

{
  "vehicleType": "motorcycle",
  "id": "test-service",
  "title": "Serviço de Teste",
  "subtitle": "Apenas um teste",
  "icon": "Package",
  "badges": ["TESTE"],
  "isActive": true
}

# Atualizar serviço
PUT http://localhost:3000/api/purposes/test-service
Content-Type: application/json

{
  "vehicleType": "motorcycle",
  "title": "Novo Título"
}

# Deletar serviço
DELETE http://localhost:3000/api/purposes/test-service?vehicleType=motorcycle

# Ativar/Desativar
PATCH http://localhost:3000/api/purposes/test-service/toggle
Content-Type: application/json

{
  "vehicleType": "motorcycle"
}
```

---

## 🆘 Troubleshooting

### ❌ "Erro ao carregar dados" no Leva-Web

**Causa:** Backend não está rodando ou MongoDB offline

**Solução:**

```bash
# 1. Verificar MongoDB
# MongoDB Compass ou serviço deve estar ativo

# 2. Iniciar backend
cd backend
npm run dev
```

### ❌ App Mobile não carrega serviços

**Causa:** URL da API incorreta ou backend offline

**Solução:**

1. Verifique se backend está rodando
2. Ajuste URL em `src/services/api.ts`
3. Para Android emulador: `http://10.0.2.2:3000/api`
4. Para device real: `http://SEU_IP:3000/api`

### ❌ "ID já existe"

**Causa:** Tentando criar serviço com ID duplicado no mesmo veículo

**Solução:**

- Use outro ID único (ex: `delivery-express`, `delivery-standard`)
- Ou edite o serviço existente em vez de criar novo

### ❌ Banco de dados vazio

**Causa:** MongoDB está vazio, nenhum serviço cadastrado

**Solução:**

- Acesse Leva-Web e cadastre manualmente
- Não há seed/dados iniciais por design

---

## 📈 Próximas Melhorias (Futuras)

1. **Autenticação no Leva-Web**

   - Login admin para proteger edições
   - Diferentes níveis de permissão

2. **Histórico de Alterações**

   - Log de quem criou/editou
   - Auditoria completa

3. **Importação/Exportação**

   - Exportar serviços em JSON
   - Importar em batch

4. **Cache no App Mobile**

   - AsyncStorage para cache local
   - Sincronização em background
   - Modo offline parcial

5. **Validações Avançadas**
   - Preview de ícones no formulário
   - Validação de slug (sem espaços/caracteres especiais)
   - Limites de caracteres

---

## 📚 Estrutura de Arquivos

```
backend/
├── src/
│   ├── models/
│   │   └── Purpose.js          ✅ Schema MongoDB
│   ├── controllers/
│   │   └── purpose.controller.js  ✅ Lógica CRUD
│   ├── routes/
│   │   └── purpose.routes.js   ✅ Rotas API
│   └── config/
│       └── database.js         ✅ Conexão MongoDB
├── server.js                   ✅ Servidor Express
└── package.json

leva-mais-web/
├── app/
│   └── settings/
│       └── purposes/
│           └── page.tsx        ✅ Interface admin
├── services/
│   └── purposesService.ts      ✅ API client
├── types/
│   └── index.ts                ✅ TypeScript types
└── package.json

Leva_Mais/ (App Mobile)
├── src/
│   └── services/
│       ├── purposes.ts         ✅ API client
│       └── api.ts              ✅ Axios config
└── package.json
```

---

## ✅ Checklist de Implementação

### Backend:

- [x] Model Purpose criado
- [x] Controller CRUD implementado
- [x] Rotas configuradas
- [x] Validações implementadas
- [x] Dados mockados removidos
- [x] Script de seed removido

### Leva-Web:

- [x] Interface de gerenciamento criada
- [x] Integração com API backend
- [x] CRUD completo funcionando
- [x] Filtros e busca implementados
- [x] localStorage removido
- [x] Dados mockados removidos

### App Mobile:

- [x] Integração com API
- [x] Funções de busca implementadas
- [x] Tratamento de erros
- [x] Dados mockados removidos
- [x] Fallback removido
- [ ] Testar conexão com backend
- [ ] Ajustar URL da API

---

**Data:** 20/12/2024  
**Versão:** 3.0.0 (100% Database-Driven)  
**Status:** ✅ Pronto para cadastrar serviços via Leva-Web
