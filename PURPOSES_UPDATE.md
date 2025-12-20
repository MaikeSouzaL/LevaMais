# 🚀 Atualização do Sistema de Purposes (Tipos de Serviço)

## 📋 O que foi implementado

### 1. **App Mobile - Integração com API**

#### ✨ Novos campos na interface `PurposeItem`:

```typescript
export interface PurposeItem {
  _id?: string; // ✨ MongoDB ID
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  badges?: string[];
  isActive?: boolean; // ✨ Controle de status
  createdAt?: string; // ✨ Data de criação
  updatedAt?: string; // ✨ Data de atualização
}
```

#### 🔌 Nova função principal com integração API:

```typescript
getPurposesByVehicleType(type: VehicleType, onlyActive: boolean = true)
```

**Recursos:**

- ✅ Busca tipos de serviço da API backend
- ✅ Filtra por tipo de veículo (motorcycle, car, van, truck)
- ✅ Filtra apenas serviços ativos (onlyActive)
- ✅ Fallback automático para dados locais em caso de erro
- ✅ Timeout de 5 segundos para evitar travamentos

#### 📦 Novas funções disponíveis:

| Função                                    | Descrição                                    |
| ----------------------------------------- | -------------------------------------------- |
| `getAllPurposes(onlyActive?)`             | Busca todos os serviços de todos os veículos |
| `createPurpose(vehicleType, data)`        | Cria novo tipo de serviço                    |
| `updatePurpose(id, vehicleType, updates)` | Atualiza serviço existente                   |
| `deletePurpose(id, vehicleType)`          | Remove um serviço                            |
| `togglePurposeActive(id, vehicleType)`    | Ativa/desativa um serviço                    |

---

### 2. **Backend - Script de Seed**

#### 📝 Arquivo criado: `backend/src/scripts/seed-purposes.js`

**Funcionalidades:**

- ✅ Popula o banco de dados com todos os tipos de serviço
- ✅ Dados sincronizados com o app mobile
- ✅ 36 tipos de serviço no total:
  - 🏍️ Motorcycle: 16 serviços
  - 🚗 Car: 11 serviços
  - 🚐 Van: 5 serviços
  - 🚚 Truck: 4 serviços

#### 🎯 Como executar:

```bash
cd backend
npm run seed:purposes
```

**⚠️ ATENÇÃO:** Este script **APAGA TODOS** os dados existentes da coleção `purposes` antes de inserir os novos dados!

---

## 🔄 Fluxo de Funcionamento

```
┌─────────────────┐
│   APP MOBILE    │
│                 │
│  getPurposes()  │
└────────┬────────┘
         │
         ├─── Tenta buscar da API ────┐
         │                             │
         │                             ▼
         │                    ┌────────────────┐
         │                    │  BACKEND API   │
         │                    │  /api/purposes │
         │                    └────────────────┘
         │                             │
         │                             ▼
         │                    ┌────────────────┐
         │                    │    MongoDB     │
         │                    │   (purposes)   │
         │                    └────────────────┘
         │
         └─── Em caso de erro ──┐
                                │
                                ▼
                    ┌───────────────────┐
                    │  Dados Locais     │
                    │  (PURPOSES_MOTO,  │
                    │   PURPOSES_CAR,   │
                    │   etc.)           │
                    └───────────────────┘
```

---

## 📊 Compatibilidade entre Projetos

| Campo         | App Mobile        | Backend | Leva-Web        |
| ------------- | ----------------- | ------- | --------------- |
| `vehicleType` | ✅                | ✅      | ✅              |
| `id`          | ✅                | ✅      | ✅              |
| `title`       | ✅                | ✅      | ✅              |
| `subtitle`    | ✅                | ✅      | ✅              |
| `icon`        | ✅ Material Icons | ✅      | ✅ Lucide Icons |
| `badges`      | ✅                | ✅      | ✅              |
| `isActive`    | ✅ NOVO           | ✅      | ✅              |
| `createdAt`   | ✅ NOVO           | ✅      | ✅              |
| `updatedAt`   | ✅ NOVO           | ✅      | ✅              |

---

## 🚀 Como Usar no App

### Exemplo 1: Buscar serviços ativos para moto

```typescript
import { getPurposesByVehicleType } from "@/services/purposes";

// Busca apenas serviços ativos
const activePurposes = await getPurposesByVehicleType("motorcycle", true);

// Busca todos (ativos e inativos)
const allPurposes = await getPurposesByVehicleType("motorcycle", false);
```

### Exemplo 2: Buscar todos os serviços

```typescript
import { getAllPurposes } from "@/services/purposes";

const allServices = await getAllPurposes(); // Apenas ativos
const allServicesIncludingInactive = await getAllPurposes(false);
```

### Exemplo 3: Criar novo serviço

```typescript
import { createPurpose } from "@/services/purposes";

const newPurpose = await createPurpose("motorcycle", {
  id: "custom-service",
  title: "Serviço Personalizado",
  subtitle: "Descrição do serviço",
  icon: "custom-icon",
  badges: ["NOVO"],
  isActive: true,
});
```

### Exemplo 4: Atualizar serviço

```typescript
import { updatePurpose } from "@/services/purposes";

const updated = await updatePurpose("delivery", "motorcycle", {
  title: "Novo Título",
  isActive: false,
});
```

---

## 🛠️ Configuração Necessária

### 1. Variáveis de Ambiente do Backend

Certifique-se de ter no arquivo `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/levamais
PORT=3000
```

### 2. URL da API no App Mobile

No arquivo `src/services/api.ts`, configure a URL correta:

```typescript
const API_BASE_URL = __DEV__
  ? "http://SEU_IP:3000/api" // ⚠️ Ajuste para seu IP local
  : "https://sua-api-producao.com/api";
```

**Para Android Emulator:** Use `http://10.0.2.2:3000/api`  
**Para Android Device/iOS:** Use `http://192.168.x.x:3000/api` (IP da sua máquina)

---

## ✅ Checklist de Implementação

- [x] Atualizar interface `PurposeItem` no app mobile
- [x] Implementar integração com API no app mobile
- [x] Adicionar fallback para dados locais
- [x] Criar script de seed no backend
- [x] Adicionar comando npm para seed
- [x] Documentar alterações
- [ ] Testar integração app + backend
- [ ] Popular banco de dados (executar seed)
- [ ] Ajustar URL da API conforme ambiente
- [ ] Decidir: Material Icons ou Lucide Icons?

---

## 🔍 Próximos Passos Sugeridos

1. **Executar o seed no backend:**

   ```bash
   cd backend
   npm run seed:purposes
   ```

2. **Testar a API:**

   ```bash
   # Buscar todos os purposes de motorcycle
   curl http://localhost:3000/api/purposes?vehicleType=motorcycle
   ```

3. **Testar no app mobile:**

   - Certifique-se que o backend está rodando
   - Ajuste a URL da API
   - Teste a busca de serviços

4. **Padronizar ícones:**
   - Decidir entre Material Icons (app) ou Lucide Icons (web)
   - Atualizar todos os projetos para usar o mesmo padrão

---

## ❓ Problemas Comuns

### App não conecta na API

- ✅ Verifique se o backend está rodando
- ✅ Confirme a URL da API no `api.ts`
- ✅ Para Android, use `http://10.0.2.2:3000/api` (emulator) ou IP local (device)

### Dados não aparecem

- ✅ Execute o seed: `npm run seed:purposes`
- ✅ Verifique se o MongoDB está rodando
- ✅ Confirme a conexão no arquivo `.env`

### Erro de CORS

- ✅ O backend já tem CORS habilitado
- ✅ Verifique se a origem está correta

---

## 📝 Notas Importantes

1. **Dados Locais vs API:**

   - O app SEMPRE tentará buscar da API primeiro
   - Em caso de erro (sem internet, servidor offline), usa dados locais
   - Isso garante funcionamento offline

2. **Cache:**

   - Por enquanto não há cache implementado
   - Cada requisição busca do servidor
   - Considere implementar cache local se necessário

3. **Segurança:**
   - A API de purposes não requer autenticação
   - Se precisar proteger, adicione middleware de auth

---

**Data da atualização:** 20/12/2024  
**Versão:** 1.0.0
