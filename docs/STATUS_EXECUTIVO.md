# Status Executivo
Data de atualizacao: 2026-05-05
## Escopo atual
- Prioridade principal: App mobile + Backend
- Front web: planejado para fase posterior
## Situacao atual
- Fluxo publico (intro, login, cadastro, verificacao, perfil): estabilizado com hardening
- Fluxo motorista: retomada de corrida ao reabrir app e status operacional alinhado
- Backend de corridas: transicoes criticas e erros padronizados
- Backend de autenticacao: validacoes e erros padronizados
- Chat (HTTP + WebSocket): seguranca por corrida reforcada
- Financeiro motorista: saque/extrato com validacoes reforcadas e paginacao no extrato
- Favoritos e cidades: validacoes e contratos reforcados no backend
- Fluxos cliente/motorista revisados com correcoes de retomada e timeout de busca
- Integracoes cliente que estavam em mock agora possuem backend real (gorjeta, notificacoes, cartao, carteira)
- Menus cliente expandidos e funcionais (comprovantes, pagamentos, cupons, suporte, privacidade, convite)
- Menus motorista expandidos e funcionais (avaliacoes, documentos, preferencias, suporte, repasses e incentivos)
- Fluxo novo de agendamento e negociacao de preco implementado (cliente e motorista)
## Em andamento
- Rodada manual ponta a ponta (cliente + motorista)
- Expansao da suite automatizada alem do smoke inicial
## Risco atual
- Falta rodada completa de testes manuais ponta a ponta (cliente/motorista)
- Falta consolidar regras de negocio de pagamentos reais (gateway) alem do MVP
