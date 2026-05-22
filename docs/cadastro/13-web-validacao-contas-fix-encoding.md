# 13 - Web: Fix de Encoding na Tela de Validação de Contas

## Problema
- A tela `verification/drivers` apresentou textos corrompidos (mojibake), com caracteres como `Ã`, `ï¿½` e símbolos quebrados em labels e botões.

## Correção aplicada
- Arquivo corrigido: `leva-mais-web/app/verification/drivers/page.tsx`
- Estratégia:
  - restauração do arquivo para base íntegra (sem corrupção),
  - reaplicação dos ajustes funcionais de carregamento via `verificationAdminService.listUsers(...)`,
  - manutenção do tratamento de erro com mensagem mais detalhada.

## Resultado
- Textos voltaram ao padrão normal da interface.
- Sem caracteres especiais quebrados no arquivo.
- Fluxo de carga de usuários mantido com fallback de API pelo service.
