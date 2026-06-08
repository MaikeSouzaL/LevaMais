# 16 — API: Referência de Endpoints

Base URL: `http://192.168.1.7:3005/api`

Autenticação: `Authorization: Bearer <JWT>` (exceto onde marcado como público)

---

## Auth (`/api/auth`)

### Público
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cadastrar usuário |
| POST | `/auth/login` | Login e-mail+senha |
| POST | `/auth/google` | Login via Google OAuth |
| POST | `/auth/check-email` | Verificar se e-mail existe |
| POST | `/auth/send-phone-code` | Enviar código SMS/WhatsApp |
| POST | `/auth/verify-phone-code` | Verificar código de telefone |
| POST | `/auth/forgot-password` | Solicitar reset de senha |
| POST | `/auth/verify-reset-code` | Verificar código de reset |
| POST | `/auth/reset-password` | Definir nova senha |

### Protegido (requer JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/profile` | Obter perfil do usuário logado |
| PATCH | `/auth/profile` | Atualizar perfil |
| PATCH | `/auth/location` | Atualizar localização GPS |
| POST | `/auth/profile-photo` | Upload de foto de perfil |
| POST | `/auth/driver-verification` | Enviar documentos de motorista |
| POST | `/auth/client-verification` | Enviar documentos de cliente |
| POST | `/auth/push-token` | Salvar token de push notification |
| DELETE | `/auth/push-token` | Remover token de push |
| GET | `/auth/payment-methods` | Listar cartões cadastrados |
| POST | `/auth/payment-methods` | Adicionar cartão |
| PATCH | `/auth/payment-methods/:id/default` | Definir cartão padrão |
| DELETE | `/auth/payment-methods/:id` | Remover cartão |
| GET | `/auth/wallet` | Saldo e histórico da carteira |
| POST | `/auth/wallet/topup` | Recarregar carteira LevaPay |
| GET | `/auth/notifications` | Listar notificações |
| GET | `/auth/privacy-export` | Exportar dados (LGPD) |
| POST | `/auth/privacy-consent` | Registrar consentimento |
| POST | `/auth/privacy-revoke` | Revogar consentimento |
| POST | `/auth/account-delete` | Solicitar exclusão de conta |
| POST | `/auth/favorite-drivers` | Adicionar motorista favorito |
| DELETE | `/auth/favorite-drivers` | Remover motorista favorito |
| GET | `/auth/favorite-drivers` | Listar motoristas favoritos |

### Admin (requer `userType: "admin"`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/users` | Listar todos os usuários |
| GET | `/auth/users/:id` | Buscar usuário por ID |
| PATCH | `/auth/users/:id` | Atualizar usuário |
| DELETE | `/auth/users/:id` | Deletar usuário |
| PATCH | `/auth/users/:id/client-verification` | Aprovar/rejeitar docs do cliente |
| PATCH | `/auth/users/:id/driver-verification` | Aprovar/rejeitar docs do motorista |
| PATCH | `/auth/users/:id/account-status` | Suspender/bloquear conta |
| GET | `/auth/platform-config` | Obter configuração da plataforma |
| PATCH | `/auth/platform-config` | Atualizar configuração |
| GET | `/auth/withdrawals` | Listar saques pendentes |
| PATCH | `/auth/withdrawals/:id` | Aprovar/rejeitar saque |

---

## Rides (`/api/rides`)

### Público
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/rides/track/:rideId` | Rastreamento público (sem auth) |

### Cálculo (requer JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/rides/calculate-price` | Calcular preço de entrega |
| POST | `/rides/calculate-ride-estimate` | Estimar corrida InDriver |
| POST | `/rides/calculate-ride-categories` | Listar categorias com preços |

### CRUD e Ciclo de Vida
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/rides` | Criar novo pedido |
| GET | `/rides` | Histórico de corridas do usuário |
| GET | `/rides/:rideId` | Buscar corrida por ID |
| GET | `/rides/active` | Corrida ativa atual |
| GET | `/rides/active/list` | Lista de corridas ativas |
| PATCH | `/rides/:rideId/status` | Atualizar status |
| POST | `/rides/:rideId/accept` | Motorista aceitar corrida |
| POST | `/rides/:rideId/reject` | Motorista rejeitar corrida |
| POST | `/rides/:rideId/cancel` | Cancelar corrida |
| POST | `/rides/:rideId/retry` | Reiniciar busca de motorista |

### Marketplace de Ofertas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/rides/:rideId/offers` | Listar ofertas recebidas |
| POST | `/rides/:rideId/offers/respond` | Motorista faz oferta |
| POST | `/rides/:rideId/offers/client-counter` | Cliente contra-oferta |
| POST | `/rides/:rideId/offers/select` | Cliente seleciona oferta |
| POST | `/rides/:rideId/offers/decline` | Cliente recusa oferta |
| POST | `/rides/:rideId/offers/increase` | Cliente aumenta lance |

### Avaliações e Gorjeta
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/rides/:rideId/rate-driver` | Cliente avalia motorista |
| POST | `/rides/:rideId/rate-client` | Motorista avalia cliente |
| POST | `/rides/:rideId/tip` | Cliente dá gorjeta |

### Entrega — Segurança
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/rides/:rideId/proof/pickup` | Upload foto de coleta |
| POST | `/rides/:rideId/proof/delivery` | Upload foto de entrega |
| POST | `/rides/:rideId/validate-pin` | Validar PIN de coleta/entrega |
| POST | `/rides/:rideId/delivery-problem` | Reportar falha na entrega |

### Rastreamento GPS
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/rides/:rideId/track-points` | Salvar pontos GPS da rota |
| GET | `/rides/:rideId/route-audit` | Auditoria de rota percorrida |

### Motorista — Consultas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/rides/available-requests` | Pedidos disponíveis para o motorista |
| GET | `/rides/negotiations/pending` | Negociações pendentes do motorista |
| GET | `/rides/nearby-drivers` | Motoristas próximos (cliente) |
| GET | `/rides/stats` | Estatísticas do motorista |
| GET | `/rides/earnings-history` | Histórico de ganhos (7 dias) |

### Agendamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/rides/:rideId/promote-to-scheduled` | Converter para corrida agendada |
| GET | `/rides/scheduled/available` | Corridas agendadas disponíveis |
| POST | `/rides/:rideId/accept-scheduled` | Aceitar corrida agendada |

### Surge Pricing
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/rides/surge/:lat/:lng` | Multiplicador de surge na área |
| GET | `/rides/heatmap/:lat/:lng` | Heatmap de demanda |

### Pagamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/rides/:rideId/pix-payment` | Gerar QR code PIX para a corrida |
| POST | `/rides/:rideId/pix-payment/confirm-mock` | Confirmar pagamento PIX (mock/dev) |
| GET | `/rides/:rideId/nfse` | NFS-e simulada (comprovante fiscal) |

### Funcionalidades Extras
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/rides/:rideId/chat` | Histórico de chat |
| POST | `/rides/:rideId/sos` | Acionar SOS |
| PATCH | `/rides/:rideId/add-stop` | Adicionar parada intermediária |
| PATCH | `/rides/:rideId/change-dropoff` | Alterar destino |
| GET | `/rides/:rideId/share-token` | Gerar link de rastreamento público |
| POST | `/rides/:rideId/queue` | Entrar na fila de espera |

---

## Driver (`/api/driver`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/driver/balance` | Saldo atual do motorista |
| POST | `/driver/balance/deposit` | Adicionar depósito |
| POST | `/driver/balance/deduct` | Deduzir saldo (uso interno) |
| GET | `/driver/balance/history` | Histórico de transações |
| POST | `/driver/balance/withdrawal-request` | Solicitar saque |
| POST | `/driver/check-ride-availability` | Verificar se pode aceitar corridas |
| POST | `/driver/go-online` | Ficar online |
| POST | `/driver/go-offline` | Ficar offline |
| PUT | `/driver/preferences` | Atualizar preferências de trabalho |
| GET | `/driver/vehicles` | Listar veículos |
| POST | `/driver/vehicles` | Adicionar veículo |
| POST | `/driver/vehicles/:id/documents` | Upload de documentos do veículo |
| PATCH | `/driver/vehicles/:id/activate` | Ativar veículo |
| PATCH | `/driver/vehicles/:id/ride-category` | Definir categoria do veículo |

### Admin
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/driver/admin/withdrawals` | Listar todos os saques |
| POST | `/driver/admin/withdrawals/:driverId/:id/pay` | Marcar saque como pago |
| POST | `/driver/admin/withdrawals/:driverId/:id/reject` | Rejeitar saque |

---

## Wallet (`/api/wallet`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/wallet` | Saldo e histórico completo |
| POST | `/wallet/deposit` | Depositar via PIX/cartão |

---

## Outros

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/cities` | Cidades atendidas |
| GET | `/promotions` | Promoções/cupons ativos |
| GET | `/purposes` | Finalidades de viagem |
| POST | `/disputes` | Abrir disputa/contestação |
| GET | `/shift-offers` | Ofertas de turno disponíveis |

---

## Códigos de Resposta

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Criado com sucesso |
| 400 | Dados inválidos / Regra de negócio |
| 401 | Token inválido ou expirado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: já existe) |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

## Formato de Erro Padrão

```json
{
  "success": false,
  "message": "Saldo LevaPay insuficiente para esta entrega.",
  "error": "INSUFFICIENT_BALANCE",
  "details": {
    "required": 35.00,
    "available": 20.00
  }
}
```
