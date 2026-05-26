# 05A - Cliente Boot (pos-login)

Arquivo: `src/routes/ClientBoot.tsx`

## Fluxo
1. Verifica permissao de localizacao.
2. Se negada -> `LocationPermissionScreen`.
3. Se concedida -> `runBootstrap()`:
- tenta GPS + reverse geocode
- salva cidade no `clientCityStore`
- busca perfil atualizado (`userService.getProfile`)
- busca corrida ativa (`rideService.getActive`)

4. Se existir corrida com motorista e status ativo (`accepted|driver_arriving|arrived|in_progress`), define `initialRideId`.
5. Verifica compliance do cliente:
- precisa de `cpf` ou `cnpj`
- selfie em `clientVerification.documents.selfie`
- `clientVerification.status === approved`

6. Se nao compliant -> `ClientOnboardingDashboard`.
7. Se compliant -> `DrawerClienteRoutes`.

## Observacao
No fluxo atual, onboarding de cliente e obrigatorio para liberar uso completo da conta cliente.
