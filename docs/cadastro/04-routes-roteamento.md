# Etapa 4 — Routes: Decisão de Roteamento

## O que acontece

O componente `Routes` observa `isAuthenticated` no authStore. Quando muda para `true`, re-renderiza e decide qual tela mostrar.

## Arquivo

`src/routes/index.tsx`

## Árvore de Decisão

```
hasHydrated === false?
  → Loading spinner (AsyncStorage ainda não carregou)

isAuthenticated === false?
  → <AuthRoutes /> (telas públicas: SignIn, SignUp)

userType ou userData.id estão vazios?
  → resolveProfileIfNeeded()
  → GET /auth/profile → atualiza authStore com dados frescos
  → Se falhar → logout() → volta pra AuthRoutes

!userData?.aceitouTermos?
  → <TermsScreen /> (aceite de termos de uso)

userType === "client"?
  → <ClientBoot />

userType === "driver"?
  → <DriverBoot />

userType === "admin"?
  → <AdminNavigator />
```

## resolveProfileIfNeeded()

```typescript
// Linhas 42-98
useEffect(() => {
  if (!token || !logout) return
  if (!userType || !userData?.id) {
    getProfile(token)
      .then(res => {
        if (res?.success && res.data?.user) {
          updateUserData(res.data.user)
        } else {
          logout()
        }
      })
      .catch(() => logout())
  }
}, [token, logout])
```

## Quando o perfil é resolvido

O `getProfile()` é chamado quando:
- O Zustand persist restaurou o estado mas está faltando `userType` ou `id`
- O app foi reaberto e os dados estavam incompletos
- O motorista tem `driverStatus !== "approved"` e quer verificar se foi aprovado

## Payload do GET /auth/profile

Resposta:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "664d...",
      "name": "João Silva",
      "email": "joao@gmail.com",
      "phone": "11999999999",
      "city": "São Paulo",
      "userType": "client",
      "acceptedTerms": false,
      "driverStatus": "none",
      "profilePhoto": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

## Notificações

Após resolver o perfil, inicializa push notifications:
```typescript
notificationService.initialize()
```
