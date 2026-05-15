# E2E Checklist - App + Backend (Cliente/Motorista)

## Pre-condicoes
1. Backend rodando com Mongo e WebSocket ativos.
2. Dois dispositivos/sessoes: Cliente e Motorista.
3. Motorista com:
   - conta aprovada,
   - localizacao ativa,
   - saldo suficiente.
4. Cidade configurada com raio de busca e categorias habilitadas.

## Evidencias esperadas em cada cenario
- Screenshot de cada etapa critica.
- ID da corrida (`rideId`) e timestamps.
- Resposta de erro/sucesso quando aplicavel.

---

## Cenario A - Corrida (carro)
1. Cliente abre Home e solicita corrida `serviceType=ride`, `vehicleType=car`.
   - Esperado: cria corrida e entra em busca.
2. Motorista recebe chamada em `DriverRequests` (aba Direto ou Fila).
   - Esperado: card aparece com pickup/dropoff/valor.
3. Motorista aceita corrida.
   - Esperado: cliente vai para tracking, motorista vai para `DriverRide`.
4. Motorista atualiza status (chegada, inicio, conclusao).
   - Esperado: cliente recebe atualizacoes em tempo real.
5. Cliente avalia motorista.
   - Esperado: fluxo de finalizacao conclui sem erro.

Aprovacao: PASS se todo fluxo ocorre sem tela quebrada e sem divergencia de status.

---

## Cenario B - Delivery leve (moto)
1. Cliente solicita entrega `serviceType=delivery`, `vehicleType=motorcycle`.
2. Cliente ajusta oferta e, se aplicavel, usa marketplace de ofertas.
3. Motorista aceita/contraoferta.
4. Cliente seleciona oferta final (quando negociacao ativa).
5. Tracking + conclusao.

Aprovacao: PASS se negociacao e aceite convergem para `driver_assigned/accepted` e tracking funcional.

---

## Cenario C - Frete de van
1. Cliente seleciona `vehicleType=van`.
2. Cliente define `deliveryType` compativel, `cargoSize` e opcao de ajudante.
3. Criar pedido e validar recebimento por motorista compativel.
4. Tentar aceite por motorista incompativel (negativo controlado).

Aprovacao: PASS se compativel recebe/aceita e incompativel e bloqueado pelo backend.

---

## Cenario D - Frete de caminhao
1. Cliente seleciona `vehicleType=truck`.
   - Esperado: orientacao de frete pesado visivel.
2. Confirmar `needsHelper` sugerido e editavel.
3. Criar pedido com detalhes de carga.
4. Motorista compativel aceita agendado e nao-agendado.

Aprovacao: PASS se pedido e roteado para categoria correta e aceite respeita regras de compatibilidade.

---

## Cenario E - Agendado
1. Cliente cria pedido com `scheduledFor`.
2. Motorista aceita em aba Agendado.
3. Validar status `driver_assigned` e reserva.
4. No horario, validar despacho/continuidade do fluxo.

Aprovacao: PASS se agendamento permanece consistente e vira corrida ativa no horario.

---

## Cenario F - Seguranca/erros
1. Tentar aceite com motorista offline/com corrida ativa.
2. Tentar aceite com servico incompativel com veiculo.
3. Tentar webhook sem secret (ambiente prod simulado).

Aprovacao: PASS se backend bloqueia com erro claro e sem efeito colateral.

---

## Matriz de saida (preencher)
- A Corrida: PASS/FAIL
- B Delivery leve: PASS/FAIL
- C Van: PASS/FAIL
- D Caminhao: PASS/FAIL
- E Agendado: PASS/FAIL
- F Seguranca/erros: PASS/FAIL

Se qualquer item FAIL, registrar:
- passo,
- tela,
- endpoint,
- payload,
- erro,
- sugestao de correcao.
