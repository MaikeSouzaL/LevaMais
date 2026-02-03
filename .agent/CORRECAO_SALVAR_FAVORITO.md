# ❤️ AJUSTE AO SALVAR FAVORITOS

## 📅 Data: 02/02/2026 - 21:12
## 🎯 Status: CORRIGIDO

Melhoria na robustez do salvamento de favoritos para evitar erros de validação no backend.

---

## 🛠️ CORREÇÕES

### 1. Dados Completos de Endereço 📦
Anteriormente, enviávamos apenas o "Endereço Formatado" e as coordenadas. Isso podia causar rejeição no servidor se ele esperasse campos separados (Rua, Bairro, CEP).
- **Agora:** O app captura e envia o objeto completo de detalhes do Google Places.
- Campos enviados: `street`, `streetNumber`, `neighborhood`, `city`, `state`, `postalCode`.

### 2. Estabilidade do Mapa 🗺️
Corrigimos um problema onde a câmera do mapa podia não focar corretamente ao abrir a tela com um local pré-definido.

Com esses ajustes, o erro de "carregar favoritos" (que na verdade era ao salvar, impedindo que eles aparecessem depois) deve ser resolvido.

---

**Antigravity AI** 🚀
