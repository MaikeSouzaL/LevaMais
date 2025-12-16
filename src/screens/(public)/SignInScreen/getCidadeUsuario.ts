
import { reverseGeocodeAsync, LocationObjectCoords } from "expo-location";

export async function getCidadeUsuario(
  coords: LocationObjectCoords
): Promise<string | null> {
  try {
    const addressResponse = await reverseGeocodeAsync(coords);

    if (!addressResponse || addressResponse.length === 0) return null;

    const address = addressResponse[0];

    const cidade = address.city || address.subregion || null;

    return cidade;
  } catch (error) {
    console.error("Erro ao obter cidade:", error);
    return null;
  }
}
