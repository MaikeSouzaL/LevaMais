# 🏙️ Detecção de Cidade com Fallback

## 📋 Problema Identificado

Ao testar a detecção automática de cidade, identificamos que o **Expo Location** nem sempre retorna o campo `city` no resultado do geocoding reverso.

### Exemplo Real:

```json
{
  "name": "395",
  "street": "Rua Maria de Lourdes Silva",
  "streetNumber": "395",
  "district": "Pimenta Bueno",
  "subregion": "Pimenta Bueno",
  "region": "Rondônia",
  "postalCode": "76970-000",
  "country": "Brasil",
  "isoCountryCode": "BR"
  // ❌ CITY NÃO ESTÁ PRESENTE!
}
```

**Resultado anterior:**

```
LOG  🏙️  Cidade: ❌ não disponível
LOG  🗺️  Estado: Rondônia ✅
```

**Console da busca:**

```
LOG  🔍 EXECUTANDO BUSCA:
LOG     Query: "av maceio"
LOG     Cidade: (não detectada) ❌
LOG     Estado: Rondônia ✅
```

## 🔧 Solução Implementada

Criamos um **sistema de fallback hierárquico** para detecção de cidade:

```typescript
const cidadeDetectada =
  endereco?.city || endereco?.subregion || endereco?.district;
```

### Ordem de Prioridade:

1. **`city`** - Prioridade máxima (quando disponível)
2. **`subregion`** - Fallback primário (geralmente contém o nome da cidade)
3. **`district`** - Fallback secundário (bairro, usado em último caso)

## 📊 Comparação Antes vs Depois

### ❌ Antes (sem fallback):

```typescript
if (endereco?.city) {
  setUserCity(endereco.city);
  console.log(`✅ Cidade detectada: ${endereco.city}`);
}
// Resultado: cidade não detectada se city não existir
```

**Resultado:**

- Cidade: `(não detectada)`
- Busca: sem contextualização por cidade

### ✅ Depois (com fallback):

```typescript
const cidadeDetectada =
  endereco?.city || endereco?.subregion || endereco?.district;

if (cidadeDetectada) {
  setUserCity(cidadeDetectada);
  console.log(`✅ Cidade detectada: ${cidadeDetectada}`);
  if (!endereco?.city && endereco?.subregion) {
    console.log(`   ℹ️  (usando subregion como fallback)`);
  }
}
```

**Resultado esperado:**

- Cidade: `Pimenta Bueno` ✅
- Busca: contextualizada com cidade e estado

## 🎯 Impacto nas Buscas

### Antes (sem cidade):

```
Query original: "av maceio"
Query melhorada: "av maceio, Rondônia"
Resultados: qualquer Av. Maceió no Brasil
```

### Depois (com cidade):

```
Query original: "av maceio"
Query melhorada: "av maceio, Pimenta Bueno, Rondônia"
Resultados: prioriza Av. Maceió em Pimenta Bueno/RO
```

## 📝 Logs Informativos

O sistema agora informa quando está usando fallback:

```
✅ Cidade detectada: Pimenta Bueno
   ℹ️  (usando subregion como fallback)
✅ Estado detectado: Rondônia
```

Isso ajuda a entender de onde veio a informação da cidade.

## 🌍 Casos de Uso

### Caso 1: City disponível (ideal)

```json
{
  "city": "São Paulo",
  "region": "São Paulo"
}
```

✅ Usa `city` diretamente

### Caso 2: Apenas subregion (comum em cidades pequenas)

```json
{
  "subregion": "Pimenta Bueno",
  "region": "Rondônia"
}
```

✅ Usa `subregion` como fallback

### Caso 3: Apenas district (raro)

```json
{
  "district": "Centro",
  "region": "Bahia"
}
```

✅ Usa `district` como último recurso

### Caso 4: Nenhum disponível (muito raro)

```json
{
  "region": "Rondônia"
}
```

⚠️ Busca apenas com estado (menos preciso)

## 🔍 Verificação

Para verificar se está funcionando, observe os logs:

1. **Detecção inicial:**

```
🌍 DETECTANDO LOCALIZAÇÃO DO USUÁRIO...
📍 Usando coordenadas do mapa atual:
   Lat: -11.xxxxx
   Lng: -61.xxxxx
✅ Cidade detectada: Pimenta Bueno
   ℹ️  (usando subregion como fallback)
✅ Estado detectado: Rondônia
```

2. **Durante a busca:**

```
🔍 EXECUTANDO BUSCA:
   Query: "av maceio"
   Cidade: Pimenta Bueno ✅
   Estado: Rondônia ✅
```

## ✨ Benefícios

1. **Maior cobertura**: Funciona mesmo quando `city` não está disponível
2. **Buscas mais precisas**: Sempre tenta contextualizar com localidade
3. **Transparência**: Logs informam quando usa fallback
4. **Robustez**: Sistema degrada graciosamente (estado → nada)

## 🚀 Próximos Passos

Se quiser melhorar ainda mais:

1. **Cache de localização**: Salvar cidade detectada em AsyncStorage
2. **Atualização periódica**: Detectar novamente se usuário se mover muito
3. **Seleção manual**: Permitir usuário escolher cidade manualmente
4. **Histórico de buscas**: Lembrar cidades pesquisadas anteriormente
