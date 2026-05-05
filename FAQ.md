# ❓ FAQ - Perguntas Frequentes

Respostas para as perguntas mais comuns sobre o projeto Leva Mais.

---

## 📱 Geral

### O que é o Leva Mais?

Leva Mais é uma plataforma de transporte e logística que conecta clientes a motoristas para diversos tipos de serviços. Suporta múltiplos tipos de veículos (moto, carro, van, caminhão) e diferentes finalidades de serviço.

### Quais plataformas são suportadas?

- **Mobile**: Android e iOS (via React Native + Expo)
- **Web**: Navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Backend**: Qualquer servidor com Node.js 14+

### O projeto está em produção?

Não. Atualmente está em fase de MVP (Produto Mínimo Viável) com desenvolvimento ativo.

### Posso usar este projeto?

Este é um projeto privado e proprietário. Para uso ou colaboração, entre em contato com a equipe.

---

## 🚀 Instalação e Setup

### Quais são os pré-requisitos?

- Node.js 14+ (recomendado 18+)
- MongoDB 4.4+ (local ou MongoDB Atlas)
- Expo CLI (para desenvolvimento mobile)
- Android Studio ou Xcode (para emuladores)
- Um editor de código (recomendado: VS Code)

### Como instalo o projeto?

Veja o [Guia de Instalação](./README.md#-início-rápido) no README.md.

### O MongoDB precisa estar instalado localmente?

Não. Você pode usar MongoDB Atlas (cloud) alterando a `MONGODB_URI` no arquivo `.env`.

### Como configuro as variáveis de ambiente?

1. Copie `.env.example` para `.env` no diretório `backend`
2. Preencha com suas credenciais
3. Veja [backend/README.md](./backend/README.md) para detalhes

### Por que o mobile não conecta ao backend?

**Causas comuns**:

1. IP incorreto em `src/services/api.ts`
2. Backend não está rodando
3. Firewall bloqueando a porta 3000
4. Para emulador Android, use `10.0.2.2` em vez de `localhost`

**Solução**:

```typescript
// src/services/api.ts
const API_BASE_URL = "http://SEU_IP_LOCAL:3000/api";
// Exemplo: "http://192.168.1.100:3000/api"
```

---

## 🔐 Autenticação e Segurança

### Como funciona a autenticação?

O sistema usa JWT (JSON Web Token):

1. Usuário faz login com email/senha ou Google
2. Backend valida credenciais
3. Se válidas, gera um token JWT
4. Cliente armazena o token
5. Todas as requisições autenticadas incluem o token no header

### Por quanto tempo o token é válido?

7 dias. Após expirar, o usuário precisa fazer login novamente.

### As senhas são armazenadas com segurança?

Sim. Usamos bcrypt com 10 rounds de salt para fazer hash das senhas. Senhas nunca são armazenadas em texto plano.

### Como funciona o login com Google?

1. App mobile usa Google Sign-In SDK
2. Usuário autentica no Google
3. App recebe `idToken` do Google
4. Envia `idToken` para backend
5. Backend valida token com Google API
6. Cria/busca usuário e retorna token JWT

### Como resetar senha?

1. Usuário solicita reset em "Esqueci minha senha"
2. Sistema envia código de 6 dígitos por email
3. Código é válido por 10 minutos
4. Usuário insere código e nova senha
5. Senha é atualizada

---

## 🗺️ Mapas e Localização

### Preciso de uma API Key do Google Maps?

Sim, para usar mapas. O projeto já tem uma chave de exemplo no `app.json`, mas é recomendado criar sua própria.

**Como obter**:

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto
3. Habilite Maps SDK for Android/iOS
4. Gere uma API Key
5. Adicione no `app.json` em `android.config.googleMaps.apiKey`

### Como funciona a geolocalização?

Usamos `expo-location` que acessa GPS do dispositivo. É necessário permissão do usuário.

### Posso usar sem localização real?

Sim, para testes. Você pode inserir coordenadas manualmente ou usar localização simulada do emulador.

---

## 📧 Email

### Como configurar o envio de emails?

Veja o guia completo em [backend/CONFIGURACAO_EMAIL.md](./backend/CONFIGURACAO_EMAIL.md).

**Resumo para Gmail**:

1. Ative verificação em 2 etapas na conta Google
2. Gere uma "Senha de app"
3. Configure no `.env`:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app_16_digitos
```

### Os emails não estão sendo enviados, o que fazer?

**Checklist**:

- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Senha de app (não a senha da conta)
- [ ] Verificação em 2 etapas ativada
- [ ] Firewall não está bloqueando porta 587
- [ ] Teste com `npm run test:email` no backend

### Posso usar outro provedor que não Gmail?

Sim. Configure `EMAIL_HOST`, `EMAIL_PORT` e credenciais no `.env`. Exemplos:

- **Outlook**: smtp.office365.com:587
- **Yahoo**: smtp.mail.yahoo.com:465
- **SendGrid**: smtp.sendgrid.net:587

---

## 🔔 Notificações

### Como funcionam as notificações push?

Usamos Expo Push Notifications:

1. App solicita permissão ao usuário
2. Obtém `expoPushToken`
3. Envia token para backend (salva no perfil)
4. Backend usa Expo Server SDK para enviar notificações
5. Expo entrega ao dispositivo

### Preciso configurar algo especial?

Não para desenvolvimento. Para produção, você precisará:

- Configurar credenciais APNs (iOS)
- Configurar Firebase (Android)
- Ter conta Expo

### Notificações não chegam, o que fazer?

**Checklist**:

- [ ] Permissão concedida no dispositivo
- [ ] Token salvo no perfil do usuário
- [ ] App em primeiro plano ou background (não fechado completamente)
- [ ] Dispositivo com internet
- [ ] Para iOS, configurar APNs

---

## 💻 Desenvolvimento

### Qual IDE/Editor é recomendado?

Visual Studio Code com extensões:

- ESLint
- Prettier
- React Native Tools
- TypeScript
- Tailwind CSS IntelliSense

### Como debugar o aplicativo mobile?

**React Native**:

- Shake device → Open Debug Menu
- `Cmd+D` (iOS) ou `Cmd+M` (Android)
- Use React DevTools
- Console.log aparece no terminal do Expo

**Backend**:

- Use `console.log` ou debugger do VS Code
- Logs aparecem no terminal onde rodou `npm run dev`

### Como ver logs do MongoDB?

```bash
# MongoDB local
tail -f /var/log/mongodb/mongod.log

# Via Mongoose
mongoose.set('debug', true);
```

### Posso usar TypeScript em todos os lugares?

Sim! O projeto já usa TypeScript no mobile e web. O backend está em JavaScript, mas pode ser migrado.

### Como adicionar novas dependências?

```bash
# Mobile (raiz)
npm install nome-do-pacote

# Backend
cd backend && npm install nome-do-pacote

# Web
cd leva-mais-web && npm install nome-do-pacote
```

---

## 📊 Banco de Dados

### Por que MongoDB e não SQL?

MongoDB foi escolhido por:

- Flexibilidade de schema (útil durante desenvolvimento)
- Boa performance para dados geoespaciais
- Fácil escalabilidade horizontal
- JSON nativo (compatível com JavaScript)

### Como visualizar os dados?

**Opções**:

1. **MongoDB Compass** (GUI oficial)
2. **Mongo Shell**:

```bash
mongosh
use leva-mais
db.users.find()
```

3. **VS Code Extension**: MongoDB for VS Code

### Como fazer backup do banco?

```bash
# Backup
mongodump --db leva-mais --out /backup/

# Restore
mongorestore --db leva-mais /backup/leva-mais
```

### Como limpar o banco de dados?

```bash
# ⚠️ CUIDADO: Isso apaga TODOS os dados
mongosh
use leva-mais
db.dropDatabase()
```

### Posso popular o banco com dados de teste?

Sim:

```bash
cd backend
node seed-simple.js
```

---

## 🌐 API

### Como testar os endpoints da API?

**Opções**:

1. **Postman/Insomnia**: Importar coleção
2. **cURL**:

```bash
curl http://localhost:3000/api/health
```

3. **VS Code REST Client**: Criar arquivo `.http`

### Qual a URL base da API?

- **Desenvolvimento**: `http://localhost:3000/api`
- **Produção**: Configurar conforme seu servidor

### Como autenticar nas requisições?

Adicione header:

```
Authorization: Bearer SEU_TOKEN_JWT_AQUI
```

### A API tem rate limiting?

Não implementado ainda. Planejado para produção.

### Existe documentação da API?

Sim! Veja [API_REFERENCE.md](./API_REFERENCE.md) para todos os endpoints.

---

## 🎨 Interface

### Posso mudar as cores do app?

Sim! Edite:

- **Mobile**: `tailwind.config.js` e `src/theme/index.ts`
- **Web**: `leva-mais-web/tailwind.config.js`

### Como adicionar novos ícones?

**Mobile**: Usamos `@expo/vector-icons`

```tsx
import { Ionicons } from "@expo/vector-icons";
<Ionicons name="home" size={24} color="black" />;
```

**Web**: Usamos `lucide-react`

```tsx
import { Home } from "lucide-react";
<Home size={24} />;
```

### O design é responsivo?

- **Mobile**: Naturalmente adaptativo
- **Web**: Sim, usando breakpoints do Tailwind. Veja [RESPONSIVIDADE.md](./leva-mais-web/RESPONSIVIDADE.md)

---

## 🚗 Funcionalidades

### Como adicionar novos tipos de veículo?

1. Edite enum em `backend/src/models/Purpose.js`
2. Atualize validações
3. Adicione ícones/assets correspondentes no mobile
4. Teste!

### Como adicionar novos tipos de serviço?

Use o painel web admin:

1. Acesse `http://localhost:3001/settings/purposes`
2. Clique em "Novo Tipo de Serviço"
3. Preencha formulário
4. Salve

Ou via API:

```bash
POST /api/purposes
{
  "vehicleType": "car",
  "id": "luxury",
  "title": "Transporte Executivo",
  "subtitle": "Carros premium",
  "icon": "Star",
  "badges": ["Premium", "Luxo"]
}
```

### Quando o sistema de corridas estará pronto?

Está em desenvolvimento ativo (Fase 2 do roadmap). Sem data definida.

### Haverá sistema de pagamento?

Sim, está planejado para Fase 3. Considerando integração com:

- Mercado Pago
- PagSeguro
- Stripe

---

## 🐛 Problemas Comuns

### "Cannot connect to MongoDB"

**Soluções**:

1. Verifique se MongoDB está rodando: `mongod --version`
2. Confira `MONGODB_URI` no `.env`
3. Para Atlas, verifique credenciais e whitelist de IPs

### "Port 3000 already in use"

**Solução**:

```bash
# Encontrar processo
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Matar processo
kill -9 PID  # macOS/Linux
taskkill /PID PID /F  # Windows

# Ou mudar porta no .env
PORT=3001
```

### "Module not found"

**Solução**:

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Mobile - também limpar cache do Expo
expo start -c
```

### "Google Sign-In not working"

**Checklist**:

- [ ] Client IDs configurados corretamente
- [ ] Arquivos de credenciais na raiz do projeto
- [ ] SHA-1 correto para Android
- [ ] Bundle ID correto para iOS

### Erros de build no Android

**Soluções**:

```bash
# Limpar build
cd android
./gradlew clean

# Rebuild
cd ..
npm run android
```

---

## 📚 Documentação

### Onde encontro toda a documentação?

Veja [INDICE.md](./INDICE.md) para navegação completa.

### Como contribuir com a documentação?

1. Edite os arquivos Markdown
2. Mantenha formatação consistente
3. Atualize o índice se adicionar novos arquivos
4. Faça commit com `docs: descrição da mudança`

---

## 🚀 Deploy e Produção

### Como fazer deploy do backend?

**Opções**:

1. **Heroku**: `git push heroku main`
2. **DigitalOcean**: Usar App Platform ou Droplet
3. **AWS**: EC2, Elastic Beanstalk, ou Lambda
4. **Vercel**: Suporta Node.js

**Checklist**:

- [ ] Configurar variáveis de ambiente
- [ ] Usar MongoDB Atlas (cloud)
- [ ] Configurar HTTPS
- [ ] Habilitar CORS apenas para domínios permitidos

### Como publicar o app mobile?

**Android**:

```bash
expo build:android -t app-bundle
# ou
eas build --platform android
```

Depois upload na Google Play Console.

**iOS**:

```bash
expo build:ios -t archive
# ou
eas build --platform ios
```

Depois upload na App Store Connect.

### Como fazer deploy do painel web?

**Vercel** (recomendado para Next.js):

```bash
cd leva-mais-web
vercel deploy
```

**Outras opções**: Netlify, Railway, Render

---

## 💡 Boas Práticas

### Como organizar branches no Git?

```
main - Produção
develop - Desenvolvimento
feature/nome-da-feature - Novas features
fix/nome-do-bug - Correções
```

### Padrões de commit?

Use Conventional Commits:

```
feat: adicionar autenticação biométrica
fix: corrigir bug no upload de foto
docs: atualizar README
style: formatar código
refactor: refatorar serviço de email
test: adicionar testes unitários
chore: atualizar dependências
```

### Como nomear componentes?

- **Componentes**: `PascalCase` (ex: `UserProfile.tsx`)
- **Utilitários**: `camelCase` (ex: `formatDate.ts`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`)

---

## 🆘 Obtendo Ajuda

### Onde reportar bugs?

1. Verifique se não é um problema conhecido neste FAQ
2. Confira a documentação relevante
3. Crie uma issue no GitHub (se aplicável)
4. Entre em contato com a equipe

### Onde tirar dúvidas técnicas?

1. Consulte primeiro:
   - Este FAQ
   - [DOCUMENTACAO.md](./DOCUMENTACAO.md)
   - [API_REFERENCE.md](./API_REFERENCE.md)
2. Documentação oficial das tecnologias
3. Stack Overflow
4. Equipe de desenvolvimento

### Como solicitar novas funcionalidades?

1. Verifique o [roadmap](./RESUMO_EXECUTIVO.md#-status-de-desenvolvimento)
2. Descreva o caso de uso
3. Proponha implementação (se possível)
4. Discuta com a equipe

---

## 📞 Contato

Para questões não respondidas neste FAQ:

- Consulte [INDICE.md](./INDICE.md) para encontrar documentação específica
- Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: 24 de dezembro de 2025  
**Versão**: 1.0.0

**Não encontrou sua pergunta?** Abra uma issue ou entre em contato!
