# Backlog de Execucao V2 - Leva_Mais

## Fase 1 - Consolidacao da base (1 semana)
- [ ] Mapear telas/rotas duplicadas e definir rota oficial por fluxo.
- [ ] Criar lista de arquivos legados para desativacao gradual.
- [ ] Revisar `authStore` e stores auxiliares para contrato unico de sessao.
- [ ] Padronizar servicos de API por dominio (`auth`, `ride`, `pricing`, `driver`, `wallet`).
- [ ] Garantir tipagem de navegacao para rotas criticas.

## Fase 2 - Fluxo Cliente E2E (1-2 semanas)
- [ ] Selecionar endereco origem/destino sem perda de estado.
- [ ] Selecionar servico/finalidade por tipo de veiculo.
- [ ] Simulacao de preco consistente com backend.
- [ ] Confirmacao e criacao de corrida.
- [ ] Busca de motorista com timeout e fallback.
- [ ] Tracking e atualizacao de status em tempo real.
- [ ] Cancelamento com regra de taxa.
- [ ] Encerramento e avaliacao.

## Fase 3 - Fluxo Motorista E2E (1-2 semanas)
- [ ] Online/offline confiavel com persistencia no backend.
- [ ] Recebimento de ofertas com filtro por cidade/veiculo.
- [ ] Aceite/recusa com lock para evitar corrida dupla.
- [ ] Navegacao operacional (coleta -> entrega).
- [ ] Finalizacao e registro de ganhos.
- [ ] Telas de carteira/extrato alinhadas ao backend.

## Fase 4 - Realtime e resiliencia (1 semana)
- [ ] Padronizar eventos socket e rooms por corrida.
- [ ] Reconexao automatica sem duplicar listeners.
- [ ] Reconciliacao por polling estrategico quando socket falhar.
- [ ] Notificacoes push para eventos criticos.

## Fase 5 - Qualidade e release (1 semana)
- [ ] Smoke tests automatizados dos fluxos criticos.
- [ ] Checklist de erro/loading/empty states.
- [ ] Teste em rede fraca e retomada de app.
- [ ] Build Android release e checklist de publicacao.

## Criterios de pronto
- Cliente e motorista completam fluxo principal sem bloqueio.
- Status de corrida consistente entre app e backend.
- Falhas de rede tratadas com recuperacao clara para usuario.
