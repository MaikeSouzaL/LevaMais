# 10 - Web: Limpeza de Telas e Menus Não Usados

## Objetivo
Remover do painel web as telas e menus que não fazem parte do fluxo atual de operação.

## Menus mantidos
- Visão Geral (`/dashboard`)
- Usuários (`/users`)
- Validação de Contas (`/verification/drivers`)

## Menus removidos
- Representantes
- Áreas de Atuação
- Corridas
- Ganhos
- Bloco de Configurações (Geral & Taxas, Tipos de Serviço, Tarifas & Preços, Tipos de Veículo)

Arquivo alterado:
- `leva-mais-web/components/layout/Sidebar.tsx`

## Telas removidas do web
Pastas removidas em `leva-mais-web/app`:
- `cities`
- `clients`
- `drivers`
- `earnings`
- `representatives`
- `rides`
- `settings`

## Estado final das páginas
Permanecem apenas:
- `dashboard`
- `users`
- `verification`
