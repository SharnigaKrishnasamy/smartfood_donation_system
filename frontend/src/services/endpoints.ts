import { api } from "./api";
import { Donation, Notification, Role, User } from "../types";

// --- Auth ---
export const AuthAPI = {
  register: (payload: Record<string, unknown>) => api.post("/api/auth/register", payload),
  login: (email: string, password: string) => api.post("/api/auth/login", { email, password }),
  me: () => api.get<{ user: User }>("/api/auth/me"),
  updateProfile: (formData: FormData) => api.put("/api/auth/profile", formData),
  changePassword: (current_password: string, new_password: string) =>
    api.put("/api/auth/change-password", { current_password, new_password }),
  logout: () => api.post("/api/auth/logout"),
};

// --- Donor ---
export const DonorAPI = {
  create: (formData: FormData) => api.post("/api/donor/donations", formData),
  list: (status?: string) =>
    api.get<{ donations: Donation[] }>("/api/donor/donations", { params: { status } }),
  get: (id: number) => api.get<{ donation: Donation }>(`/api/donor/donations/${id}`),
  update: (id: number, formData: FormData) => api.put(`/api/donor/donations/${id}`, formData),
  remove: (id: number) => api.delete(`/api/donor/donations/${id}`),
  cancel: (id: number) => api.put(`/api/donor/donations/${id}/cancel`),
};

// --- NGO ---
export const NgoAPI = {
  nearby: (params: Record<string, unknown>) =>
    api.get<{ donations: Donation[] }>("/api/ngo/donations/nearby", { params }),
  accept: (id: number) => api.put(`/api/ngo/donations/${id}/accept`),
  reject: (id: number) => api.put(`/api/ngo/donations/${id}/reject`),
  myDonations: (status?: string) =>
    api.get<{ donations: Donation[] }>("/api/ngo/donations", { params: { status } }),
  get: (id: number) => api.get<{ donation: Donation }>(`/api/ngo/donations/${id}`),
};

// --- Volunteer ---
export const VolunteerAPI = {
  available: (params: Record<string, unknown>) =>
    api.get<{ pickups: Donation[] }>("/api/volunteer/pickups/available", { params }),
  acceptPickup: (id: number) => api.post(`/api/volunteer/pickups/${id}/accept`),
  confirmPickup: (id: number, notes?: string) =>
    api.put(`/api/volunteer/pickups/${id}/confirm-pickup`, { notes }),
  confirmDelivery: (id: number, notes?: string) =>
    api.put(`/api/volunteer/pickups/${id}/confirm-delivery`, { notes }),
  history: () => api.get("/api/volunteer/history"),
};

// --- Admin ---
export const AdminAPI = {
  dashboard: () => api.get("/api/admin/dashboard"),
  listUsers: (params: Record<string, unknown> = {}) =>
    api.get<{ users: User[] }>("/api/admin/users", { params }),
  toggleActive: (id: number) => api.put(`/api/admin/users/${id}/toggle-active`),
  approveNgo: (id: number) => api.put(`/api/admin/users/${id}/approve-ngo`),
  deleteUser: (id: number) => api.delete(`/api/admin/users/${id}`),
  listDonations: (status?: string) =>
    api.get<{ donations: Donation[] }>("/api/admin/donations", { params: { status } }),
  deleteDonation: (id: number) => api.delete(`/api/admin/donations/${id}`),
  exportCsv: () => api.get("/api/admin/reports/donations.csv", { responseType: "blob" }),
  auditLogs: () => api.get("/api/admin/audit-logs"),
};

// --- Notifications ---
export const NotificationAPI = {
  list: (unreadOnly = false) =>
    api.get<{ notifications: Notification[]; unread_count: number }>("/api/notifications", {
      params: { unread_only: unreadOnly },
    }),
  markRead: (id: number) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put("/api/notifications/read-all"),
};

// --- Search ---
export const SearchAPI = {
  donations: (params: Record<string, unknown>) =>
    api.get<{ donations: Donation[] }>("/api/search/donations", { params }),
  ngos: (q?: string) => api.get("/api/search/ngos", { params: { q } }),
  volunteers: (q?: string) => api.get("/api/search/volunteers", { params: { q } }),
};

export type { Role };
