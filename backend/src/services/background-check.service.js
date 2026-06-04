/**
 * Background Check Service for criminal record lookup with Heuristic fallback
 */

const BACKGROUND_CHECK_API_KEY = process.env.BACKGROUND_CHECK_API_KEY;
const BACKGROUND_CHECK_URL = process.env.BACKGROUND_CHECK_URL;

/**
 * Performs a criminal record lookup (Background Check) for a driver
 * @param {string} driverName 
 * @param {string} cpf 
 * @returns {Promise<{success: boolean, status: 'approved' | 'rejected', reason?: string}>}
 */
async function performBackgroundCheck(driverName, cpf) {
  // If API credentials are set, attempt real API integration
  if (BACKGROUND_CHECK_API_KEY && BACKGROUND_CHECK_URL) {
    try {
      console.log(`[BackgroundCheck] Initiating external API request for CPF: ${cpf}...`);
      const response = await fetch(BACKGROUND_CHECK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${BACKGROUND_CHECK_API_KEY}`
        },
        body: JSON.stringify({
          name: driverName,
          taxId: cpf
        })
      });

      if (!response.ok) {
        throw new Error(`External API responded with status ${response.status}`);
      }

      const result = await response.json();
      
      // Assume schema returns: { hasRecord: boolean, message?: string }
      if (result.hasRecord) {
        console.log("[BackgroundCheck] External API found judicial records.");
        return {
          success: true,
          status: "rejected",
          reason: result.message || "Restrições judiciais ou criminais identificadas nos tribunais públicos."
        };
      } else {
        console.log("[BackgroundCheck] External API returned clean records.");
        return {
          success: true,
          status: "approved"
        };
      }
    } catch (apiError) {
      console.error("[BackgroundCheck] External API call failed, falling back to simulated verification:", apiError.message);
      // Fallback to simulation
    }
  }

  // Sem provedor configurado: NÃO decide automaticamente.
  // Fica PENDENTE para aprovação manual no dashboard (decisão de negócio atual).
  console.log("[BackgroundCheck] Sem API configurada — checagem criminal deixada para revisão manual (pending).");
  return Promise.resolve({
    success: true,
    status: "pending",
    reason: "Aguardando revisão manual no painel (antecedentes criminais).",
  });
}

module.exports = {
  performBackgroundCheck
};
