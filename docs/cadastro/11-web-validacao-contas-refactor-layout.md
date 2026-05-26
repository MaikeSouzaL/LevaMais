# 11 - Web: Refactor de Layout da Tela de Validação de Contas

## Escopo
- Tela: `leva-mais-web/app/verification/drivers/page.tsx`
- Objetivo: melhorar leitura operacional da fila de contas novas para validar/aprovar.

## O que foi alterado
- Header reestruturado com copy mais direta para auditoria em tempo real.
- Banner de atenção adicionado quando existe fila pendente (`pendingDrivers + pendingClients > 0`).
- Tabs de navegação remodeladas para formato segmentado em largura total:
  - `Motoristas (N)`
  - `Clientes (N)`
- Área de filtros mantida e ampliada com atalhos rápidos por status:
  - `Pendentes`
  - `Aprovados`
  - `Reprovados`
  - `Todos`
- Ajustes visuais nos cards de métricas para facilitar leitura de volume de fila.

## Fluxo funcional preservado
- Não houve alteração de endpoint.
- Não houve alteração de payload.
- Não houve alteração de regras de aprovação/reprovação.
- Continuam válidas as ações granulares por documento já implementadas:
  - Motorista: aprovação/reprovação de documentos individualmente.
  - Cliente: aprovação/reprovação de CPF/selfie individualmente.

## Resultado esperado na operação
- Operador identifica imediatamente:
  - volume pendente,
  - contexto (motorista x cliente),
  - status alvo para triagem rápida.
- Menos cliques para alternar filtro de status durante auditoria.
