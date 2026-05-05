# 🔍 AUTOCOMPLETE E AJUSTES DE PICKUP

## 📅 Data: 02/02/2026 - 20:34
## 🎯 Status: IMPLEMENTADO

A tela de seleção de endereço (`AddressPickerScreen`) foi atualizada para restaurar a funcionalidade de Autocomplete do Google Places e melhorar a ergonomia.

---

## 🛠️ MUDANÇAS REALIZADAS

### 1. Google Places Autocomplete 🗺️
- Substituímos o campo de texto simples pelo componente inteligente `AddressAutocomplete`.
- Ao digitar, sugestões do Google aparecem imediatamente.
- Ao selecionar uma sugestão, o mapa voa automaticamente para o local escolhido.

### 2. Ajuste de Layout (UI) 📐
- O campo de busca foi movido para baixo (`top: 60`), melhorando o acesso e visualização em dispositivos modernos com notch/ilha dinâmica.

---

## 🔄 COMO TESTAR

1. Na Home, toque em **"Definir local atual"**.
2. Digite um endereço no campo de busca.
3. Veja as sugestões aparecendo.
4. Toque em uma sugestão -> O mapa deve centralizar nela.
5. Toque em "Confirmar Endereço" -> Volta para a Home com o novo local definido.

---

**Antigravity AI** 🚀
