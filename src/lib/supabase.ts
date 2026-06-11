import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from "@env";

export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Client admin com service_role — ignora RLS para queries de dispatch.
// Usado APENAS para buscar corridas disponíveis (getAvailableRequests).
const SERVICE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || "";
export const supabaseAdmin = SERVICE_KEY
  ? createClient(EXPO_PUBLIC_SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : supabase; // fallback para o client normal se a key não existir

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "client" | "driver" | "admin" | null;
          city: string | null;
          cpf: string | null;
          is_active: boolean;
          tour_seen: boolean;
          accepted_terms: boolean;
          expo_push_token: string | null;
          map_theme: "light" | "dark";
          rating: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
          wallet_balance: number;
          held_balance: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      driver_details: {
        Row: {
          id: string;
          status: "pending" | "approved" | "rejected" | "blocked" | "suspended";
          vehicle_type: "motorcycle" | "car" | "van" | "truck" | null;
          vehicle_plate: string | null;
          vehicle_model: string | null;
          vehicle_color: string | null;
          vehicle_year: number | null;
          service_types: string[];
          search_radius_km: number;
          auto_accept: boolean;
          profile_photo_url: string | null;
          crlv_front_url: string | null;
          crlv_back_url: string | null;
          cpf_photo_url: string | null;
          selfie_url: string | null;
          cpf_status: string;
          selfie_status: string;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
          balance: number;
          total_earnings: number;
          total_withdrawn: number;
        };
        Update: Partial<Database["public"]["Tables"]["driver_details"]["Row"]>;
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "topup" | "hold" | "release" | "refund_hold" | "refund" | "cancellation_fee" | "debt_settlement" | "delivery_failed_charge" | "withdrawal" | "manual_adjustment" | "ride_payment" | "deposit" | "deduction" | "driver_topup" | "app_fee_debit";
          amount: number;
          description: string | null;
          created_at: string;
          reference_id: string | null;
          status: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["wallet_transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["wallet_transactions"]["Row"]>;
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          pix_key: string;
          pix_key_type: "cpf" | "email" | "phone" | "random";
          status: "pending" | "approved" | "paid" | "rejected";
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["withdrawals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["withdrawals"]["Row"]>;
      };
      user_cards: {
        Row: {
          id: string;
          user_id: string;
          brand: string;
          last4: string;
          holder_name: string;
          expiry_month: number;
          expiry_year: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_cards"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["user_cards"]["Row"]>;
      };
      rides: {
        Row: {
          id: string;
          client_id: string;
          driver_id: string | null;
          service_type: "ride" | "delivery";
          vehicle_type: string;
          ride_category: string | null;
          pickup: any;
          dropoff: any;
          stops: any | null;
          pricing: any;
          distance: any;
          duration: any;
          route_coordinates: any | null;
          details: any | null;
          status: string;
          cancellation_fee: number | null;
          requested_at: string;
          accepted_at: string | null;
          arrived_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          scheduled_for: string | null;
          negotiation: any | null;
          promotion: any | null;
          payment: any | null;
          is_waiting_in_queue: boolean;
          arrived_at_dropoff: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rides"]["Row"], "id" | "requested_at" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["rides"]["Row"]>;
      };
    };
  };
};
