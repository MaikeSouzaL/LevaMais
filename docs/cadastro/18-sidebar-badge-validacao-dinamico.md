# 18 - Sidebar: Badge Dinâmico de Validação de Contas

## Objetivo
- Substituir o número fixo no menu `Validação de Contas` por contagem real de contas pendentes de aprovação.

## Regra de contagem
- O badge agora soma a fila de análise pendente (novos + pendentes), para sinalizar trabalho do time de validação:

### Motorista pendente
- conta quando `driverStatus` está em `pending` ou `none`

### Cliente pendente
- conta quando cliente não está aprovado/ativo e está em fase de análise:
  - `clientVerification.status` em `none` / `pending` / `manual_review`
  - ou campos `cpfStatus`/`selfieStatus` em estados pendentes (`unchecked`, `pending`, `manual_review`, `none`)

## Implementação
- Arquivo:
  - `leva-mais-web/components/layout/Sidebar.tsx`
- Passos:
  - remove badge fixo do `MENU_ITEMS`
  - busca usuários via `verificationAdminService.listUsers(...)`
  - calcula total pendente e injeta badge dinamicamente no item de menu
  - atualiza automaticamente a cada 20s
