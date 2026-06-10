/**
 * Flags centrais da migração Node.js → Supabase.
 *
 * Conforme cada bloco é migrado para o Supabase, a dependência do backend Node
 * é desligada aqui. Mantém o app funcional durante a transição sem precisar
 * remover/editar dezenas de arquivos de uma vez.
 *
 * Estado atual da migração:
 *  - Auth (signup/login/Google/perfil): ✅ Supabase
 *  - Realtime (Socket.io → Supabase Channels): ✅ Supabase (REALTIME_ENABLED = true)
 *  - KYC cliente/motorista (Bucket kyc): ✅ Supabase
 *  - Corridas/entregas/pagamentos: ✅ Supabase (fluxos separados e transparentes)
 *  - Carteira/Pix/Depósitos: ✅ Supabase
 *  - Serviços secundários (Favoritos, Turnos, Preços, Cupons, Disputas): ✅ Supabase
 */

/** Socket.io → Supabase Realtime habilitado e migrado. */
export const REALTIME_ENABLED = true;

/** Chamadas REST ao backend Node legado. Desativado por completo. */
export const BACKEND_ENABLED = false;

/** Timeout curto p/ falhar rápido quando o Node estiver offline durante a migração (ms). */
export const BACKEND_TIMEOUT_MS = 8000;

/** Nº de retries de rede. Baixo durante a migração para não pendurar a UI. */
export const BACKEND_MAX_RETRIES = 1;
