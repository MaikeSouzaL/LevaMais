# 23 - Validacao de Cliente: card unico, regra de ativo e liberacao de botoes

## Objetivo
Ajustar a tela de validacao de contas para cliente com as regras operacionais corretas:
- cliente so aparece como ativo quando aprovado e ativado
- remover bloco separado de biometria
- usar card unico com dados cadastrais + selfie
- liberar botoes de aprovar/reprovar somente com pacote completo

## Ajustes aplicados

Arquivo alterado:
- `leva-mais-web/app/verification/drivers/page.tsx`

### 1) Regras dos cards de topo
- `Clientes Pendentes`: considera `status` pending/none/ausente.
- `Clientes Ativos`: considera apenas `isActive === true` e `clientVerification.status === "approved"`.

### 2) Card unico para cliente
- Mantido somente um card com:
  - nome completo
  - telefone principal
  - documento identificador (CPF/CNPJ)
  - cidade/regiao
  - selfie do usuario ao lado

### 3) Remocao da secao de biometria
- Removido bloco separado "Biometria Facial / Selfie de Verificacao".
- Removido "Status da Biometria".

### 4) Liberacao de botoes por completude
- Criados criterios:
  - `clientDocumentsReady`: selfie + rgFront + rgBack
  - `clientProfileReady`: nome + telefone + cidade + CPF/CNPJ
  - `clientApprovalReady`: ambos verdadeiros
- Rodape do modal do cliente:
  - com `clientApprovalReady`: mostra "Reprovar Cadastro" e "Aprovar & Ativar Cliente"
  - sem completude: mostra aviso de pendencia

### 5) Fluxo de reprovacao do cliente
- Reprovacao passa a ser direta no usuario:
  - `isActive: false`
  - `clientVerification.status: rejected`
  - `clientVerification.selfieStatus: rejected`
  - `clientVerification.rejectionReason`

## Resultado esperado
- Cliente em analise nao aparece como ativo.
- Operador aprova/reprova somente quando pacote de dados/documentos estiver completo.
- UX simplificada com um unico card para auditoria do cliente.
