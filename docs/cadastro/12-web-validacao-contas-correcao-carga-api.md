# 12 - Web: Correção de Carga de Dados na Validação de Contas

## Problema observado
- Tela `verification/drivers` exibindo:
  - contadores zerados,
  - lista vazia,
  - toast `Erro ao conectar ao banco de cadastros`.

## Causa raiz
- A consulta dependia de uma única base (`NEXT_PUBLIC_API_URL`).
- Em ambiente local, quando essa URL/porta não corresponde ao backend ativo, o carregamento falha.

## Correção aplicada

### 1) Fallback de API no serviço admin
- Arquivo: `leva-mais-web/services/verificationAdminService.ts`
- Implementado:
  - normalização de base URL com sufixo `/api`,
  - lista de candidatos de base URL (env + origin + localhost/127.0.0.1 em portas comuns),
  - execução com fallback automático até encontrar backend válido.

### 2) Centralização da tela no serviço
- Arquivo: `leva-mais-web/app/verification/drivers/page.tsx`
- A tela deixou de chamar `axios.get` direto com URL fixa.
- Agora usa:
  - `verificationAdminService.listUsers("driver")`
  - `verificationAdminService.listUsers("client")`
- Atualizações de usuário também foram centralizadas para:
  - `verificationAdminService.updateUserById(...)`

### 3) Erro mais claro para operação
- O toast de erro de carga passou a exibir:
  - mensagem de backend quando disponível, ou
  - status HTTP, reduzindo diagnóstico “cego”.

## Impacto
- A tela volta a carregar usuários mesmo quando há variação de porta/base local.
- Mantém o mesmo contrato de endpoint e mesma regra de autorização admin (`x-admin-key`).
