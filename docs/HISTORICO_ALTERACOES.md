# Historico de Alteracoes
## 2026-05-05 - Bloco App + Backend (fase atual)
- Hardening de auth, rides, wallet e chat
- Ajustes de fluxo do motorista com retomada e transicoes de status
- Consolidacao de calculo financeiro do motorista com driverValue
- Reorganizacao completa da documentacao para pasta docs
- Correcao do fluxo de saque PIX aleatorio (app/backend)
- Extrato financeiro com paginacao e metadados no backend + scroll incremental no app
- Hardening de localizacao do motorista e favoritos no backend (validacoes + permissoes + erros)
- Hardening de favorite-addresses e city no backend (validacoes + regras de duplicidade + erros padronizados)
- Revisao de fluxo Cliente/Motorista com correcoes criticas de retomada, timeout e coordenadas
- Integracao real de gorjeta, notificacoes, cartoes e carteira do cliente (remoção de mocks)
- Expansao e conexao dos menus/telas de Cliente e Motorista para padrao super-app (corrida + entrega + financeiro + suporte)
- Criacao da matriz de telas consolidada em `docs/MATRIZ_TELAS_APP.md`
- Implantacao de regressao minima automatizada do backend com `jest` + `supertest`
- Refatoracao do servidor para modo testavel (`createServer`) e smoke tests de seguranca/disponibilidade
- Remocao de indice duplicado no modelo `DriverLocation` (eliminando warning de execucao)
## Marco funcional atual
- App e backend operacionais com foco em estabilidade dos fluxos centrais
- Proxima frente: validacao manual ponta a ponta e fechamento de regressao minima
