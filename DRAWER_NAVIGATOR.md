# 🗂️ Drawer Navigator - Leva+ App

## ✅ Implementação Completa

O Drawer Navigator foi **atualizado e melhorado** seguindo o design system do app.

---

## 📱 Estrutura Atual

### **Arquivo:** `src/routes/drawer.cliente.routes.tsx`

```
DrawerClienteRoutes
├── CustomDrawerContent (Menu lateral)
│   ├── Header (Avatar + Nome + Email)
│   ├── Menu Items (6 itens)
│   │   ├── 🏠 Início
│   │   ├── 📜 Histórico
│   │   ├── 💰 Carteira
│   │   ├── 👤 Perfil
│   │   ├── ❓ Ajuda
│   │   └── ⚙️ Configurações
│   └── Logout Button (Sair)
└── Screens
    └── Home (HomeScreen)
```

---

## 🎨 Design do Drawer

### **Cores:**

- Background: `#0f231c` (background-dark)
- Texto ativo: `#02de95` (primary)
- Texto inativo: `#9ca5a3` (gray-400)
- Divider: `border-white/10`
- Logout: `#ef4444` (vermelho)

### **Medidas:**

- Largura: `280px`
- Padding horizontal: `24px` (px-6)
- Padding vertical: `32px` (py-8) no header
- Item height: `~56px` (py-4)

### **Elementos:**

#### 1. **Header:**

```tsx
Avatar (64x64) + Informações
- Avatar: círculo verde com iniciais
- Nome: texto branco, bold, lg
- Email: texto cinza, sm
- Border bottom: branco/10
```

#### 2. **Menu Items:**

```tsx
Ícone (24x24) + Label
- Ícone: MaterialCommunityIcons
- Cor ativa: verde (#02de95)
- Cor inativa: cinza (#9ca5a3)
- Background ativo: verde/10 + border-left verde
```

#### 3. **Logout:**

```tsx
Ícone logout + "Sair"
- Cor: vermelho (#ef4444)
- Border top: branco/10
```

---

## 🔧 Configuração

### **Navigator Options:**

```typescript
screenOptions={{
  headerShown: false,          // Sem header padrão
  drawerStyle: {
    backgroundColor: "#0f231c",
    width: 280,
  },
  drawerActiveTintColor: "#02de95",
  drawerInactiveTintColor: "#9ca5a3",
  drawerType: "slide",         // Animação slide
  overlayColor: "rgba(0, 0, 0, 0.5)",
}}
```

---

## 🏠 Integração na HomeScreen

### **Botão Menu Hambúrguer:**

Foi adicionado um botão flutuante no topo esquerdo da HomeScreen:

```tsx
<TouchableOpacity
  onPress={handlePressMenu}
  className="w-12 h-12 rounded-full bg-surface-dark/90 border border-white/10"
>
  <MaterialIcons name="menu" size={24} color="#02de95" />
</TouchableOpacity>
```

### **Posicionamento:**

```
top-14 (56px do topo)
left-4 (16px da esquerda)
Ao lado do LocationHeader
```

### **Layout Atualizado:**

```
┌─────────────────────────────────────┐
│  [☰]  ╔════════════════════════╗   │
│       ║ 👤 LOCAL ATUAL          ▼║   │
│       ║   Rua das Flores, 123   ║   │
│       ╚════════════════════════╝   │
│                                     │
│           🗺️  M A P A             │
│                                     │
└─────────────────────────────────────┘
```

---

## 📋 Menu Items Disponíveis

| Ícone            | Nome     | Label         | Status   | Navegação   |
| ---------------- | -------- | ------------- | -------- | ----------- |
| 🏠 `home`        | Home     | Início        | ✅ Ativo | Funciona    |
| 📜 `history`     | History  | Histórico     | ⏳ TODO  | Console.log |
| 💰 `wallet`      | Wallet   | Carteira      | ⏳ TODO  | Console.log |
| 👤 `account`     | Profile  | Perfil        | ⏳ TODO  | Console.log |
| ❓ `help-circle` | Help     | Ajuda         | ⏳ TODO  | Console.log |
| ⚙️ `cog`         | Settings | Configurações | ⏳ TODO  | Console.log |
| 🚪 `logout`      | -        | Sair          | ✅ Ativo | Logout      |

---

## 🔄 Fluxo de Navegação

### **Abrir Drawer:**

```typescript
const navigation = useNavigation<DrawerNavigationProp<any>>();
navigation.openDrawer();
```

### **Fechar Drawer:**

```typescript
navigation.closeDrawer();
```

### **Toggle Drawer:**

```typescript
navigation.toggleDrawer();
```

### **Navegar para tela:**

```typescript
navigation.navigate("Home");
```

---

## 🎯 Estados Visuais

### **Item Ativo (Focused):**

```tsx
- Background: bg-primary/10 (verde translúcido)
- Border left: border-l-4 border-primary (4px verde)
- Ícone: #02de95 (verde)
- Texto: text-primary (verde)
```

### **Item Inativo:**

```tsx
- Background: transparente
- Border: nenhuma
- Ícone: #9ca5a3 (cinza)
- Texto: text-gray-400 (cinza)
```

### **Active Opacity:**

```tsx
activeOpacity={0.7} // Em todos os botões
```

---

## 🔐 Autenticação

### **Dados do Usuário:**

```typescript
const { logout, userData } = useAuthStore();

// userData contém:
{
  nome: string,
  email: string,
  // ... outros campos
}
```

### **Logout:**

```typescript
function handleLogout() {
  logout(); // Limpa o store
  // Navegação automática via Routes.tsx
}
```

---

## 📱 Responsividade

### **Drawer Width:**

- Mobile: `280px`
- Tablet: (pode ser ajustado)

### **Overlay:**

- Cor: `rgba(0, 0, 0, 0.5)`
- Toque fora fecha o drawer

### **Animação:**

- Tipo: `slide` (desliza da esquerda)
- Duração: padrão do React Navigation

---

## 🚀 Próximos Passos (TODO)

### 1. **Criar Screens Faltantes:**

```tsx
// src/screens/(authenticated)/Client/
├── HistoryScreen/
├── WalletScreen/
├── ProfileScreen/
├── HelpScreen/
└── SettingsScreen/
```

### 2. **Adicionar Screens ao Drawer:**

```tsx
<Screen name="History" component={HistoryScreen}
  options={{ drawerLabel: "Histórico" }} />
<Screen name="Wallet" component={WalletScreen}
  options={{ drawerLabel: "Carteira" }} />
// ... etc
```

### 3. **Implementar Navegação:**

```typescript
// Atualizar menuItems.map
onPress={() => {
  props.navigation.navigate(item.name);
}}
```

### 4. **Adicionar Badges:**

```tsx
// Exemplo: notificações não lidas
<View className="bg-red-500 rounded-full px-2">
  <Text className="text-white text-xs">3</Text>
</View>
```

### 5. **Adicionar Avatar Real:**

```tsx
// Substituir iniciais por imagem
{
  userData?.photoUrl ? (
    <Image source={{ uri: userData.photoUrl }} />
  ) : (
    <Text>{initials}</Text>
  );
}
```

---

## 🎨 Customização Avançada

### **Adicionar Submenus:**

```tsx
const menuItems = [
  { name: "Home", label: "Início", icon: "home" },
  {
    name: "Services",
    label: "Serviços",
    icon: "car",
    submenu: [
      { name: "Ride", label: "Corrida" },
      { name: "Delivery", label: "Entrega" },
    ],
  },
];
```

### **Adicionar Seções:**

```tsx
<View className="px-6 pt-4">
  <Text className="text-gray-500 text-xs uppercase mb-2">
    Principal
  </Text>
  {/* Menu items */}
</View>

<View className="px-6 pt-4">
  <Text className="text-gray-500 text-xs uppercase mb-2">
    Configurações
  </Text>
  {/* Settings items */}
</View>
```

### **Adicionar Switch:**

```tsx
import { Switch } from "react-native";

<View className="flex-row items-center justify-between px-6 py-4">
  <View className="flex-row items-center">
    <MaterialCommunityIcons name="bell" size={24} />
    <Text className="ml-4">Notificações</Text>
  </View>
  <Switch value={notifications} onValueChange={setNotifications} />
</View>;
```

---

## 📝 Código Completo

### **drawer.cliente.routes.tsx:**

```typescript
✅ CustomDrawerContent implementado
✅ Menu items configurados
✅ Logout implementado
✅ Estilos aplicados
✅ Navegação funcional
```

### **HomeScreen/index.tsx:**

```typescript
✅ Botão menu adicionado
✅ Navigation hook importado
✅ handlePressMenu implementado
✅ Layout ajustado
```

---

## 🎯 Resultado Final

### ✅ **Drawer Navigator Completo:**

- [x] Menu lateral com design dark
- [x] Header com avatar e informações
- [x] 6 itens de menu
- [x] Logout button
- [x] Botão hamburger na HomeScreen
- [x] Navegação funcional
- [x] Estados visuais (ativo/inativo)
- [x] Cores do design system
- [x] Ícones corretos
- [x] Responsivo

### ⏳ **Pendente:**

- [ ] Criar screens faltantes
- [ ] Implementar navegação completa
- [ ] Adicionar avatar real do usuário
- [ ] Adicionar badges de notificação

---

**Data:** 19 de dezembro de 2025  
**Status:** ✅ DRAWER NAVIGATOR IMPLEMENTADO E FUNCIONANDO  
**Próximo:** Criar as screens faltantes (History, Wallet, Profile, Help, Settings)
