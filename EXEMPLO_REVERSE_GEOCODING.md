# 📍 Guia de Reverse Geocoding - LevaMais

Este documento explica como usar o reverse geocoding (obter endereço a partir de coordenadas) no app LevaMais.

## 🎯 Nova API (Recomendada)

### Instalação

```bash
npx expo install expo-location
```

### Configuração (app.json)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Precisamos da sua localização para preencher o endereço automaticamente."
        }
      ]
    ]
  }
}
```

## 📚 Funções Disponíveis

### 1. `obterEnderecoPorCoordenadas()` - Principal

Obtém o endereço completo a partir de coordenadas.

```typescript
import { obterEnderecoPorCoordenadas } from "@/utils/location";

const endereco = await obterEnderecoPorCoordenadas(-8.7608, -63.8999);

console.log(endereco);
// {
//   street: "Avenida Brasília",
//   streetNumber: "1234",
//   district: "Centro",
//   city: "Porto Velho",
//   region: "RO",
//   postalCode: "76801-000",
//   country: "Brasil",
//   isoCountryCode: "BR",
//   ...
// }
```

**Características:**

- ✅ Retry automático (3 tentativas)
- ✅ Backoff progressivo quando serviço indisponível
- ✅ Retorna `null` se falhar
- ✅ Tipagem completa TypeScript

### 2. `formatarEndereco()` - Formatação Completa

Transforma o endereço em string legível.

```typescript
import {
  obterEnderecoPorCoordenadas,
  formatarEndereco,
} from "@/utils/location";

const endereco = await obterEnderecoPorCoordenadas(lat, lng);
const texto = formatarEndereco(endereco);

console.log(texto);
// "Avenida Brasília, 1234 - Centro - Porto Velho/RO"
```

**Formato:** `Rua, Número - Bairro - Cidade/UF`

### 3. `formatarEnderecoCompacto()` - Formatação Curta

Versão compacta sem o bairro (ideal para pins no mapa).

```typescript
import {
  obterEnderecoPorCoordenadas,
  formatarEnderecoCompacto,
} from "@/utils/location";

const endereco = await obterEnderecoPorCoordenadas(lat, lng);
const texto = formatarEnderecoCompacto(endereco);

console.log(texto);
// "Avenida Brasília, 1234 - Porto Velho/RO"
```

**Formato:** `Rua, Número - Cidade/UF`

### 4. `pinGeocode` - Para Pins Arrastáveis

Utilitário específico para pins no mapa com debounce.

```typescript
import { pinGeocode } from "@/utils/pinGeocode";

// Versão direta
const resultado = await pinGeocode.reverse(lat, lng);
console.log(resultado.formatted);
// "Avenida Brasília, 1234 - Porto Velho/RO"

// Versão com debounce (ideal para onRegionChangeComplete)
pinGeocode.debouncedReverse(lat, lng, (resultado) => {
  setAddress(resultado.formatted);
});
```

**Características:**

- ✅ Debounce de 400ms (evita chamadas excessivas durante arrasto)
- ✅ Fallback para coordenadas se geocoding falhar
- ✅ Callback para atualização assíncrona

## 🎨 Exemplos Práticos

### Exemplo 1: Buscar endereço ao arrastar pin no mapa

```typescript
const handleRegionChangeComplete = async (region: {
  latitude: number;
  longitude: number;
}) => {
  // Usando a versão com debounce (recomendado)
  pinGeocode.debouncedReverse(
    region.latitude,
    region.longitude,
    (resultado) => {
      setCurrentAddress(resultado.formatted);
    }
  );
};

<MapView
  onRegionChangeComplete={handleRegionChangeComplete}
  // ...
/>;
```

### Exemplo 2: Buscar endereço ao clicar em "Usar minha localização"

```typescript
const handleUseMyLocation = async () => {
  const location = await getCurrentLocation();
  if (!location) return;

  const endereco = await obterEnderecoPorCoordenadas(
    location.latitude,
    location.longitude
  );

  const textoFormatado = formatarEndereco(endereco);
  setCurrentAddress(textoFormatado);
};
```

### Exemplo 3: Exibir endereço completo em formulário

```typescript
const [formData, setFormData] = useState({
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
});

const preencherComCoordenadas = async (lat: number, lng: number) => {
  const endereco = await obterEnderecoPorCoordenadas(lat, lng);

  if (endereco) {
    setFormData({
      rua: endereco.street || "",
      numero: endereco.streetNumber || "",
      bairro: endereco.district || "",
      cidade: endereco.city || "",
      estado: endereco.region?.substring(0, 2).toUpperCase() || "",
      cep: endereco.postalCode || "",
    });
  }
};
```

## ⚠️ Importante

### Variações entre Plataformas

O que vem preenchido **varia entre Android e iOS**:

- Às vezes `streetNumber` pode vir vazio
- `district` pode ter nomes diferentes
- Nem todos os campos são garantidos

### Limitações do Expo Location

Para 100% de consistência e mais campos, considere usar:

- Google Geocoding API
- Mapbox Geocoding
- OpenCage Geocoding

### Tratamento de Erros

Sempre verifique se o resultado é `null`:

```typescript
const endereco = await obterEnderecoPorCoordenadas(lat, lng);

if (!endereco) {
  // Geocoding falhou - use coordenadas como fallback
  setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  return;
}

// Sucesso - use o endereço
const texto = formatarEndereco(endereco);
setAddress(texto);
```

## 🔄 Migração do Código Antigo

Se você estava usando `getAddressFromCoordinates()`:

### Antes (Legado)

```typescript
const address = await getAddressFromCoordinates({ latitude, longitude });
const texto = `${address.street}, ${address.number} - ${address.city}/${address.state}`;
```

### Depois (Novo)

```typescript
const endereco = await obterEnderecoPorCoordenadas(latitude, longitude);
const texto = formatarEnderecoCompacto(endereco);
```

**Nota:** A função `getAddressFromCoordinates()` ainda existe para compatibilidade, mas está marcada como deprecated.

## 📖 Referências

- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [reverseGeocodeAsync API](https://docs.expo.dev/versions/latest/sdk/location/#locationreversegeocodeasynnc)

---

✨ **Dica:** Use sempre `formatarEndereco()` ou `formatarEnderecoCompacto()` para garantir formatação consistente em todo o app!
