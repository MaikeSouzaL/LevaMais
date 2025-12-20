# 📊 Exemplo de Output do Console - Reverse Geocoding

Quando você mover o pin no mapa, o console mostrará TODOS os dados retornados pelo reverse geocoding.

## 🎯 Exemplo Real de Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️  PIN MOVIDO - BUSCANDO ENDEREÇO...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Coordenadas:
   Latitude: -11.673460
   Longitude: -61.186712

✅ DADOS COMPLETOS DO REVERSE GEOCODING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Campos principais:
   🏠 Nome: Rua Josias da Silva
   🛣️  Rua: Rua Josias da Silva
   🔢 Número: 279
   🏘️  Bairro: Vila Progresso
   🏙️  Cidade: São Paulo
   🗺️  Estado: SP
   📮 CEP: 05046-000

📌 Campos secundários:
   🌍 País: Brasil
   🏳️  Código ISO: BR
   🗂️  Sub-região: São Paulo
   🕐 Timezone: America/Sao_Paulo

📌 Objeto completo (JSON):
{
  "name": "Rua Josias da Silva",
  "street": "Rua Josias da Silva",
  "streetNumber": "279",
  "district": "Vila Progresso",
  "city": "São Paulo",
  "subregion": "São Paulo",
  "region": "SP",
  "postalCode": "05046-000",
  "country": "Brasil",
  "isoCountryCode": "BR",
  "timezone": "America/Sao_Paulo"
}

✨ ENDEREÇO FORMATADO:
   Rua Josias da Silva, 279 - Vila Progresso - São Paulo/SP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📱 Quando os dados não estão disponíveis

Alguns campos podem vir vazios dependendo da localização e plataforma:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️  PIN MOVIDO - BUSCANDO ENDEREÇO...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Coordenadas:
   Latitude: -8.760800
   Longitude: -63.899900

✅ DADOS COMPLETOS DO REVERSE GEOCODING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Campos principais:
   🏠 Nome: Avenida Jorge Teixeira
   🛣️  Rua: Avenida Jorge Teixeira
   🔢 Número: ❌ não disponível
   🏘️  Bairro: ❌ não disponível
   🏙️  Cidade: Porto Velho
   🗺️  Estado: RO
   📮 CEP: ❌ não disponível

📌 Campos secundários:
   🌍 País: Brasil
   🏳️  Código ISO: BR
   🗂️  Sub-região: Rondônia
   🕐 Timezone: America/Porto_Velho

📌 Objeto completo (JSON):
{
  "name": "Avenida Jorge Teixeira",
  "street": "Avenida Jorge Teixeira",
  "city": "Porto Velho",
  "subregion": "Rondônia",
  "region": "RO",
  "country": "Brasil",
  "isoCountryCode": "BR",
  "timezone": "America/Porto_Velho"
}

✨ ENDEREÇO FORMATADO:
   Avenida Jorge Teixeira - Porto Velho/RO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ❌ Quando o serviço está indisponível

Se o reverse geocoding falhar após 3 tentativas:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️  PIN MOVIDO - BUSCANDO ENDEREÇO...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Coordenadas:
   Latitude: -8.760800
   Longitude: -63.899900

❌ ERRO: Endereço não encontrado
   O reverse geocoding retornou null
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🎯 Como usar essas informações

1. **Debugging**: Veja exatamente quais campos estão disponíveis em cada região
2. **Testes**: Compare Android vs iOS para ver diferenças
3. **Validação**: Verifique se os dados estão corretos
4. **Otimização**: Identifique quais campos usar como fallback

## 📍 Campos disponíveis por plataforma

| Campo            | iOS | Android | Observação            |
| ---------------- | --- | ------- | --------------------- |
| `name`           | ✅  | ✅      | Nome da localização   |
| `street`         | ✅  | ✅      | Nome da rua           |
| `streetNumber`   | ⚠️  | ⚠️      | Nem sempre disponível |
| `district`       | ⚠️  | ⚠️      | Bairro - varia muito  |
| `city`           | ✅  | ✅      | Cidade                |
| `region`         | ✅  | ✅      | Estado/província      |
| `postalCode`     | ⚠️  | ⚠️      | CEP - nem sempre      |
| `country`        | ✅  | ✅      | País                  |
| `isoCountryCode` | ✅  | ✅      | Código ISO do país    |
| `subregion`      | ✅  | ✅      | Sub-região            |
| `timezone`       | ✅  | ✅      | Fuso horário          |

**Legenda:**

- ✅ = Geralmente disponível
- ⚠️ = Pode não estar disponível em alguns locais

## 🔍 Como visualizar no Metro/Expo

1. Execute o app: `npx expo start`
2. Aperte `j` para abrir o debugger
3. Ou use `console.log` no terminal do Metro
4. Mova o pin no mapa
5. Veja todos os dados no console!

---

💡 **Dica**: Use esses logs para entender quais campos você pode confiar em cada região do Brasil!
