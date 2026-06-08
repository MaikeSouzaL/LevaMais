# 17 — Como o App Deve Funcionar (Visão de Produto)

Este documento descreve como cada parte do app **deve se comportar** do ponto de vista do produto e UX, referenciando os melhores padrões de Uber, 99, InDriver, Lalamove e iFood (logística).

---

## Princípios de Produto

1. **Velocidade acima de tudo** — cada interação deve ser instantânea ou com feedback imediato
2. **Transparência total** — preços, taxas e status sempre visíveis
3. **Confiança mútua** — mecanismos que protegem cliente e motorista
4. **Modelo InDriver** — negociação livre de preço diferencia o app no mercado

---

## 1. Onboarding

### Como deve funcionar
- Máximo 3 telas de onboarding com animações simples
- Cadastro em menos de 2 minutos (nome, e-mail, senha, telefone)
- Verificação de telefone: SMS deve chegar em < 30 segundos
- Permissão de GPS pedida com explicação clara do benefício
- **Não pedir muitas informações de uma vez** — colete o mínimo para começar, o resto depois

### Referência
- **Uber**: login com 2 toques via Google, pedido em < 30 segundos
- **99**: cadastro via Google muito fluido

---

## 2. Tela Home do Cliente

### Como deve funcionar
- Ao abrir: mapa centralizado na posição atual, motoristas visíveis como pontos
- Dois serviços claramente visíveis: **Corrida** e **Entrega**
- Se há pedido ativo: bottom sheet automático mostrando status
- Localização "minha casa" e "meu trabalho" facilmente acessíveis
- Barra de busca de destino no topo

### Comportamento esperado
- GPS localizando em < 3 segundos
- Motoristas no mapa se movendo em tempo real (animação suave)
- Contagem de motoristas disponíveis na área ("X motoristas próximos")
- **Histórico de destinos recentes** sugeridos ao tocar na busca

### Referência
- **Uber**: bottom sheet com serviços, destinos recentes, previsão imediata
- **99**: acesso rápido a favoritos na home

---

## 3. Fluxo de Entrega

### Como deve funcionar

**Entrada rápida:**
- Tocar "Entrega" → selecionar tipo de veículo → tela já mostra estimativa de preço
- Opção de usar endereços favoritos com 1 toque

**Informações do pacote:**
- Formulário com UX visual (ícones de tamanho, slider de peso)
- Preço atualiza em tempo real conforme preenche
- Mostrar "por que esse preço?" com detalhamento simples

**Definição do preço (modelo InDriver):**
- App sugere um preço calculado
- Cliente pode aumentar ou diminuir (dentro de faixa razoável)
- Incentivo visual para aumentar: "Preços maiores atraem motoristas mais rápido"

**Confirmação:**
- Resumo completo antes de enviar
- Estimativa de tempo visível
- PIN de entrega mostrado claramente com instrução: "Passe este código ao destinatário"

### Problemas a evitar
- ❌ Não forçar o cliente a digitar o mesmo endereço duas vezes
- ❌ Não esconder o preço até o último passo
- ❌ Não exigir muitos campos desnecessários para encomendas simples

---

## 4. Marketplace de Ofertas

### Como deve funcionar (referência InDriver + Lalamove)

**Layout do card de oferta:**
```
[Foto] João Silva  ⭐ 4.9 (234)
       Honda CG 160 • Azul
       ⏱ 6 min • 2,3 km de você
       
       💰 R$ 32,00          [Selecionar]
       
       [Aceitar esta oferta] ← destacado se "Recomendado"
```

**Ordenação:**
- "Recomendado" no topo: melhor combinação de ETA × preço
- Demais ordenados por valor crescente

**Interações:**
- Swipe para ver mais detalhes do motorista
- Contra-oferta: modal com slider de valor
- Aumentar meu lance: botão flutuante com destaque quando poucas ofertas

**Comportamento esperado:**
- Atualização em tempo real (nova oferta aparece com animação)
- Se não há ofertas em 2 min: sugestão "Aumente sua oferta para atrair motoristas"
- Timer visual mostrando quando o pedido expira
- **Oferta recomendada** destacada com badge verde

### Referência
- **InDriver**: lista limpa com oferta de contra-proposta
- **Lalamove**: ETA e distância em destaque, badge "Melhor opção"

---

## 5. Rastreamento em Tempo Real

### Como deve funcionar (referência Uber)

**Mapa:**
- Localização do motorista com seta de direção e animação suave
- Rota traçada (A → B) em azul
- Atualização de posição a cada 3–5 segundos sem piscar

**HUD (sobreposição no mapa):**
- Nome e foto do motorista
- Placa e modelo do veículo
- ETA dinâmico: "Chega em 4 min" → "Chega em 2 min" → "Chegou!"
- Barra de progresso das etapas: Coleta → Em rota → Entregue

**Ações visíveis:**
- 💬 Chat (com badge se não lida)
- 📞 Ligar
- ❌ Cancelar
- ❗ SOS (discreto, não assustador)

**Feedbacks sonoros/haptics:**
- Vibração quando motorista chega
- Som sutil quando status muda
- Notificação push se app em background

### Referência
- **Uber**: animação do carro se movendo é o ícone do produto
- **99**: rota traçada clara + ETA em destaque

---

## 6. Chat

### Como deve funcionar
- Interface estilo WhatsApp (mensagens próprias à direita, do outro à esquerda)
- Respostas rápidas (botões pré-definidos) para situações comuns
- Indicador de "digitando..."
- Entrega confirmada (✓ azul)
- Limite razoável de tamanho de mensagem
- **Atalho de emoji** para expressividade rápida

### Respostas rápidas sugeridas (cliente):
- "Já estou descendo"
- "Aguarda 2 minutos"
- "Estou na entrada principal"

### Respostas rápidas sugeridas (motorista):
- "Chegando em instantes"
- "Estou no local"
- "Não consigo localizar você"
- "Pacote coletado"

---

## 7. Pagamentos

### Como deve funcionar

**Seleção de método:**
- Visual com ícones claros
- LevaPay mostra saldo disponível ("R$ 71,74 disponíveis")
- Cartão mostra os últimos 4 dígitos
- PIX com ícone do PIX

**LevaPay (melhor experiência):**
- Pagamento instantâneo, sem telas extras
- Saldo reservado no aceite (cliente não precisa fazer nada)
- Após conclusão: notificação push "Entrega concluída. R$ 30,00 debitados"

**PIX:**
- QR code gerado em < 2 segundos
- Detecção automática de pagamento
- Fallback: código copiável se não conseguir abrir o QR

### Referência
- **Uber**: pagamento invisível — já tem o cartão, não precisa fazer nada
- **99**: LevaPay (crédito interno) = experiência mais fluida

---

## 8. Cancelamento

### Como deve funcionar

**Antes de motorista aceitar:**
- Cancelamento gratuito, imediato, sem confirmação extra
- "Pedido cancelado" e volta para Home

**Após motorista aceitar (dentro da janela grátis de 2 min):**
- Aviso: "Ainda dentro da janela grátis, sem cobrança"
- 1 toque para cancelar

**Após janela grátis:**
- Exibir claramente a taxa ANTES de confirmar
- "Taxa de cancelamento: R$ 8,50 (10% do valor)"
- Botão "Cancelar mesmo assim (R$ 8,50)"
- Botão "Não cancelar" em destaque (para evitar cancelamentos acidentais)

**Entrega em andamento:**
- Aviso que a devolução do pacote gera custo adicional
- Usuário precisa confirmar 2 vezes

---

## 9. Fluxo do Motorista

### Como deve funcionar

**Online/Offline:**
- Toggle grande e intuitivo
- Ao ficar online: mapa mostra pedidos próximos
- Ao ficar offline: confirmação se há pedido ativo

**Recebimento de pedido:**
- Alerta visual + sonoro + vibração
- Card com todas as informações necessárias para decisão:
  - Endereço de coleta e destino
  - Distância da coleta
  - Valor a receber (não o valor bruto — já o líquido!)
  - Tipo de carga (para entregas)
- Timer de 30 segundos para decidir
- Se não decidir → passa para próximo motorista automaticamente

**Durante a execução:**
- Navegação integrada (abre Maps/Waze com 1 toque)
- Botão de status grande e fácil
- Checklist visual: Coleta → Foto → PIN → Entrega → Foto → PIN → Concluir

### Referência
- **Uber**: driver app com timeline clara de etapas
- **iFood**: checklist de entrega com validação de cada etapa

---

## 10. Saldo e Pagamentos do Motorista

### Como deve funcionar

**Dashboard financeiro:**
- Ganhos de hoje em destaque
- Gráfico de barras dos últimos 7 dias
- Detalhamento: ganhos brutos / taxas / líquido

**Saldo:**
- Número grande e visível no canto da tela principal
- Alerta automático quando < R$ 20 (limite configurável)
- "Deposite agora" com 1 toque → PIX gerado

**Taxa da plataforma:**
- Sempre transparente: "Valor da corrida: R$ 30,00 — Taxa: R$ 4,50 — Seu ganho: R$ 25,50"
- Nunca ocultar a taxa
- Histórico de cada cobrança acessível

**Saque:**
- PIX instantâneo (com parceria bancária futura)
- Chave PIX salva → saque em 2 toques
- Confirmação com valor e chave antes de enviar

### Referência
- **Uber**: ganhos em tempo real, transparência de taxas
- **InDriver**: sem taxa de plataforma visível para o motorista (mas nós queremos o oposto — transparência total)

---

## 11. Avaliações

### Como deve funcionar

**Para o cliente (avaliando motorista):**
- Fluxo natural após conclusão, não obrigatório
- 5 estrelas + tags rápidas (3–4 opções relevantes ao contexto)
- Gorjeta integrada na mesma tela
- "Obrigado pela avaliação!" com animação de confete

**Para o motorista (avaliando cliente):**
- Mais simples, pode ser pulado
- Foco em: pontualidade, educação, facilidade de localizar

**Exibição nas ofertas:**
- Rating visível ao lado do nome
- Número de avaliações (ex: "⭐ 4.9 (234)") — dá credibilidade

---

## 12. Segurança

### O que deve ser sempre visível
- Botão SOS discreto mas acessível em 1 toque (canto superior)
- Nome, foto e placa do motorista com destaque
- Link de compartilhamento de viagem para familiar

### Validação de identidade
- Foto de perfil obrigatória (motorista)
- Placa e veículo devem bater com o esperado
- Para entregas de alto valor: PIN obrigatório

### Privacidade
- Números de telefone nunca compartilhados diretamente
- Chat mascarado como intermediário
- Localização precisa só durante a corrida

---

## 13. Melhorias Prioritárias (Roadmap de Produto)

### Alta Prioridade
1. **Mensagens rápidas no chat** — reduz atrito na comunicação
2. **Ligar com número mascarado** — privacidade para ambos
3. **Foto de perfil obrigatória para motoristas** — confiança do cliente
4. **ETA mais preciso no marketplace** — mostrar "chegando em X min" com confiança
5. **Tour interativo na primeira vez** — reduz abandono no onboarding

### Média Prioridade
6. **Corrida agendada para clientes** — agenda de viagens recorrentes
7. **Favoritos rápidos na home** — casa/trabalho com 1 toque
8. **Estimativa de preço antes de inserir destino** — como o Uber mostra preço ao vivo
9. **Notificação push de oferta expirada** — "Seu pedido não teve ofertas, tente aumentar o valor"
10. **Histórico com busca e filtro** — data, valor, tipo de serviço

### Futuro
11. **Avaliação do veículo** — foto do carro no perfil, estrelas separadas para limpeza
12. **Modo noturno** — automático por horário
13. **Entrega com múltiplos destinatários** — rota otimizada
14. **Seguro da carga** — valor declarado + cobertura
15. **Motorista favorito** — cliente pode solicitar motorista que já usou antes

---

## 14. KPIs do Produto

| Métrica | O que mede | Meta |
|---------|-----------|------|
| Time to First Ride | Tempo do cadastro à 1ª corrida | < 5 min |
| Offer Rate | % de pedidos que recebem ≥ 1 oferta em 5 min | > 80% |
| Match Rate | % de pedidos completados (vs. criados) | > 70% |
| Cancellation Rate | % de corridas canceladas | < 10% |
| Driver Rating | Média de avaliações dos motoristas | > 4.5 |
| Chat Response Time | Tempo médio de resposta no chat | < 60s |
| App Crash Rate | Crashes por sessão | < 0.1% |
