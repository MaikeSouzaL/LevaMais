# 16 - Web: Correção de Textos com Símbolos Quebrados

## Problema
- A tela de validação (`/verification/drivers`) voltou a exibir símbolos quebrados e caracteres corrompidos.

## Correção aplicada
- Arquivo corrigido:
  - `leva-mais-web/app/verification/drivers/page.tsx`
- Ajustes:
  - remoção de caracteres inválidos remanescentes,
  - normalização de labels/botões com texto legível,
  - substituição de ícones corrompidos por rótulos textuais estáveis (`Moto`, `Van`, `Carro`, `Caminhão`).

## Resultado
- A tela não possui mais textos com símbolos quebrados no código-fonte.
