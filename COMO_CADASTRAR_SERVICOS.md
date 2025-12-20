# 🎯 Como Cadastrar Tipos de Serviço

## 🚀 Início Rápido (3 Passos)

### 1️⃣ Iniciar Backend

```bash
cd backend
npm run dev
```

✅ Rodando em http://localhost:3000

---

### 2️⃣ Iniciar Leva-Web (Painel Admin)

```bash
cd leva-mais-web
npm run dev
```

✅ Rodando em http://localhost:3001

---

### 3️⃣ Cadastrar Serviços

Acesse: **http://localhost:3001**

---

## 📝 Passo a Passo para Cadastrar

### Exemplo: Cadastrar "Entrega de Delivery" para Moto

1. Abra o navegador em `http://localhost:3001`

2. Clique na aba **"Moto"** (Motorcycle)

3. Clique no botão **"+ Adicionar Novo"**

4. Preencha o formulário:

   ```
   Campo           │ Valor
   ────────────────┼──────────────────────────────────
   ID (slug)       │ delivery
   Título          │ Entrega de Delivery
   Subtítulo       │ Entregar pacotes e encomendas
   Ícone           │ local-shipping
   Badges          │ Rápido
   Status          │ ✅ Ativo
   ```

5. Clique em **"Salvar"**

✅ **Pronto!** O serviço já está no banco de dados e aparecerá no app mobile.

---

## 🏍️ Sugestões de Serviços para MOTO

```
ID              │ Título                        │ Ícone
────────────────┼───────────────────────────────┼──────────────────
delivery        │ Entrega de Delivery           │ local-shipping
documents       │ Documentos                    │ description
market-light    │ Compras de Supermercado       │ shopping-cart
express         │ Expresso                      │ bolt
pharmacy        │ Farmácia                      │ local-pharmacy
petshop         │ Pet Shop                      │ pets
postoffice      │ Correios/Cartório             │ markunread-mailbox
meals           │ Refeições/Restaurantes        │ restaurant
ecommerce       │ E-commerce/Loja               │ store
office          │ Material de escritório        │ inventory
parts           │ Peças e ferramentas leves     │ build
bank            │ Bancos/Financeiro             │ account-balance
gifts           │ Presentes/Floricultura        │ redeem
scheduled       │ Retirada agendada             │ event
multi-stop      │ Multi-paradas                 │ alt-route
urgent-1h       │ Urgente 1h                    │ speed
```

---

## 🚗 Sugestões de Serviços para CARRO

```
ID              │ Título                        │ Ícone
────────────────┼───────────────────────────────┼──────────────────
delivery        │ Entrega de Delivery           │ local-shipping
documents       │ Documentos                    │ description
market-medium   │ Compras de Supermercado       │ shopping-bag
express         │ Expresso                      │ bolt
ecommerce       │ E-commerce/Loja               │ storefront
multi-stop      │ Multi-paradas                 │ alt-route
fragile         │ Itens frágeis                 │ inventory-2
rain-protection │ Proteção contra chuva         │ umbrella
scheduled       │ Retirada agendada             │ event
gifts           │ Presentes/Floricultura        │ card-giftcard
postoffice      │ Correios/Cartório             │ markunread-mailbox
```

---

## 🚐 Sugestões de Serviços para VAN

```
ID              │ Título                        │ Ícone
────────────────┼───────────────────────────────┼──────────────────
moving-light    │ Mudança leve                  │ inventory-2
market-bulk     │ Compras volumosas             │ shopping-cart
ecommerce-bulk  │ Coleta de grandes volumes     │ warehouse
multi-stop      │ Multi-paradas                 │ alt-route
fragile         │ Frágeis com proteção          │ shield
```

---

## 🚚 Sugestões de Serviços para CAMINHÃO

```
ID              │ Título                        │ Ícone
────────────────┼───────────────────────────────┼──────────────────
moving          │ Mudanças                      │ local-shipping
commercial-load │ Carga comercial               │ inventory-2
construction    │ Materiais de construção       │ construction
long-distance   │ Longa distância               │ route
```

---

## 🎨 Ícones Mais Usados

```
local-shipping      - Caminhão de entrega
description         - Documento
shopping-cart       - Carrinho
bolt                - Raio (velocidade)
local-pharmacy      - Farmácia
pets                - Animais
markunread-mailbox  - Caixa de correio
restaurant          - Restaurante
store               - Loja
inventory           - Caixas
build               - Ferramentas
account-balance     - Banco
redeem              - Presente
event               - Calendário
alt-route           - Rotas
speed               - Velocímetro
storefront          - Fachada de loja
shopping-bag        - Sacola
umbrella            - Guarda-chuva
warehouse           - Armazém
shield              - Escudo
route               - Estrada
construction        - Construção
```

**Ver todos:** https://fonts.google.com/icons

---

## 📱 Testar no App

Depois de cadastrar os serviços:

### 1. Configure a URL da API no app

Edite `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? "http://SEU_IP:3000/api" // ⚠️ Coloque seu IP aqui
  : "https://sua-api.com/api";
```

**Para descobrir seu IP:**

- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

**Exemplos:**

- Emulador Android: `http://10.0.2.2:3000/api`
- Device Android/iOS: `http://192.168.1.5:3000/api` (seu IP local)

### 2. Inicie o app

```bash
npm run android
# ou
npm run ios
```

### 3. Os serviços cadastrados aparecerão automaticamente! 🎉

---

## ✅ Checklist de Cadastro

### Para cada tipo de veículo, cadastre:

**Moto (Motorcycle):**

- [ ] Entrega de Delivery
- [ ] Documentos
- [ ] Compras de Supermercado
- [ ] Expresso
- [ ] Farmácia
- [ ] Pet Shop
- [ ] Correios/Cartório
- [ ] Refeições/Restaurantes
- [ ] E-commerce/Loja
- [ ] Material de escritório
- [ ] Peças leves
- [ ] Bancos/Financeiro
- [ ] Presentes/Floricultura
- [ ] Retirada agendada
- [ ] Multi-paradas
- [ ] Urgente 1h

**Carro (Car):**

- [ ] Entrega de Delivery
- [ ] Documentos
- [ ] Compras de Supermercado
- [ ] Expresso
- [ ] E-commerce/Loja
- [ ] Multi-paradas
- [ ] Itens frágeis
- [ ] Proteção contra chuva
- [ ] Retirada agendada
- [ ] Presentes/Floricultura
- [ ] Correios/Cartório

**Van:**

- [ ] Mudança leve
- [ ] Compras volumosas
- [ ] Coleta de grandes volumes
- [ ] Multi-paradas
- [ ] Frágeis com proteção

**Caminhão (Truck):**

- [ ] Mudanças
- [ ] Carga comercial
- [ ] Materiais de construção
- [ ] Longa distância

---

## ⚠️ Dicas Importantes

### ✅ DO (Faça):

- Use IDs únicos sem espaços (ex: `delivery`, `express-1h`)
- Preencha todos os campos obrigatórios
- Teste no app depois de cadastrar
- Use ícones do Material Icons
- Ative os serviços que deseja mostrar no app

### ❌ DON'T (Não Faça):

- Não use o mesmo ID duas vezes no mesmo veículo
- Não deixe campos vazios
- Não use espaços no campo ID
- Não use ícones que não existem
- Não esqueça de ativar o serviço

---

## 🔍 Verificar se Funcionou

### Via Browser:

```
http://localhost:3000/api/purposes?vehicleType=motorcycle
```

Deve mostrar JSON com os serviços cadastrados.

### Via App Mobile:

Os serviços aparecerão na tela de seleção de veículo.

---

## 🆘 Problemas?

### Backend não inicia

```bash
cd backend
npm install
npm run dev
```

### Leva-Web não abre

```bash
cd leva-mais-web
npm install
npm run dev
```

### Serviço não aparece no app

1. Verifique se está marcado como "Ativo" ✅
2. Confirme se o backend está rodando
3. Ajuste a URL da API no app
4. Reinicie o app

---

**Qualquer dúvida, consulte:** `PURPOSES_FINAL_ARCHITECTURE.md`
