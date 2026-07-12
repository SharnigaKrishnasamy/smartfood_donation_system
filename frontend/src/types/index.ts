export type Role = "donor" | "ngo" | "volunteer" | "admin";

export type DonationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "expired"
  | "cancelled";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role_name: Role;
  organization_name?: string | null;
  registration_number?: string | null;
  is_approved: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  profile_image?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FoodItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

export interface DonationImage {
  id: number;
  image_path: string;
  url: string;
}

export interface VolunteerAssignment {
  id: number;
  donation_id: number;
  volunteer_id: number;
  status: "assigned" | "picked_up" | "delivered" | "cancelled";
  assigned_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  pickup_notes?: string | null;
  delivery_notes?: string | null;
  volunteer_info?: Partial<User> | null;
}

export interface Donation {
  id: number;
  donor_id: number;
  ngo_id?: number | null;
  food_name: string;
  category: string;
  is_veg: boolean;
  quantity: number;
  quantity_unit: string;
  description?: string | null;
  cooking_time?: string | null;
  expiry_datetime: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  status: DonationStatus;
  created_at: string;
  updated_at: string;
  food_items?: FoodItem[];
  images?: DonationImage[];
  donor_info?: Partial<User> | null;
  ngo_info?: Partial<User> | null;
  assignment?: VolunteerAssignment | null;
  distance_km?: number | null;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_donation_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export const FOOD_CATEGORIES = [
  "cooked_meals",
  "raw_ingredients",
  "packaged",
  "bakery",
  "fruits_vegetables",
  "dairy",
  "beverages",
  "other",
] as const;

export const STATUS_LABELS: Record<DonationStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Not Suitable",
  assigned: "Volunteer Assigned",
  picked_up: "Picked Up",
  delivered: "Delivered",
  expired: "Expired",
  cancelled: "Cancelled",
};
