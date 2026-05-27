# Leva Mais - Documentação Completa

## 📱 Visão Geral do Aplicativo

Leva Mais é uma plataforma de mobilidade urbana que conecta passageiros a motoristas e clientes a entregadores. O app funciona em modelo híbrido combinando características do **inDriver** (negociação de preços) e **99/Uber** (rastreamento em tempo real).

### Características Principais

- **Fluxo de Corrida**: Sistema de lances estilo inDriver onde passageiros propõem preços e motoristas respondem com ofertas
- **Fluxo de Entrega**: Sistema tradicional com cálculo automático de preços baseado em distância e tipo de carga
- **Tempo Real**: WebSocket para comunicação instantânea entre passageiros e motoristas
- **Pagamentos Flexíveis**: Suporte a dinheiro, cartão, PIX e carteira digital
- **Avaliações Bidirecionais**: Sistema de rating para passageiros e motoristas

---

## 🏗️ Arquitetura

### Stack Tecnológica

#### Frontend (Mobile)
- **Framework**: React Native com Expo SDK 54
- **Linguagem**: TypeScript
- **Navegação**: React Navigation v7 (Stack + Drawer)
- **Estado Global**: Zustand v5 com persistência AsyncStorage
- **Estilização**: NativeWind (Tailwind CSS para React Native)
- **Mapas**: react-native-maps com Google Maps
- **Animações**: Moti + React Native Reanimated
- **Formulários**: React Hook Form + Zod
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Banco de Dados**: MongoDB com Mongoose
- **Autenticação**: JWT (JSON Web Tokens)
- **Tempo Real**: Socket.io
- **Validação**: Joi
- **Upload**: Multer
- **Pagamentos**: Integração com gateways (PIX, Cartão)

### Estrutura de Pastas

```
Leva_Mais/
├── src/                          # Frontend React Native
│   ├── components/               # Componentes reutilizáveis
│   ├── context/                  # Zustand stores
│   ├── hooks/                    # Custom hooks
│   ├── routes/                   # Configuração de navegação
│   ├── screens/                  # Telas do app
│   │   ├── (authenticated)/
│   │   │   ├── Client/          # Telas do passageiro
│   │   │   └── Driver/          # Telas do motorista
│   │   └── (public)/            # Telas de autenticação
│   ├── services/                # Serviços (API, WebSocket)
│   ├── theme/                   # Configuração de tema
│   ├── types/                   # Tipos TypeScript
│   └── utils/                   # Utilitários
├── backend/                      # Backend Node.js
│   ├── src/
│   │   ├── controllers/         # Controladores de rotas
│   │   ├── models/              # Schemas MongoDB
│   │   ├── routes/              # Definição de rotas
│   │   ├── services/            # Lógica de negócio
│   │   ├── middlewares/         # Middlewares Express
│   │   └── utils/               # Utilitários
│   └── server.js                # Entry point
└── leva-mais-web/                # Painel administrativo (Next.js)
```

---

## 🚗 Fluxo de Corrida (Estilo inDriver)

### Visão Geral

O fluxo de corrida do Leva Mais segue o modelo de **negociação direta** entre passageiro e motorista, inspirado no inDriver:

1. Passageiro insere origem e destino
2. Sistema calcula preço sugerido (pré-cálculo)
3. Passageiro faz um **lance** (oferta de preço)
4. Motoristas próximos recebem a solicitação
5. Motoristas enviam **propostas** com seus preços
6. Passageiro escolhe a melhor proposta (ou faz contra-proposta)
7. Motorista aceita e vai até o local de embarque
8. Corrida acontece com rastreamento em tempo real
9. Pagamento e avaliação

### Telas do Fluxo

#### 1. DestinationSearch (Busca de Destino)
**Localização**: `src/screens/(authenticated)/Client/Ride/Request/DestinationSearch/index.tsx`

**Funcionalidades**:
- Seleção de origem (localização atual ou busca)
- Seleção de destino (busca por endereço)
- Visualização da rota no mapa
- Cálculo de distância e tempo estimado
- Botão "Continuar" para próxima tela

**Navegação**:
- Entrada: Home → "Para onde vamos?"
- Saída: RideBidSetup

**Parâmetros Enviados**:
```typescript
{
  pickup: {
    address: string,
    latitude: number,
    longitude: number
  },
  dropoff: {
    address: string,
    latitude: number,
    longitude: number
  },
  routeCoordinates: Array<{latitude, longitude}>
}
```

---

#### 2. RideBidSetup (Configuração do Lance)
**Localização**: `src/screens/(authenticated)/Client/Ride/Request/RideBidSetupScreen/index.tsx`

**Funcionalidades**:
- Exibe resumo da rota (origem, destino, distância, tempo)
- Seleção de tipo de veículo (Moto ou Carro)
- Exibe preço sugerido pelo sistema
- Passageiro define seu **lance** (valor que quer pagar)
- Botões de ajuste rápido (+R$1, +R$2, -R$1, -R$2)
- Validação: lance deve estar entre mínimo e máximo sugerido
- Seleção de método de pagamento
- Botão "Enviar Lance para Motoristas"

**Cálculo de Preço Sugerido**:
O sistema chama o endpoint `POST /rides/calculate-ride-estimate` que retorna:
- `suggestedPrice`: Preço sugerido (base para o lance)
- `minPrice`: 80% do preço sugerido (limite mínimo)
- `maxPrice`: 120% do preço sugerido (limite máximo)
- `distanceKm`: Distância em quilômetros
- `durationMin`: Tempo estimado em minutos
- `pricingBreakdown`: Detalhamento (tarifa base + distância)

**Fórmula de Cálculo** (Backend):
```javascript
// Tabela de preços por veículo
ridePricing = {
  motorcycle: {
    baseFare: 5.00,        // Tarifa base
    perKm: 1.50,           // Preço por km
    minimumFare: 8.00,     // Tarifa mínima
    minimumDistance: 2     // Distância mínima (km)
  },
  car: {
    baseFare: 8.00,
    perKm: 2.50,
    minimumFare: 12.00,
    minimumDistance: 2
  }
}

// Cálculo
if (distanceKm <= minimumDistance) {
  price = minimumFare
} else {
  price = baseFare + ((distanceKm - minimumDistance) * perKm)
}

// Fatores dinâmicos (opcionais)
if (horárioDePico) price *= 1.2  // +20%
if (altaDemanda) price *= 1.25   // +25%
```

**Navegação**:
- Entrada: DestinationSearch
- Saída: RideBiddingScreen

**Parâmetros Enviados**:
```typescript
{
  pickup, dropoff, routeCoordinates,
  vehicleType: "motorcycle" | "car",
  clientOffer: number,  // Lance do passageiro
  paymentMethod: "credit_card" | "pix" | "cash" | "wallet",
  estimate: {
    suggestedPrice, minPrice, maxPrice,
    distanceKm, durationMin, pricingBreakdown
  }
}
```

---

#### 3. RideBiddingScreen (Propostas em Tempo Real)
**Localização**: `src/screens/(authenticated)/Client/Ride/Request/RideBiddingScreen/index.tsx`

**Funcionalidades**:
- Cria a corrida no backend com o lance do passageiro
- Exibe lista de propostas de motoristas em tempo real
- Cada proposta mostra:
  - Foto e nome do motorista
  - Rating (estrelas)
  - Informações do veículo (modelo, cor, placa)
  - Preço proposto pelo motorista
  - Diferença em relação ao lance do passageiro (+R$ ou -R$)
  - Mensagem opcional do motorista
- Botões de ação para cada proposta:
  - ✅ **Aceitar**: Confirma a proposta e vai para rastreamento
  - 💬 **Contra-proposta**: Abre modal para novo valor
  - ❌ **Recusar**: Remove a proposta da lista
- Atualização automática via WebSocket (novas propostas)
- Polling de fallback a cada 5 segundos
- Botão "Cancelar Corrida" no header

**Fluxo de Criação da Corrida**:
```typescript
const rideData = {
  serviceType: "ride",
  vehicleType: "motorcycle" | "car",
  pickup, dropoff, routeCoordinates,
  pricing: {
    basePrice: estimate.pricingBreakdown.baseFare,
    distancePrice: estimate.pricingBreakdown.distancePrice,
    serviceFee: 0,
    total: clientOffer,  // Lance do passageiro
    currency: "BRL"
  },
  distance: {
    value: estimate.distanceKm * 1000,  // metros
    text: `${estimate.distanceKm.toFixed(1)} km`
  },
  duration: {
    value: estimate.durationMin * 60,   // segundos
    text: `${estimate.durationMin} min`
  },
  negotiation: {
    enabled: true,
    clientOffer: clientOffer
  }
};

const ride = await rideService.create(rideData);
```

**Eventos WebSocket**:
- `new-offer`: Nova proposta de motorista
- `offer-updated`: Proposta atualizada
- `ride-accepted`: Motorista aceitou (redireciona para RideTracking)

**Navegação**:
- Entrada: RideBidSetup
- Saída: RideTracking (ao aceitar proposta)

---

#### 4. RideTracking (Rastreamento em Tempo Real)
**Localização**: `src/screens/(authenticated)/Client/Ride/Tracking/RideTracking/index.tsx`

**Funcionalidades**:
- Mapa com localização do motorista em tempo real
- Rota do motorista até o passageiro (embarque)
- Rota do passageiro até o destino (após embarque)
- Status da corrida:
  - `accepted`: Motorista aceitou, indo para embarque
  - `arrived`: Motorista chegou no local de embarque
  - `in_progress`: Corrida em andamento
  - `completed`: Corrida finalizada
- Informações do motorista (foto, nome, veículo, placa)
- Botão "Ligar" para motorista
- Botão "Chat" para comunicação
- Botão "Cancelar" (com taxa se aplicável)
- Estimativa de tempo de chegada (ETA)
- Distância até o motorista

**Atualizações em Tempo Real**:
- WebSocket: `driver-location-updated` (posição do motorista)
- WebSocket: `ride-status-updated` (mudança de status)
- Polling: Atualização de dados da corrida a cada 10 segundos

**Navegação**:
- Entrada: RideBiddingScreen (após aceitar proposta)
- Saída: RideCompleted (ao finalizar corrida)

---

#### 5. RideCompleted (Corrida Finalizada)
**Localização**: `src/screens/(authenticated)/Client/Ride/Completion/RideCompleted/index.tsx`

**Funcionalidades**:
- Resumo da corrida (origem, destino, valor pago)
- Avaliação do motorista (1 a 5 estrelas)
- Tags rápidas (educado, pontual, dirigiu bem, etc.)
- Campo de comentário opcional
- Opção de dar gorjeta (R$2, R$5, R$10)
- Botão "Voltar para Início"

**Navegação**:
- Entrada: RideTracking (ao finalizar)
- Saída: Home

---

### Fluxo Completo (Diagrama)

```
┌─────────────────────────────────────────────────────────────┐
│                         PASSAGEIRO                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   DestinationSearch      │
              │  (Selecionar destino)    │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │     RideBidSetup         │
              │  (Fazer lance/preço)     │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   RideBiddingScreen      │
              │  (Ver propostas de       │
              │   motoristas)            │
              └──────────────────────────┘
                            │
                  ┌─────────┴─────────┐
                  │                   │
                  ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │   Aceitar    │    │   Contra-    │
        │   Proposta   │    │   proposta   │
        └──────────────┘    └──────────────┘
                  │                   │
                  └─────────┬─────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │     RideTracking         │
              │  (Acompanhar motorista)  │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │    RideCompleted         │
              │  (Avaliar motorista)     │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │         Home             │
              └──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         MOTORISTA                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Recebe notificação de   │
              │  nova solicitação        │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Vê detalhes da corrida  │
              │  (origem, destino,       │
              │   lance do passageiro)   │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Envia proposta com      │
              │  seu preço               │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Aguarda resposta do     │
              │  passageiro              │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Passageiro aceita?      │
              └──────────────────────────┘
                            │
                  ┌─────────┴─────────┐
                  │                   │
                 Sim                  Não
                  │                   │
                  ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │   Ir para    │    │  Receber     │
        │   embarque   │    │  contra-     │
        └──────────────┘    │  proposta    │
                  │         └──────────────┘
                  │                   │
                  ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │   Passageiro │    │  Aceitar/    │
        │   embarcou?  │    │  Recusar     │
        └──────────────┘    └──────────────┘
                  │
                  ▼
        ┌──────────────┐
        │  Iniciar     │
        │  corrida     │
        └──────────────┘
                  │
                  ▼
        ┌──────────────┐
        │  Chegar ao   │
        │  destino     │
        └──────────────┘
                  │
                  ▼
        ┌──────────────┐
        │  Finalizar   │
        │  corrida     │
        └──────────────┘
                  │
                  ▼
        ┌──────────────┐
        │  Avaliar     │
        │  passageiro  │
        └──────────────┘
```

---

## 📦 Fluxo de Entrega

O fluxo de entrega é mais tradicional, sem negociação de preços:

### Telas do Fluxo

1. **DeliverySetup**: Seleção de tipo de entrega (moto, carro, van, caminhão)
2. **DeliverySenderInfo**: Informações do remetente
3. **DeliveryDetails**: Detalhes do pacote (peso, dimensões, frágil)
4. **DeliveryReview**: Revisão do pedido
5. **DeliveryPaymentConfirm**: Confirmação de pagamento
6. **RideTracking**: Rastreamento do entregador
7. **DeliveryCompleted**: Entrega finalizada

### Cálculo de Preço de Entrega

O preço é calculado automaticamente baseado em:
- Tipo de veículo
- Distância
- Peso e dimensões do pacote
- Fragilidade
- Necessidade de ajudante

**Fórmula**:
```javascript
basePrice = deliveryPricing[vehicleType].baseFare
distancePrice = distanceKm * deliveryPricing[vehicleType].perKm
weightMultiplier = calculateWeightMultiplier(weightKg)
fragileMultiplier = isFragile ? 1.1 : 1.0
helperMultiplier = needsHelper ? 1.15 : 1.0

totalPrice = (basePrice + distancePrice) * weightMultiplier * fragileMultiplier * helperMultiplier
```

---

## 🔌 Backend API

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Login com Google
- `POST /api/auth/refresh-token` - Renovar token JWT
- `POST /api/auth/logout` - Logout

#### Corridas (Rides)
- `POST /api/rides/calculate-ride-estimate` - Calcular estimativa de preço (pré-cálculo)
- `POST /api/rides` - Criar nova corrida
- `GET /api/rides/:id` - Buscar corrida por ID
- `GET /api/rides/active` - Buscar corrida ativa do usuário
- `POST /api/rides/:id/cancel` - Cancelar corrida
- `POST /api/rides/:id/accept` - Motorista aceita corrida
- `POST /api/rides/:id/reject` - Motorista rejeita corrida

#### Ofertas e Negociação
- `GET /api/rides/:id/offers` - Listar propostas de motoristas
- `POST /api/rides/:id/offers` - Motorista envia proposta
- `POST /api/rides/:id/offers/:offerId/respond` - Passageiro responde proposta
- `POST /api/rides/:id/offers/:offerId/counter` - Passageiro faz contra-proposta

#### Pagamentos
- `POST /api/payments/process` - Processar pagamento
- `GET /api/wallet/balance` - Consultar saldo da carteira
- `POST /api/wallet/withdraw` - Solicitar saque

#### Avaliações
- `POST /api/ratings` - Criar avaliação
- `GET /api/ratings/driver/:id` - Avaliações do motorista
- `GET /api/ratings/client/:id` - Avaliações do passageiro

#### Motoristas
- `GET /api/drivers/nearby` - Buscar motoristas próximos
- `PUT /api/drivers/location` - Atualizar localização do motorista
- `PUT /api/drivers/status` - Atualizar status (online/offline)

#### Entregas
- `POST /api/deliveries` - Criar entrega
- `GET /api/deliveries/:id` - Buscar entrega por ID
- `PUT /api/deliveries/:id/status` - Atualizar status da entrega

### Modelos de Dados

#### User (Usuário)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  password: String,  // Hashed
  userType: "client" | "driver" | "admin",
  profilePhoto: String,
  rating: Number,  // 0-5
  totalRatings: Number,
  walletBalance: Number,
  cpf: String,
  cnpj: String,
  clientVerification: {
    status: "none" | "pending" | "approved" | "rejected",
    documents: {
      selfie: String,
      rgFront: String,
      rgBack: String
    }
  },
  driverStatus: "none" | "pending" | "approved" | "rejected",
  driverDocuments: {
    cnhFront: String,
    cnhBack: String,
    vehiclePhoto: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Ride (Corrida)
```javascript
{
  _id: ObjectId,
  clientId: ObjectId,  // Ref: User
  driverId: ObjectId,  // Ref: User (opcional até aceitar)
  serviceType: "ride" | "delivery",
  vehicleType: "motorcycle" | "car" | "van" | "truck",
  status: "requesting" | "accepted" | "arrived" | "in_progress" | "completed" | "cancelled",
  
  pickup: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  dropoff: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  
  routeCoordinates: [{
    latitude: Number,
    longitude: Number
  }],
  
  pricing: {
    basePrice: Number,
    distancePrice: Number,
    serviceFee: Number,
    total: Number,
    currency: String  // "BRL"
  },
  
  distance: {
    value: Number,  // metros
    text: String    // "5.2 km"
  },
  
  duration: {
    value: Number,  // segundos
    text: String    // "15 min"
  },
  
  negotiation: {
    enabled: Boolean,
    clientOffer: Number,  // Lance do passageiro
    finalPrice: Number    // Preço acordado
  },
  
  offers: [{
    driverId: ObjectId,
    amount: Number,
    status: "pending" | "accepted" | "rejected" | "countered",
    message: String,
    createdAt: Date
  }],
  
  payment: {
    method: "credit_card" | "pix" | "cash" | "wallet",
    status: "pending" | "paid" | "refunded",
    transactionId: String
  },
  
  rating: {
    clientToDriver: {
      stars: Number,
      comment: String,
      createdAt: Date
    },
    driverToClient: {
      stars: Number,
      comment: String,
      createdAt: Date
    }
  },
  
  cancellationFee: Number,
  requestedAt: Date,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date
}
```

#### DriverLocation (Localização do Motorista)
```javascript
{
  _id: ObjectId,
  driverId: ObjectId,  // Ref: User
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  heading: Number,  // Direção em graus
  speed: Number,    // Velocidade em km/h
  status: "available" | "busy" | "offline",
  vehicleType: "motorcycle" | "car" | "van" | "truck",
  serviceTypes: ["ride", "delivery"],
  searchRadiusKm: Number,  // Raio de busca
  lastUpdated: Date
}
```

---

## 🎨 Design System

### Cores Principais

```typescript
const colors = {
  primary: {
    500: '#02de95',  // Verde principal
    600: '#02c583',
    700: '#02ac71'
  },
  background: {
    primary: '#091A2F',    // Azul escuro
    secondary: '#11253E',  // Azul médio
    tertiary: '#1a3454'    // Azul claro
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255,255,255,0.7)',
    tertiary: 'rgba(255,255,255,0.5)'
  },
  success: '#02de95',
  error: '#ef4444',
  warning: '#FFB900',
  info: '#3b82f6'
};
```

### Tipografia

- **Fonte**: System default (iOS: San Francisco, Android: Roboto)
- **Tamanhos**: xs (10), sm (12), base (14), lg (16), xl (20), 2xl (24), 3xl (30), 4xl (36)
- **Pesos**: normal (400), semibold (600), bold (700), black (900)

### Componentes Principais

#### Botões
```tsx
<TouchableOpacity className="bg-[#02de95] rounded-2xl py-4 items-center">
  <Text className="text-[#091A2F] text-lg font-black">TEXTO</Text>
</TouchableOpacity>
```

#### Cards
```tsx
<View className="bg-[#11253E] rounded-3xl p-5 border border-white/10">
  <Text className="text-white text-base font-bold">Título</Text>
  <Text className="text-white/60 text-sm">Descrição</Text>
</View>
```

#### Inputs
```tsx
<TextInput 
  className="bg-[#091A2F] text-white rounded-2xl p-4 border border-white/10"
  placeholder="Digite aqui"
  placeholderTextColor="#ffffff40"
/>
```

---

## 🔐 Segurança

### Autenticação
- JWT com expiração de 24 horas
- Refresh tokens para renovação automática
- Senhas hash com bcrypt (10 rounds)
- Validação de token em todas as rotas protegidas

### Autorização
- Middleware de verificação de role (client, driver, admin)
- Validação de ownership (usuário só acessa seus próprios dados)
- Rate limiting para prevenir abuso

### Dados Sensíveis
- CPF/CNPJ criptografados no banco
- Documentos de verificação armazenados em storage seguro
- Logs de auditoria para operações sensíveis

### Validações
- Zod para validação de dados no frontend
- Joi para validação de dados no backend
- Sanitização de inputs para prevenir XSS
- Escape de queries para prevenir NoSQL injection

---

## 🚀 Deploy e Infraestrutura

### Ambiente de Desenvolvimento
```bash
# Frontend
cd Leva_Mais
npm install
npm start

# Backend
cd backend
npm install
npm run dev
```

### Variáveis de Ambiente

#### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3005/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
EXPO_PUBLIC_WEBSOCKET_URL=http://localhost:3005
```

#### Backend (.env)
```env
PORT=3005
MONGODB_URI=mongodb://localhost:27017/leva_mais
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_MAPS_API_KEY=your_key
STRIPE_SECRET_KEY=your_stripe_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=sa-east-1
S3_BUCKET_NAME=leva-mais-uploads
```

### Produção
- **Frontend**: Expo EAS Build + OTA Updates
- **Backend**: Docker containers em AWS ECS
- **Banco**: MongoDB Atlas (cluster replicado)
- **Storage**: AWS S3 para uploads
- **CDN**: CloudFront para assets estáticos
- **Monitoramento**: Sentry para erros, DataDog para métricas

---

## 📊 Métricas e Analytics

### KPIs Principais
- **Corridas por dia**: Total de corridas finalizadas
- **Taxa de aceitação**: % de propostas aceitas por motoristas
- **Tempo médio de espera**: Tempo entre solicitação e aceite
- **Rating médio**: Avaliação média de passageiros e motoristas
- **Taxa de cancelamento**: % de corridas canceladas
- **Receita por corrida**: Valor médio das corridas
- **Churn rate**: % de usuários que deixam de usar o app

### Eventos Rastreados
- Abertura do app
- Busca de destino
- Criação de corrida
- Envio de lance
- Aceite de proposta
- Finalização de corrida
- Avaliação
- Cancelamento

---

## 🧪 Testes

### Frontend
- **Unitários**: Jest + React Native Testing Library
- **Integração**: Detox para testes E2E
- **Cobertura**: Mínimo 70% de coverage

### Backend
- **Unitários**: Jest + Supertest
- **Integração**: Testes de API com banco de testes
- **Cobertura**: Mínimo 80% de coverage

### Executar Testes
```bash
# Frontend
npm test

# Backend
cd backend
npm test
```

---

## 📝 Convenções de Código

### Nomenclatura
- **Arquivos**: PascalCase para componentes (HomeScreen.tsx)
- **Variáveis**: camelCase (userProfile)
- **Constantes**: UPPER_SNAKE_CASE (API_BASE_URL)
- **Tipos**: PascalCase (UserData)
- **Rotas**: kebab-case (/api/user-profile)

### Estrutura de Componentes
```tsx
// 1. Imports
import React from 'react';
import { View } from 'react-native';

// 2. Tipos
interface Props {
  title: string;
}

// 3. Componente
export default function MyComponent({ title }: Props) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Funções
  const handlePress = () => {};
  
  // 6. Render
  return <View>{title}</View>;
}
```

### Commits
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Refatoração
- `docs:` Documentação
- `test:` Testes
- `chore:` Tarefas de manutenção

---

## 🗑️ Telas Obsoletas para Remoção

Esta seção lista as telas do **fluxo antigo de corrida** que foram desabilitadas mas ainda existem no código. Elas devem ser **deletadas permanentemente** após validação completa do novo fluxo inDriver.

### Status Atual

✅ **Rotas desabilitadas** - As telas não estão mais acessíveis via navegação  
✅ **TypeScript validado** - Sem erros de compilação  
⏳ **Aguardando testes** - Validar novo fluxo em produção  
🔜 **Pronto para deletar** - Após confirmação de funcionamento

### Telas para Deletar

#### 1. SelectVehicleScreen
- **Caminho**: `src/screens/(authenticated)/Client/Ride/Request/SelectVehicle/index.tsx`
- **Função antiga**: Seleção de tipo de veículo (moto/carro)
- **Substituída por**: `RideBidSetupScreen` (agora tem seletor de veículo integrado)
- **Motivo da remoção**: Fluxo antigo exigia seleção separada de veículo antes de ver preços

#### 2. ServicePurposeScreen
- **Caminho**: `src/screens/(authenticated)/Client/Ride/Request/ServicePurpose/index.tsx`
- **Função antiga**: Seleção de propósito do serviço (corrida/entrega/etc)
- **Substituída por**: Não necessário no novo fluxo (serviceType é definido automaticamente)
- **Motivo da remoção**: Simplificação do fluxo - usuário não precisa mais escolher propósito

#### 3. OrderSummaryScreen (FinalOrderSummary)
- **Caminho**: `src/screens/(authenticated)/Client/Ride/Request/OrderSummary/index.tsx`
- **Função antiga**: Resumo final antes de buscar motorista
- **Substituída por**: `RideBidSetupScreen` (já mostra resumo + permite fazer lance)
- **Motivo da remoção**: Tela intermediária desnecessária no novo fluxo

#### 4. PaymentEnhancedScreen
- **Caminho**: `src/screens/(authenticated)/Client/Ride/Request/PaymentEnhanced/index.tsx`
- **Função antiga**: Seleção de método de pagamento antes de buscar motorista
- **Substituída por**: `RideBidSetupScreen` (já inclui seleção de pagamento)
- **Motivo da remoção**: No novo fluxo, pagamento é selecionado junto com o lance

#### 5. SearchingDriverScreen
- **Caminho**: `src/screens/(authenticated)/Client/Ride/SearchingDriver/index.tsx`
- **Função antiga**: Tela de busca automática de motorista (estilo Uber/99)
- **Substituída por**: `RideBiddingScreen` (estilo inDriver - motorista faz proposta)
- **Motivo da remoção**: Mudança de paradigma - de busca automática para negociação

### Componentes Relacionados (Também Deletar)

#### VehicleCard
- **Caminho**: `src/screens/(authenticated)/Client/Shared/components/VehicleCard.tsx`
- **Usado em**: SelectVehicleScreen (já obsoleta)
- **Ação**: Deletar após confirmar que não é usado em outros lugares

#### PurposeCard
- **Caminho**: `src/screens/(authenticated)/Client/Shared/components/PurposeCard.tsx`
- **Usado em**: ServicePurposeScreen (já obsoleta)
- **Ação**: Deletar após confirmar que não é usado em outros lugares

#### PaymentMethodCard
- **Caminho**: `src/screens/(authenticated)/Client/Shared/components/PaymentMethodCard.tsx`
- **Usado em**: PaymentEnhancedScreen (já obsoleta)
- **Ação**: Deletar após confirmar que não é usado em outros lugares

### Procedimento de Remoção

**Fase 1 - Desabilitação (✅ CONCLUÍDA)**
- [x] Remover importações das rotas em `client.stack.routes.tsx`
- [x] Remover registros de `<Stack.Screen>` das telas obsoletas
- [x] Validar que não há erros de TypeScript
- [x] Confirmar que o build funciona

**Fase 2 - Validação (⏳ EM ANDAMENTO)**
- [ ] Testar fluxo completo de corrida (novo) em desenvolvimento
- [ ] Testar fluxo completo de corrida (novo) em staging
- [ ] Validar que não há regressões em outros fluxos (entregas, etc)
- [ ] Coletar feedback de usuários beta

**Fase 3 - Deleção (🔜 AGUARDANDO)**
- [ ] Deletar arquivos das 5 telas obsoletas
- [ ] Deletar componentes relacionados (VehicleCard, PurposeCard, PaymentMethodCard)
- [ ] Remover tipos de navegação obsoletos em `navigation.ts`
- [ ] Remover constantes de rotas em `Shared/utils/navigation.ts`
- [ ] Atualizar documentação removendo referências ao fluxo antigo
- [ ] Commit com mensagem: `chore: delete obsolete ride flow screens`

### Verificação Antes de Deletar

Execute estes comandos para garantir que não há dependências:

```bash
# Verificar se SelectVehicle é referenciado em algum lugar
grep -r "SelectVehicle" src/ --include="*.ts" --include="*.tsx"

# Verificar se ServicePurpose é referenciado
grep -r "ServicePurpose" src/ --include="*.ts" --include="*.tsx"

# Verificar se FinalOrderSummary é referenciado
grep -r "FinalOrderSummary" src/ --include="*.ts" --include="*.tsx"

# Verificar se PaymentEnhanced é referenciado
grep -r "PaymentEnhanced\|PaymentScreen" src/ --include="*.ts" --include="*.tsx"

# Verificar se SearchingDriver é referenciado
grep -r "SearchingDriver" src/ --include="*.ts" --include="*.tsx"

# Verificar se os componentes são usados em outros lugares
grep -r "VehicleCard\|PurposeCard\|PaymentMethodCard" src/ --include="*.ts" --include="*.tsx"
```

Se todos os comandos retornarem apenas referências nos próprios arquivos obsoletos, é seguro deletar.

### Notas Importantes

⚠️ **NÃO deletar antes de**:
1. Confirmar que o novo fluxo inDriver funciona 100% em produção
2. Validar que não há deep links ou notificações push apontando para telas antigas
3. Garantir que não há fluxos de entrega usando essas telas
4. Testar exaustivamente em dispositivos reais (iOS e Android)

✅ **Seguro deletar quando**:
- Nenhum erro de TypeScript após desabilitação
- Fluxo de corrida novo testado e aprovado
- Sem referências externas às telas antigas
- Documentação atualizada

---

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] Agendamento de corridas
- [ ] Paradas intermediárias
- [ ] Divisão de conta
- [ ] Modo família (múltiplos passageiros)
- [ ] Assinatura mensal (rides ilimitadas)
- [ ] Integração com transporte público
- [ ] Programa de fidelidade
- [ ] Cupons de desconto
- [ ] Modo escuro/claro
- [ ] Acessibilidade (VoiceOver, TalkBack)

### Melhorias Técnicas
- [ ] Migração para React Native New Architecture
- [ ] Implementar GraphQL
- [ ] Adotar microserviços
- [ ] Implementar cache com Redis
- [ ] Adicionar feature flags
- [ ] Implementar A/B testing
- [ ] Otimizar bundle size
- [ ] Implementar code splitting

---

## 📞 Suporte

- **Email**: suporte@levamais.app
- **Telefone**: 0800 123 4567
- **WhatsApp**: (11) 99999-9999
- **Central de Ajuda**: https://ajuda.levamais.app

---

## 📄 Licença

Copyright © 2024 Leva Mais. Todos os direitos reservados.

Este software é proprietário e confidencial. Não é permitida a reprodução, distribuição ou modificação sem autorização prévia por escrito.

---

**Última atualização**: 26 de maio de 2026  
**Versão**: 1.0.0  
**Autor**: Equipe Leva Mais
