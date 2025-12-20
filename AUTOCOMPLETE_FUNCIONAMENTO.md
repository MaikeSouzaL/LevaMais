# 🎬 Demonstração: Autocomplete em Tempo Real

## 📱 Passo a Passo Visual

### Estado Inicial

```
┌─────────────────────────────────┐
│  ← 🔍 Buscar endereço           │
└─────────────────────────────────┘

(Nenhuma lista visível)
```

---

### Usuário digita: "R"

```
┌─────────────────────────────────┐
│  ← 🔍 R                          │
└─────────────────────────────────┘

❌ Menos de 3 caracteres
   Lista não aparece ainda
```

---

### Usuário digita: "Ru"

```
┌─────────────────────────────────┐
│  ← 🔍 Ru                         │
└─────────────────────────────────┘

❌ Menos de 3 caracteres
   Lista não aparece ainda
```

---

### Usuário digita: "Rua" (3 caracteres)

```
┌─────────────────────────────────┐
│  ← 🔍 Rua                    ⏳  │ ← Loading aparece
└─────────────────────────────────┘

⏳ Aguardando 500ms (debounce)...
   Se continuar digitando, reinicia o timer
```

---

### 500ms depois (parou de digitar)

```
┌─────────────────────────────────┐
│  ← 🔍 Rua                    ⏳  │
└─────────────────────────────────┘

🔍 Buscando no servidor...
   Location.geocodeAsync("Rua")
```

---

### Resultados Chegam!

```
┌─────────────────────────────────┐
│  ← 🔍 Rua                    ❌  │ ← Botão limpar
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📍 Rua da Consolação            │ ← Resultado 1
│    São Paulo - SP                │
├─────────────────────────────────┤
│ 📍 Rua Augusta                   │ ← Resultado 2
│    São Paulo - SP                │
├─────────────────────────────────┤
│ 📍 Rua Oscar Freire              │ ← Resultado 3
│    São Paulo - SP                │
├─────────────────────────────────┤
│ 📍 Rua Pamplona                  │ ← Resultado 4
│    São Paulo - SP                │
└─────────────────────────────────┘
```

---

### Usuário continua digitando: "Rua J"

```
┌─────────────────────────────────┐
│  ← 🔍 Rua J                  ⏳  │ ← Loading reaparece
└─────────────────────────────────┘

⏰ Timer reiniciado!
   Aguardando mais 500ms...
   (Lista anterior ainda visível)
```

---

### Usuário digita: "Rua Jo"

```
┌─────────────────────────────────┐
│  ← 🔍 Rua Jo                 ⏳  │
└─────────────────────────────────┘

⏰ Timer reiniciado novamente!
   Aguardando mais 500ms...
```

---

### Usuário digita: "Rua Josias"

```
┌─────────────────────────────────┐
│  ← 🔍 Rua Josias             ⏳  │
└─────────────────────────────────┘

⏰ Timer reiniciado!
   Aguardando 500ms...
```

---

### 500ms depois (parou de digitar "Rua Josias")

```
┌─────────────────────────────────┐
│  ← 🔍 Rua Josias             ⏳  │
└─────────────────────────────────┘

🔍 Buscando resultados específicos...
   Location.geocodeAsync("Rua Josias")
```

---

### Novos Resultados (mais específicos)

```
┌─────────────────────────────────┐
│  ← 🔍 Rua Josias             ❌  │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📍 Rua Josias da Silva, 279      │ ← Resultado específico
│    Pimenta Bueno - RO            │
├─────────────────────────────────┤
│ 📍 Rua Josias da Silva           │
│    São Paulo - SP                │
├─────────────────────────────────┤
│ 📍 Rua Josias Ferreira           │
│    Porto Velho - RO              │
└─────────────────────────────────┘
```

---

### Usuário Seleciona um Resultado

```
Usuário toca em:
📍 Rua Josias da Silva, 279
   Pimenta Bueno - RO

         ↓

┌─────────────────────────────────┐
│  ← 🔍 Buscar endereço            │ ← Campo limpo
└─────────────────────────────────┘

(Lista desaparece)

         ↓

🗺️ MAPA ANIMA PARA O LOCAL
📍 PIN MOVE AUTOMATICAMENTE
📝 ENDEREÇO ATUALIZA NO BOTTOM SHEET
```

---

## 🔄 Comportamento Dinâmico

### Cenário 1: Digitação Rápida

```
"R" → "Ru" → "Rua" → "Rua " → "Rua J" → "Rua Jo" → "Rua Jos"
  ↓     ↓      ↓       ↓        ↓        ↓          ↓
Aguarda... Aguarda... Timer reinicia continuamente...
                                                     ↓
                                          Para de digitar
                                                     ↓
                                          Aguarda 500ms
                                                     ↓
                                              BUSCA ÚNICA!
```

**Resultado:** Apenas 1 chamada de API em vez de 7!

---

### Cenário 2: Digitação Lenta

```
"R"  →  aguarda 2s  →  "u"  →  aguarda 2s  →  "a"
  ↓                      ↓                      ↓
(sem busca)          (sem busca)           Busca "a"!
                                           (500ms depois)
```

**Resultado:** Busca acontece após cada pausa de 500ms

---

### Cenário 3: Backspace

```
"Rua Josias" ← Backspace ← "Rua Josi" ← Backspace ← "Rua Jos"
      ↓                          ↓                       ↓
Timer reinicia            Timer reinicia          Timer reinicia
      ↓                          ↓                       ↓
  Aguarda 500ms            Aguarda 500ms           Aguarda 500ms
      ↓                          ↓                       ↓
Busca "Rua Josias"      Busca "Rua Josi"      Busca "Rua Jos"
```

---

## 🎯 Regras de Negócio

### ✅ Lista Aparece Quando:

- Usuário digitou **3 ou mais caracteres**
- Passou **500ms sem digitar** (debounce)
- **Busca retornou resultados**

### ❌ Lista NÃO Aparece Quando:

- Menos de 3 caracteres
- Usuário ainda está digitando (dentro dos 500ms)
- Busca não retornou resultados
- Campo de busca está vazio

### 🔄 Lista Atualiza Quando:

- Usuário para de digitar por 500ms
- Nova busca é completada
- Resultados diferentes chegam

### 🚫 Lista Desaparece Quando:

- Usuário seleciona um resultado
- Usuário clica no X (limpar)
- Campo fica com menos de 3 caracteres
- Usuário clica fora (perde foco)

---

## 📊 Timeline Detalhada

```
T = 0ms     : Usuário digita "R"
              → searchQuery = "R"
              → Timer inicia (500ms)

T = 100ms   : Usuário digita "u"
              → searchQuery = "Ru"
              → Timer CANCELA e REINICIA (500ms)

T = 200ms   : Usuário digita "a"
              → searchQuery = "Rua"
              → Timer CANCELA e REINICIA (500ms)

T = 700ms   : Timer de 500ms completa!
              → setIsSearching(true)
              → setShowResults(true)
              → Loading aparece ⏳

T = 800ms   : buscarEnderecoPorTexto("Rua") inicia

T = 1500ms  : Resultados chegam!
              → setSearchResults([...])
              → setIsSearching(false)
              → Lista aparece com resultados 📋

T = 2000ms  : Usuário digita "J"
              → searchQuery = "Rua J"
              → Timer CANCELA e REINICIA
              → Lista anterior ainda visível

T = 2500ms  : Timer completa novamente
              → Nova busca inicia
              → Loading aparece ⏳

T = 3200ms  : Novos resultados chegam!
              → Lista atualiza com novos resultados 📋
```

---

## 💡 Por que Debounce?

### Sem Debounce:

```
Usuário digita: "Rua Josias da Silva"
Caracteres: 22

Buscas executadas: 22
Chamadas de API: 22 ❌
Tempo total: ~44 segundos
Performance: PÉSSIMA 🐌
```

### Com Debounce (500ms):

```
Usuário digita: "Rua Josias da Silva"
Tempo digitando: ~5 segundos
Pausa ao final: 500ms

Buscas executadas: 1
Chamadas de API: 1 ✅
Tempo total: ~1-2 segundos
Performance: ÓTIMA ⚡
```

**Economia: 95% menos chamadas!**

---

## 🎨 Estados Visuais

### Estado 1: Vazio

```
🔍 Buscar endereço
```

### Estado 2: Digitando (< 3 chars)

```
🔍 Ru
```

### Estado 3: Buscando

```
🔍 Rua Josias    ⏳
```

### Estado 4: Resultados

```
🔍 Rua Josias    ❌
┌──────────────────┐
│ 📍 Resultado 1   │
│ 📍 Resultado 2   │
│ 📍 Resultado 3   │
└──────────────────┘
```

### Estado 5: Sem Resultados

```
🔍 xyzabc123    ❌
┌──────────────────┐
│ Sem resultados   │
└──────────────────┘
```

---

## ✨ Experiência do Usuário

**Fluxo Natural:**

1. Usuário começa a digitar
2. Após 3 caracteres, vê o loading
3. Meio segundo depois, vê os resultados
4. Continua digitando → resultados atualizam
5. Encontra o que quer → clica
6. Mapa move automaticamente
7. ✨ Mágica!

**Resultado:** Experiência fluida e responsiva, igual aos melhores apps do mercado! 🚀

---

**Implementado e Funcionando!** ✅
