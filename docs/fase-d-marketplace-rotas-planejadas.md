# Fase D — Índice (Marketplace + Rotas Planejadas)

> O plano da Fase D foi **dividido em dois documentos focados**. Este arquivo é apenas o índice.
> **Última atualização:** 2026-06-05

A Fase D transforma o Leva+ em uma plataforma com **marketplace** (estilo iFood) e **rotas planejadas / maloteiro** (transportadora colaborativa entre cidades). Por terem superfícies, ritmos e times distintos, os planos foram separados:

## 📦 Planos

| Documento | Trilha | Escopo | Status |
|---|---|---|---|
| **[`fase-d-marketplace.md`](./fase-d-marketplace.md)** | Marketplace (D0–D6 + D10) | Lojas parceiras vendem produtos/serviços; comissão por venda; **web cliente** + **portal parceiro separado** + **admin** | D0/D1 ✅ · D2 🟡 · backend D3–D5 presente; frontends pendentes |
| **[`fase-d-app-rotas-maloteiro.md`](./fase-d-app-rotas-maloteiro.md)** | App / Maloteiro (D7–D9) | Motorista publica rota futura; cliente reserva espaço; **tudo no app** | D7/D8 ✅ · D9 🟡 (execução feita; Ride/tracking/bundling pendentes) |

## Princípios comuns às duas trilhas
- **Reaproveitar, não reinventar:** `Ride(serviceType="delivery")` é a única unidade de execução logística; Marketplace e Rotas são *produtores de entregas*.
- **Pagamento:** escrow LevaPay (`walletEscrow.service`) — hold na origem comercial, release na conclusão.
- **Fundação D0** (modelos + aditivos em `Ride`/`Promotion`/`PlatformConfig`) é **compartilhada** e já está concluída.
- **Superfícies:** o **app cliente não compra no marketplace** (isso é web); o app é o canal das **rotas planejadas**, corrida, entrega, frete e acompanhamento.

## Decomposição original (referência)
- **Trilha Marketplace:** `D0 → D1 → D2 → D3 → D4 → D5 → D6` (+ `D10` transversal) → `fase-d-marketplace.md`
- **Trilha Rotas:** `D7 → D8 → D9` → `fase-d-app-rotas-maloteiro.md`
