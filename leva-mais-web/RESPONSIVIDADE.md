# 📱 Responsividade do Leva-Web

## ✅ Implementação Completa

O painel administrativo Leva-Web agora é **totalmente responsivo** para desktop, tablet e mobile.

---

## 🎨 Breakpoints Tailwind

```javascript
// Tailwind CSS Breakpoints
sm: '640px'   // Small devices (landscape phones)
md: '768px'   // Medium devices (tablets)
lg: '1024px'  // Large devices (desktops)
xl: '1280px'  // Extra large devices
2xl: '1536px' // 2X Extra large devices
```

---

## 🏗️ Estrutura Responsiva

### 1. Layout Principal (`app/layout.tsx`)

**Mobile (< 1024px):**

- Sidebar oculta por padrão
- Menu hambúrguer no Topbar
- Conteúdo ocupa 100% da largura
- Padding reduzido: `p-4`

**Desktop (≥ 1024px):**

- Sidebar sempre visível (fixa)
- Conteúdo com margem esquerda: `ml-64`
- Padding normal: `p-8`

```tsx
<div className="flex-1 lg:ml-64">
  <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
  <main className="mt-16 p-4 sm:p-6 lg:p-8">{children}</main>
</div>
```

---

### 2. Sidebar (`components/layout/Sidebar.tsx`)

**Mobile (< 1024px):**

- Menu deslizante lateral (slide-in)
- Overlay escuro ao abrir
- Botão "X" para fechar
- Animação `translate-x`

**Desktop (≥ 1024px):**

- Sempre visível
- Fixo na esquerda
- Sem overlay
- Sem botão de fechar

```tsx
<aside className={cn(
  "w-64 h-screen fixed left-0 top-0 z-50",
  "lg:translate-x-0", // Desktop: sempre visível
  isOpen ? "translate-x-0" : "-translate-x-full" // Mobile
)}>
```

**Overlay Mobile:**

```tsx
{
  isOpen && (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={onClose}
    />
  );
}
```

---

### 3. Topbar (`components/layout/Topbar.tsx`)

**Mobile (< 768px):**

- Menu hambúrguer visível
- Logo "L+" compacto
- Busca via botão (ícone)
- Notificações e perfil mantidos

**Tablet (768px - 1023px):**

- Menu hambúrguer visível
- Busca inline (menor: `w-64`)
- Todos os ícones visíveis

**Desktop (≥ 1024px):**

- Sem menu hambúrguer
- Busca inline completa (`w-96`)
- Layout espaçoso

```tsx
{/* Mobile Menu + Logo */}
<button className="lg:hidden">
  <Menu size={20} />
</button>
<div className="lg:hidden">Logo Compacto</div>

{/* Desktop Search */}
<div className="hidden md:flex w-64 lg:w-96">
  <input placeholder="Buscar..." />
</div>

{/* Mobile Search Button */}
<button className="md:hidden">
  <Search size={20} />
</button>
```

---

### 4. Página Purposes (`app/settings/purposes/page.tsx`)

#### Header

**Mobile:**

- Layout vertical (flex-col)
- Título menor: `text-2xl`
- Botão com texto curto: "Novo"

**Desktop:**

- Layout horizontal (flex-row)
- Título maior: `text-3xl`
- Botão com texto completo: "Novo Tipo de Serviço"

```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <h1 className="text-2xl sm:text-3xl">Tipos de Serviço</h1>
  <button>
    <span className="hidden sm:inline">Novo Tipo de Serviço</span>
    <span className="sm:hidden">Novo</span>
  </button>
</div>
```

#### Tabs de Veículos

**Mobile:**

- Layout flex-wrap
- Cada tab ocupa espaço igual: `flex-1`
- Ícones + texto (quando houver espaço)

**Desktop:**

- Layout inline
- Tabs com largura automática
- Sempre mostra texto

```tsx
<div className="flex flex-wrap sm:p-1 gap-1 sm:gap-0">
  {VEHICLE_TABS.map((tab) => (
    <button className="flex-1 sm:flex-none">
      <tab.icon size={16} />
      <span className="hidden xs:inline">{tab.label}</span>
    </button>
  ))}
</div>
```

#### Stats Cards

**Mobile:** 2 colunas (`grid-cols-2`)
**Tablet/Desktop:** 4 colunas (`md:grid-cols-4`)

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

#### Filtros

**Mobile:**

- Layout vertical (flex-col)
- Select ocupa largura total: `flex-1`
- Botões em linha

**Desktop:**

- Layout horizontal (flex-row)
- Select com largura fixa

```tsx
<div className="flex flex-col lg:flex-row gap-4">
  <input className="flex-1" />
  <select className="flex-1 sm:flex-none" />
</div>
```

#### Tabela vs Cards

**Desktop (≥ 768px):**

- Tabela completa com 6 colunas
- Hover effects
- Actions no hover

```tsx
<div className="hidden md:block">
  <table>...</table>
</div>
```

**Mobile (< 768px):**

- Cards empilhados verticalmente
- Informações reorganizadas
- Actions sempre visíveis
- Clique para abrir drawer

```tsx
<div className="md:hidden space-y-3">
  {filteredData.map((item) => (
    <div className="bg-white rounded-xl p-4">
      {/* Header com ícone + título + status */}
      {/* Subtitle */}
      {/* Badges */}
      {/* Actions: Editar | Ativar/Desativar | Excluir */}
    </div>
  ))}
</div>
```

**Card Mobile Structure:**

```tsx
<div className="bg-white rounded-xl border p-4">
  {/* Header: Icon + Title + Status Badge */}
  <div className="flex items-start gap-3">
    <div className="w-12 h-12 bg-slate-100 rounded-lg">
      <Icon />
    </div>
    <div className="flex-1">
      <h3>{title}</h3>
      <p className="text-xs font-mono">{id}</p>
    </div>
    <span className="badge">{status}</span>
  </div>

  {/* Subtitle */}
  <p className="line-clamp-2">{subtitle}</p>

  {/* Badges */}
  <div className="flex flex-wrap gap-1">
    {badges.map(...)}
  </div>

  {/* Actions */}
  <div className="flex gap-2 border-t pt-2">
    <button>Editar</button>
    <button>Ativar/Desativar</button>
    <button>Excluir</button>
  </div>
</div>
```

---

## 🎯 Recursos Responsivos

### ✅ Implementados

1. **Menu Hambúrguer (Mobile)**

   - Sidebar desliza da esquerda
   - Overlay escuro (backdrop)
   - Fecha ao clicar em item ou overlay

2. **Layout Adaptativo**

   - Desktop: Sidebar fixa + conteúdo com margem
   - Mobile: Sidebar overlay + conteúdo 100%

3. **Componentes Flexíveis**

   - Buttons com texto condicional
   - Tabs com flex-wrap
   - Grid com breakpoints (2→4 colunas)

4. **Tabela → Cards**

   - Desktop: Tabela tradicional
   - Mobile: Cards empilhados

5. **Espaçamentos Responsivos**

   - Padding: `p-4 sm:p-6 lg:p-8`
   - Gap: `gap-2 sm:gap-4`
   - Font sizes: `text-2xl sm:text-3xl`

6. **Topbar Adaptável**

   - Mobile: Menu + Logo compacto + Search icon
   - Desktop: Search completo

7. **Animações Suaves**
   - Sidebar: `transition-transform duration-300`
   - Overlay: `transition-opacity`

---

## 📐 Padrões de Design

### Mobile-First

Sempre começar com mobile e adicionar breakpoints para desktop:

```tsx
// ❌ Errado (Desktop-first)
className = "p-8 sm:p-4";

// ✅ Correto (Mobile-first)
className = "p-4 sm:p-6 lg:p-8";
```

### Visibility Classes

```tsx
hidden sm:block      // Oculto no mobile, visível no desktop
sm:hidden            // Visível no mobile, oculto no desktop
hidden md:flex       // Oculto até tablet
lg:hidden            // Oculto em desktop grande
```

### Flex Direction

```tsx
flex-col sm:flex-row // Vertical no mobile, horizontal no desktop
flex-wrap            // Permite quebra de linha
```

### Grid Responsive

```tsx
grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
```

---

## 🧪 Testando Responsividade

### 1. Chrome DevTools

- `F12` → Toggle device toolbar (`Ctrl+Shift+M`)
- Testar breakpoints: 375px, 768px, 1024px, 1440px

### 2. Dispositivos Reais

- **Mobile:** iPhone SE (375px), iPhone 12 (390px)
- **Tablet:** iPad (768px), iPad Pro (1024px)
- **Desktop:** 1366px, 1920px

### 3. Testes de UX

- [ ] Menu hambúrguer abre/fecha corretamente
- [ ] Overlay escuro funciona
- [ ] Cards mobile exibem todas informações
- [ ] Botões têm área de toque adequada (min 44x44px)
- [ ] Textos legíveis em todas telas
- [ ] Sem scroll horizontal inesperado

---

## 🔧 Comandos de Teste

```bash
# Iniciar backend
cd backend
npm run dev

# Iniciar leva-web
cd leva-mais-web
npm run dev

# Acessar
http://localhost:3001/settings/purposes

# Testar em diferentes tamanhos de tela no DevTools
```

---

## 📱 Exemplo de Breakpoint Visual

```
┌─────────────────────────────────────────────────┐
│  < 768px (Mobile)                               │
│  ┌─────────────────────────────────────────┐   │
│  │ [☰] Leva+ [🔍][🔔][AD]                  │   │
│  ├─────────────────────────────────────────┤   │
│  │ Tipos de Serviço            [+ Novo]    │   │
│  │ [🏍][🚗][🚐][🚛]                        │   │
│  │ [2][2][0][18:30]                        │   │
│  │ [Busca___________][Status▼][↻]         │   │
│  │                                         │   │
│  │ ┌─────────────────────────────────────┐ │   │
│  │ │ [📦] Delivery        [Ativo]        │ │   │
│  │ │ delivery                            │ │   │
│  │ │ Entregar comidas, lanches...        │ │   │
│  │ │ [RÁPIDO][POPULAR]                   │ │   │
│  │ │ ─────────────────────────────────── │ │   │
│  │ │ [Editar] [Desativar] [🗑]          │ │   │
│  │ └─────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  ≥ 1024px (Desktop)                                          │
│  ┌──────┬──────────────────────────────────────────────────┐ │
│  │      │ [Buscar____________][🔔][AD]                     │ │
│  │ Leva+├──────────────────────────────────────────────────┤ │
│  │      │ Tipos de Serviço    [+ Novo Tipo de Serviço]    │ │
│  │ ───  │ [🏍 Moto][🚗 Carro][🚐 Van][🚛 Caminhão]        │ │
│  │      │ [Total: 2][Ativos: 2][Inativos: 0][18:30]       │ │
│  │ 📊   │ [Buscar___________________][Status▼][↻]         │ │
│  │ 👥   │                                                  │ │
│  │ 🚗   │ ┌────────────────────────────────────────────┐  │ │
│  │ 👤   │ │ Icon│Title/ID │Subtitle│Badges│Status│Ações│  │ │
│  │ 🗺️   │ ├────┼─────────┼────────┼──────┼──────┼─────┤  │ │
│  │ 💰   │ │ 📦 │Delivery │Entregar│[RÁPIDO]│Ativo│⚙️  │  │ │
│  │      │ └────────────────────────────────────────────┘  │ │
│  │ ───  │                                                  │ │
│  │      │                                                  │ │
│  │ ⚙️   │                                                  │ │
│  │ 🚛   │                                                  │ │
│  │ 💵   │                                                  │ │
│  └──────┴──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Próximos Passos (Futuro)

- [ ] Implementar busca mobile em modal fullscreen
- [ ] Adicionar gesture swipe para fechar sidebar
- [ ] PWA (Progressive Web App) para instalação mobile
- [ ] Dark mode mobile
- [ ] Touch optimizations (aumentar área de toque)

---

**Atualizado em:** 20 de dezembro de 2025
**Status:** ✅ Totalmente Responsivo
