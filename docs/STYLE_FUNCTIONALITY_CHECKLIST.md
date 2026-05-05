# Style + Funcionalidades Checklist (App + Backend)

## Como usar
- [x] Documento criado para controle continuo
- [ ] Cada item so vira `[x]` apos implementacao + validacao tecnica (`tsc`/`node --check`) + teste manual rapido

## 1) Base visual (Design System)
- [ ] Tokens unicos de cor (sem duplicacao e sem hex solto em telas novas)
- [ ] Escala tipografica unica (titulos, subtitulos, corpo, legenda)
- [ ] Escala de espacamento e raio aplicada em componentes compartilhados
- [ ] Variantes padrao de botao (primario, secundario, perigo, ghost)
- [ ] Estado de loading/erro/vazio padronizado para listas e formularios
- [ ] Revisao de contraste e areas de toque minimas

## 2) Fluxo publico (onboarding + auth)
- [x] Verificacao de telefone backend + app
- [x] Validacao forte de telefone antes de avancar cadastro
- [x] Recuperacao de senha com reenvio real de codigo
- [x] Pos-cadastro motorista alinhado com permissao de notificacao
- [x] Bloqueio de contas desativadas ja na etapa de login Google
- [x] Validacao adicional de email/nome/telefone no cadastro manual e Google
- [x] Fallback manual de localizacao (UF/cidade) quando GPS falhar no cadastro
- [x] Validacao de consistencia no fallback de localizacao (UF com 2 letras e cidade minima)
- [x] Intro com acao explicita de pular para reduzir friccao de entrada
- [ ] Revisao final de copy e consistencia dos CTAs (intro/login/cadastro)
- [ ] Hardening de erros offline no onboarding

## 3) Fluxo cliente (corrida + entrega + frete)
- [x] Home com leitura mais clara de modos de servico
- [x] Busca de motorista com fallback de polling e estados terminais
- [x] Tracking com rejoin em reconexao de socket e chat mais robusto
- [ ] Revisao completa do fluxo de cancelamento (regras/taxas/comunicacao)
- [ ] Fechar experiencia de pos-corrida (avaliacao/gorjeta/comprovante)
- [ ] Revisar carteira e metodos de pagamento ponta a ponta

## 4) Fluxo motorista
- [x] Revisar aceite/rejeicao e tratamento de timeout (sincronizacao inicial + limpeza de ofertas expiradas)
- [x] Alinhar calculo de ganhos/saldo/extrato para usar `pricing.driverValue` com fallback legado
- [ ] Revisar retomada de corrida ativa ao reabrir o app
- [ ] Revisar status operacionais ate conclusao
- [ ] Revisar ganhos/extrato/saque com regras claras

## 5) Backend e contratos
- [x] Endpoints de telefone adicionados (`send-phone-code`, `verify-phone-code`)
- [x] Metodo de pagamento normalizado na criacao de corrida
- [x] Hardening de validacao em `auth` para `checkEmail`, `forgotPassword` e telefone em `updateProfile`
- [ ] Padronizar shape de erro HTTP por modulo (`auth`, `rides`, `wallet`, `chat`)
- [ ] Revisar validacoes de payload em todos endpoints criticos
- [ ] Revisar coerencia final de status de corrida entre app e backend

## 6) Qualidade e operacao
- [x] Validacao tecnica recorrente com `npx tsc --noEmit`
- [x] Validacao sintatica backend alterado com `node --check`
- [x] Criar roteiro de testes manuais por fluxo (cliente/motorista)
- [ ] Adicionar testes de regressao minimos (auth + ride lifecycle)
- [ ] Revisar logs de erro e observabilidade minima
