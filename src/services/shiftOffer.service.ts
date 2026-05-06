import api from "./api";

export type ShiftOffer = {
  _id: string;
  clientId: string | { _id: string; name?: string; phone?: string };
  cityId?: string | null;
  title: string;
  description?: string;
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  dailyAmount: number;
  fuelIncluded: boolean;
  startAt: string;
  endAt: string;
  status: "open" | "accepted" | "completed" | "cancelled" | "expired";
  acceptedBy?: string | { _id: string; name?: string; phone?: string } | null;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
};

class ShiftOfferService {
  async create(payload: {
    title: string;
    description?: string;
    cityId?: string;
    vehicleType?: "motorcycle" | "car" | "van" | "truck";
    dailyAmount: number;
    fuelIncluded: boolean;
    startAt: string;
    endAt: string;
  }): Promise<ShiftOffer> {
    const response = await api.post("/shift-offers", payload);
    return response.data?.offer;
  }

  async listClientOffers(): Promise<ShiftOffer[]> {
    const response = await api.get("/shift-offers/client");
    return response.data?.offers || [];
  }

  async listAvailableOffers(): Promise<ShiftOffer[]> {
    const response = await api.get("/shift-offers/available");
    return response.data?.offers || [];
  }

  async listDriverAccepted(): Promise<ShiftOffer[]> {
    const response = await api.get("/shift-offers/driver");
    return response.data?.offers || [];
  }

  async accept(offerId: string): Promise<ShiftOffer> {
    const response = await api.post(`/shift-offers/${offerId}/accept`);
    return response.data?.offer;
  }
}

export default new ShiftOfferService();
