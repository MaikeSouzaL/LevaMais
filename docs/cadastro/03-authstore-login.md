# Etapa 3 — authStore.login(): Persistência dos Dados

## O que acontece

Após `registerUser()` ou `googleAuth()` retornar sucesso, o frontend chama `authStore.login()`.

## Código

Arquivo: `src/context/authStore.ts` (linha 90-96)

```typescript
login: (userType, userData, token) =>
  set({
    isAuthenticated: true,
    userType: userType ?? null,
    userData: normalizeUserData(userData),
    token: token ?? null,
  }),
```

## Payload recebido pelo login()

### Via Google:
```json
{
  "userType": "client",
  "userData": {
    "id": "664d...",
    "name": "João Silva",
    "email": "joao@gmail.com",
    "telefone": "11999999999",
    "cidade": "São Paulo",
    "fotoPerfil": "https://lh3...",
    "googleId": "123...",
    "aceitouTermos": false,
    "driverStatus": "none"
  },
  "token": "eyJhbGciOiJI..."
}
```

### Via Cadastro Manual:
```json
{
  "userType": "client",
  "userData": {
    "id": "664d...",
    "name": "João Silva",
    "email": "joao@gmail.com",
    "telefone": "11999999999",
    "cidade": "São Paulo",
    "fotoPerfil": null,
    "googleId": null,
    "aceitouTermos": false,
    "driverStatus": "none"
  },
  "token": "eyJhbGciOiJI..."
}
```

## O que o normalizeUserData faz

```typescript
normalizeUserData(data) = {
  id: data.id ?? data._id,
  name: data.name ?? data.nome,
  nome: data.nome ?? data.name,
  email: data.email?.toLowerCase(),
  telefone: data.telefone ?? data.phone,
  cidade: data.cidade ?? data.city,
  fotoPerfil: data.fotoPerfil ?? data.profilePhoto,
  googleId: data.googleId,
  aceitouTermos: data.aceitouTermos ?? data.acceptedTerms,
  driverStatus: data.driverStatus,
  // ... outros campos
}
```

## Persistência

Zustand com middleware `persist` salva automaticamente no AsyncStorage (key `"auth-storage"`):

```
AsyncStorage.setItem("auth-storage", JSON.stringify({
  state: {
    isAuthenticated: true,
    userType: "client",
    userData: { ... },
    token: "eyJ..."
  },
  version: 0
}))
```

## Efeito Imediato

`isAuthenticated = true` dispara re-render do componente `Routes` (`src/routes/index.tsx`), que decide para onde navegar.
