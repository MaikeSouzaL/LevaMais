O mapa não apareceu porque o código atual foi configurado para **ocultar o mapa no Android** caso não tenhamos uma chave de API do Google, exibindo apenas aquela mensagem de aviso.

### O Problema Técnico
No **Android**, a "API Nativa de Mapa" é, por definição, o **Google Maps**. O Google não permite o uso do seu mapa nativo sem uma API Key válida (mesmo que seja apenas para visualizar).
*   **iOS:** Usa Apple Maps (não exige chave para uso básico).
*   **Android:** Usa Google Maps (exige chave obrigatória).

### A Solução (Sem pagar API)
Para ter um mapa no Android **sem** usar a chave do Google, precisamos usar uma estratégia diferente: **OpenStreetMap via WebView**.
Isso significa que, em vez de um componente nativo do sistema, carregaremos um pequeno "navegador" que exibe o mapa livre (Leaflet/OpenStreetMap).

### Plano de Implementação
Vou alterar o arquivo `Step2Address.tsx` para usar uma abordagem híbrida:
1.  **No iOS (iPhone):** Mantemos o `react-native-maps` (Apple Maps Nativo), que é rápido e bonito.
2.  **No Android:** Substituímos a mensagem de aviso por um `WebView` carregando o **OpenStreetMap**.
    *   Isso garantirá que o mapa apareça visualmente.
    *   Ele será atualizado automaticamente quando a localização mudar.

Dessa forma, você terá mapas funcionando nos dois sistemas sem precisar configurar pagamentos ou chaves no Google Cloud.

**Podemos proceder com essa alteração?**