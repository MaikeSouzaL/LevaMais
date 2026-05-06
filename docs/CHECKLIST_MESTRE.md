# Checklist Mestre
## A. Base visual e UX
- [ ] Consolidar tokens finais de design system
- [ ] Revisar acessibilidade minima em telas principais
## B. Fluxo publico
- [x] Intro/Login/Cadastro/Verificacao estabilizados
- [ ] Rodar validacao manual final do funil completo
## C. Cliente
- [x] Busca e tracking com resiliencia melhorada
- [x] Fechar experiencia de pos-corrida (avaliacao/comprovante)
- [x] Completar menus de perfil/suporte/pagamentos com rotas funcionais
- [x] Implementar agendamento e oferta de preco no fluxo de pedido
- [x] Implementar tela e fluxo de plantao para comercios/restaurantes
## D. Motorista
- [x] Retomada de corrida ativa ao reabrir app
- [x] Status operacionais consolidados
- [x] Revisar regras finais de ganhos/extrato/saque
- [x] Completar menus de operacao (avaliacoes, documentos, preferencias, suporte)
- [x] Fluxo de resposta a oferta (aceite/contraoferta)
- [x] Implementar aceite de plantao e bloqueio de corridas durante horario ativo
## E. Backend
- [x] Auth com validacoes e erros padronizados
- [x] Rides com hardening de transicoes e erros
- [x] Chat com seguranca por corrida (HTTP + WebSocket)
- [x] Padronizar erros e validacoes nos modulos restantes
## F. Qualidade
- [x] Verificacao tecnica recorrente (`tsc`, `node --check`)
- [ ] Rodar bateria de testes manuais ponta a ponta
- [x] Criar e executar regressao minima automatizada
