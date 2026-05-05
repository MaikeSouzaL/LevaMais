# App Screen Inventory V1

## Publico (nao autenticado)
- `IntroScreen`
- `SignInScreen`
- `SignUpScreen`
- `PhoneVerificationScreen`
- `SelectProfileScreen`
- `ClientCompleteRegistrationScreen`
- `DriverCompleteRegistrationScreen`
- `Step1Data`
- `Step2Address`
- `Step3Preferences`
- `Step2Vehicle`
- `Step3DriverLocation`
- `ForgotPasswordScreen`
- `VerifyCodeScreen`
- `NewPasswordScreen`
- `TermsScreen`
- `NotificationPermissionScreen`
- `LocationPermissionScreen`
- `OfflineErrorScreen`

## Cliente (autenticado)
- `Client Home`
- `ClientCityScreen`
- `AddressPicker`
- `ConfirmPickup`
- `SelectVehicle`
- `ServicePurpose`
- `OrderSummary`
- `Payment`
- `SearchingDriver`
- `RideTracking`
- `Chat`
- `CancelRide`
- `CancelFee`
- `RideCompleted`
- `RateDriver`
- `TipDriver`
- `ActiveOrders`
- `HistoryList`
- `OrderDetails`
- `FavoritesList`
- `AddFavorite`
- `NotificationsCenter`
- `SafetyCenter`
- `ProfileView`
- `Settings`
- `Help`
- `Wallet`
- `AddPaymentMethod`

## Motorista (autenticado)
- `DriverHomeScreen`
- `DriverRequestsScreen`
- `DriverRideScreen`
- `DriverChatScreen`
- `DriverCancelRideScreen`
- `DriverRateClientScreen`
- `DriverEarningsScreen`
- `DriverWithdrawScreen`
- `DriverStatementScreen`
- `DriverRideDetailsScreen`
- `DriverHistoryScreen`
- `DriverProfileScreen`
- `DriverVehicleScreen`
- `DriverSafetyScreen`
- `DriverHelpScreen`
- `DriverSettingsScreen`

## Componentes compartilhados relevantes
- `Client Shared Components` (headers, cards, bottom sheets, empty states)
- `Driver Components` (HUD, status, request cards, map controls)
- `GlobalMap`
- `MapMarker`
- `chat components`

## Status de revisao
- [x] Inventario inicial completo
- [ ] Revisao detalhada de cada tela com criterio: manter / refatorar / remover
- [ ] Revisao de fluxo de navegacao ponta a ponta (sem tela orfa)
- [ ] Revisao de consistencia visual completa (app cliente x motorista)
