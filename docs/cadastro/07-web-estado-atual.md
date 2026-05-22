# 07 - Web (estado atual do fluxo inicial)

## Escopo analisado
Pasta: `leva-mais-web`

## Resultado
No estado atual, o projeto web nao implementa fluxo publico de:
- cadastro
- login
- login google
- verificacao de telefone
- selecao de perfil

O web atual esta focado em painel operacional/admin (usuarios, motoristas, corridas, verificacoes, configuracoes).

## Integracao observada
- Consumo de endpoints administrativos do backend (`/auth/users`, etc.).
- Nao foi encontrado fluxo de sessao inicial equivalente ao app mobile (AuthRoutes/SignIn/SignUp).

## Implicacao para documentacao
Para o modulo "inicio de jornada do usuario", a fonte de verdade hoje e:
- App mobile (`src/screens/(public)/*`, `src/routes/index.tsx`)
- Backend auth (`backend/src/controllers/auth.controller.js`, `backend/src/routes/auth.routes.js`)

Se desejarem, o proximo passo e criar o fluxo web de autenticacao inicial e documentar em paralelo com padrao igual ao mobile.
