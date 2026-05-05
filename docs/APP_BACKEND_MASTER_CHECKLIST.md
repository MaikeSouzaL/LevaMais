# App + Backend Master Checklist (Uber/99/iFood benchmark)

## Status geral
- [x] Levantamento inicial de estrutura (app, backend, rotas, telas)
- [x] Mapa completo de telas do app (publico, cliente, motorista)
- [x] Mapa inicial de modulos e rotas do backend
- [x] Identificacao de bloqueios criticos de onboarding
- [ ] Revisao completa tela a tela com criterios de produto (manter/remover/refatorar)
- [ ] Revisao completa endpoint a endpoint com criterios de negocio e seguranca

## A. Style System e UX (App)
- [ ] Consolidar tokens unicos de design (cores, tipografia, espacamento, raio, elevacao)
- [ ] Padronizar headers, botoes, cards, listas e estados vazios
- [ ] Padronizar feedback de erro/sucesso/loading em todos os fluxos
- [ ] Revisar consistencia visual entre fluxo cliente e motorista
- [ ] Revisar acessibilidade minima (contraste, tamanho toque, labels)

## B. Onboarding e autenticacao
- [x] Corrigir backend para suportar verificacao de telefone (envio e validacao de codigo)
- [x] Conectar fluxo de verificacao de telefone no app com envio inicial automatico
- [x] Impedir cadastro manual sem telefone valido (DDD + numero)
- [x] Atualizar selecao de perfil para mensagem multiuso (corrida + entrega + comercio)
- [x] Bloquear login Google em conta desativada
- [x] Implementar reenvio real de codigo no fluxo de recuperacao de senha
- [x] Preencher email automaticamente no login apos redefinir senha
- [x] Unificar pos-cadastro do motorista com tela de permissao de notificacao
- [x] Tratar projectId de push nao configurado sem quebrar onboarding
- [ ] Revisar fluxo Intro -> Login -> Cadastro -> Selecao de perfil -> Conclusao
- [ ] Validar login Google para conta existente x conta nova sem friccao
- [ ] Garantir que todos os passos bloqueiem estados inconsistentes
- [ ] Revisar politicas de senha, termos e recuperacao de senha

## C. Fluxo Cliente (ride + delivery)
- [ ] Home com descoberta de servicos (carona, entrega, frete) clara e objetiva
- [ ] Solicitar corrida/entrega (origem, destino, categoria, motivo/servico)
- [ ] Selecao de veiculo e precificacao transparente
- [ ] Busca de motorista com estados e contingencias
- [ ] Rastreamento em tempo real + chat + seguranca
- [ ] Cancelamento com regras claras (taxa e justificativa)
- [ ] Conclusao: avaliacao, gorjeta, comprovantes
- [ ] Historico e detalhes de corridas/pedidos
- [ ] Carteira, pagamentos e metodos de pagamento
- [ ] Favoritos, notificacoes e central de seguranca

## D. Fluxo Motorista
- [ ] Home operacional (online/offline, demanda, mapa)
- [ ] Recebimento e resposta a chamadas (aceite/rejeicao)
- [ ] Fluxo operacional da corrida (a caminho, chegada, em viagem, concluida)
- [ ] Chat com cliente e recursos de seguranca
- [ ] Ganhos, extrato, saque e detalhes financeiros
- [ ] Historico, perfil, veiculo, ajuda e configuracoes

## E. Realtime, mapa e resiliencia
- [ ] Auditoria completa de websocket (conexao, reconexao, eventos zumbis)
- [x] Ajuste inicial de reconexao no tracking (rejoin automatico na corrida apos reconnect)
- [ ] Auditoria de atualizacao de localizacao (cliente/motorista)
- [ ] Contingencias offline e retomada de corrida ativa
- [ ] Normalizacao de estados de corrida entre app e backend

## F. Backend (dominio e API)
- [x] Implementar endpoints publicos de telefone: `/auth/send-phone-code` e `/auth/verify-phone-code`
- [ ] Revisar contrato de auth (payloads, mensagens, codigos HTTP)
- [x] Hardening inicial do cadastro auth (normalizacao/validacao de email, telefone, userType, preferredPayment)
- [ ] Revisar modulo de corridas (status, regras de transicao, validacoes)
- [ ] Revisar precificacao por cidade/veiculo/servico e fallbacks
- [x] Normalizar metodo de pagamento na criacao de corrida (mapper backend para `card/pix/cash/wallet`)
- [x] Padronizacao inicial de erros HTTP em `rides` (endpoints criticos) e `wallet` (`success:false`, `message`, `error`)
- [ ] Revisar carteira/saque/extrato e reconciliacao de valores
- [ ] Revisar chat e seguranca de acesso por corrida
- [ ] Revisar consistencia de modelos, indices e limpeza de dados

## G. Qualidade, seguranca e operacao
- [x] Validacao tecnica basica apos alteracoes (node --check + tsc --noEmit)
- [ ] Criar testes minimos de regressao para onboarding/auth
- [ ] Criar testes minimos de regressao para corrida (cliente/motorista)
- [ ] Revisar rate limiting e protecoes contra abuso em endpoints sensiveis
- [ ] Revisar logs estruturados e monitoramento de erros
- [ ] Revisar variaveis de ambiente e defaults de producao

## Proximos passos imediatos (Sprint App+Back #1)
- [x] Revisar e refatorar o fluxo de selecao de perfil para suportar melhor multiuso (pessoa, comercio/restaurante, motorista)
- [x] Fechar lacunas de navegacao do onboarding (sem telas "soltas" ou passos redundantes)
- [ ] Padronizar textos, nomes de rotas e estados de UI do onboarding
- [x] Criar roteiro de testes manuais guiados ponta a ponta (cliente e motorista)
- [ ] Rodar testes manuais guiados ponta a ponta (cliente e motorista)
