import { supabase } from '../lib/supabase';

export interface Purpose {
  _id: string;
  id: string; // slug (ex: 'delivery', 'moto-taxi')
  title: string;
  subtitle: string;
  serviceMode?: "ride" | "delivery" | "frete";
  vehicleType: 'motorcycle' | 'car' | 'van' | 'truck';
  icon: string;
  badges?: string[];
  isActive: boolean;
}

const DEFAULT_PURPOSES: Purpose[] = [
  {
    _id: "p1",
    id: "ride-car",
    title: "Corrida Regular",
    subtitle: "Carro particular para o dia a dia",
    serviceMode: "ride",
    vehicleType: "car",
    icon: "car",
    badges: ["Mais popular"],
    isActive: true,
  },
  {
    _id: "p2",
    id: "delivery-moto",
    title: "Entrega Moto",
    subtitle: "Entregas rapidas de documentos e pacotes",
    serviceMode: "delivery",
    vehicleType: "motorcycle",
    icon: "bike",
    badges: ["Rapido"],
    isActive: true,
  },
  {
    _id: "p3",
    id: "frete-van",
    title: "Frete & Mudanca",
    subtitle: "Transporte de cargas e volumes maiores",
    serviceMode: "frete",
    vehicleType: "van",
    icon: "truck",
    isActive: true,
  },
];

const purposeService = {
  /**
   * Busca todos os tipos de serviço ativos
   */
  getAll: async (isActive = true): Promise<Purpose[]> => {
    try {
      const { data, error } = await supabase
        .from("purposes")
        .select("*")
        .eq("is_active", isActive);

      if (error) {
        if (error.code === "42P01") {
          return DEFAULT_PURPOSES;
        }
        throw error;
      }

      return (data || []).map((row: any) => ({
        _id: row.id,
        id: row.slug || row.id,
        title: row.title,
        subtitle: row.subtitle || row.description || "",
        serviceMode: row.service_mode,
        vehicleType: row.vehicle_type,
        icon: row.icon || "car",
        badges: row.badges || [],
        isActive: row.is_active,
      }));
    } catch (error) {
      console.error("Erro ao carregar finalidades do Supabase:", error);
      return DEFAULT_PURPOSES;
    }
  },

  /**
   * Busca tipos de serviço por categoria de veículo
   */
  getByVehicle: async (vehicleType: string): Promise<Purpose[]> => {
    try {
      const all = await purposeService.getAll();
      return all.filter((p) => p.vehicleType === vehicleType);
    } catch {
      return DEFAULT_PURPOSES.filter((p) => p.vehicleType === vehicleType);
    }
  }
};

export default purposeService;
