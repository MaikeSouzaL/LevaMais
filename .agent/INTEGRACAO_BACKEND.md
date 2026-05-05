# 🔌 INTEGRAÇÃO COM BACKEND (MONGODB)

## 📅 Data: 02/02/2026 - 20:25
## 🎯 Status: PRONTO NO FRONTEND

O frontend foi atualizado para **remover todos os dados mockados** e consumir dados reais do backend.

---

## 🛠️ O QUE FOI FEITO

### 1. Chamada de Veículos Próximos
A `HomeScreen` agora faz polling a cada 10 segundos no endpoint:
`GET /rides/nearby-drivers?latitude=...&longitude=...&radius=5000`

### 2. Formato Esperado do Backend
O backend deve responder com um JSON array neste formato:

```json
[
  {
    "id": "driver_123",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "type": "car",
    "rotation": 90
  },
  {
    "id": "driver_456",
    "latitude": -23.5510,
    "longitude": -46.6340,
    "type": "motorcycle",
    "rotation": 180
  }
]
```

### 3. Configuração de Ambiente
O app usará a URL definida em `EXPO_PUBLIC_API_URL`. Certifique-se de que seu `.env` aponta para o servidor correto com MongoDB e WebSocket.

Exemplo `.env`:
```
EXPO_PUBLIC_API_URL=http://seuserver.com.br
```

---

## ⚠️ AÇÃO NECESSÁRIA NO BACKEND

Se este endpoint ainda não existir, implemente-o consultando sua coleção de motoristas ativos no MongoDB (usando `$near` ou `$geoNear`).

Exemplo Mongoose (sugestão):
```javascript
// Exemplo de query no backend
const drivers = await DriverModel.find({
  isOnline: true,
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: 5000
    }
  }
});
```

---

**Antigravity AI** 🚀
