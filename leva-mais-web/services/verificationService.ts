import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Criar instância do axios
const api = axios.create({
  baseURL: `${API_URL}/verification`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface PendingDriver {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    category: string;
  };
  hasCnpj: boolean;
  cnpj?: string;
  documents: {
    cnh: { status: "approved" | "pending" | "rejected"; url: string };
    crlv: { status: "approved" | "pending" | "rejected"; url: string };
    criminalRecord: {
      status: "approved" | "pending" | "rejected";
      url: string;
    };
    proofOfResidence: {
      status: "approved" | "pending" | "rejected";
      url: string;
    };
  };
  photos: {
    profile: string;
    vehicle: string[];
    cnh: string;
  };
  profilePhotoUrl?: string;
  registrationDate: string;
  status: "pending" | "approved" | "rejected";
  cityId: string;
  cityName: string;
  assignedReviewer?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}

export interface VerificationStats {
  totalPending: number;
  approvedToday: number;
  rejectedToday: number;
  averageReviewTime: string;
}

export interface ApproveDriverData {
  notes?: string;
}

export interface RejectDriverData {
  reason: string;
  notes?: string;
}

class VerificationService {
  /**
   * Busca todos os motoristas pendentes de verificação
   */
  async getPendingDrivers(filters?: {
    status?: string;
    cityId?: string;
    search?: string;
  }): Promise<PendingDriver[]> {
    try {
      const response = await api.get("/drivers", { params: filters });
      return response.data;
    } catch (error) {
      // Tratar 404 (endpoint ausente) e outros erros retornando lista vazia
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      // Evitar poluir console em desenvolvimento; a UI já mostra estado vazio
      return [];
    }
  }

  /**
   * Busca um motorista específico por ID
   */
  async getDriverById(id: string): Promise<PendingDriver | null> {
    try {
      const response = await api.get(`/drivers/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar motorista:", error);
      return null;
    }
  }

  /**
   * Busca estatísticas de verificação
   */
  async getStats(): Promise<VerificationStats> {
    try {
      const response = await api.get("/stats");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return {
        totalPending: 0,
        approvedToday: 0,
        rejectedToday: 0,
        averageReviewTime: "0 min",
      };
    }
  }

  /**
   * Aprova um motorista
   */
  async approveDriver(id: string, data?: ApproveDriverData): Promise<void> {
    try {
      await api.post(`/drivers/${id}/approve`, data);
    } catch (error) {
      console.error("Erro ao aprovar motorista:", error);
      throw error;
    }
  }

  /**
   * Rejeita um motorista
   */
  async rejectDriver(id: string, data: RejectDriverData): Promise<void> {
    try {
      await api.post(`/drivers/${id}/reject`, data);
    } catch (error) {
      console.error("Erro ao rejeitar motorista:", error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um documento específico
   */
  async updateDocumentStatus(
    driverId: string,
    documentType: keyof PendingDriver["documents"],
    status: "approved" | "pending" | "rejected"
  ): Promise<void> {
    try {
      await api.patch(`/drivers/${driverId}/documents/${documentType}`, {
        status,
      });
    } catch (error) {
      console.error("Erro ao atualizar status do documento:", error);
      throw error;
    }
  }

  /**
   * Atribui um revisor a um motorista pendente
   */
  async assignReviewer(driverId: string, reviewerName: string): Promise<void> {
    try {
      await api.patch(`/drivers/${driverId}/assign`, { reviewerName });
    } catch (error) {
      console.error("Erro ao atribuir revisor:", error);
      throw error;
    }
  }
}

export const verificationService = new VerificationService();
