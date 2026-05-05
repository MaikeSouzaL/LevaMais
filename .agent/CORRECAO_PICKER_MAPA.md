# 🎯 MAPA FOCADO E PIN DE ENDEREÇO

## 📅 Data: 02/02/2026 - 20:38
## 🎯 Status: IMPLEMENTADO

Correções realizadas para garantir que o mapa da tela de seleção de endereço (`AddressPickerScreen`) se comporte corretamente.

---

## 🛠️ AJUSTES REALIZADOS

### 1. 📍 Marcador (Pin) no Mapa
Agora, quando você seleciona um endereço na busca (ou já entra com um endereço definido), um **marcador vermelho** (pino padrão) aparece no mapa para confirmar visualmente a localização exata.

### 2. 🔍 Zoom Inicial Correto
O problema do mapa abrir mostrando "o mundo todo" (zoom 0) foi corrigido.
- Se o usuário já tiver uma localização, o mapa abre focado nela (Zoom 15+).
- Se estiver carregando, ele usa a localização do GPS do dispositivo.
- Adicionei um fallback para São Paulo caso o GPS demore, evitando a tela azul do oceano.

### 3. 🌑 Tema Escuro
Apliquei o mesmo estilo "Night Mode" da Home nesta tela para manter a consistência visual.

---

## 🧪 O QUE ESPERAR NO TESTE

1. Abra "Definir local atual".
2. O mapa deve abrir focado na sua região, não na África.
3. Se você buscar "Avenida Paulista, 1000", o mapa deve voar para lá e **mostrar um pino** no local.

---

**Antigravity AI** 🚀
