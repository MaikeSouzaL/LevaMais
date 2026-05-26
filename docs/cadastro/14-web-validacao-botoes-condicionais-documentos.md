# 14 - Web: Exibição Condicional de Botões de Aprovação/Reprovação

## Regra implementada
- Na tela de validação (`/verification/drivers`), os botões de `Aprovar` e `Reprovar` **não aparecem** enquanto o usuário não enviar todos os documentos obrigatórios.

## Cliente
- Botões de `Reprovar Dados` e `Aprovar Dados` agora dependem de:
  - `clientVerification.documents.selfie`
  - `clientVerification.documents.rgFront`
  - `clientVerification.documents.rgBack`
- Sem os 3 documentos, os botões ficam ocultos.

## Motorista
- Para liberar `Reprovar Cadastro` e `Aprovar & Ativar Motorista`, o sistema exige:
  - Identidade: `selfie`, `cnhFront`, `cnhBack`
  - Veículo: documentos completos via frota (`crlvFront`, `crlvBack`, `vehiclePhoto`) ou legado em `driverDocuments`
- Sem envio completo, os botões são substituídos por aviso no rodapé:
  - "Aguardando envio de todos os documentos obrigatorios..."

## Arquivo alterado
- `leva-mais-web/app/verification/drivers/page.tsx`
