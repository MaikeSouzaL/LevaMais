# 04 - Routes e Roteamento

Arquivo: `src/routes/index.tsx`

## Ordem de decisao
1. `!hasHydrated` -> loader
2. `!isAuthenticated` -> `AuthRoutes`
3. `resolvingProfile` -> loader
4. `!userData?.aceitouTermos` -> `TermsScreen`
5. `userType === "driver"` -> `DriverBoot`
6. `userType === "client"` -> `ClientBoot`
7. fallback -> loader

## Resolve profile automatico
`resolveProfileIfNeeded()` chama `getProfile(token)` quando:
- falta `userType`
- falta `userData.id`
- ou motorista ainda nao aprovado (forca refresh de status)

Se falhar profile/token invalido -> `logout()`.

## Legal gate
Enquanto `aceitouTermos` for falso, o app mostra `TermsScreen`.
Ao aceitar:
- chama `userService.updateProfile({ acceptedTerms: true })`
- atualiza store local.

## Push notifications
Com sessao valida (`isAuthenticated && token && userData.id`), inicializa `notificationService.initialize()`.
