# Backend Endpoint Inventory V1

## Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `POST /google`
- `POST /check-email`
- `POST /send-phone-code`
- `POST /verify-phone-code`
- `POST /forgot-password`
- `POST /verify-reset-code`
- `POST /reset-password`
- `GET /profile` (auth)
- `PATCH /profile` (auth)
- `POST /push-token` (auth)
- `DELETE /push-token` (auth)
- `GET /users` (admin)
- `GET /users/:id` (admin)
- `PATCH /users/:id` (admin)
- `DELETE /users/:id` (admin)

## Rides (`/api/rides`) [auth]
- `POST /calculate-price`
- `POST /`
- `POST /:rideId/accept`
- `POST /:rideId/reject`
- `POST /:rideId/cancel`
- `PATCH /:rideId/status`
- `POST /:rideId/rate-client`
- `POST /:rideId/rate-driver`
- `POST /:rideId/proof/pickup`
- `POST /:rideId/proof/delivery`
- `GET /active`
- `GET /active/list`
- `GET /available-requests`
- `GET /stats`
- `GET /earnings-history`
- `GET /nearby-drivers`
- `GET /:rideId`
- `GET /`

## Outros modulos (existentes)
- `cities`
- `pricing`
- `wallet`
- `chat`
- `driver-location`
- `favorites`
- `favorite-addresses`
- `purposes`
- `representatives`
- `platform-config`

## Status de revisao backend
- [x] Inventario inicial de endpoints
- [x] Correcao de lacuna critica no auth (telefone)
- [ ] Revisao de contrato padrao de resposta e erro por modulo
- [ ] Revisao de regras de autorizacao por endpoint
- [ ] Revisao de idempotencia e consistencia nos fluxos criticos
