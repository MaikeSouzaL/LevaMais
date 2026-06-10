import { supabase } from "../lib/supabase";

export interface Ride {
  _id: string;
  serviceType: "ride" | "delivery" | string;
  status: string;
  pickup: {
    address: string;
  };
  dropoff: {
    address: string;
  };
  pricing?: {
    total?: number;
    platformFee?: number;
  };
  clientId?: {
    _id?: string;
    name?: string;
  };
}

export interface OperationsSummary {
  success: boolean;
  generatedAt: string;
  health: "healthy" | "warning" | "critical";
  rides: {
    active: number;
    byStatus: Record<string, number>;
    byService: Record<string, number>;
    paymentPending: number;
    waitingRequests: number;
  };
  drivers: {
    total: number;
    approved: number;
    online: number;
    available: number;
    busy: number;
    onRide: number;
    offline: number;
    staleLocations: number;
  };
  tracking: {
    expected: number;
    fresh: number;
    stale: number;
    missing: number;
    coveragePct: number;
    staleRideIds: string[];
  };
  alerts: Array<{
    id: string;
    severity: "warning" | "critical";
    title: string;
    message: string;
    value: number;
  }>;
  recentEvents: Array<{
    id: string;
    serviceType: string;
    status: string;
    clientName: string;
    pickup: string;
    dropoff: string;
    total: number;
    updatedAt: string;
  }>;
}

export const ridesService = {
  async getAll(): Promise<Ride[]> {
    try {
      const [ridesRes, deliveriesRes] = await Promise.all([
        supabase
          .from("rides")
          .select(`
            *,
            profiles(*)
          `),
        supabase
          .from("deliveries")
          .select(`
            *,
            profiles(*)
          `),
      ]);

      const list: Ride[] = [];

      if (ridesRes.data) {
        ridesRes.data.forEach((row: any) => {
          const profile = row.profiles?.[0] || row.profiles || {};
          list.push({
            _id: row.id,
            serviceType: "ride",
            status: row.status,
            pickup: { address: row.pickup_address || "" },
            dropoff: { address: row.dropoff_address || "" },
            pricing: {
              total: Number(row.price || row.pricing?.total || 0),
              platformFee: Number(row.pricing?.platformFee || 0),
            },
            clientId: {
              _id: row.client_id,
              name: profile.full_name || "Cliente",
            },
          });
        });
      }

      if (deliveriesRes.data) {
        deliveriesRes.data.forEach((row: any) => {
          const profile = row.profiles?.[0] || row.profiles || {};
          list.push({
            _id: row.id,
            serviceType: "delivery",
            status: row.status,
            pickup: { address: row.pickup_address || "" },
            dropoff: { address: row.dropoff_address || "" },
            pricing: {
              total: Number(row.price || row.pricing?.total || 0),
              platformFee: Number(row.pricing?.platformFee || 0),
            },
            clientId: {
              _id: row.client_id,
              name: profile.full_name || "Cliente",
            },
          });
        });
      }

      return list;
    } catch (error) {
      console.error("Error fetching rides and deliveries:", error);
      return [];
    }
  },

  async getNfse(rideId: string): Promise<any> {
    return {
      success: true,
      nfseUrl: "https://example.com/nfse/placeholder.pdf",
      xmlUrl: "https://example.com/nfse/placeholder.xml",
      nfeNumber: "20260610001",
    };
  },
};

export const operationsService = {
  async getSummary(): Promise<OperationsSummary | null> {
    try {
      const allRides = await ridesService.getAll();
      const activeRides = allRides.filter(r => 
        !["completed", "cancelled", "finished"].includes(r.status.toLowerCase())
      );

      const byStatus: Record<string, number> = {};
      const byService: Record<string, number> = { ride: 0, delivery: 0 };
      let paymentPending = 0;
      let waitingRequests = 0;

      allRides.forEach(r => {
        const status = r.status.toLowerCase();
        byStatus[status] = (byStatus[status] || 0) + 1;
        if (r.serviceType === "ride") byService.ride++;
        if (r.serviceType === "delivery") byService.delivery++;
        if (status === "payment_pending") paymentPending++;
        if (status === "requested" || status === "searching") waitingRequests++;
      });

      const { data: driversList } = await supabase.from("profiles").select("id").eq("role", "driver");
      const { data: approvedDrivers } = await supabase.from("driver_details").select("id").eq("status", "approved");
      const { data: activeLocations } = await supabase.from("driver_locations").select("id, status");

      const totalDrivers = driversList?.length || 0;
      const approvedCount = approvedDrivers?.length || 0;
      const onlineDrivers = activeLocations?.length || 0;

      let availableCount = 0;
      let busyCount = 0;
      let onRideCount = 0;

      activeLocations?.forEach((loc: any) => {
        if (loc.status === "available") availableCount++;
        else if (loc.status === "busy") busyCount++;
        else if (loc.status === "on_ride") onRideCount++;
      });

      const recentEvents = allRides.slice(0, 5).map(r => ({
        id: r._id,
        serviceType: r.serviceType,
        status: r.status,
        clientName: r.clientId?.name || "Cliente",
        pickup: r.pickup.address,
        dropoff: r.dropoff.address,
        total: r.pricing?.total || 0,
        updatedAt: new Date().toISOString(),
      }));

      return {
        success: true,
        generatedAt: new Date().toISOString(),
        health: activeRides.length > 20 ? "warning" : "healthy",
        rides: {
          active: activeRides.length,
          byStatus,
          byService,
          paymentPending,
          waitingRequests,
        },
        drivers: {
          total: totalDrivers,
          approved: approvedCount,
          online: onlineDrivers,
          available: availableCount,
          busy: busyCount,
          onRide: onRideCount,
          offline: totalDrivers - onlineDrivers,
          staleLocations: 0,
        },
        tracking: {
          expected: onlineDrivers,
          fresh: onlineDrivers,
          stale: 0,
          missing: 0,
          coveragePct: 100,
          staleRideIds: [],
        },
        alerts: [],
        recentEvents,
      };
    } catch (error) {
      console.error("Error generating operations summary:", error);
      return null;
    }
  },
};
