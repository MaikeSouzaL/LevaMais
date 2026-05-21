# Etapa 5A — Cliente: ClientBoot → HomeScreen

## O que acontece

Quando `userType === "client"`, o Routes renderiza `<ClientBoot />`.

## Arquivo

`src/routes/ClientBoot.tsx`

## Passo a passo

```
1. Verifica AsyncStorage("client_onboarding_done")
   → Se "1" → skip onboarding

2. Verifica permissão de localização
   → Se negada → <LocationPermissionScreen />
   → Se concedida → runBootstrap()

3. runBootstrap(hasPermission, mounted):
   a) GPS + reverse geocode → detecta cidade
   b) resolveCityIdByNameAndState() → salva no clientCityStore
   c) rideService.getActive() → corrida ativa? → inicialRideId

4. Se primeira vez (não "activated"):
   → <ClientOnboardingDashboard /> (tour de boas vindas)

5. Se já ativado:
   → <DrawerClienteRoutes initialRideId={...} />
```

## DrawerClienteRoutes

Arquivo: `src/routes/drawer.cliente.routes.tsx`

- Drawer Navigator com 16 itens de menu
- Internamente usa `ClientStackRoutes` (NativeStackNavigator, ~40 telas)
- Se `initialRideId` existe → inicia em "RideTracking"
- Se não → inicia em "Home"

## HomeScreen — Inicialização

Arquivo: `src/screens/(authenticated)/Client/Home/index.tsx`

### O que acontece ao abrir:

```
1. WebSocket.connect()
2. Polling a cada 6s: rideService.getActiveList()
3. WebSocket listeners:
   - "ride-status-updated" → re-verifica rides
   - "ride-offers-updated" → verifica ofertas
   - "driver-accepted-offer" → navega para pagamento
   - "ride-cancelled" → mostra modal de cancelamento
   - "ride-payment-expired" → mostra modal de expirado
4. Carrega endereços favoritos
5. Carrega disponibilidade de motoristas próximos
```

### Banner "Aguardando Propostas"

Se `activeRides` contém uma ride com status `"requesting"`:
```tsx
activeRequestingRideId → banner amarelo "Aguardando Propostas"
```

### Redirecionamento Automático

Se `activeRides` contém uma ride com driver atribuído e status ativo:
```typescript
if (ride.driverId && ["accepted", "driver_arriving", "arrived", "in_progress"].includes(ride.status)) {
  navigation.reset({ routes: [{ name: "RideTracking", params: { rideId: ride._id } }] })
}
```

### Redirecionamento para Marketplace

Se houver ofertas de motoristas:
```typescript
if (ride.negotiation.offers.some(o => o.status !== "rejected")) {
  setNegotiationRideId(ride._id)
  // Botão no bottom sheet leva para RideOffersMarketplace
}
```
