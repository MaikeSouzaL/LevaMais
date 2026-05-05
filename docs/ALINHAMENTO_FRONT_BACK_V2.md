# Alinhamento Front + Back V2 - Leva_Mais

## Visao geral
O backend atual ja cobre a maior parte do MVP operacional e esta em nivel melhor que o projeto anterior. O foco agora e fechar lacunas de consistencia entre estados de tela, eventos realtime e contratos de resposta.

## Rotas backend disponiveis (nucleo)
- Auth: `/api/auth/*` (register, login, google, me, perfil, senha)
- Rides: `/api/rides/*` (create, accept/reject, cancel, status, active, history, stats)
- Pricing: `/api/pricing/*` (calculate, categorias, config)
- Driver location/status: `/api/driver-location/*`
- Favorites: `/api/favorites` e `/api/favorite-addresses`
- Wallet: `/api/wallet/*`
- Purposes/Cities/Platform config: modulos administrativos e de apoio

## Pontos de atencao para estabilizacao
1. Garantir formato consistente de respostas (success/data/error) entre modulos.
2. Revisar semantica de status HTTP (401 vs 403) para evitar logout indevido.
3. Padronizar nomes de campos de usuario entre front e back (`name` vs `nome`, etc).
4. Garantir que fluxo de corrida use uma unica fonte de verdade para status.
5. Consolidar listeners socket para nao duplicar eventos ao navegar entre telas.

## Contratos criticos para smoke test
1. `POST /api/auth/login`
2. `POST /api/rides`
3. `POST /api/rides/:rideId/accept`
4. `PATCH /api/rides/:rideId/status`
5. `GET /api/rides/active`
6. `POST /api/rides/:rideId/cancel`
7. `POST /api/pricing/calculate`
8. `PATCH /api/driver-location/status`

## Meta da proxima etapa tecnica
- Criar bateria de validacao do fluxo ponta a ponta cliente/motorista com base nesses contratos.
- Ajustar stores e services para refletirem os mesmos nomes e estados do backend.
