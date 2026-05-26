# 15 - Web: Auditoria de Contas em Modal Central

## Alteração
- A visualização de auditoria do usuário na tela `verification/drivers` deixou de abrir como drawer lateral à direita.
- Agora abre como **modal central** na tela inteira.

## Motivo
- Evitar a área escura lateral grande e melhorar foco/legibilidade da revisão.

## Implementação
- Arquivo: `leva-mais-web/app/verification/drivers/page.tsx`
- Ajustes:
  - wrapper do painel alterado de `fixed right-0 ...` para `fixed inset-0 flex items-center justify-center`
  - container interno com `max-w-5xl`, `max-h-[92vh]`, `rounded-2xl` e `overflow-y-auto`
  - clique fora fecha modal; clique dentro mantém aberto.

## Correção adicional
- Ajustado callback do botão de aprovação de motorista para `handleApproveUser(selectedUser)` (estava com referência inválida).
