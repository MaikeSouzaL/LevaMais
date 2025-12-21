## Diagnóstico de Dados
- Modelo backend: `Purpose` com campos `vehicleType`, `id`, `title`, `subtitle`, `icon`, `badges`, `isActive` (backend/src/models/Purpose.js).
- Rotas: `/api/purposes` (GET/POST/PUT/DELETE), já registradas (backend/server.js).
- Serviço frontend: `getPurposesByVehicleType(vehicleType)` consulta `/purposes?vehicleType=...&isActive=true`.
- Script existente: `backend/src/scripts/seed-purposes.js` popula todos os tipos (inclui motorcycle). Você pediu um script focado em carro, van e caminhão.

## Plano de Implementação
1. Criar um novo script `backend/src/scripts/seed-purposes-cvt.js` (Car, Van, Truck):
- Conecta ao MongoDB via `MONGODB_URI`.
- Define listas de purposes para `car`, `van`, `truck` (ids/títulos/subtítulos/icons/badges compatíveis com Leva Web e mobile).
- Executa upsert por `(vehicleType, id)` para evitar duplicar e não apagar dados existentes.
- Gera relatório de quantos registros foram criados/atualizados.

2. Ícones e compatibilidade:
- Usar nomes de ícones Material (como já está no seed atual) para manter compatibilidade com o app.
- Manter `isActive: true` por padrão.

3. Execução:
- Comando: `node backend/src/scripts/seed-purposes-cvt.js`.
- Opcional: adicionar script no `package.json` como `"seed:cvt"`.

4. Opcional (alternativa HTTP):
- Versão do script que chama `POST /api/purposes` em loop (sem deletar nada).
- Útil quando se quer popular usando a API com validações do controller.

5. Verificação:
- Após rodar, validar via `GET /api/purposes?vehicleType=car&isActive=true` (e van/truck) que os itens foram inseridos.
- Abrir `ServicePurposeScreen` e conferir que a listagem aparece conforme o tipo de veículo.

## Observações
- Não altero dados de `motorcycle` neste script.
- Não é destrutivo (usa upsert), seguro para rodar múltiplas vezes.
- Mantém o fluxo frontend sem mudanças.

Posso criar esse script e adicionar o comando de execução agora?