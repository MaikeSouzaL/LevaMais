# Auditoria de Telas - Cliente (Mobile)
Data: 2026-05-15

## Objetivo avaliado
Revisar telas do lado do cliente e identificar:
- correções necessárias
- melhorias recomendadas
- pontos para manter padrão visual/técnico

## Escopo analisado
- Rotas cliente: `src/routes/client.stack.routes.tsx`, `src/routes/drawer.cliente.routes.tsx`, `src/routes/ClientBoot.tsx`
- Telas em `src/screens/(authenticated)/Client/**`
- Componentes compartilhados cliente em `src/screens/(authenticated)/Client/Shared/components/**`

## Achados críticos (corrigir primeiro)
1. Rota inexistente usada no SOS (quebra de navegação)
- Evidência:
  - `src/screens/(authenticated)/Client/Home/index.tsx:247` usa `navigation.navigate("ClientSafety" as any)`.
  - `src/screens/(authenticated)/Client/Ride/Request/DestinationSearch/index.tsx:78` usa `navigation.navigate("ClientSafety" as any)`.
  - A rota declarada no stack é `SafetyCenter` em `src/routes/client.stack.routes.tsx:101`.
- Impacto:
  - Botão SOS pode falhar silenciosamente ou cair em fallback inesperado.
- Ação:
  - Trocar `ClientSafety` por `SafetyCenter` e tipar rota para impedir regressão.

## Achados de alta prioridade (padronização/qualidade)
1. Mistura de paradigmas de estilo na mesma tela
- Evidência:
  - `src/screens/(authenticated)/Client/Home/index.tsx` mistura `StyleSheet.create`, `style={{...}}` e `className`.
  - `src/screens/(authenticated)/Client/Ride/Request/DestinationSearch/index.tsx` usa alto volume de classes utilitárias inline com cores hardcoded.
- Impacto:
  - manutenção mais cara e comportamento visual inconsistente.
- Ação:
  - Definir padrão por módulo (preferir `theme + StyleSheet` ou utilitário, não ambos no mesmo arquivo).

2. Cores hardcoded repetidas fora do tema
- Evidência:
  - várias telas cliente com `#091A2F`, `#02de95`, `#ef4444`, etc.
- Impacto:
  - difícil evoluir identidade visual/acessibilidade.
- Ação:
  - extrair para `src/theme/colors.ts` e substituir usos diretos.

3. Arquivo legado no fluxo principal de Home
- Evidência:
  - `src/screens/(authenticated)/Client/Home/index.legacy.tsx` exporta uma tela completa, mas Home ativo é `Home/index.tsx`.
- Impacto:
  - confusão de manutenção e risco de correções no arquivo errado.
- Ação:
  - arquivar/remover legado ou mover para pasta `legacy/` com aviso explícito.

## Achados de média prioridade
1. Inconsistência de nomenclatura e acentuação no drawer
- Evidência:
  - labels como `Inicio`, `Historico`, `Configuracoes` em `src/routes/drawer.cliente.routes.tsx`.
- Impacto:
  - experiência textual inconsistente (ou aparência de erro de encoding).
- Ação:
  - padronizar com acentuação correta e revisão de cópia.

2. Uso amplo de `any` em navegação
- Evidência:
  - `DrawerNavigationProp<any>`, casts `as any` em várias telas cliente.
- Impacto:
  - reduz segurança de rota/params e permite erros como `ClientSafety`.
- Ação:
  - criar/usar tipo único do stack cliente e remover `any` gradualmente.

3. Rotas com alias sem semântica clara
- Evidência:
  - `LocationPicker` e `EditFavorite` apontam para o mesmo componente `AddressPicker`.
- Impacto:
  - confusão de propósito e de estado por rota.
- Ação:
  - documentar intenção ou separar wrappers com nomes explícitos.

## Padrões que estão bons e devem ser mantidos
1. Estrutura de componentes compartilhados
- `ClientScreenHeader`, `FlowStepHeader`, `LoadingButton` ajudam consistência.
2. Organização por domínio
- `Ride/Request`, `Ride/Tracking`, `Profile`, `Orders`, `History`.
3. Stack centralizado
- `client.stack.routes.tsx` concentra fluxo de navegação do cliente.

## Backlog recomendado (ordem sugerida)
1. Corrigir rota SOS (`ClientSafety` -> `SafetyCenter`) em Home e DestinationSearch.
2. Tipar navegação cliente para bloquear nomes de rota inválidos em compile-time.
3. Padronizar estilo em Home e DestinationSearch (evitar mistura de paradigmas no mesmo arquivo).
4. Substituir cores hardcoded mais repetidas por tokens do tema.
5. Tratar `index.legacy.tsx` (arquivar/remover com decisão explícita).
6. Revisar copy do drawer e padronizar acentuação.

## Status de execução (2026-05-15)
- Concluído: item 1 (correção crítica da rota SOS).
- Concluído parcialmente: item 6 (acentuação dos rótulos do drawer).
- Concluído parcialmente: item 2 (tipagem de navegação aplicada em Home e DestinationSearch).
- Concluído parcialmente: item 2 (tipagem de navegação aplicada em Home, DestinationSearch, ActiveOrders, RideTracking, Chat, CancelRide, RideCompleted e AddressPicker).
- Concluído parcialmente: item 4 (drawer cliente migrado para tokens de cor do tema).
- Concluído parcialmente: remoção de casts de navegação no Home (`as never` e `as any`), mantendo tipagem estrita.
- Arquivos alterados:
  - `src/screens/(authenticated)/Client/Home/index.tsx`
  - `src/screens/(authenticated)/Client/Ride/Request/DestinationSearch/index.tsx`
  - `src/routes/drawer.cliente.routes.tsx`
  - `src/screens/(authenticated)/Client/types/navigation.ts`
- Validação:
  - busca global por `ClientSafety` sem ocorrências remanescentes.
  - `npx tsc --noEmit` executado com sucesso após as alterações.
