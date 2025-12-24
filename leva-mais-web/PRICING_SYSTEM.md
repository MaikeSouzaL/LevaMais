# 💰 Sistema de Preços & Regras - Documentação Completa

## 📋 Visão Geral

Sistema completo de configuração de preços dinâmicos, horários de pico, taxas de cancelamento e regras da plataforma para o LevaMais.

## 🎯 Arquivos Criados

### 1. **services/pricingService.ts**

Serviço TypeScript com lógica completa de preços

**Interfaces Principais:**

```typescript
interface VehiclePricing {
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  basePrice: number; // Preço base da corrida
  pricePerKm: number; // Preço por km rodado
  pricePerMinute: number; // Preço por minuto
  minimumPrice: number; // Valor mínimo da corrida
  enabled: boolean;
}

interface PeakHour {
  id: string;
  name: string;
  dayOfWeek: number[]; // 0-6 (Domingo-Sábado)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  multiplier: number; // Multiplicador (ex: 1.5 = +50%)
  enabled: boolean;
}

interface CancellationFee {
  type: "client" | "driver";
  timeLimit: number; // Minutos após aceitar
  feePercentage: number; // % do valor da corrida
  minimumFee: number; // Taxa mínima fixa
  enabled: boolean;
}

interface PlatformSettings {
  platformFeePercentage: number; // Taxa da plataforma (%)
  searchRadius: number; // Raio de busca em km
  driverTimeoutSeconds: number; // Tempo de espera por motorista
  maxDriversToNotify: number; // Máximo de motoristas a notificar
  autoAcceptRadius: number; // Raio para aceitação automática
}
```

**Métodos:**

- `getConfig()` - Buscar configuração atual
- `updateConfig(config)` - Atualizar configuração
- `calculateEstimate(params)` - Calcular preço estimado
- `getDefaultConfig()` - Retornar configuração padrão
- `validateConfig(config)` - Validar configuração

### 2. **app/settings/pricing/page.tsx**

Página completa com 1000+ linhas de código

## 🎨 Componentes da Interface

### 1. **Abas (Tabs)**

#### 📊 Preços por Veículo

Configuração individual para cada tipo de veículo:

- **Moto**: Preço base, por km, por minuto, mínimo
- **Carro**: Idem
- **Van**: Idem
- **Caminhão**: Idem

**Recursos:**

- Toggle ativo/inativo por veículo
- Cálculo de exemplo em tempo real
- Validação de valores
- Dica visual de como o preço é calculado

#### ⏰ Horários de Pico

Configuração de multiplicadores por horário e dia:

- **Nome** do horário
- **Dias da semana** (checkboxes para cada dia)
- **Horário de início** e **fim**
- **Multiplicador** de preço (1.0 a 5.0)
- **Ativar/Desativar**

**Recursos:**

- Adicionar múltiplos horários
- Remover horários
- Seleção múltipla de dias
- Preview do acréscimo de preço
- Exemplo de cálculo

#### ❌ Taxas de Cancelamento

Configuração de penalidades:

- **Cliente**: Taxa e tempo limite
- **Motorista**: Taxa e tempo limite

**Campos:**

- Tempo limite (minutos após aceitar)
- Percentual do valor da corrida
- Taxa mínima fixa (R$)
- Ativar/Desativar

**Recursos:**

- Exemplo de cálculo em tempo real
- Validação de valores

#### ⚙️ Configurações Gerais

Ajustes globais da plataforma:

1. **Taxa da Plataforma** (0-50%)

   - Slider + input numérico
   - Exemplo de cálculo

2. **Raio de Busca** (1-50 km)

   - Distância para procurar motoristas

3. **Tempo de Espera** (10-120 segundos)

   - Tempo que motorista tem para aceitar

4. **Máximo de Motoristas** (1-10)

   - Quantos motoristas notificar simultaneamente

5. **Raio de Auto-aceitação** (0-10 km)
   - Distância para aceitação automática

### 2. **Configurações Padrão**

#### Preços por Veículo

```javascript
Moto:
- Base: R$ 5,00
- Por km: R$ 1,50
- Por min: R$ 0,30
- Mínimo: R$ 8,00

Carro:
- Base: R$ 8,00
- Por km: R$ 2,00
- Por min: R$ 0,40
- Mínimo: R$ 12,00

Van:
- Base: R$ 15,00
- Por km: R$ 3,50
- Por min: R$ 0,60
- Mínimo: R$ 25,00

Caminhão:
- Base: R$ 25,00
- Por km: R$ 5,00
- Por min: R$ 0,80
- Mínimo: R$ 40,00
```

#### Horários de Pico Padrão

```javascript
1. Horário de Pico - Manhã
   - Dias: Segunda a Sexta
   - Horário: 07:00 - 09:00
   - Multiplicador: 1.3 (+30%)

2. Horário de Pico - Tarde
   - Dias: Segunda a Sexta
   - Horário: 17:00 - 19:00
   - Multiplicador: 1.3 (+30%)

3. Final de Semana
   - Dias: Sábado e Domingo
   - Horário: 00:00 - 23:59
   - Multiplicador: 1.2 (+20%)
```

#### Taxas de Cancelamento Padrão

```javascript
Cliente:
- Tempo limite: 5 minutos
- Percentual: 20%
- Mínimo: R$ 5,00

Motorista:
- Tempo limite: 2 minutos
- Percentual: 10%
- Mínimo: R$ 0,00
```

#### Configurações da Plataforma Padrão

```javascript
- Taxa da plataforma: 15%
- Raio de busca: 10 km
- Tempo de espera: 30 segundos
- Máximo de motoristas: 5
- Auto-aceitação: 2 km
```

## 💡 Fórmula de Cálculo de Preço

### Cálculo Base

```
Preço Total = Preço Base + (Distância × Preço/km) + (Tempo × Preço/min)
```

### Com Horário de Pico

```
Preço com Pico = Preço Total × Multiplicador
```

### Taxa da Plataforma

```
Taxa Plataforma = Preço Final × (Taxa% / 100)
Motorista Recebe = Preço Final - Taxa Plataforma
```

### Exemplo Completo

```
Corrida de Carro:
- Distância: 10 km
- Tempo: 20 minutos
- Horário: 18:00 (pico da tarde)

Cálculo:
1. Base: R$ 8,00
2. Distância: 10 × R$ 2,00 = R$ 20,00
3. Tempo: 20 × R$ 0,40 = R$ 8,00
4. Subtotal: R$ 36,00
5. Pico (1.3×): R$ 46,80
6. Taxa Plataforma (15%): R$ 7,02
7. Motorista recebe: R$ 39,78
8. Total Cliente: R$ 46,80
```

## 🔒 Validações Implementadas

### Preços de Veículos

- ✅ Preço base não pode ser negativo
- ✅ Preço por km não pode ser negativo
- ✅ Preço por minuto não pode ser negativo
- ✅ Preço mínimo deve ser ≥ preço base

### Horários de Pico

- ✅ Multiplicador deve ser ≥ 1.0
- ✅ Horário de fim deve ser após início
- ✅ Pelo menos um dia deve estar selecionado

### Taxas de Cancelamento

- ✅ Tempo limite deve ser positivo
- ✅ Percentual entre 0-100%
- ✅ Taxa mínima não pode ser negativa

### Configurações da Plataforma

- ✅ Taxa da plataforma entre 0-50%
- ✅ Raio de busca entre 1-50 km
- ✅ Tempo de espera entre 10-120 segundos
- ✅ Máximo de motoristas entre 1-10

## 🎨 Design & UX

### Cores por Tipo

```css
Moto: bg-green-100 (verde claro)
Carro: bg-green-100 (verde claro)
Van: bg-green-100 (verde claro)
Caminhão: bg-green-100 (verde claro)

Ativo: bg-green-600 (verde)
Inativo: bg-gray-400 (cinza)

Alertas: bg-blue-50 (azul claro)
Exemplos: bg-yellow-50 (amarelo claro)
Success: bg-green-50 (verde claro)
```

### Ícones Utilizados

- 💰 `DollarSign` - Preços
- ⏰ `Clock` - Tempo
- 📈 `TrendingUp` - Crescimento/Pico
- ⚙️ `Settings` - Configurações
- 🏍️ `Bike` - Moto
- 🚗 `Car` - Carro
- 📦 `Package` - Van
- 🚚 `TruckIcon` - Caminhão
- ✅ `Check` - Confirmação
- ❌ `X` - Cancelamento
- 💾 `Save` - Salvar
- 🔄 `RotateCcw` - Resetar

## 🔌 Integração Backend (Futura)

### Endpoints Necessários

```typescript
GET / api / pricing / config; // Buscar configuração
PUT / api / pricing / config; // Atualizar configuração
POST / api / pricing / estimate; // Calcular estimativa
GET / api / pricing / history; // Histórico de alterações
```

### Modelo MongoDB

```javascript
const PricingConfigSchema = new Schema(
  {
    vehiclePricing: [
      {
        vehicleType: String,
        basePrice: Number,
        pricePerKm: Number,
        pricePerMinute: Number,
        minimumPrice: Number,
        enabled: Boolean,
      },
    ],
    peakHours: [
      {
        id: String,
        name: String,
        dayOfWeek: [Number],
        startTime: String,
        endTime: String,
        multiplier: Number,
        enabled: Boolean,
      },
    ],
    cancellationFees: [
      {
        type: String,
        timeLimit: Number,
        feePercentage: Number,
        minimumFee: Number,
        enabled: Boolean,
      },
    ],
    platformSettings: {
      platformFeePercentage: Number,
      searchRadius: Number,
      driverTimeoutSeconds: Number,
      maxDriversToNotify: Number,
      autoAcceptRadius: Number,
    },
    updatedAt: Date,
    updatedBy: ObjectId, // Referência ao admin que alterou
  },
  { timestamps: true }
);
```

## 🚀 Funcionalidades

### ✅ Implementadas

- [x] Interface completa com 4 abas
- [x] Configuração de preços por veículo
- [x] Horários de pico com dias e multiplicadores
- [x] Taxas de cancelamento
- [x] Configurações globais da plataforma
- [x] Validação de valores
- [x] Exemplos de cálculo em tempo real
- [x] Sliders + inputs numéricos
- [x] Toggle ativo/inativo
- [x] Botão salvar/resetar
- [x] Toast notifications
- [x] Loading states
- [x] Configuração padrão
- [x] Responsividade completa

### 📝 Próximas Features

- [ ] Histórico de alterações
- [ ] Comparação de configurações
- [ ] Simulador de preços
- [ ] Gráficos de impacto
- [ ] Testes A/B de preços
- [ ] Preços por região/cidade
- [ ] Descontos e cupons
- [ ] Promoções temporárias
- [ ] Integração com Google Distance Matrix API
- [ ] Cálculo de preço em tempo real
- [ ] Previsão de demanda

## 🎯 Como Usar

### 1. Acessar a Página

```
http://localhost:3001/settings/pricing
```

Ou clique em "Preços & Regras" no menu de Configurações.

### 2. Configurar Preços de Veículos

1. Clique na aba "Preços por Veículo"
2. Ajuste os valores para cada tipo
3. Use os exemplos para validar
4. Ative/desative tipos conforme necessário

### 3. Configurar Horários de Pico

1. Clique na aba "Horários de Pico"
2. Clique em "Adicionar Horário"
3. Defina nome, dias, horários e multiplicador
4. Veja o exemplo de acréscimo

### 4. Configurar Taxas de Cancelamento

1. Clique na aba "Taxas de Cancelamento"
2. Ajuste tempo limite e percentuais
3. Defina taxa mínima
4. Ative/desative conforme política

### 5. Ajustar Configurações Gerais

1. Clique na aba "Configurações Gerais"
2. Use os sliders ou inputs
3. Veja descrições de cada configuração
4. Ajuste conforme necessário

### 6. Salvar

Clique em "Salvar Alterações" no topo da página.

### 7. Resetar (se necessário)

Clique em "Restaurar Padrão" para voltar aos valores iniciais.

## 📊 Relatórios & Analytics (Futuro)

### Métricas Recomendadas

- Preço médio por tipo de veículo
- Impacto de horários de pico
- Taxa de cancelamento efetiva
- Receita da plataforma
- Comparativo antes/depois de alterações

### Dashboards Sugeridos

- Gráfico de preços médios
- Heatmap de demanda
- Análise de cancelamentos
- Comparação de períodos
- Simulação de cenários

## ⚠️ Avisos Importantes

### Produção

- ✅ Sempre testar em ambiente de teste primeiro
- ✅ Comunicar motoristas sobre mudanças de preço
- ✅ Manter histórico de alterações
- ✅ Fazer backup antes de grandes mudanças
- ✅ Monitorar impacto nas primeiras 24h

### Performance

- Taxa da plataforma impacta diretamente o motorista
- Horários de pico muito altos podem afastar clientes
- Raio de busca muito grande pode atrasar matching
- Tempo de espera muito curto frustra motoristas

## 🔐 Segurança

### Recomendações

- Apenas admins devem acessar
- Log de todas as alterações
- Aprovação para mudanças críticas
- Limite de alterações por dia
- Notificação de mudanças drásticas

## ✅ Checklist de Implementação

- [x] pricingService.ts criado
- [x] app/settings/pricing/page.tsx criado
- [x] Menu "Preços & Regras" habilitado
- [x] 4 abas implementadas
- [x] Validação de configurações
- [x] Configuração padrão
- [x] Exemplos de cálculo
- [x] Toast notifications
- [x] Responsividade
- [ ] Backend API (próxima etapa)
- [ ] Histórico de alterações
- [ ] Testes unitários

## 🎉 Status

**✅ Interface completa e pronta para uso!**

Aguardando implementação do backend para persistência dos dados.

---

**Criado em**: 24 de dezembro de 2025  
**Versão**: 1.0.0  
**Autor**: Sistema LevaMais
