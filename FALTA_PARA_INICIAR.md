# 📌 Leva Mais — O que falta para iniciar (e concluir o MVP)

**Projeto:** Leva Mais (Mobile + Backend + Admin Web)  
**Objetivo deste documento:** listar, de forma executável, tudo que falta para colocar o projeto em funcionamento end‑to‑end e iniciar evolução com sprints.

> Observação importante: a **Fase 6 (Matching)** está documentada como **100% implementada no backend + serviços mobile**, mas **a integração UI no app** ainda é o grande gargalo.

---

## 1) Definição do que é “MVP pronto” (critério de pronto)

### MVP (Cliente)
- [ ] Usuário cria conta / login (email e Google)
- [ ] Usuário aceita termos e habilita notificações
- [ ] Usuário seleciona origem e destino no mapa
- [ ] Usuário escolhe tipo de veículo + tipo/finalidade do serviço (purposes)
- [ ] App calcula preço real (backend)
- [ ] Usuário confirma solicitação → **cria corrida** (backend)
- [ ] App mostra tela de “procurando motorista”
- [ ] App recebe evento **driver-found** via WebSocket
- [ ] App acompanha corrida (mapa + localização do motorista em tempo real)
- [ ] Usuário consegue cancelar antes/depois de aceitar (com taxa quando aplicável)
- [ ] Usuário finaliza corrida e vê histórico

### MVP (Motorista)
- [ ] Motorista cria conta / login
- [ ] Motorista tem modo **online/offline** (disponível)
- [ ] Motorista recebe solicitações em tempo real
- [ ] Motorista aceita/rejeita
- [ ] Motorista atualiza localização continuamente (driver-location)
- [ ] Motorista atualiza status: arrived → started → completed
- [ ] Motorista vê histórico

### MVP (Admin)
- [ ] Admin gerencia tipos de serviço (purposes) — já existe módulo
- [ ] Admin gerencia usuários (mínimo: listar e bloquear) **(provável falta)**
- [ ] Admin vê corridas (mínimo: listagem/consulta) **(provável falta)**

---

## 2) O que já está pronto (base para iniciar)

### Backend
✅ Auth (email/senha + Google)  
✅ Reset de senha via email  
✅ CRUD de purposes e favoritos  
✅ **Fase 6: Rides + DriverLocation + WebSocket + cálculo de preço** (documentado como concluído)

### Mobile
✅ Telas de onboarding/auth/mapa/seleção de destinos (pelo README)  
✅ Serviços `ride.service.ts` e `websocket.service.ts` prontos (Fase 6)

### Web Admin
✅ Next.js Admin com CRUD de purposes

---

## 3) Gaps críticos (por componente)

## 3.1 Mobile — o que falta implementar/integrar

### A) Integração do fluxo de corrida (cliente)
- [ ] **FinalOrderSummaryScreen**: chamar `ride.service.create()`
  - Inputs: pickup, dropoff, vehicleType, serviceType, pricing, distance/duration
  - Output: `rideId`
- [ ] **SearchingDriverModal**: escutar `driver-found` via websocket
  - Atualizar UI quando motorista aceitar
  - Timeout e tratamento (nenhum motorista)
- [ ] **Offers/Sheets**: substituir preços mockados por `ride.service.calculatePrice()`

### B) Tela de rastreio (tracking)
- [ ] **RideTrackingScreen** (nova)
  - Mapa com rota + marker do motorista
  - Listener `driver-location-updated`
  - Estados: aguardando motorista → motorista chegou → em corrida → finalizada
  - Ações: cancelar, chat, ligar, SOS (mesmo que stub)

### C) Chat (opcional no MVP, mas já há eventos)
- [ ] **ChatScreen** (integrar eventos `new-message`)
- [ ] UX: histórico, envio, notificações

### D) Histórico
- [ ] **RideHistoryScreen** (nova)
  - `ride.service.getHistory()`
  - filtros e paginação

### E) Fluxo motorista (provável grande falta)
Pelo README o motorista está “em desenvolvimento”. Para MVP:
- [ ] Telas driver: dashboard, corridas pendentes, corrida ativa
- [ ] Botão online/offline + status
- [ ] Aceitar/rejeitar corrida (usar endpoints)
- [ ] Atualização periódica de localização (background)

### F) Infra mobile essencial
- [ ] Guardar token e reconectar WebSocket após restart
- [ ] Permissões de localização (foreground + background se necessário)
- [ ] Tratamento de erros de rede / offline

---

## 3.2 Backend — o que falta (validar no código)
A documentação diz que rides/matching está pronto, mas para “iniciar o projeto” geralmente ainda faltam:

### A) Produção/segurança
- [ ] Rate limit e proteção anti abuso (auth/webhook)
- [ ] Logs estruturados
- [ ] Auditoria e observabilidade
- [ ] Validação forte (Zod/Joi) nos endpoints

### B) Pagamentos (planejado)
- [ ] Integração de pagamento (Pix/cartão)
- [ ] Split/repasse para motorista
- [ ] Recibos e conciliação

### C) Administração e relatórios
- [ ] Endpoints de admin: listar usuários, bloquear, listar rides, métricas

### D) Chat (persistência)
- [ ] Persistir mensagens (Mongo) e não só eventos

---

## 3.3 Web Admin — o que falta
Hoje ele parece focado em purposes.
- [ ] Tela/rotas para **Usuários** (listar, bloquear, tipo)
- [ ] Tela/rotas para **Corridas** (listar, status, detalhes)
- [ ] Dashboard (métricas básicas)

---

## 4) Roadmap sugerido (sprints)

### Sprint 0 — “Rodar tudo” (1–2 dias)
- [ ] Padronizar .env (backend, mobile, web)
- [ ] Rodar Mongo local/Atlas
- [ ] Rodar backend + seed motoristas
- [ ] Rodar app e confirmar login + mapa

### Sprint 1 — Cliente cria corrida (3–5 dias)
- [ ] calculatePrice real
- [ ] create ride
- [ ] tela “procurando motorista”
- [ ] receber driver-found

### Sprint 2 — Tracking e status (3–5 dias)
- [ ] RideTrackingScreen
- [ ] atualizar marcador do motorista
- [ ] cancelar corrida

### Sprint 3 — Motorista MVP (5–10 dias)
- [ ] dashboard motorista
- [ ] receber solicitações
- [ ] aceitar/rejeitar
- [ ] enviar localização
- [ ] status arrived/started/completed

### Sprint 4 — Histórico + acabamento (3–5 dias)
- [ ] histórico cliente/motorista
- [ ] melhorias UX
- [ ] erros/offline

### Sprint 5 — Admin mínimo (3–5 dias)
- [ ] users + rides no painel

---

## 5) Checklist de setup para “iniciar” agora

### Backend
- [ ] `backend/.env` preenchido
- [ ] MongoDB rodando
- [ ] `npm run dev` ok
- [ ] seed de motoristas executado (conforme docs da Fase 6)

### Mobile
- [ ] `src/services/api.ts` apontando para IP correto
- [ ] Google Sign-In configurado (arquivos client_secret)
- [ ] Maps API key configurada
- [ ] Expo Notifications configurado

### Web Admin
- [ ] `leva-mais-web` aponta para backend

---

## 6) Próximos documentos que eu recomendo gerar
- **ROADMAP.md** (macro) e **SPRINTS.md** (detalhado)
- **MVP_ACCEPTANCE_CRITERIA.md** (o que é “pronto”)
- **TEST_PLAN.md** (cenários QA)
- **DEPLOY.md** (produção)

---

## 7) Próximo passo imediato (pra você)

Me diga qual é a prioridade:
1) **Só cliente** (sem motorista real, simulando aceite) para demos rápidas
2) **Cliente + motorista** (MVP completo)

E me confirme se vocês vão rodar:
- tudo local (Mongo local) ou
- Atlas + backend hospedado

A partir disso, eu quebro o backlog em tasks menores por pasta/arquivo e já deixo um plano de execução bem direto.
