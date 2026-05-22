# 05B - Motorista Aprovado Boot

Arquivo: `src/routes/DriverBoot.tsx`

## Fluxo
1. Lê `driverStatus` do `authStore`.
2. Se `driverStatus !== approved`:
- nao busca corrida ativa
- entra direto no drawer (que limita menus para nao aprovados)

3. Se `driverStatus === approved`:
- busca corrida ativa via `rideService.getActive()`
- se existir, define `initialRideId`
- abre `DrawerDriverRoutes` com rota inicial adequada.

## Drawer do motorista
Arquivo: `src/routes/drawer.driver.routes.tsx`

- Motorista aprovado: menu completo.
- Motorista nao aprovado: menu filtrado (`Home`, `Vehicle`, `Documents`, `Profile`, `SupportCenter`).
- Se `initialRideId` existir, rota inicial vira `DriverRide`.
