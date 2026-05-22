# Fluxo 26 - Endereços favoritos do cliente

## Objetivo

Permitir que o cliente salve endereços frequentes e use esses locais como coleta ou destino no fluxo de entrega.

O app agora segue o comportamento da referência:

- `Casa` abre a busca com o texto `Onde você mora?`.
- `Trabalho` abre a busca com o texto `Onde você trabalha?`.
- `Favoritos` abre uma nova tela dedicada com a lista de locais salvos.
- Se não houver favoritos, a tela exibe o estado vazio e o botão `Adicionar favorito`.
- Ao adicionar favorito, o cliente busca um endereço, informa o `Nome do local` e salva.
- Ao selecionar um favorito salvo, o endereço é preenchido no campo atual, seja coleta ou destino.
- Quando o teclado é fechado manualmente durante a busca, o bottom sheet também é fechado para manter o comportamento igual à referência.
- A Home do cliente, na aba de corrida, também exibe atalhos para adicionar `Casa`, `Trabalho` e `Favorito`, todos abrindo a nova tela.
- A Home do cliente, na aba de entrega, exibe os mesmos atalhos acima do card `Enviar/Receber`, todos abrindo a nova tela.
- As telas antigas de criação de favorito foram removidas; novos favoritos devem passar pela nova tela `FavoriteAddressFlow`.

## Banco de dados

Foi criada a coleção MongoDB `favoritos`.

Cada documento fica atrelado ao usuário pelo campo `userId`.

Campos principais:

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId do usuario",
  "name": "Casa",
  "label": "Casa",
  "icon": "home",
  "address": "Rua Exemplo, 123 - Cidade",
  "formattedAddress": "Rua Exemplo, 123 - Cidade",
  "latitude": -11.672,
  "longitude": -61.193,
  "city": "Pimenta Bueno",
  "state": "RO",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Backend

Rotas protegidas por autenticação:

- `GET /api/favorite-addresses`
- `POST /api/favorite-addresses`
- `PUT /api/favorite-addresses/:favoriteId`
- `DELETE /api/favorite-addresses/:favoriteId`

### Listar favoritos

Payload enviado pelo app:

```http
GET /api/favorite-addresses
Authorization: Bearer <token>
```

Resposta:

```json
{
  "success": true,
  "favorites": [
    {
      "_id": "id",
      "id": "id",
      "userId": "id do usuario",
      "name": "Casa",
      "label": "Casa",
      "icon": "home",
      "address": "Rua Exemplo, 123",
      "formattedAddress": "Rua Exemplo, 123",
      "latitude": -11.672,
      "longitude": -61.193
    }
  ]
}
```

### Criar favorito

Payload enviado pelo app:

```json
{
  "name": "Casa",
  "icon": "home",
  "address": "Rua Exemplo, 123",
  "formattedAddress": "Rua Exemplo, 123",
  "latitude": -11.672,
  "longitude": -61.193
}
```

Validações do backend:

- `name` é obrigatório.
- `address` ou `formattedAddress` é obrigatório.
- `latitude` é obrigatória e deve estar entre `-90` e `90`.
- `longitude` é obrigatória e deve estar entre `-180` e `180`.
- `state`, quando enviado, deve ter duas letras.
- Não permite duplicar favoritos com o mesmo `name` para o mesmo `userId`.

Resposta de sucesso:

```json
{
  "success": true,
  "message": "Favorito adicionado com sucesso",
  "favorite": {
    "_id": "id",
    "id": "id",
    "name": "Casa",
    "label": "Casa",
    "icon": "home",
    "address": "Rua Exemplo, 123",
    "formattedAddress": "Rua Exemplo, 123",
    "latitude": -11.672,
    "longitude": -61.193
  }
}
```

## App cliente

Tela afetada:

- `DeliverySenderInfo`

Fluxo de uso:

1. Cliente toca no campo de endereço.
2. O bottom sheet abre com busca, atalhos e sugestões.
3. Ao tocar em `Casa`, o placeholder muda para `Onde você mora?`.
4. Ao tocar em `Trabalho`, o placeholder muda para `Onde você trabalha?`.
5. Ao tocar em `Favoritos`, abre a tela de favoritos.
6. Ao adicionar favorito, o app busca o endereço pelo Google Places.
7. Após selecionar o endereço, o app abre `Nome do local`.
8. Ao salvar, o app envia o favorito para o backend.
9. O favorito salvo passa a aparecer na lista e pode preencher coleta ou destino.
10. Se o cliente fechar o teclado durante a busca, o app fecha o bottom sheet e limpa o estado da busca.

## Pontos de entrada

O mesmo fluxo de favoritos pode ser aberto por:

- Campo de endereço dentro de `DeliverySenderInfo`.
- Atalhos da Home na aba `Corrida`.
- Atalhos da Home na aba `Entrega`.
- Tela `Favoritos`, quando o usuário toca em adicionar.

Todos esses pontos usam a rota `FavoriteAddressFlow`, que é uma tela full screen do stack. O cadastro de favoritos não deve abrir como bottom sheet.

## Rota mobile

```ts
FavoriteAddressFlow: {
  initialSearchMode?: "home" | "work" | "favorite" | "favoritesList";
}
```

Uso esperado:

- `initialSearchMode: "home"` abre busca com `Onde você mora?`.
- `initialSearchMode: "work"` abre busca com `Onde você trabalha?`.
- `initialSearchMode: "favorite"` abre busca com `Insira o endereço`.
- `initialSearchMode: "favoritesList"` abre a lista/estado vazio de favoritos.

## Observações

- A coleção `favoritos` substitui o uso de favoritos embutidos no documento do usuário.
- O endpoint antigo foi mantido no mesmo caminho usado pelo app: `/api/favorite-addresses`.
- Casa e Trabalho também são salvos como favoritos, usando `icon` igual a `home` ou `work`.
- Favoritos manuais usam `icon` igual a `favorite`.

## Integração com entrega

A Home do cliente na aba `Entrega` possui seletor horizontal de veículo:

- `Moto Entrega` envia `vehicleType: "motorcycle"`.
- `Carro Entrega` envia `vehicleType: "car"`.
- `Van Entrega` envia `vehicleType: "van"`.
- `Truck Entrega` envia `vehicleType: "truck"`.

O veículo selecionado aparece com check verde no canto superior direito do card e é repassado para `DeliverySenderInfo`.
