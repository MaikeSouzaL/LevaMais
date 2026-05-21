# Etapa 5C — Motorista NÃO Aprovado: Onboarding Dashboard

## O que acontece

Quando `userType === "driver"` E `driverStatus !== "approved"`.

## Arquivo

`src/components/driver/home/DriverOnboardingDashboard.tsx`

## 5 Etapas para Aprovação

### Step 1 — Cadastro Básico
- **Status**: Sempre ✅ (conta já existe)
- Nada a fazer

### Step 2 — Dados Cadastrais
- **Status**: Pendente até preencher CPF ou CNPJ
- **Ação**: Modal com abas PF (CPF) / PJ (CNPJ)
- **Campos PF**: CPF, nome, telefone, cidade
- **Campos PJ**: CNPJ, razão social, nome fantasia, email, telefone
- **Salva via**: `userService.updateProfile({ cpf, cnpj, name, phone, city, ... })`
- **Payload enviado**:
```json
{
  "cpf": "12345678909",
  "name": "João Silva",
  "phone": "11999999999",
  "city": "São Paulo"
}
```

### Step 3 — Documentação Pessoal
- **Status**: Pendente até enviar CNH + selfie
- **Ação**: Upload de 3 arquivos (CNH frente, CNH verso, selfie)
- **Salva via**: `authService.submitDriverVerification(formData)`
- **Endpoint**: `POST /auth/driver-verification` (multipart/form-data)
- **Payload**: FormData com:
  - `cnhFront` (imagem)
  - `cnhBack` (imagem)
  - `selfie` (imagem)
- **Salvo no MongoDB**:
```json
{
  "driverDocuments": {
    "cnhFront": "/uploads/...",
    "cnhBack": "/uploads/...",
    "selfie": "/uploads/...",
    "submittedAt": "2026-05-20T...",
    "cnhFrontStatus": "pending",
    "cnhBackStatus": "pending",
    "selfieStatus": "pending"
  },
  "driverStatus": "pending"
}
```

### Step 4 — Veículo
- **Status**: Pendente até cadastrar veículo + CRLV
- **Ação**: Tela de cadastro de veículo (tipo, placa, modelo, cor, ano)
- **Salva via**: `driverService` → adiciona ao array `vehicles`
- **Salvo no MongoDB**:
```json
{
  "vehicles": [{
    "type": "motorcycle",
    "plate": "ABC1234",
    "model": "Honda CG 160",
    "color": "Preta",
    "year": 2023,
    "status": "pending",
    "documents": {
      "crlvFront": "/uploads/...",
      "crlvBack": "/uploads/...",
      "vehiclePhoto": "/uploads/...",
      "submittedAt": "2026-05-20T..."
    }
  }]
}
```

### Step 5 — Saldo
- **Status**: Bloqueado até Steps 3 e 4 aprovados
- **Ação**: Adicionar saldo na carteira
- **Libera**: `POST /drivers/go-online` funcional

## 3 Visões do Dashboard

### Progress View (padrão)
- Barra de progresso (% concluído)
- Cards de cada etapa com ícone (pendente/concluído/bloqueado)
- Clique no card abre ação correspondente

### Analysis View
- Aparece quando: docs pessoais + veículo estão enviados E não rejeitados
- Mostra "Cadastro em Análise" com relógio animado
- Badges de status por etapa
- Botão de refresh (puxa perfil atualizado)

### Congratulations View
- Aparece quando: `driverStatus === "approved"` E `vehicleStatus === "approved"` E tem CPF/CNPJ
- Animação de celebração
- Guia rápido de início
- Botão "Começar a Faturar!" → `updateUserData({ driverStatus: "approved" })`

## API usada para verificar status

```typescript
async function loadOnboardingStatus() {
  const profile = await userService.getProfile()
  const vehicles = await driverService.listVehicles()
  const balance = await driverService.getBalance()

  // Calcula progresso
  const hasCadastral = !!(profile.cpf || profile.cnpj)
  const hasDocs = !!(profile.driverDocuments?.cnhFront)
  const hasVehicle = vehicles?.vehicles?.length > 0
  const hasBalance = balance?.balance > 0

  // Detecta estados
  isProfileUnderAnalysis = hasDocs && hasVehicle && !isRejected
  showCongrats = driverStatus === "approved" && vehicleApproved && hasCadastral
}
```
