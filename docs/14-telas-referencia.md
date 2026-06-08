# 14 — Telas: Referência Completa

## Telas Públicas (sem autenticação)

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `IntroScreen` | `(public)/IntroScreen/` | Onboarding inicial com carrossel |
| `SelectProfileScreen` | `(public)/SelectProfileScreen/` | Escolha: cliente ou motorista |
| `SignInScreen` | `(public)/SignInScreen/` | Login e-mail/senha + Google |
| `SignUpScreen` | `(public)/SignUpScreen/` | Cadastro de novo usuário |
| `ForgotPasswordScreen` | `(public)/ForgotPasswordScreen/` | Recuperação de senha |
| `PhoneVerificationScreen` | `(public)/PhoneVerificationScreen/` | Verificação de telefone (SMS/WhatsApp) |
| `NewPasswordScreen` | `(public)/NewPasswordScreen/` | Redefinir senha |
| `LocationPermissionScreen` | `(public)/LocationPermissionScreen/` | Solicita permissão de GPS |
| `NotificationPermissionScreen` | `(public)/NotificationPermissionScreen/` | Solicita permissão de notificações |
| `GooglePhonePromptScreen` | `(public)/GooglePhonePromptScreen/` | Solicita telefone no login Google |
| `PhoneLocationSetupScreen` | `(public)/PhoneLocationSetupScreen/` | Setup combinado telefone+localização |

---

## Telas do Cliente — Navegação

A navegação do cliente usa um **Drawer** (menu lateral) que contém um **Stack** de telas.

### Drawer (menu lateral)
- Perfil resumido (foto, nome, rating)
- Home
- Histórico
- Carteira (LevaPay)
- Cupons
- Segurança
- Convide amigos
- Configurações
- Ajuda e Suporte
- Sair

---

## Telas do Cliente — Stack

### Home e Mapa

| Tela (nome no Stack) | Arquivo | Descrição |
|---------------------|---------|-----------|
| `Home` | `Client/Home/` | Tela principal com mapa, botões de serviço e pedido ativo |
| `ClientCity` | `Client/ClientCityScreen.tsx` | Selecionar cidade de atendimento |
| `NotificationsCenter` | `Client/Notifications/NotificationsCenter.tsx` | Central de notificações |
| `ActiveOrders` | `Client/Orders/ActiveOrders` | Pedidos ativos em curso |
| `ShiftOffersClient` | `Client/Orders/ShiftOffersClientScreen.tsx` | Ofertas de plantão/turno |

### Fluxo de Corrida

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `DestinationSearch` | `Ride/Request/DestinationSearch/` | Busca de destino com autocomplete |
| `ConfirmPickup` | `Ride/Request/ConfirmPickup/` | Confirmar endereço de pickup no mapa |
| `RideCategorySelect` | `Ride/Request/RideCategorySelect/` | Selecionar categoria de carro/moto |
| `RideSetup` | `Ride/Request/RideSetup/` | Confirmação final + pagamento + cupom |
| `ServicePurpose` | `Ride/Request/ServicePurpose/` | Finalidade da viagem (trabalho, lazer…) |
| `RideBidSetup` | `Ride/Request/RideBidSetupScreen/` | Configurar lance para corrida InDriver |
| `RideBiddingScreen` | `Ride/Request/RideBiddingScreen/` | Ajustar valor do lance com slider |
| `SearchingDriver` | (modal na HomeScreen) | Aguardando motorista aceitar |
| `RideTracking` | `Ride/Tracking/RideTracking/` | Rastreamento da corrida em tempo real |

### Fluxo de Entrega

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `DeliverySetup` | `Ride/Request/DeliverySetup/` | Escolher veículo + endereços básicos |
| `DeliverySenderInfo` | `Ride/Request/DeliverySenderInfo/` | Dados do remetente e destinatário |
| `DeliveryMapPicker` | `Ride/Request/DeliveryMapPicker/` | Escolher endereço no mapa |
| `EditDeliveryAddress` | `Ride/Request/EditDeliveryAddress/` | Editar endereço de entrega salvo |
| `DeliveryDetails` | `Ride/Request/DeliveryDetails/` | Detalhes do pacote (tamanho, peso, etc.) |
| `DeliveryReview` | `Ride/Request/DeliveryReview/` | Resumo completo + confirmar pedido |
| `OrderSent` | `Ride/OrderSentScreen/` | Pedido enviado — aguardando ofertas |
| `RideOffersMarketplace` | `Client/Orders/RideOffersMarketplaceScreen` | Marketplace de ofertas dos motoristas |
| `DeliveryTracking` | `Ride/Tracking/DeliveryTracking/` | Rastreamento da entrega em tempo real |

### Pós-corrida

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `RideCompleted` | `Ride/Completion/RideCompleted/` | Conclusão: resumo + avaliação |
| `ClientRateDriver` | `Ride/Completion/RateDriver/` | Avaliar motorista (1–5 estrelas) |
| `TipDriver` | `Ride/Completion/TipDriver/` | Dar gorjeta ao motorista |
| `ClientCancelRide` | `Ride/Cancellation/CancelRide/` | Confirmar cancelamento |
| `CancelFee` | `Ride/Cancellation/CancelFee/` | Exibir e aceitar taxa de cancelamento |
| `Chat` | `Ride/Tracking/Chat/` | Chat com motorista durante a corrida |

### Histórico e Endereços

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `History` | `Client/History/HistoryList/` | Histórico de corridas e entregas |
| `OrderDetails` | `Client/History/OrderDetails/` | Detalhes de um pedido específico |
| `RouteAudit` | `Client/History/RouteAudit/` | Ver rota GPS real percorrida |
| `Favorites` | `Client/Favorites/FavoritesList/` | Endereços favoritos |
| `FavoriteAddressFlow` | `Client/Favorites/FavoriteAddressFlow/` | Adicionar/editar endereço favorito |
| `LocationPicker` | `Ride/Request/AddressPicker/` | Picker de endereço (busca + mapa) |

### Perfil e Financeiro

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `Profile` | `Client/Profile/ProfileView/` | Ver e editar perfil |
| `EditAccount` | `Client/Profile/EditAccountScreen.tsx` | Editar dados da conta |
| `Wallet` | `Client/Profile/Wallet/` | Carteira LevaPay (saldo + histórico) |
| `Deposit` | `Client/Wallet/DepositScreen` | Recarregar LevaPay |
| `PaymentsCenter` | `Client/Profile/PaymentsCenter.tsx` | Central de pagamentos (cartões, PIX) |
| `AddPaymentMethod` | `Client/Profile/AddPaymentMethod/` | Cadastrar cartão de crédito/débito |
| `Coupons` | `Client/Profile/CouponsScreen.tsx` | Cupons de desconto disponíveis |
| `Receipts` | `Client/Profile/ReceiptsScreen.tsx` | Comprovantes de pagamento |

### Configurações e Suporte

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `Settings` | `Client/Profile/Settings/` | Configurações do app |
| `Help` | `Client/Profile/Help/` | Ajuda e FAQ |
| `SupportCenter` | `Client/Profile/SupportCenterScreen.tsx` | Falar com suporte |
| `SafetyCenter` | `Client/Safety/SafetyCenter.tsx` | Centro de segurança + SOS |
| `PrivacyData` | `Client/Profile/PrivacyDataScreen.tsx` | Privacidade e dados pessoais |
| `InviteFriends` | `Client/Profile/InviteFriendsScreen.tsx` | Indicar amigos |

---

## Telas do Motorista

### Principal

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `DriverScreen` | `Driver/components/DriverScreen.tsx` | Tela principal: mapa + HUD + status |

### Pedidos e Execução

| Tela/Componente | Arquivo | Descrição |
|----------------|---------|-----------|
| `DriverRequestCard` | `Driver/components/DriverRequestCard.tsx` | Card de nova solicitação recebida |
| `DriverShiftOffersScreen` | `Driver/DriverShiftOffersScreen.tsx` | Lista de pedidos disponíveis para negociação |
| `RideCompletedDriverScreen` | `Driver/RideCompletedDriverScreen.tsx` | Tela de conclusão (ganhos da corrida) |
| `DriverRateClientScreen` | `Driver/DriverRateClientScreen.tsx` | Avaliar cliente |
| `DriverChatScreen` | `Driver/DriverChatScreen.tsx` | Chat com cliente |

### Financeiro

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `DriverEarningsScreen` | `Driver/DriverEarningsScreen.tsx` | Ganhos + gráficos |
| `DriverStatementScreen` | `Driver/DriverStatementScreen.tsx` | Extrato de transações |
| `DriverWithdrawScreen` | `Driver/DriverWithdrawScreen.tsx` | Solicitar saque |
| `DriverPayoutsScreen` | `Driver/DriverPayoutsScreen.tsx` | Histórico de saques |
| `DriverIncentivesScreen` | `Driver/DriverIncentivesScreen.tsx` | Incentivos e metas |

### Perfil e Documentos

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| `DriverDocumentsScreen` | `Driver/DriverDocumentsScreen.tsx` | Documentos enviados e status |
| `DriverVehicleScreen` | `Driver/DriverVehicleScreen.tsx` | Gerenciar frota de veículos |
| `DriverWorkPreferencesScreen` | `Driver/DriverWorkPreferencesScreen.tsx` | Preferências de trabalho |
| `DriverSettingsScreen` | `Driver/DriverSettingsScreen.tsx` | Configurações |
| `DriverRatingsScreen` | `Driver/DriverRatingsScreen.tsx` | Histórico de avaliações recebidas |
| `DriverHistoryScreen` | `Driver/DriverHistoryScreen.tsx` | Histórico de corridas |
| `DriverHistoryRideDetailsScreen` | `Driver/DriverHistoryRideDetailsScreen.tsx` | Detalhe de corrida no histórico |
| `DriverSafetyScreen` | `Driver/DriverSafetyScreen.tsx` | Centro de segurança |
| `DriverSupportCenterScreen` | `Driver/DriverSupportCenterScreen.tsx` | Suporte |
| `DriverHelpScreen` | `Driver/DriverHelpScreen.tsx` | Ajuda e FAQ |

---

## Parâmetros de Navegação Importantes

### `DeliveryReview`
```ts
{
  pickup: { address, latitude, longitude },
  dropoff: { address, latitude, longitude },
  vehicleType: string,
  cargoSize?: "small" | "medium" | "large",
  needsHelper?: boolean,
  priority?: number,
  cargoDescription?: string,
  recipientName?: string,
  recipientPhone?: string,
  recipientInstructions?: string,
  deliveryPin?: string,
  offerValue?: number,
  paymentMethod?: string,
  pricingSnapshot?: any
}
```

### `RideTracking` / `DeliveryTracking`
```ts
{ rideId: string }
```

### `RideCompleted`
```ts
{
  rideId: string,
  total?: number,
  pickupAddress?: string,
  dropoffAddress?: string,
  driverName?: string,
  driverId?: string,
  serviceType?: string
}
```

### `RideOffersMarketplace`
```ts
{ rideId: string, autoOpenIncrease?: boolean }
```

### `CancelFee`
```ts
{ rideId: string, fee: number, total?: number, serviceType?: string }
```
