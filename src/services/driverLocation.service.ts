import api from "./api";

export type DriverStatus = "offline" | "available" | "busy" | "on_ride";

export type DriverVehicleType = "motorcycle" | "car" | "van" | "truck";

export type DriverVehicleInfo = {
  plate?: string;
  model?: string;
  color?: string;
  year?: number;
};

export type UpdateDriverLocationRequest = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  status?: DriverStatus;
  vehicleType: DriverVehicleType;
  vehicle?: DriverVehicleInfo;
  serviceTypes?: Array<"ride" | "delivery">;
};

class DriverLocationService {
  async getMe() {
    const res = await api.get("/driver-location/me");
    return res.data;
  }

  async update(data: UpdateDriverLocationRequest) {
    const res = await api.post("/driver-location/update", data);
    return res.data;
  }

  async setStatus(data: {
    status: DriverStatus;
    acceptingRides?: boolean;
    serviceTypes?: Array<"ride" | "delivery">;
  }) {
    const res = await api.patch("/driver-location/status", data);
    return res.data;
  }
}

export default new DriverLocationService();
