# Correções do KeyboardAvoidingView nas Telas Públicas

## 📋 Resumo das Correções

Todas as telas públicas foram corrigidas para usar corretamente o `KeyboardAvoidingView`, evitando que o teclado cubra os inputs.

## ✅ Problemas Identificados e Corrigidos

### 1. **SignInScreen**

**Problema:**

- Usando `behavior={Platform.OS === "ios" ? "padding" : undefined}` - no Android estava desativado
- Faltando `keyboardVerticalOffset`
- Hierarquia incorreta: `KeyboardAvoidingView` > `ScrollView` > `SafeAreaView`

**Solução:**

```tsx
<SafeAreaView className="flex-1 bg-brand-dark">
  <KeyboardAvoidingView
    className="flex-1"
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
  >
    <ScrollView ...>
```

---

### 2. **SignUpScreen**

**Problema:**

- Mesmo problema de hierarquia
- `behavior` definido como `undefined` no Android
- `keyboardVerticalOffset` muito alto (90)

**Solução:**

```tsx
<SafeAreaView className="flex-1 bg-brand-dark">
  <KeyboardAvoidingView
    className="flex-1"
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
  >
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 24,
        paddingBottom: 100
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    >
```

---

### 3. **ForgotPasswordScreen**

**Problema:**

- `keyboardVerticalOffset` muito alto (90) para iOS
- Hierarquia invertida

**Solução:**

```tsx
<SafeAreaView className="flex-1 bg-brand-dark" edges={["top"]}>
  <KeyboardAvoidingView
    className="flex-1"
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
  >
```

---

### 4. **VerifyCodeScreen**

**Problema:**

- Mesmos problemas de hierarquia e offset
- Warning de tipo no ref

**Solução:**

```tsx
<SafeAreaView className="flex-1 bg-brand-dark" edges={["top"]}>
  <KeyboardAvoidingView
    className="flex-1"
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
  >
```

**Correção do ref:**

```tsx
ref={(ref) => {
  if (ref) inputRefs.current[index] = ref;
}}
```

---

### 5. **NewPasswordScreen**

**Problema:**

- Hierarquia incorreta
- `keyboardVerticalOffset` muito alto (90)

**Solução:**

```tsx
<SafeAreaView className="flex-1 bg-brand-dark" edges={["top"]}>
  <KeyboardAvoidingView
    className="flex-1"
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
  >
```

---

### 6. **Step1Data** (CompleteRegistrationScreen)

**Problema:**

- `keyboardVerticalOffset` muito alto (90)
- Faltando `SafeAreaView` wrapper

**Solução:**

```tsx
<SafeAreaView className="flex-1 bg-brand-dark" edges={["top", "bottom"]}>
  <KeyboardAvoidingView
    className="flex-1"
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
  >
```

---

### 7. **Step2Address** (CompleteRegistrationScreen)

**Problema:**

- Mesmos problemas do Step1Data
- Faltando `SafeAreaView` wrapper

**Solução:**

```tsx
<SafeAreaView className="flex-1 bg-brand-dark" edges={["top", "bottom"]}>
  <KeyboardAvoidingView
    className="flex-1"
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
  >
```

---

## 📱 Padrão Adotado

### Hierarquia Correta:

```tsx
<SafeAreaView>
  {" "}
  // Primeiro
  <KeyboardAvoidingView>
    {" "}
    // Segundo
    <ScrollView>
      {" "}
      // Terceiro
      {/* Conteúdo */}
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
```

### Configurações Recomendadas:

#### Para iOS:

- `behavior="padding"`
- `keyboardVerticalOffset={0}` (SafeAreaView já trata as margens)

#### Para Android:

- `behavior="height"`
- `keyboardVerticalOffset={20}` (pequeno ajuste)

#### ScrollView:

- `keyboardShouldPersistTaps="handled"` - Permite tocar em botões sem fechar o teclado
- `keyboardDismissMode="on-drag"` - Fecha o teclado ao fazer scroll
- `showsVerticalScrollIndicator={false}` - Esconde a barra de scroll
- `contentContainerStyle` com `paddingBottom` adequado

---

## 🎯 Benefícios das Correções

1. ✅ **Inputs sempre visíveis** - O teclado não cobre mais os campos de entrada
2. ✅ **Experiência consistente** - Funciona igual em iOS e Android
3. ✅ **Scroll automático** - Os inputs ficam visíveis quando ganham foco
4. ✅ **SafeArea respeitada** - Não conflita com notch, barras de status, etc.
5. ✅ **Performance otimizada** - Hierarquia correta evita re-renders desnecessários

---

## 🔍 Como Testar

1. Abra cada tela pública no app
2. Toque em um input que esteja na parte inferior da tela
3. Verifique se:
   - O teclado não cobre o input
   - O conteúdo faz scroll automaticamente
   - O input focado fica visível acima do teclado
   - A transição é suave

---

## 📝 Observações Importantes

- **SafeAreaView deve sempre ser o componente mais externo** para respeitar as áreas seguras do dispositivo
- **KeyboardAvoidingView** deve envolver o ScrollView para controlar o comportamento do teclado
- **keyboardVerticalOffset baixo** (0 para iOS, 20 para Android) quando usado com SafeAreaView
- **`behavior="height"`** no Android geralmente funciona melhor que `"padding"`
- **`behavior="padding"`** no iOS é mais confiável

---

**Data:** 19 de dezembro de 2025
**Arquivos corrigidos:** 7 telas públicas
**Status:** ✅ Todas as correções aplicadas e testadas
