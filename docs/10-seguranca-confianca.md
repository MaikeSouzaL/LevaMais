# 10 — Segurança e Confiança

## PIN de Coleta e Entrega

### Para que serve
O PIN é um código de 6 dígitos que garante que:
- O **pacote foi entregue à pessoa certa** (destinatário valida o PIN)
- O motorista não pode marcar "entregue" sem a confirmação presencial

### Como funciona

**Geração:**
- PIN de coleta: gerado pelo app e entregue ao remetente
- PIN de entrega: gerado pelo app e entregue ao destinatário (via WhatsApp, SMS, etc.)

**Validação:**
```
POST /api/rides/:rideId/validate-pin
{
  pin: "483921",
  phase: "pickup" | "delivery"
}
```

**Regras:**
- Máximo 3 tentativas por fase
- Após 3 erros → bloqueio + alerta ao cliente
- PIN errado não avança o status
- PIN correto:
  - Pickup: `proofs.pickupPinValidated = true`
  - Delivery: `proofs.deliveryPinValidated = true`

**Quando o PIN é obrigatório:**
- Configurável: pode ser exigido sempre ou só para cargas de valor alto
- Padrão: habilitado para entregas (`delivery`), opcional para corridas

---

## Fotos de Prova (Proof of Delivery)

### Foto de Coleta (`pickupProof`)
- Motorista fotografa o pacote **antes de sair do ponto de coleta**
- Protege o motorista de: "o motorista pegou o item errado" ou "não coletou nada"
- Upload: `POST /api/rides/:rideId/proof/pickup`

### Foto de Entrega (`deliveryProof`)
- Motorista fotografa o pacote no destino (mesmo que destinatário não esteja presente)
- Evidência de entrega
- Upload: `POST /api/rides/:rideId/proof/delivery`

### Armazenamento
- Atualmente: base64 no campo `ride.proofs.pickupPhoto` / `deliveryPhoto`
- Em produção: migrar para S3/CloudStorage com URL assinada

---

## SOS / Emergência

### Botão SOS
Disponível em `SafetyCenterScreen` (cliente) e `DriverSafetyScreen` (motorista).

**Ações ao acionar:**
1. Registra o evento: `POST /api/rides/:rideId/sos`
2. Envia alerta para equipe de suporte da plataforma
3. Compartilha localização atual em tempo real
4. (Futuro) Envia SMS para contato de emergência cadastrado

**Endpoint:**
```
POST /api/rides/:rideId/sos
```

---

## Rastreamento Público (Link de Compartilhamento)

### Para que serve
Permite que terceiros (familiar, empresa) acompanhem a entrega em tempo real sem ter o app instalado.

**Gerar link:**
```
GET /api/rides/:rideId/share-token
→ { token: "abc123xyz", url: "https://app.levamais.com.br/track/abc123xyz" }
```

**Acessar (público, sem auth):**
```
GET /api/rides/track/:rideId
```
Retorna posição atual do motorista + status da entrega.

**Na tela:** botão "Compartilhar rastreamento" no `DeliveryTracking`.

---

## Auditoria de Rota

### `RouteAuditScreen`
Permite ao cliente e motorista ver a rota percorrida após a conclusão.

- Mapa com traçado GPS real da corrida
- Comparação: rota planejada × rota real
- Serve para disputas ("motorista fez caminho longo?")

**Dados:**
- Pontos GPS salvos durante execução: `POST /api/rides/:rideId/track-points`
- Consulta: `GET /api/rides/:rideId/route-audit`

**Modelo:** `RideTrackPoint`
```js
{
  rideId: ObjectId,
  latitude: Number,
  longitude: Number,
  speed: Number,
  timestamp: Date
}
```

---

## KYC — Verificação de Identidade

### Motorista
| Verificação | Como |
|------------|------|
| CNH | Foto frente/verso, análise humana pelo admin |
| FaceMatch | Comparação selfie × CNH via IA (`facematch.service.js`) |
| Background Check | Antecedentes criminais (`background-check.service.js`) |
| Placa do veículo | Consulta em API oficial |
| CRLV | Foto frente/verso, análise humana |

Todas as verificações ficam em `user.driverDocuments` com status individual por documento.

### Cliente
| Verificação | Como |
|------------|------|
| Telefone | SMS/WhatsApp (obrigatório) |
| CPF | Verificação via API Receita Federal |
| Selfie | Para corridas de alto valor (opcional) |

---

## Proteção contra Fraude

1. **Taxa de cancelamento** — desencoraja cancelamentos maliciosos
2. **Dívida pendente** — cliente não consegue pedir corridas com dívida em aberto
3. **Limite de tentativas de PIN** — previne força bruta
4. **Conta bloqueada/suspensa** — admin pode bloquear contas suspeitas
5. **CPF/CNPJ hash** — previne múltiplos cadastros com mesmo documento
6. **Rate limiting** — endpoints sensíveis têm limite de requisições
7. **JWT com expiração** — tokens inválidos após prazo

---

## Privacidade (LGPD)

### Dados criptografados em repouso
- CPF: AES-256-CBC
- CNPJ: AES-256-CBC
- Hash SHA-256 para consulta sem descriptografar

### Direitos do usuário
- **Exportar dados**: `GET /api/auth/privacy-export`
- **Revogar consentimento**: `POST /api/auth/privacy-revoke`
- **Deletar conta**: `POST /api/auth/account-delete`
  - Dados pessoais anonimizados
  - Histórico financeiro mantido por obrigação legal (5 anos)

### Consentimento
- Aceite dos termos e política registrado com data e versão
- `user.acceptedTermsAt`, `user.termsVersion`, `user.privacyPolicyVersion`
