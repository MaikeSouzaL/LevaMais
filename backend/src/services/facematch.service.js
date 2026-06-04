/**
 * Face-match Service using AWS Rekognition with Heuristic fallback
 */

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

const SIMILARITY_THRESHOLD = 80.0;

/**
 * Downloads an image from a URL and returns a Buffer
 * @param {string} url 
 * @returns {Promise<Buffer>}
 */
async function downloadImageToBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`[FaceMatch] Error downloading image from ${url}:`, error.message);
    throw error;
  }
}

/**
 * Performs Face-match comparison between a selfie and a document photo
 * @param {string} selfieUrl 
 * @param {string} documentUrl 
 * @returns {Promise<{success: boolean, confidence: number, status: 'approved' | 'rejected', reason?: string}>}
 */
async function performFaceMatch(selfieUrl, documentUrl) {
  // If AWS credentials are set, attempt real face matching via AWS Rekognition
  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    try {
      console.log("[FaceMatch] Initializing AWS Rekognition comparison...");
      const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
      
      const client = new RekognitionClient({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY
        }
      });

      console.log("[FaceMatch] Downloading selfie and document images...");
      const [selfieBuffer, documentBuffer] = await Promise.all([
        downloadImageToBuffer(selfieUrl),
        downloadImageToBuffer(documentUrl)
      ]);

      const command = new CompareFacesCommand({
        SourceImage: { Bytes: documentBuffer },
        TargetImage: { Bytes: selfieBuffer },
        SimilarityThreshold: SIMILARITY_THRESHOLD
      });

      const response = await client.send(command);
      const faceMatches = response.FaceMatches || [];

      if (faceMatches.length > 0) {
        const match = faceMatches[0];
        const similarity = match.Similarity || 0.0;
        console.log(`[FaceMatch] Face match successful with similarity: ${similarity}%`);
        
        if (similarity >= SIMILARITY_THRESHOLD) {
          return {
            success: true,
            confidence: parseFloat(similarity.toFixed(2)),
            status: "approved"
          };
        } else {
          return {
            success: true,
            confidence: parseFloat(similarity.toFixed(2)),
            status: "rejected",
            reason: `Grau de equivalência facial de ${similarity.toFixed(1)}% está abaixo do limite mínimo de ${SIMILARITY_THRESHOLD}%`
          };
        }
      } else {
        console.log("[FaceMatch] No matching faces found in the photos.");
        return {
          success: true,
          confidence: 0.0,
          status: "rejected",
          reason: "Nenhum rosto correspondente pôde ser encontrado entre as duas fotos fornecidas."
        };
      }
    } catch (awsError) {
      console.error("[FaceMatch] AWS Rekognition comparison failed, falling back to simulated validation:", awsError.message);
      // Fallback to simulation if AWS SDK isn't installed or throws an error
    }
  }

  // Sem provedor (AWS) configurado: NÃO decide automaticamente.
  // Fica PENDENTE para aprovação manual no dashboard (decisão de negócio atual).
  console.log("[FaceMatch] Sem API configurada — reconhecimento facial deixado para revisão manual (pending).");
  return Promise.resolve({
    success: true,
    confidence: null,
    status: "pending",
    reason: "Aguardando revisão manual no painel (reconhecimento facial).",
  });
}

module.exports = {
  performFaceMatch
};
