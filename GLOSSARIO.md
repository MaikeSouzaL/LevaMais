# 📖 Glossário - Leva Mais

Guia de referência rápida para termos técnicos e conceitos utilizados no projeto Leva Mais.

---

## A

### API (Application Programming Interface)

Interface de Programação de Aplicações. Conjunto de endpoints que permitem a comunicação entre o frontend (mobile/web) e o backend.

### AsyncStorage

Sistema de armazenamento local persistente do React Native, usado para salvar dados como tokens de autenticação.

### Autenticação

Processo de verificação da identidade de um usuário, geralmente através de email/senha ou OAuth.

### Axios

Biblioteca JavaScript para fazer requisições HTTP, utilizada no mobile e web para comunicação com a API.

---

## B

### Backend

Servidor que processa a lógica de negócio, gerencia dados e fornece APIs. No projeto: Node.js + Express.

### bcrypt

Biblioteca para hash de senhas, garantindo que senhas nunca sejam armazenadas em texto plano.

### Bottom Sheet

Componente de interface que desliza de baixo para cima, usado para exibir informações adicionais (ex: lista de favoritos).

### Bundle

Pacote compilado do aplicativo mobile, pronto para instalação em dispositivos.

---

## C

### Client

Neste contexto, refere-se ao usuário que solicita serviços de transporte (não confundir com cliente HTTP).

### CORS (Cross-Origin Resource Sharing)

Mecanismo de segurança que permite ou restringe requisições de origens diferentes ao servidor.

### CRUD

Create (Criar), Read (Ler), Update (Atualizar), Delete (Deletar) - operações básicas de um sistema de dados.

---

## D

### Driver

Motorista que presta serviços de transporte na plataforma.

### DTO (Data Transfer Object)

Objeto usado para transferir dados entre camadas da aplicação.

---

## E

### Endpoint

URL específica da API que executa uma operação (ex: `/api/auth/login`).

### Expo

Plataforma e conjunto de ferramentas para desenvolvimento React Native, facilitando build, deploy e acesso a APIs nativas.

### Express

Framework web minimalista para Node.js, usado para criar a API REST do backend.

---

## F

### Favorite (Favorito)

Local salvo pelo usuário para acesso rápido (ex: Casa, Trabalho).

### Frontend

Interface visual com a qual o usuário interage. No projeto: app mobile (React Native) e painel web (Next.js).

---

## G

### Geocoding

Processo de converter endereço em coordenadas geográficas (latitude/longitude).

### Google OAuth

Sistema de autenticação do Google que permite login com conta Google sem senha.

---

## H

### Hash

Resultado de uma função criptográfica unidirecional. Usado para armazenar senhas de forma segura.

### HTTP/HTTPS

Protocolo de comunicação entre cliente e servidor. HTTPS é a versão segura (criptografada).

---

## I

### idToken

Token de identificação fornecido pelo Google após login bem-sucedido, usado para autenticação no backend.

### Index

Em bancos de dados, estrutura que melhora a velocidade de consultas em campos específicos.

---

## J

### JSON (JavaScript Object Notation)

Formato de dados usado para comunicação entre frontend e backend.

### JWT (JSON Web Token)

Token de autenticação codificado que contém informações do usuário. Usado para autorizar requisições.

---

## K

### Key (Chave)

Em MongoDB, campo único que identifica um documento. Também se refere a chaves de API (Google Maps, etc.).

---

## L

### Latitude/Longitude

Coordenadas geográficas que identificam uma localização precisa no mapa.

### LGPD (Lei Geral de Proteção de Dados)

Lei brasileira que regula o tratamento de dados pessoais.

---

## M

### Middleware

Função que intercepta requisições antes de chegarem aos controllers, usada para autenticação, validação, etc.

### MongoDB

Banco de dados NoSQL orientado a documentos, usado para persistência de dados.

### Mongoose

ODM (Object Document Mapper) para MongoDB, facilita modelagem e validação de dados.

### MVP (Minimum Viable Product)

Produto Mínimo Viável - versão inicial com funcionalidades essenciais.

---

## N

### NativeWind

Biblioteca que permite usar Tailwind CSS no React Native.

### Next.js

Framework React para desenvolvimento web com renderização do lado do servidor (SSR).

### Nodemailer

Biblioteca Node.js para envio de emails.

### NoSQL

Tipo de banco de dados não-relacional, como MongoDB.

---

## O

### OAuth

Protocolo de autorização que permite login usando serviços de terceiros (Google, Facebook, etc.).

### ODM (Object Document Mapper)

Camada de abstração entre código e banco de dados de documentos (ex: Mongoose).

---

## P

### Payload

Dados transportados em uma requisição ou token JWT.

### Purpose (Tipo de Serviço)

Finalidade do serviço de transporte (ex: entrega, mudança, transporte de passageiros).

### Push Notification

Notificação enviada do servidor para o dispositivo do usuário, mesmo com o app fechado.

---

## Q

### Query

Consulta ao banco de dados para buscar informações.

---

## R

### React

Biblioteca JavaScript para construção de interfaces de usuário.

### React Native

Framework para desenvolvimento de aplicativos mobile nativos usando React.

### REST (Representational State Transfer)

Estilo de arquitetura para APIs que usa métodos HTTP (GET, POST, PUT, DELETE).

### Route (Rota)

Caminho da URL que mapeia para uma função específica do servidor.

---

## S

### Schema

Estrutura que define o formato de dados em um modelo (ex: Mongoose Schema).

### SDK (Software Development Kit)

Conjunto de ferramentas para desenvolvimento (ex: Expo SDK, Google Sign-In SDK).

### SSR (Server-Side Rendering)

Renderização no servidor, usada pelo Next.js para melhorar performance e SEO.

### State Management

Gerenciamento de estado da aplicação. No projeto: Zustand.

---

## T

### Tailwind CSS

Framework CSS utility-first para estilização rápida.

### Token

String criptografada usada para autenticação (JWT) ou notificações (Push Token).

### TypeScript

Superset do JavaScript que adiciona tipagem estática.

---

## U

### UI (User Interface)

Interface do usuário - elementos visuais com os quais o usuário interage.

### UX (User Experience)

Experiência do usuário - como o usuário se sente ao usar a aplicação.

---

## V

### Validation (Validação)

Verificação se os dados atendem aos requisitos (ex: email válido, senha mínima de 6 caracteres).

### Variable (Variável)

Valor que pode mudar durante a execução do programa.

### Vehicle Type (Tipo de Veículo)

Categoria de veículo: motorcycle (moto), car (carro), van, truck (caminhão).

---

## W

### Webhook

URL que recebe notificações automáticas quando eventos ocorrem.

---

## X

### XSS (Cross-Site Scripting)

Tipo de ataque de segurança prevenido através de sanitização de inputs.

---

## Y

### YAML

Formato de arquivo de configuração legível por humanos.

---

## Z

### Zod

Biblioteca TypeScript para validação e parsing de dados com type-safety.

### Zustand

Biblioteca leve de gerenciamento de estado para React/React Native.

---

## Termos Específicos do Projeto

### authStore

Store do Zustand que gerencia estado de autenticação (usuário logado, token, etc.).

### FavoriteBottomSheet

Componente que exibe lista de locais favoritos em um bottom sheet.

### GlobalMap

Componente de mapa reutilizável usado em várias telas.

### LocationHeader

Componente de cabeçalho que mostra localização atual do usuário.

### PasswordReset

Modelo de dados para gerenciar processo de recuperação de senha.

### ProfileCompleted

Flag booleana que indica se o usuário completou seu cadastro.

### UserType

Tipo de usuário no sistema: "client", "driver" ou "admin".

---

## Siglas Comuns

| Sigla | Significado                       |
| ----- | --------------------------------- |
| API   | Application Programming Interface |
| CORS  | Cross-Origin Resource Sharing     |
| CRUD  | Create, Read, Update, Delete      |
| DB    | Database (Banco de Dados)         |
| DTO   | Data Transfer Object              |
| HTTP  | HyperText Transfer Protocol       |
| HTTPS | HTTP Secure                       |
| JWT   | JSON Web Token                    |
| LGPD  | Lei Geral de Proteção de Dados    |
| MVP   | Minimum Viable Product            |
| NoSQL | Not Only SQL                      |
| OAuth | Open Authorization                |
| ODM   | Object Document Mapper            |
| REST  | Representational State Transfer   |
| SDK   | Software Development Kit          |
| SQL   | Structured Query Language         |
| SSR   | Server-Side Rendering             |
| UI    | User Interface                    |
| URI   | Uniform Resource Identifier       |
| URL   | Uniform Resource Locator          |
| UX    | User Experience                   |
| XSS   | Cross-Site Scripting              |

---

## Códigos HTTP Comuns

| Código | Significado           | Uso no Projeto                           |
| ------ | --------------------- | ---------------------------------------- |
| 200    | OK                    | Operação bem-sucedida                    |
| 201    | Created               | Recurso criado (cadastro, novo favorito) |
| 400    | Bad Request           | Dados inválidos                          |
| 401    | Unauthorized          | Token ausente ou inválido                |
| 403    | Forbidden             | Sem permissão (não é admin)              |
| 404    | Not Found             | Recurso não encontrado                   |
| 409    | Conflict              | Conflito (email já existe)               |
| 500    | Internal Server Error | Erro no servidor                         |

---

## Métodos HTTP

| Método | Descrição         | Exemplo                |
| ------ | ----------------- | ---------------------- |
| GET    | Buscar dados      | Listar favoritos       |
| POST   | Criar dados       | Cadastrar usuário      |
| PUT    | Atualizar dados   | Atualizar perfil       |
| DELETE | Deletar dados     | Remover favorito       |
| PATCH  | Atualizar parcial | Atualizar apenas email |

---

## Tipos de Dados TypeScript

| Tipo      | Descrição        | Exemplo          |
| --------- | ---------------- | ---------------- |
| string    | Texto            | "João Silva"     |
| number    | Número           | 42, 3.14         |
| boolean   | Verdadeiro/Falso | true, false      |
| object    | Objeto           | { name: "João" } |
| array     | Lista            | [1, 2, 3]        |
| null      | Nulo             | null             |
| undefined | Indefinido       | undefined        |
| any       | Qualquer tipo    | evitar usar      |

---

## Ícones Usados na Documentação

| Ícone | Significado             |
| ----- | ----------------------- |
| ✅    | Implementado, concluído |
| 🚧    | Em desenvolvimento      |
| 📋    | Planejado, futuro       |
| ⭐    | Importante, destaque    |
| 🔐    | Relacionado a segurança |
| 📱    | Mobile                  |
| 💻    | Web                     |
| ⚙️    | Backend                 |
| 🗺️    | Mapas, localização      |
| 🔔    | Notificações            |
| 📦    | Pacote, biblioteca      |
| 🚀    | Deploy, produção        |
| 🐛    | Bug, problema           |
| 📊    | Dados, estatísticas     |
| 🎨    | Design, UI/UX           |

---

## Convenções de Nomenclatura

### Arquivos

- `PascalCase.tsx` - Componentes React
- `camelCase.ts` - Arquivos de serviço, utils
- `kebab-case.js` - Scripts, configurações
- `SCREAMING_SNAKE_CASE.md` - Documentação importante

### Código

- `PascalCase` - Componentes, Classes, Types
- `camelCase` - Variáveis, funções, métodos
- `SCREAMING_SNAKE_CASE` - Constantes
- `snake_case` - Campos de banco de dados (evitado)

### Git

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

---

## Referências Externas

### Documentação Oficial

- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [Next.js](https://nextjs.org/docs)
- [MongoDB](https://docs.mongodb.com/)
- [Express](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Bibliotecas

- [Zustand](https://github.com/pmndrs/zustand)
- [Zod](https://zod.dev/)
- [Axios](https://axios-http.com/)
- [Mongoose](https://mongoosejs.com/)
- [React Navigation](https://reactnavigation.org/)

---

**Última atualização**: 24 de dezembro de 2025  
**Versão**: 1.0.0
