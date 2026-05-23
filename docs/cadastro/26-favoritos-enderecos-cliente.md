# Fluxo 26 - Entrega, endereços e favoritos do cliente

## Objetivo

Organizar a aba `Entrega` da Home para separar retirada e entrega, permitir seleção de veículo, reutilizar favoritos e abrir `Detalhes da entrega` apenas quando origem e destino estiverem completos.

## Home - Aba Entrega

A Home mantém as abas principais `Corrida`, `Entrega` e `Pay`.

Na aba `Entrega`, a tela exibe:

- Seletor horizontal de veículo: `Moto`, `Carro`, `Van` e `Truck`.
- Check verde no veículo selecionado.
- Atalhos `Adicionar Casa`, `Adicionar Trabalho` e `Adicionar Favorito`.
- Card com tabs internas `Enviar` e `Receber`.

A Home é o ponto de montagem do fluxo. Depois que o usuário confirma o primeiro endereço, o app volta para a Home na aba `Entrega` para que ele escolha manualmente o outro campo. Quando o segundo endereço é confirmado, o app navega para `DeliveryDetails`.

## Estado Interno

A Home usa dois estados separados:

- `pickupProfile`: retirada/origem/remetente.
- `dropoffProfile`: entrega/destino/destinatário.

Formato de cada perfil:

```ts
{
  address: string;
  addressCoords: { latitude: number; longitude: number } | null;
  details?: string;
  contactName: string;
  contactPhone: string;
}
```

## Enviar e Receber

Em `Enviar`:

- Campo superior: `RETIRADA (ORIGEM)` abre `Informações do remetente`.
- Campo inferior: `ENTREGA (DESTINO)` abre `Informações do destinatário`.

Em `Receber`:

- Campo superior: `RETIRADA (ORIGEM)` abre `Informações do remetente`.
- Campo inferior: `ENTREGA (DESTINO)` abre `Informações do destinatário`.

A diferença entre `Enviar` e `Receber` é visual/textual. Os dados continuam separados como origem e destino.

## Confirmação dos Formulários

`DeliverySenderInfo` recebe:

```ts
{
  mode: "sender" | "receiver";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  flow: "send" | "receive";
  pickupProfile?: DeliveryAddressProfile | null;
  dropoffProfile?: DeliveryAddressProfile | null;
}
```

Regras ao confirmar:

- Se confirmou o remetente e ainda falta destinatário, volta para `Home` com `deliveryDraftProfile` preenchendo `pickupProfile`.
- Se confirmou o destinatário e ainda falta remetente, volta para `Home` com `deliveryDraftProfile` preenchendo `dropoffProfile`.
- A Home mostra a aba `Entrega`, mantém veículo e mantém `Enviar`/`Receber`.
- O usuário toca manualmente no outro campo para preencher o perfil restante.
- Se os dois perfis estão completos, `DeliverySenderInfo` monta o payload final e navega para `DeliveryDetails`.
- A tela `Localizando você...` não aparece no meio desse retorno.

## Payload Final

Rota: `DeliveryDetails`.

```ts
{
  flow: "send" | "receive";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  pickupProfile: DeliveryAddressProfile;
  dropoffProfile: DeliveryAddressProfile;
}
```

## Tela Detalhes da Entrega

`DeliveryDetails` é a etapa visual antes da criação real do pedido.

Ela mostra:

- Card de rota com coleta e entrega.
- Contatos de coleta e entrega.
- Complementos, quando existirem.
- Card `Inserir detalhes do item`.
- Card do veículo selecionado.
- Card `Verificar com PIN`.
- Rodapé com pagamento, total inicial e botão `Confirmar`.

Por enquanto, `Confirmar` apenas mantém a tela pronta para a próxima etapa. A criação real da entrega será conectada depois.

## Seleção de Endereço

A seleção usa a tela full screen `FavoriteAddressFlow`.

Textos corretos:

- Remetente: `Buscar local para remetente`.
- Destinatário: `Buscar local para destinatário`.

O retorno para `DeliverySenderInfo` preserva o payload parcial:

```ts
{
  mode: "sender" | "receiver";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  flow: "send" | "receive";
  pickupProfile?: DeliveryAddressProfile | null;
  dropoffProfile?: DeliveryAddressProfile | null;
  mapPickedAddress: string;
  mapPickedLatitude: number;
  mapPickedLongitude: number;
  mapPickedName?: string;
  mapPickedPhone?: string;
  mapPickedDetails?: string;
}
```

## Favoritos

A coleção MongoDB é `favoritos`, vinculada ao usuário por `userId`.

Endpoints protegidos:

- `GET /api/favorite-addresses`
- `POST /api/favorite-addresses`
- `PUT /api/favorite-addresses/:favoriteId`
- `DELETE /api/favorite-addresses/:favoriteId`

Regras:

- `Casa`: procura favorito com `icon: "home"` ou nome `Casa`.
- `Trabalho`: procura favorito com `icon: "work"` ou nome `Trabalho`.
- `Favoritos`: abre a lista de favoritos salvos.
- Se `Casa` ou `Trabalho` já existir, o endereço é aplicado automaticamente.
- Se não existir, abre o cadastro do favorito correspondente.

## Validação Manual

1. Selecionar `Moto`, `Carro`, `Van` e `Truck` e confirmar se `vehicleType` acompanha a seleção.
2. Abrir `Enviar`, preencher remetente e verificar que o app volta para Home na aba `Entrega` com a origem preenchida.
3. Tocar no destino, preencher destinatário e verificar que abre `DeliveryDetails`.
4. Repetir iniciando pelo destinatário e confirmar que o app volta para Home com o destino preenchido.
5. Salvar `Casa`, `Trabalho` e um favorito comum.
6. Tocar em `Casa`, `Trabalho` ou `Favoritos` e confirmar preenchimento automático.
7. Confirmar que favoritos aparecem apenas para o usuário autenticado.
