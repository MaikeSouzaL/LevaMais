# App + Backend Manual Tests V1

## Regras de execucao
- [ ] Rodar em ambiente com backend ativo e app limpo (logout + cache limpo)
- [ ] Registrar resultado por caso: `PASS`, `FAIL`, `BLOCKED`
- [ ] Em `FAIL`, anexar tela/erro e endpoint envolvido

## 1) Onboarding e auth publico
- [ ] Intro: avancar/voltar slides sem travar e ir para login no ultimo slide
- [ ] SignUp manual: bloquear nome curto, email invalido e telefone sem DDD
- [ ] SignUp Google: exigir telefone valido antes de seguir
- [ ] PhoneVerification: envio inicial automatico + reenvio com cooldown
- [ ] PhoneVerification: bloquear codigo incompleto e aceitar codigo valido
- [ ] SelectProfile: navegar para fluxo cliente e fluxo motorista corretamente
- [ ] SignIn manual: login com credenciais validas e bloquear invalidas
- [ ] SignIn Google: impedir entrada de conta desativada
- [ ] ForgotPassword: solicitar codigo, validar codigo e redefinir senha

## 2) Cadastro completo cliente
- [ ] Step1 dados: validar CPF/CNPJ e campos obrigatorios
- [ ] Step2 endereco: preencher por GPS
- [ ] Step2 endereco: fallback manual de UF/cidade quando GPS falhar
- [ ] Step3 preferencias: permitir PIX, dinheiro e cartao
- [ ] Finalizar: criar conta, autenticar e abrir tela de notificacao

## 3) Cadastro completo motorista
- [ ] Step1 dados: validar documento e dados obrigatorios
- [ ] Step2 veiculo: obrigar tipo de veiculo
- [ ] Step3 localizacao: preencher por GPS
- [ ] Step3 localizacao: fallback manual de UF/cidade
- [ ] Finalizar: criar motorista, autenticar e abrir tela de notificacao

## 4) Corridas cliente
- [ ] Criar corrida com origem/destino validos
- [ ] Busca de motorista: transicao para tracking em aceite
- [ ] Busca de motorista: expirar/cancelar sem travar UI
- [ ] Tracking: receber updates de status e localizacao
- [ ] Tracking: chat com unread badge correto fora da tela de chat
- [ ] Cancelamento: aplicar regra de taxa quando cabivel

## 5) Fluxo motorista
- [ ] Requests: receber nova solicitacao em tempo real
- [ ] Requests: re-sincronizar lista ao reconectar socket
- [ ] Aceite: navegar para corrida ativa
- [ ] RideScreen: atualizar status (`arrived` -> `in_progress` -> `completed`)
- [ ] RideScreen: chat com unread badge correto

## 6) Wallet
- [ ] Balance: retornar saldo sem erro de contrato
- [ ] Withdraw: bloquear valor invalido e chave PIX ausente
- [ ] Withdraw: bloquear quando saldo insuficiente
- [ ] Statement: listar entradas e saidas ordenadas por data

## 7) Contrato HTTP (shape de erro)
- [ ] `rides`: validar retorno padrao com `success:false`, `message`, `error` nos endpoints ajustados
- [ ] `wallet`: validar retorno padrao com `success:false`, `message`, `error`
- [ ] `auth`: validar padrao e mensagens de validacao
