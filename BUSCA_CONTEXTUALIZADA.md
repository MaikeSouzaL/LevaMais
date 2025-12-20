# 🎯 Busca Contextualizada por Cidade

## ✅ Implementado: Busca Prioriza Cidade Atual

O sistema agora detecta automaticamente a cidade onde o usuário está e prioriza resultados dessa localização!

---

## 🌟 Como Funciona

### 1️⃣ Detecção Automática da Cidade

**Ao abrir o modo de seleção de mapa:**

```
1. Sistema pega localização GPS atual
         ↓
2. Faz reverse geocoding
         ↓
3. Extrai cidade e estado
         ↓
4. Armazena para usar nas buscas
```

**Console Output:**

```
🏙️  Cidade detectada: Pimenta Bueno
🗺️  Estado detectado: Rondônia
```

---

### 2️⃣ Busca Inteligente

**Quando você busca "Rua Josias":**

**Sem contexto (antes):**

```
Location.geocodeAsync("Rua Josias")
         ↓
Resultados de TODO o Brasil (sem ordem)
```

**Com contexto (agora):**

```
Location.geocodeAsync("Rua Josias, Pimenta Bueno, RO")
         ↓
Resultados priorizados da sua cidade!
```

---

### 3️⃣ Estratégia Dupla

Para garantir melhores resultados, fazemos 2 buscas em paralelo:

```typescript
Promise.all([
  Location.geocodeAsync("Rua Josias"), // Busca original
  Location.geocodeAsync("Rua Josias, Pimenta Bueno, RO"), // Busca contextualizada
]);
```

**Resultado:** Melhor dos dois mundos!

- ✅ Encontra resultados na sua cidade
- ✅ Também encontra em outras cidades (se necessário)

---

### 4️⃣ Ordenação Inteligente

Depois de obter os resultados, reordenamos:

```typescript
// Priorizar resultados da cidade do usuário
results.sort((a, b) => {
  const aCityMatch = a.city === "Pimenta Bueno";
  const bCityMatch = b.city === "Pimenta Bueno";

  if (aCityMatch && !bCityMatch) return -1; // a vem primeiro
  if (!aCityMatch && bCityMatch) return 1; // b vem primeiro
  return 0; // mantém ordem original
});
```

---

## 📱 Experiência do Usuário

### Antes (Sem Contexto)

**Usuário em Pimenta Bueno busca "Rua Josias":**

```
┌─────────────────────────────────┐
│ 🔍 Buscar endereço              │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📍 Rua Josias da Silva          │ ← São Paulo
│    São Paulo - SP               │
├─────────────────────────────────┤
│ 📍 Rua Josias Ferreira          │ ← Rio de Janeiro
│    Rio de Janeiro - RJ          │
├─────────────────────────────────┤
│ 📍 Rua Josias da Silva          │ ← Pimenta Bueno (DIFÍCIL DE ACHAR!)
│    Pimenta Bueno - RO           │
└─────────────────────────────────┘
```

### Depois (Com Contexto)

**Usuário em Pimenta Bueno busca "Rua Josias":**

```
┌─────────────────────────────────┐
│ 🔍 Buscar em Pimenta Bueno - RO │ ← Mostra cidade detectada
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📍 Rua Josias da Silva, 279     │ ← Pimenta Bueno PRIMEIRO!
│    Pimenta Bueno - RO           │
├─────────────────────────────────┤
│ 📍 Rua Josias Ferreira          │ ← Pimenta Bueno também
│    Pimenta Bueno - RO           │
├─────────────────────────────────┤
│ 📍 Rua Josias da Silva          │ ← Outras cidades depois
│    São Paulo - SP               │
└─────────────────────────────────┘
```

**✨ Muito mais fácil encontrar!**

---

## 🔍 Console Output Detalhado

### Detecção da Cidade

```
🏙️  Cidade detectada: Pimenta Bueno
🗺️  Estado detectado: Rondônia
```

### Durante a Busca

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 BUSCA DE ENDEREÇO INICIADA
   Query: "Rua Josias"
   🏙️  Cidade do usuário: Pimenta Bueno
   🗺️  Estado do usuário: Rondônia
   🎯 Query melhorada: "Rua Josias, Pimenta Bueno, Rondônia"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Resultados Encontrados

```
✅ 5 resultado(s) encontrado(s)
📍 Rua Josias da Silva, 279 - Pimenta Bueno - RO
📍 Rua Josias Ferreira - Pimenta Bueno - RO
📍 Rua Josias - Porto Velho - RO
📍 Rua Josias da Silva - São Paulo - SP
📍 Rua Josias - Rio de Janeiro - RJ

🎯 Resultados reordenados priorizando: Pimenta Bueno
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🛠️ Implementação Técnica

### Estados Adicionados

```typescript
const [userCity, setUserCity] = useState<string>("");
const [userRegion, setUserRegion] = useState<string>("");
```

### Detecção ao Montar

```typescript
useEffect(() => {
  const detectUserLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      const endereco = await obterEnderecoPorCoordenadas(
        location.latitude,
        location.longitude
      );

      setUserCity(endereco?.city || "");
      setUserRegion(endereco?.region || "");
    }
  };

  detectUserLocation();
}, []);
```

### Busca Contextualizada

```typescript
const results = await buscarEnderecoPorTexto(
  searchQuery,
  userCity, // ← Passa cidade
  userRegion // ← Passa estado
);
```

### Função Melhorada

```typescript
export async function buscarEnderecoPorTexto(
  query: string,
  userCity?: string, // ← Novo parâmetro opcional
  userRegion?: string // ← Novo parâmetro opcional
): Promise<GeocodingResult[]>;
```

---

## 🎯 Casos de Uso

### Cenário 1: Busca Local

**Usuário em:** Pimenta Bueno - RO  
**Busca:** "Rua Josias"  
**Resultado:** Prioriza Pimenta Bueno ✅

### Cenário 2: Busca em Outra Cidade

**Usuário em:** Pimenta Bueno - RO  
**Busca:** "Rua Josias, São Paulo"  
**Resultado:** Encontra em São Paulo também ✅

### Cenário 3: Sem Localização

**GPS desligado ou sem permissão**  
**Busca:** "Rua Josias"  
**Resultado:** Busca normal (sem priorização) ✅

---

## 📊 Comparação

| Aspecto         | Antes               | Depois                         |
| --------------- | ------------------- | ------------------------------ |
| **Relevância**  | Aleatória           | Prioriza cidade local          |
| **Placeholder** | "Buscar endereço"   | "Buscar em Pimenta Bueno - RO" |
| **Query**       | "Rua X"             | "Rua X, Cidade, Estado"        |
| **Resultados**  | Misturados          | Ordenados por relevância       |
| **UX**          | Difícil achar local | Fácil e intuitivo              |

---

## ✨ Benefícios

### 1. **Mais Rápido**

Usuário encontra o que procura no topo da lista

### 2. **Mais Relevante**

Resultados da cidade atual aparecem primeiro

### 3. **Mais Inteligente**

Sistema entende contexto do usuário

### 4. **Mais Profissional**

Comportamento igual ao Uber, 99, Google Maps

### 5. **Feedback Visual**

Placeholder mostra cidade detectada

---

## 🚀 Como Testar

1. **Abra o app**

   ```bash
   npx expo start
   ```

2. **Permita acesso à localização**

   - Sistema detectará sua cidade automaticamente

3. **Entre no modo de mapa**

   - Toque em "Escolher destino"

4. **Veja o placeholder**

   ```
   🔍 Buscar em [Sua Cidade] - [Seu Estado]
   ```

5. **Digite um endereço comum**

   - Ex: "Rua Josias"

6. **Observe os resultados**

   - Endereços da sua cidade aparecem PRIMEIRO!
   - Console mostra detalhes da busca

7. **Veja os logs**
   ```
   🏙️  Cidade detectada: [Sua Cidade]
   🎯 Query melhorada: "Rua X, [Sua Cidade], [Estado]"
   🎯 Resultados reordenados priorizando: [Sua Cidade]
   ```

---

## 🎨 Melhorias Futuras (Opcional)

### 1. Cache de Localização

```typescript
// Salvar cidade para não buscar toda vez
AsyncStorage.setItem("userCity", city);
```

### 2. Mostrar Distância

```typescript
// Adicionar distância aos resultados
📍 Rua X - 500m de você
📍 Rua Y - 2.5km de você
```

### 3. Histórico de Buscas

```typescript
// Salvar buscas recentes
Últimas buscas:
- Rua Josias da Silva
- Avenida Presidente
```

### 4. Filtro por Cidade

```typescript
// Toggle para mudar cidade
[Pimenta Bueno ▼]  [Todas as cidades]
```

---

## ✅ Resultado Final

**Experiência de busca inteligente e contextualizada:**

- 🎯 Detecta cidade automaticamente
- 🔍 Prioriza resultados locais
- 📍 Placeholder personalizado
- 📊 Logs detalhados
- ⚡ Performance mantida (busca paralela)
- ✨ UX profissional

**Igual aos melhores apps de transporte!** 🚗🗺️
