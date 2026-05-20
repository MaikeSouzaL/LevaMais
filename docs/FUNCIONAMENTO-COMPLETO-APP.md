# DOCUMENTAÇÃO COMPLETA - LEVA MAIS

## Funcionamento do App Cliente e Motorista

**Data:** 2026-05-20
**Versão:** 1.0

---

## ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Fluxo de Autenticação e Onboarding](#3-fluxo-de-autenticação-e-onboarding)
4. [App do Cliente - Telas e Funcionalidades](#4-app-do-cliente)
5. [App do Motorista - Telas e Funcionalidades](#5-app-do-motorista)
6. [Fluxo de Corridas (Ride)](#6-fluxo-de-corridas-ride)
7. [Fluxo de Entregas (Delivery) com Negociação](#7-fluxo-de-entregas-delivery)
8. [Sistema de Pagamentos e Carteira](#8-sistema-de-pagamentos-e-carteira)
9. [Backend - Controladores e Serviços](#9-backend)
10. [Máquina de Estados da Corrida](#10-máquina-de-estados)
11. [Web Admin (leva-mais-web)](#11-web-admin)

---

## 1. VISÃO GERAL DO SISTEMA

O **Leva Mais** é uma plataforma de mobilidade urbana estilo inDriver/99, composta por:

| Módulo | Tecnologia | Descrição |
|--------|-----------|-----------|
| **App Mobile** | React Native + Expo | App para clientes e motoristas |
| **Backend** | Node.js + Express + MongoDB | API REST + WebSocket |
| **Web Admin** | Next.js 14 | Painel administrativo para gestão da plataforma |

### Modos de Serviço

- **Ride (Corrida):** Transporte de passageiros com opções de veículo (moto, carro, van)
- **Delivery (Entrega):** Encomendas com negociação de preço estilo inDriver

### Perfis de Usuário

- **Client (Cliente):** Solicita corridas e entregas
- **Driver (Motorista):** Aceita e executa corridas/entregas
- **Admin:** Gerencia a plataforma via Web Admin

---

## 2. ARQUITETURA TÉCNICA

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   App Mobile (Expo) │     │   Web Admin (Next)  │     │   Backend (Express) │
│   React Native      │────▶│   React/TypeScript  │────▶│   Node.js + MongoDB │
│   src/screens/      │     │   leva-mais-web/    │     │   backend/src/      │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                                                            │
         └────────────────── WebSocket (Socket.IO) ───────────────────┘
                              (tempo real: tracking, chat, ofertas)
```

### Estrutura do App Mobile

```
src/
├── components/          # Componentes reutilizáveis
│   ├── auth/           # Componentes de autenticação
│   ├── client/         # Componentes do cliente (home, delivery, offers)
│   ├── driver/         # Componentes do motorista (home, offers)
│   ├── maps/           # Marcadores e rotas no mapa
│   ├── ui/             # UI genérica (botões, modais, toast)
│   └── routes/         # Rotas desenhadas no mapa
├── screens/
│   ├── (public)/       # Telas de autenticação (11 telas)
│   └── (authenticated)/
│       ├── Client/     # Telas do cliente (~35 telas)
│       └── Driver/     # Telas do motorista (25 telas)
├── routes/             # Configuração de navegação
├── services/           # Chamadas à API (22 serviços)
├── context/            # Estado global (auth, chat, ride)
├── hooks/              # Hooks customizados
└── utils/              # Utilitários
```

---

## 3. FLUXO DE AUTENTICAÇÃO E ONBOARDING

### Telas Públicas (11 telas)

| Tela | Rota | Descrição |
|------|------|-----------|
| **IntroScreen** | `IntroScreen` | Slides de introdução com benefícios do app. Navega para SignIn ou SignUp. |
| **SignInScreen** | `SignIn` | Login com email/senha ou Google. Link para cadastro e recuperação de senha. |
| **SignUpScreen** | `SignUp` | Cadastro com nome, email, telefone, senha e tipo de usuário (cliente/motorista). |
| **SelectProfileScreen** | `SelectProfile` | Escolha entre perfil Cliente ou Motorista (após login Google). |
| **ForgotPasswordScreen** | `ForgotPassword` | Solicita email para enviar código de recuperação. |
| **VerifyCodeScreen** | `VerifyCode` | Insere código de 4 dígitos enviado por email. |
| **NewPasswordScreen** | `NewPassword` | Define nova senha após verificação. |
| **PhoneVerificationScreen** | `PhoneVerification` | Verificação de número de telefone via SMS. |
| **GooglePhonePromptScreen** | `GooglePhonePrompt` | Solicita telefone durante cadastro com Google. |
| **TermsScreen** | `Terms` | Termos de uso e política de privacidade. Aceite obrigatório. |
| **NotificationPermissionScreen** | `NotificationPermission` | Solicita permissão para notificações push. |

### Fluxo de Autenticação

```
IntroScreen → SignIn / SignUp
                    ↓
              (Google ou Email)
                    ↓
            SelectProfile (se Google)
                    ↓
            TermsScreen (aceitar termos)
                    ↓
        NotificationPermission
                    ↓
          ┌─ Cliente: ClientBoot → DrawerClienteRoutes → Home
          │
          └─ Motorista: DriverBoot → DrawerDriverRoutes → DriverHome
```

### Gatekeeper de Termos

Após autenticação, o sistema verifica se o usuário aceitou os termos (`aceitouTermos`). Se não, bloqueia o acesso até aceitar. Isso é aplicado centralmente em `routes/index.tsx`.

---

## 4. APP DO CLIENTE

### 4.1 Navegação Principal (Drawer + Stack)

O cliente usa um **Drawer Navigator** com menu lateral contendo 16 itens, mais um **Stack Navigator** com ~35 telas.

#### Menu Drawer do Cliente

| Item | Rota | Ícone | Descrição |
|------|------|-------|-----------|
| Início | `Home` | 🏠 | Mapa principal com busca de motoristas |
| Histórico | `History` | 📋 | Lista de corridas/entregas passadas |
| Pedidos ativos | `ActiveOrders` | 📍 | Corridas em andamento |
| Plantões motoboy | `ShiftOffersClient` | 🕐 | Disponibilidade de motoboys |
| Comprovantes | `Receipts` | 🧾 | Recibos de corridas |
| Carteira | `Wallet` | 💰 | Saldo e transações |
| Pagamentos | `PaymentsCenter` | 💳 | Métodos de pagamento |
| Cupons | `Coupons` | 🎫 | Cupons de desconto |
| Perfil | `Profile` | 👤 | Dados pessoais |
| Notificações | `NotificationsCenter` | 🔔 | Central de notificações |
| Favoritos | `Favorites` | ⭐ | Endereços salvos |
| Segurança | `SafetyCenter` | 🛡️ | Central de segurança |
| Suporte | `SupportCenter` | 🆘 | Central de ajuda |
| Privacidade | `PrivacyData` | 🔒 | Dados e privacidade |
| Convidar amigos | `InviteFriends` | 👥 | Indique e ganhe |
| Configurações | `Settings` | ⚙️ | Preferências do app |

### 4.2 Tela Home (Início)

**Arquivo:** `src/screens/(authenticated)/Client/Home/index.tsx`

A tela principal do cliente exibe:

- **Mapa em tempo real** (`ClientRealtimeMap`): Mostra motoristas próximos no mapa
- **Floating Header** (`ClientFloatingHeader`): Endereço atual, saldo, foto de perfil
- **Bottom Sheet** (`ClientBottomSheet`): 
  - Campo "Para onde?" para inserir destino
  - Botões de serviço: **Corrida** ou **Entrega**
  - Endereços favoritos
  - Histórico recente
- **Map Action Buttons**: Centralizar mapa, mostrar trânsito
- Modais de status: "Pedido enviado com sucesso", "Nenhum motorista disponível"

### 4.3 Fluxo de Corrida (Ride)

#### Fase 1: Solicitação

| Tela | Descrição |
|------|-----------|
| **DestinationSearch** | Busca endereço de destino com Google Places. Calcula distância, tempo e preço estimado. |
| **ServiceSelection** | Escolhe tipo de serviço (Corrida ou Entrega). |
| **SelectVehicle** | Seleciona veículo: Moto, Carro, Van ou Caminhão. Mostra preço por categoria. |
| **ServicePurpose** | Define finalidade: Trabalho, Lazer, Compras, etc. |
| **RideSetup** | Confirma endereços, vê preço detalhado (base + distância + taxa), adiciona código promocional. |
| **PaymentEnhanced** | Seleciona forma de pagamento: Dinheiro, Cartão, Carteira ou Pix. |
| **ConfirmPickup** | Confirma ponto de embarque exato no mapa. |
| **OrderSummary** | Resumo final antes de enviar: endereços, preço, pagamento, veículo. |

#### Fase 2: Busca

| Tela | Descrição |
|------|-----------|
| **OrderSentScreen** | Animação de "Pedido enviado". Timer visual. Transição automática para busca. |
| **SearchingDriver** | Busca motoristas próximos em tempo real. Mostra raio de busca expandindo. Timer regressivo. Se não encontrar, oferece agendamento ou cancelamento. |

#### Fase 3: Tracking (Corrida Ativa)

| Tela | Descrição |
|------|-----------|
| **RideTracking** | Acompanha motorista no mapa em tempo real. Mostra ETA, distância, placa/nome do motorista. Botões: Chat, Ligar, Cancelar, Compartilhar rota. |
| **Chat** | Chat em tempo real com motorista via WebSocket. |

#### Fase 4: Cancelamento

| Tela | Descrição |
|------|-----------|
| **CancelRide** | Tela de cancelamento com seleção de motivo. Lista pré-definida + campo livre. |
| **CancelFee** | Se houver taxa de cancelamento: mostra valor e justificativa baseada nas regras da plataforma (antes/depois do embarque). |

#### Fase 5: Finalização

| Tela | Descrição |
|------|-----------|
| **RideCompleted** | Tela de sucesso com resumo: preço pago, distância, duração, motorista. |
| **RateDriver** | Avaliação do motorista: 1-5 estrelas + comentário opcional + tags (amigável, pontual, etc.). |
| **TipDriver** | Gorjeta opcional: valores sugeridos (R$2, R$5, R$10) ou valor personalizado. |

### 4.4 Fluxo de Entrega (Delivery) com Negociação

O fluxo de entrega usa o modelo **inDriver** onde o cliente publica o pedido e motoristas fazem ofertas.

#### Fase 1: Configuração

| Tela | Descrição |
|------|-----------|
| **DestinationSearch** | Define endereço de coleta e entrega. |
| **DeliverySetup** | Detalhes da encomenda: tipo de item, tamanho, peso aproximado, frágil, precisa de ajudante, seguro, nome/telefone do destinatário, instruções. |
| **DeliveryReview** | Revisão de todos os detalhes antes de publicar. |
| **DeliveryPaymentConfirm** | (Após selecionar motorista) Confirmação do pagamento. Escolhe método e confirma valor negociado. |

#### Fase 2: Negociação (Marketplace)

| Tela | Descrição |
|------|-----------|
| **SearchingDriver** | Aguarda motoristas. Mostra "Publicado - Aguardando ofertas". |
| **RideOffersMarketplace** | Lista de ofertas recebidas dos motoristas. Cada oferta mostra: nome, foto, avaliação, veículo, preço, ETA. Cliente pode: aceitar, recusar ou contrapropor. |
| **Contraproposta** | Cliente ajusta o valor e envia contraproposta. Motorista pode aceitar ou contrapropor de volta. |

#### Fase 3-5: Tracking, Cancelamento e Finalização
Mesmo fluxo da corrida (telas compartilhadas).

### 4.5 Perfil e Configurações

| Tela | Descrição |
|------|-----------|
| **ProfileView** | Foto, nome, email, telefone, cidade. Editar perfil. |
| **EditAccount** | Editar nome, email, telefone, foto. |
| **Settings** | Preferências: notificações, idioma, tema. |
| **Wallet** | Saldo da carteira, histórico de transações (entradas/saídas). |
| **PaymentsCenter** | Métodos de pagamento salvos. Adicionar cartão. |
| **AddPaymentMethod** | Cadastrar novo cartão de crédito. |
| **Coupons** | Cupons de desconto disponíveis e usados. |
| **Receipts** | Comprovantes/recibos de corridas. |
| **PrivacyData** | Solicitar/baixar dados pessoais. |
| **InviteFriends** | Código de indicação para compartilhar. |

### 4.6 Histórico e Pedidos

| Tela | Descrição |
|------|-----------|
| **HistoryList** | Lista cronológica de corridas concluídas e canceladas. Filtro por período. |
| **OrderDetails** | Detalhes de uma corrida: trajeto no mapa, preço, motorista, avaliação, recibo. |
| **ActiveOrders** | Corridas/entregas em andamento com status em tempo real. |
| **ShiftOffersClient** | Lista de plantões de motoboys disponíveis. Permite agendar. |

### 4.7 Outros

| Tela | Descrição |
|------|-----------|
| **FavoritesList** | Endereços favoritos salvos. Gerenciar (editar, excluir). |
| **AddFavorite** | Adicionar novo endereço favorito com apelido. |
| **AddressPicker** | Busca de endereço no mapa com pin drop. Usado para favoritos e destino. |
| **SafetyCenter** | Botão de emergência, compartilhar rota, contatos de confiança. |
| **NotificationsCenter** | Central de notificações push recebidas. |
| **SupportCenter** | Ajuda, FAQs, contato com suporte. |
| **ClientCityScreen** | Seleção de cidade do cliente. |
| **Help** | Ajuda rápida e central de suporte. |
| **LocationPicker** | Selecionar localização no mapa (arrastar pin). |

---

## 5. APP DO MOTORISTA

### 5.1 Navegação Principal (Drawer)

O motorista usa um **Drawer Navigator** com 14 itens de menu, mais telas ocultas para fluxos específicos.

#### Menu Drawer do Motorista

| Item | Rota | Ícone | Descrição |
|------|------|-------|-----------|
| Mapa | `DriverHome` | 🗺️ | Mapa principal e status online/offline |
| Solicitações | `DriverRequests` | 🚗 | Corridas próximas disponíveis |
| Ganhos e carteira | `DriverFinance` | 💵 | Stack financeiro (ganhos, saque, extrato) |
| Plantões | `DriverShiftOffers` | 🕐 | Ofertas de plantão |
| Avaliações | `DriverRatings` | ⭐ | Notas e feedback dos clientes |
| Histórico | `DriverHistory` | 📋 | Corridas realizadas |
| Veículo | `DriverVehicle` | 🏍️ | Dados do veículo cadastrado |
| Documentos | `DriverDocuments` | 📄 | CNH, CRLV, foto do veículo |
| Preferências | `DriverWorkPreferences` | 🎚️ | Preferências de trabalho (raios, valores) |
| Perfil | `DriverProfile` | 👤 | Dados pessoais |
| Segurança | `DriverSafety` | 🛡️ | Botão de pânico |
| Suporte | `DriverSupportCenter` | 🆘 | Central de ajuda |
| Ajuda rápida | `DriverHelp` | ❓ | FAQs e tutoriais |
| Configurações | `DriverSettings` | ⚙️ | Preferências do app |

### 5.2 Stack Financeiro (DriverFinance Stack)

Agrupa telas relacionadas a finanças:

| Tela | Descrição |
|------|-----------|
| **DriverEarningsScreen** | Dashboard de ganhos: hoje, semana, mês. Total acumulado. |
| **DriverWithdrawScreen** | Solicitar saque: valor, chave Pix, confirmação. |
| **DriverStatementScreen** | Extrato detalhado de transações: corridas, saques, bônus, taxas. |
| **DriverPayoutsScreen** | Histórico de saques e pagamentos recebidos. |
| **DriverIncentivesScreen** | Metas e bônus: meta diária de corridas (padrão 10), bônus por meta (padrão R$20). |
| **DriverRideDetailsScreen** | Detalhes financeiros de uma corrida específica. |

### 5.3 Tela Home do Motorista

**Arquivo:** `src/screens/(authenticated)/Driver/DriverHomeScreen.tsx`

A tela principal do motorista:

- **Mapa interativo** com marcadores de:
  - Clientes próximos solicitando corrida
  - Corridas ativas
- **Status Header** (`DriverStatusHeader`): 
  - Toggle Online/Offline
  - Status atual: Disponível / Em corrida / Ocupado
  - Tipo de veículo configurado
- **Balance Widget**: Saldo atual da carteira
- **Driver Deposit Modal**: Depósito de saldo na plataforma
- **Queue Tag Yellow**: Indicador de fila de espera
- **Driver Bottom Sheet**: Ofertas recebidas, próximas corridas
- **Onboarding Dashboard**: Para motoristas recém-cadastrados (primeiro acesso)
- **Incoming Offer Sheet** (`NewIncomingOfferSheet`): Oferta recebida em tempo real com som/vibração

### 5.4 Telas de Operação

| Tela | Descrição |
|------|-----------|
| **DriverRequestsScreen** | Lista de corridas/entregas solicitadas próximas. Filtros: distância, preço, tipo. Aceitar ou fazer oferta. |
| **DriverRideScreen** | Tela ativa durante a corrida: navegação GPS, dados do cliente, botão "Cheguei", "Iniciar corrida", "Finalizar". |
| **DriverChatScreen** | Chat com cliente durante a corrida. |
| **DriverCancelRideScreen** | Cancelar corrida com seleção de motivo. |
| **DriverRateClientScreen** | Avaliar cliente após a corrida. |
| **DriverShiftOffersScreen** | Ofertas de plantão disponíveis na região. |

### 5.5 Telas de Entrega (Modo Delivery)

| Tela | Descrição |
|------|-----------|
| **DeliveryOfferScreen** | Lista de entregas disponíveis para fazer oferta. |
| **DeliveryOfferDetailScreen** | Detalhes da entrega: trajeto, tipo de carga, valor sugerido. Permite fazer oferta ou contraproposta. |
| **DriverNegotiationScreen** | Tela de negociação: histórico de ofertas, contrapropostas, aceitar/rejeitar. |

### 5.6 Perfil e Documentos

| Tela | Descrição |
|------|-----------|
| **DriverProfileScreen** | Nome, foto, email, telefone, avaliação, total de corridas. |
| **DriverVehicleScreen** | Cadastro do veículo: placa, modelo, cor, ano, categoria. |
| **DriverDocumentsScreen** | Upload e verificação de: CNH, CRLV, foto do veículo, selfie. Status de aprovação. |
| **DriverWorkPreferencesScreen** | Configurações de trabalho: raio máximo de busca, valor mínimo por corrida, tipos de serviço aceitos. |
| **DriverRatingsScreen** | Notas recebidas, comentários, tags de avaliação. |
| **DriverSafetyScreen** | Botão de emergência, compartilhar localização com contatos. |
| **DriverSupportCenterScreen** | Central de suporte e FAQs. |
| **DriverHelpScreen** | Ajuda rápida com problemas comuns. |
| **DriverSettingsScreen** | Configurações do app: notificações, GPS, economia de bateria. |

### 5.7 Onboarding do Motorista

Motoristas passam por processo de aprovação:
1. Cadastro inicial (SignUp ou Google)
2. Upload de documentos (CNH, CRLV, selfie)
3. Cadastro do veículo
4. Aguardar aprovação (status: `pending_approval`)
5. Acesso liberado (status: `approved`)

Enquanto não aprovado, o drawer filtra itens indisponíveis e o motorista vê um **Onboarding Dashboard** na Home.

---

## 6. FLUXO DE CORRIDAS (RIDE)

### Diagrama do Fluxo Cliente

```
Home (escolhe Corrida)
  → DestinationSearch (define destino)
    → SelectVehicle (escolhe veículo)
      → ServicePurpose (finalidade)
        → RideSetup (confirma detalhes e preço)
          → PaymentEnhanced (forma de pagamento)
            → ConfirmPickup (ponto exato)
              → OrderSummary (resumo final)
                → OrderSentScreen (animação envio)
                  → SearchingDriver (busca motoristas)
                    → [Motorista encontrado]
                      → RideTracking (acompanha no mapa)
                        → Chat (conversa com motorista)
                        → CancelRide (se cancelar)
                          → CancelFee (taxa se aplicável)
                    → RideCompleted (corrida finalizada)
                      → RateDriver (avaliar)
                      → TipDriver (gorjeta opcional)
```

### Diagrama do Fluxo Motorista

```
DriverHome (Online, aguardando)
  → [Recebe solicitação via WebSocket]
    → DriverRequests (vê detalhes)
      → Aceitar? 
        → Sim: DriverRideScreen (navegar até cliente)
          → "Cheguei" → "Iniciar corrida"
            → Navegação GPS até destino
              → "Finalizar corrida"
                → DriverRateClientScreen (avaliar)
```

---

## 7. FLUXO DE ENTREGAS (DELIVERY) COM NEGOCIAÇÃO

### Modelo inDriver: Cliente publica, motoristas ofertam

```
Home (escolhe Entrega)
  → DestinationSearch (coleta + entrega)
    → DeliverySetup (detalhes da encomenda)
      → DeliveryReview (revisão final)
        → [Publica pedido]
          → SearchingDriver (aguardando ofertas)
            → RideOffersMarketplace (ofertas recebidas)
              ├─ Aceitar oferta
              ├─ Recusar oferta
              └─ Contrapropor valor
                  ← Motorista aceita/recusa/contrapropõe
            → [Acordo fechado]
              → DeliveryPaymentConfirm (confirmar pagamento)
                → RideTracking (acompanhar entrega)
                  → RideCompleted
                    → RateDriver + TipDriver
```

### Sistema de Negociação

1. Cliente publica pedido com preço base calculado pelo sistema
2. Cliente pode opcionalmente sugerir valor inicial (`clientOffer`)
3. Motoristas veem o pedido e fazem ofertas
4. Cada oferta tem status: `accepted`, `countered`, `rejected`, `client_countered`
5. Negociação vai e volta até acordo ou timeout
6. Ao aceitar, status da corrida muda para `payment_pending`
7. Cliente confirma pagamento → status muda para `driver_assigned`
8. Motorista inicia a entrega

---

## 8. SISTEMA DE PAGAMENTOS E CARTEIRA

### Métodos de Pagamento

- 💵 **Dinheiro** (cash) - padrão
- 💳 **Cartão** (card)
- 📱 **Carteira** (wallet) - saldo pré-pago
- 🏦 **Pix**

### Motorista: Sistema de Saldo (Pré-pago)

Motoristas mantêm saldo na plataforma para:
- Pagar taxas de serviço
- Receber repasses de corridas
- Depósitos e saques

Funcionalidades:
- **Depósito:** Adiciona créditos via PIX
- **Saque:** Transfere saldo para conta bancária
- **Débito automático:** Taxa da plataforma é debitada ao aceitar corrida
- **Verificação de saldo:** Antes de aceitar corrida, verifica se tem saldo suficiente

### Taxas da Plataforma (PlatformConfig)

| Configuração | Padrão | Descrição |
|-------------|--------|-----------|
| Taxa do App | 15% | Porcentagem cobrada sobre cada corrida |
| Split representante | 50% | Participação do representante local no lucro |
| Raio de busca | 5000m | Raio máximo de busca de motoristas |
| Timeout de busca | 60s | Tempo máximo procurando motorista |
| Intervalo fila | 60s | Intervalo entre reenvios de fila de espera |

### Regras de Cancelamento

| Fase | Taxa | Descrição |
|------|------|-----------|
| Antes do embarque | 10% (min R$5, max R$50) | Cancelamento antes do motorista chegar |
| Após embarque | 50% (min R$20, max R$200) | Com suporte obrigatório |
| Durante entrega | 80% (min R$30, max R$500) | Desabilitado por padrão, requer suporte |

### Metas de Motorista

- **Meta diária:** 10 corridas (configurável)
- **Bônus:** R$20 ao atingir a meta (configurável)

---

## 9. BACKEND

### Estrutura

```
backend/src/
├── config/          # Configurações (banco, email, storage)
├── controllers/     # Lógica de negócio (18 controllers)
├── middlewares/     # Auth, admin key, rate limit, upload
├── models/          # Schemas Mongoose (19 models)
├── routes/          # Definição de rotas REST (18 arquivos)
├── services/        # Serviços auxiliares
├── templates/       # Templates de email
└── scripts/         # Scripts de manutenção
```

### Principais Controladores

| Controller | Tamanho | Responsabilidade |
|-----------|---------|-----------------|
| `ride.controller.js` | 132KB | CRUD de corridas, negociação, tracking, cancelamento, estados |
| `auth.controller.js` | 64KB | Registro, login, Google OAuth, verificação telefone, recuperação senha |
| `driver.controller.js` | 26KB | Perfil motorista, documentos, aprovação, status online |
| `driverLocation.controller.js` | 21KB | Localização GPS, status (available/busy/offline), proximidade |
| `payment.controller.js` | 23KB | Processamento de pagamentos, reembolsos, webhooks |
| `withdraw.controller.js` | 11KB | Saques, extrato, verificação de saldo |
| `wallet.controller.js` | 7KB | Carteira digital, transações |
| `config.controller.js` | 7KB | Configurações globais da plataforma |
| `pricing.controller.js` | 9KB | Cálculo de preços por distância, veículo, região |
| `chat.controller.js` | 7KB | Mensagens em tempo real |
| `purpose.controller.js` | 12KB | Finalidades de viagem (trabalho, lazer, etc.) |
| `promotion.controller.js` | 6KB | Cupons e códigos promocionais |
| `shiftOffer.controller.js` | 6KB | Plantões de motoboy |
| `favorite.controller.js` | 3KB | Endereços favoritos |
| `favoriteAddress.controller.js` | 8KB | Gerenciamento de endereços favoritos |
| `city.controller.js` | 9KB | Cidades atendidas |
| `platformConfig.controller.js` | 1KB | Configurações globais |
| `representative.controller.js` | 1KB | Gestão de representantes regionais |

### Principais Modelos (MongoDB)

| Modelo | Descrição |
|--------|-----------|
| **Ride** | Corrida/entrega: status, trajeto, preço, negociação, pagamento |
| **User** | Usuários: dados, tipo (client/driver/admin), status aprovação |
| **DriverLocation** | Localização em tempo real, status online |
| **ChatMessage** | Mensagens do chat |
| **City** | Cidades e regiões atendidas |
| **PlatformConfig** | Configurações globais da plataforma |
| **PricingConfig** | Regras de precificação por região/veículo |
| **Promotion** | Cupons e códigos promocionais |
| **ShiftOffer** | Ofertas de plantão |
| **Withdrawal** | Solicitações de saque |
| **PaymentWebhookEvent** | Eventos de webhook de pagamento |
| **RideTrackPoint** | Pontos de GPS durante a corrida |
| **Favorite** | Endereços favoritos |
| **DriverDailyStats** | Estatísticas diárias do motorista |
| **PasswordReset** | Tokens de recuperação de senha |
| **PhoneVerification** | Códigos de verificação de telefone |
| **Representative** | Representantes regionais |
| **PricingRule** | Regras de preço específicas |

### Comunicação em Tempo Real (WebSocket)

O serviço `websocket.service.ts` gerencia conexão Socket.IO:

**Eventos:**
- `ride:new` - Nova solicitação para motoristas próximos
- `ride:accepted` - Motorista aceitou
- `ride:driver_location` - Localização do motorista
- `ride:status_changed` - Mudança de status
- `offer:new` - Nova oferta na negociação
- `offer:countered` - Contraproposta
- `offer:accepted` - Oferta aceita
- `payment:confirmed` - Pagamento confirmado
- `ride:cancelled` - Corrida cancelada
- `chat:message` - Mensagem do chat

---

## 10. MÁQUINA DE ESTADOS DA CORRIDA

### Estados do Ride

```
scheduled → requesting → [busca motoristas]
                            ↓
                    ┌─ driver_assigned → accepted → in_progress → completed
                    │       ↑
                    │  payment_pending
                    │       ↑
                    │  (negociação concluída)
                    │
                    ├─ cancelled_no_driver (timeout)
                    ├─ cancelled_by_client
                    └─ cancelled_by_driver
```

### Estados do Pagamento

```
not_selected → pre_selected → pending → processing → authorized → completed
                                                              → failed → refunded
```

### Estados da Negociação

```
Oferta: accepted | countered | rejected | client_countered
```

### Transições Principais

| De | Para | Gatilho |
|----|------|---------|
| `scheduled` | `requesting` | Cliente publica ou atinge horário agendado |
| `requesting` | `driver_assigned` | Motorista aceito (ride) ou pagamento confirmado (delivery) |
| `requesting` | `cancelled_no_driver` | Timeout sem motorista |
| `payment_pending` | `driver_assigned` | Cliente confirma pagamento |
| `driver_assigned` | `accepted` | Motorista inicia deslocamento |
| `accepted` | `in_progress` | Motorista inicia corrida |
| `in_progress` | `completed` | Motorista finaliza |
| `requesting` / `driver_assigned` / `accepted` | `cancelled_*` | Cancelamento por qualquer parte |

### Fases de Cancelamento

- **beforePickup:** scheduled, requesting, driver_assigned, accepted
- **afterPickup:** in_progress
- **duringDelivery:** in_progress (entregas)

---

## 11. WEB ADMIN (leva-mais-web)

### Painel Administrativo (Next.js 14)

O web admin permite gerenciar toda a plataforma:

| Seção | Descrição |
|--------|-----------|
| **Dashboard** | Visão geral: total de corridas, motoristas ativos, receita |
| **Settings > General** | Configurações globais (taxas, raios, timeout, cancelamento, metas, suporte) |
| **Settings > Pricing** | Regras de precificação por cidade/região |
| **Settings > Representatives** | Gestão de representantes e splits |
| **Auth** | Login com chave admin (`x-admin-key`) |

### Tela de Configurações Gerais

Acessível em `app/settings/general/page.tsx`:

**Abas:**
- **Financeiro & Split:** Taxa do app (%), participação do representante (%)
- **Pesquisa & Fila:** Raio de busca (m), tempo de timeout (min), intervalo de fila (s)
- **Metas dos Motoristas:** Meta diária de corridas, bônus
- **Canais de Suporte:** Telefone, email, WhatsApp, URL help center
- **Políticas Legais:** Versões dos Termos de Uso, Política de Privacidade, Consentimento
- **Modo de Operação:** Toggle Modo Desenvolvimento (desabilita validações externas)

Alterações são salvas via API e disparam evento `platform-config-updated` para atualizar o app.

---

## APÊNDICE: Lista Completa de Telas

### Cliente (35 telas na stack + 1 drawer)

1. Home (Início)
2. History (Histórico)
3. Wallet (Carteira)
4. Profile (Perfil)
5. Help (Ajuda)
6. Settings (Configurações)
7. EditAccount (Editar Conta)
8. LocationPicker (Buscar Endereço)
9. DestinationSearch (Buscar Destino)
10. Favorites (Favoritos)
11. AddFavorite (Adicionar Favorito)
12. SelectVehicle (Selecionar Veículo)
13. ServicePurpose (Finalidade)
14. RideSetup (Configurar Corrida)
15. DeliverySetup (Configurar Entrega)
16. DeliveryReview (Revisar Entrega)
17. DeliveryPaymentConfirm (Confirmar Pagamento)
18. OrderSummary (Resumo do Pedido)
19. Payment (Pagamento)
20. SearchingDriver (Buscando Motorista)
21. OrderSent (Pedido Enviado)
22. ActiveOrders (Pedidos Ativos)
23. ShiftOffersClient (Plantões)
24. RideOffersMarketplace (Ofertas Recebidas)
25. RideTracking (Acompanhar Corrida)
26. Chat (Conversa)
27. CancelRide (Cancelar)
28. CancelFee (Taxa Cancelamento)
29. RideCompleted (Corrida Finalizada)
30. RateDriver (Avaliar Motorista)
31. TipDriver (Gorjeta)
32. OrderDetails (Detalhes do Pedido)
33. ClientCity (Cidade)
34. ConfirmPickup (Confirmar Embarque)
35. AddPaymentMethod (Adicionar Cartão)
36. SafetyCenter (Central Segurança)
37. NotificationsCenter (Notificações)
38. PaymentsCenter (Pagamentos)
39. Coupons (Cupons)
40. Receipts (Comprovantes)
41. PrivacyData (Privacidade)
42. InviteFriends (Convidar Amigos)
43. SupportCenter (Suporte)

### Motorista (25 telas)

1. DriverHome (Mapa/Início)
2. DriverRequests (Solicitações)
3. DriverRide (Corrida Ativa)
4. DriverRateClient (Avaliar Cliente)
5. DriverCancelRide (Cancelar)
6. DriverEarnings (Ganhos)
7. DriverHistory (Histórico)
8. DriverProfile (Perfil)
9. DriverVehicle (Veículo)
10. DriverSettings (Configurações)
11. DriverWithdraw (Saque)
12. DriverStatement (Extrato)
13. DriverRideDetails (Detalhes Corrida)
14. DriverHelp (Ajuda)
15. DriverChat (Chat)
16. DriverSafety (Segurança)
17. DriverPayouts (Pagamentos)
18. DriverIncentives (Metas/Bônus)
19. DriverWorkPreferences (Preferências)
20. DriverDocuments (Documentos)
21. DriverRatings (Avaliações)
22. DriverSupportCenter (Suporte)
23. DriverShiftOffers (Plantões)
24. DeliveryOfferScreen (Ofertas Entrega)
25. DriverNegotiation (Negociação)
26. DeliveryOfferDetailScreen (Detalhe Oferta)

### Telas Públicas (11 telas)

1. IntroScreen
2. SignInScreen
3. SignUpScreen
4. SelectProfileScreen
5. ForgotPasswordScreen
6. VerifyCodeScreen
7. NewPasswordScreen
8. PhoneVerificationScreen
9. GooglePhonePromptScreen
10. TermsScreen
11. NotificationPermissionScreen

---

**Total: ~80 telas** entre app mobile (cliente + motorista) e web admin.

---

*Documento gerado com base na análise do código-fonte em 2026-05-20.*
