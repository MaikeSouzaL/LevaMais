# 🎯 Sistema de Purposes - Nova Arquitetura

## 📐 Arquitetura Atualizada

```
┌─────────────────────────────────────────────────────────┐
│                    LEVA-WEB (Admin)                      │
│  - Cadastrar tipos de serviço                           │
│  - Gerenciar (criar, editar, deletar)                   │
│  - Ativar/Desativar serviços                            │
│  - Interface administrativa                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ CRUD Operations
                 ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND API (Express + MongoDB)             │
│  - Rotas: /api/purposes                                 │
│  - CRUD completo                                         │
│  - Validações                                            │
│  - Fonte única da verdade                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ GET Requests
                 ▼
┌─────────────────────────────────────────────────────────┐
│                 APP MOBILE (React Native)                │
│  - Busca serviços da API                                │
│  - Filtra por veículo                                    │
│  - Filtra apenas ativos                                 │
│  - SEM dados mockados                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 O que mudou?

### ❌ ANTES (Sistema Antigo)

```typescript
// App tinha dados mockados
const PURPOSES_MOTO = [
  { id: "delivery", title: "Entrega..." },
  { id: "documents", title: "Documentos..." },
  // ... mais 14 itens
];

// Retornava direto do mock
export function getPurposesByVehicleType(type) {
  return PURPOSES_MOTO; // Dados estáticos!
}
```

### ✅ AGORA (Sistema Novo)

```typescript
// App busca da API
export async function getPurposesByVehicleType(type, onlyActive = true) {
  const response = await api.get("/purposes", {
    params: { vehicleType: type },
  });
  return response.data; // Dados dinâmicos do MongoDB!
}
```

---

## 📦 Componentes do Sistema

### 1️⃣ **App Mobile** (`src/services/purposes.ts`)

**Responsabilidades:**

- ✅ Buscar serviços da API
- ✅ Filtrar por tipo de veículo
- ✅ Filtrar apenas ativos
- ✅ Tratar erros de conexão

**Funções Disponíveis:**

```typescript
getPurposesByVehicleType(type, onlyActive); // Principal
getAllPurposes(onlyActive); // Todos os veículos
createPurpose(vehicleType, data); // [Admin only]
updatePurpose(id, vehicleType, updates); // [Admin only]
deletePurpose(id, vehicleType); // [Admin only]
togglePurposeActive(id, vehicleType); // [Admin only]
hasPurposesForVehicle(type); // Helper
countActivePurposes(type); // Helper
getVehicleLabel(type); // Helper
```

**⚠️ IMPORTANTE:** Não há mais dados mockados no app!

---

### 2️⃣ **Backend API** (`backend/src/`)

**Model:** `Purpose.js`

```javascript
{
  vehicleType: String, // motorcycle, car, van, truck
  id: String,          // Slug único por veículo
  title: String,
  subtitle: String,
  icon: String,
  badges: [String],
  isActive: Boolean,
  timestamps: true     // createdAt, updatedAt
}
```

**Rotas:**

- `GET /api/purposes` - Lista todos (filtro: ?vehicleType=motorcycle)
- `POST /api/purposes` - Cria novo
- `PUT /api/purposes/:id` - Atualiza
- `DELETE /api/purposes/:id` - Remove
- `PATCH /api/purposes/:id/toggle` - Ativa/Desativa

---

### 3️⃣ **Leva-Web** (Painel Admin)

**Função:**

- Interface web para cadastrar serviços
- Gerenciar todos os tipos de veículo
- Ativar/desativar serviços
- Duplicar serviços existentes

**Acesso:**

```bash
cd leva-mais-web
npm run dev
# Acessar: http://localhost:3001
```

---

## 🚀 Fluxo de Trabalho

### 📝 Para Cadastrar Novos Serviços:

1. **Acesse o Leva-Web**

   ```bash
   cd leva-mais-web
   npm run dev
   ```

2. **Selecione o tipo de veículo**

   - Motorcycle (Moto)
   - Car (Carro)
   - Van
   - Truck (Caminhão)

3. **Cadastre o serviço**

   - ID (slug, único): `delivery`
   - Título: `Entrega de Delivery`
   - Subtítulo: `Entregar pacotes e encomendas`
   - Ícone: `local-shipping` (Material Icons)
   - Badges (opcional): `["Rápido"]`
   - Status: Ativo ✅

4. **O serviço estará disponível no app automaticamente!**

---

## 🎮 Como Usar no App Mobile

### Exemplo Prático:

```typescript
import { getPurposesByVehicleType } from "@/services/purposes";

function VehicleServicesScreen() {
  const [services, setServices] = useState<PurposeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      setError(null);

      // Busca serviços ativos para moto
      const data = await getPurposesByVehicleType("motorcycle", true);

      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      console.error("Erro ao carregar serviços:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  if (error) {
    return <ErrorView message={error} onRetry={loadServices} />;
  }

  if (services.length === 0) {
    return <EmptyState message="Nenhum serviço disponível" />;
  }

  return (
    <FlatList
      data={services}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ServiceCard service={item} />}
    />
  );
}
```

---

## ⚙️ Configuração Necessária

### 1. Backend (.env)

```env
MONGODB_URI=mongodb://localhost:27017/levamais
PORT=3000
```

### 2. App Mobile (api.ts)

```typescript
// Para desenvolvimento
const API_BASE_URL = __DEV__
  ? "http://192.168.1.5:3000/api" // ⚠️ Ajuste para SEU IP
  : "https://api.levamais.com/api";
```

**Dicas de URL:**

- **Android Emulator:** `http://10.0.2.2:3000/api`
- **Android Device:** `http://192.168.x.x:3000/api` (IP da máquina)
- **iOS Simulator:** `http://localhost:3000/api`
- **iOS Device:** `http://192.168.x.x:3000/api`

---

## 📊 Status Atual

| Componente      | Status         | Ação Necessária                 |
| --------------- | -------------- | ------------------------------- |
| **App Mobile**  | ✅ Atualizado  | Configurar URL da API           |
| **Backend API** | ✅ Pronto      | Iniciar servidor                |
| **MongoDB**     | ⚠️ Vazio       | Cadastrar serviços via Leva-Web |
| **Leva-Web**    | ✅ Funcionando | Usar para cadastrar             |

---

## ✅ Checklist de Implementação

### Desenvolvedor:

- [x] Remover dados mockados do app
- [x] Criar funções de integração com API
- [x] Adicionar tratamento de erros
- [x] Documentar sistema
- [ ] Configurar URL da API
- [ ] Testar conexão app ↔ backend

### Admin/Gestor:

- [ ] Iniciar backend (`cd backend && npm run dev`)
- [ ] Iniciar leva-web (`cd leva-mais-web && npm run dev`)
- [ ] Cadastrar serviços de Moto
- [ ] Cadastrar serviços de Carro
- [ ] Cadastrar serviços de Van
- [ ] Cadastrar serviços de Caminhão
- [ ] Testar no app mobile

---

## 🆘 Troubleshooting

### ❌ "Não foi possível carregar os tipos de serviço"

**Possíveis causas:**

1. Backend não está rodando
2. URL da API incorreta
3. MongoDB não está conectado
4. Banco de dados vazio (sem serviços cadastrados)

**Solução:**

```bash
# 1. Verificar backend
cd backend
npm run dev

# 2. Verificar MongoDB
# Certifique-se que está rodando

# 3. Cadastrar serviços via Leva-Web
cd leva-mais-web
npm run dev
# Acesse http://localhost:3001
```

### ❌ App não conecta na API (Android)

**Problema:** URL incorreta para emulador/device

**Solução:**

```typescript
// src/services/api.ts
const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:3000/api"  // Para emulador
  // OU
  ? "http://192.168.1.5:3000/api"  // Para device real
  : "https://api.levamais.com/api";
```

---

## 📈 Próximos Passos

1. **Cache Local** (futuro)

   - Implementar AsyncStorage para cache
   - Sincronizar em background
   - Modo offline básico

2. **Notificações** (futuro)

   - Notificar app quando novos serviços forem adicionados
   - Push notification via Firebase

3. **Analytics** (futuro)
   - Rastrear serviços mais usados
   - Métricas de performance

---

**Última atualização:** 20/12/2024  
**Versão:** 2.0.0 (API-First Architecture)
