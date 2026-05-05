# 🔍 ANÁLISE DO BACKEND

## 📅 Data: 02/02/2026

Analisando os controladores `ride.controller.js` e `pricing.controller.js`, mapeamos a lógica exata de funcionamento:

### 1. 💰 Cálculo de Preço
O backend não calcula o preço na hora de *criar* a corrida, ele espera receber o objeto `pricing` calculado.
Porém, existe o endpoint `/rides/calculate-price` (acessível via `PricingController`) que deve ser chamado pelo App antes da criação.

**Lógica de Cálculo:**
1. Busca regra de preço (`PricingRule`) baseada em:
   - **Cidade** (`cityId`)
   - **Veículo** (`vehicleCategory`: moto, car, van, truck)
   - **Serviço** (`purposeId`: ride, delivery, moving)
2. Calcula distância (Haversine).
3. Aplica fórmula: `Taxa Mínima` OU `(Distância * Preço/Km)`.

### 2. 📝 Criação de Corrida (`POST /rides`)
Parâmetros obrigatórios:
- `pickup` (lat, lng, address)
- `dropoff` (lat, lng, address)
- `vehicleType` (motorcycle, car, van, truck)
- `purposeId` (ID ou slug do serviço)
- `pricing` (Objeto com total calculado)

### 3. 🚗 Tipos de Veículo
Configurados no backend: `motorcycle`, `car`, `van`, `truck`.

Isso confirma que nossa nova Dashboard deve permitir selecionar **Veículo** e depois **Serviço** para enviar esses parâmetros corretamente.

---

**Antigravity AI** 🚀
