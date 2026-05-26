# Fluxo 25 - Usuários Web e Seleção de Endereço no Mapa

## Central de usuários web
Arquivo principal: `leva-mais-web/app/users/page.tsx`.

### Regra de cadastro por tipo de usuário
- Cliente: cadastro simples com nome, CPF ou CNPJ, telefone, cidade e selfie.
- Motorista: cadastro completo com documentos pessoais, selfie, veículo/frota, documentos do veículo e dados de repasse.

### Painel lateral
- O painel de detalhes não escurece mais a tela principal.
- O overlay do drawer é transparente para manter a tela de fundo visível.
- A ficha do cliente mostra apenas dados cadastrais essenciais.
- A ficha do motorista mostra dados cadastrais, status dos documentos pessoais, veículos/documentos do veículo e dados de repasse.

## App cliente - endereço por mapa
Arquivos principais:
- `src/screens/(authenticated)/Client/Ride/Request/DeliverySenderInfo/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Request/AddressPicker/index.tsx`
- `src/screens/(authenticated)/Client/types/navigation.ts`

### Fluxo
1. Usuário abre informações do remetente ou destinatário.
2. Ao tocar em endereço, abre o bottom sheet de busca.
3. Ao tocar em `Marque o local no mapa`, o app navega para `LocationPicker`.
4. O usuário arrasta o mapa/marcador central até o local correto.
5. Ao confirmar, `LocationPicker` retorna para `DeliverySenderInfo` com endereço, latitude e longitude.
6. O formulário recebe o endereço e habilita a continuação quando os demais dados obrigatórios estiverem preenchidos.

### Teclado e bottom sheet
- O bottom sheet de busca usa `KeyboardAvoidingView`.
- Quando o teclado abre, o sheet aumenta a altura para ficar acima do teclado e não ficar escondido atrás dele.

## Ajuste visual do bottom sheet de busca
- No modo destinatário, o placeholder segue a referência: `Entregar para`.
- O indicador do campo usa ponto laranja no destinatário e verde na coleta.
- Com teclado aberto, o bottom sheet recebe altura fixa maior para ocupar a área acima do teclado, mantendo categorias e sugestões visíveis.
- As sugestões rápidas aparecem com ícone de destaque laranja, título, endereço e distância, como na referência visual.
