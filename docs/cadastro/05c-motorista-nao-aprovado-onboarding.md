# 05C - Motorista nao aprovado (Onboarding)

Arquivo: `src/components/driver/home/DriverOnboardingDashboard.tsx`

## Fonte de dados
`loadOnboardingStatus()` busca:
- `userService.getProfile()`
- `driverService.listVehicles()`
- `driverService.getBalance()`

## Blocos avaliados
1. Cadastro basico (sempre concluido)
2. Dados cadastrais (CPF/CNPJ + cidade/telefone)
3. Documentos pessoais (`driverDocuments`: CNH frente/verso + selfie)
4. Veiculo (`vehicles[]` com status)
5. Saldo (`driverBalance.balance > 0`)

## Regras de status
- `driverStatus`: `none|pending|approved|rejected`
- `vehicleStatus`: derivado da frota
- progresso: percentual por etapas concluidas
- libera "parabens" quando:
  - `driverStatus=approved`
  - `vehicleStatus=approved`
  - possui CPF ou CNPJ

## Acoes de onboarding
- Atualizar dados cadastrais: `userService.updateProfile(...)`
- Cadastrar/gerenciar veiculo: telas de veiculo
- Enviar documentos: fluxo de verificacao
- Adicionar saldo: fluxo financeiro
