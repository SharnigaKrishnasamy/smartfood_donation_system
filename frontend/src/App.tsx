import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RoleRedirect } from "./pages/RoleRedirect";
import { NotFoundPage, UnauthorizedPage } from "./pages/ErrorPages";
import { ProfilePage } from "./pages/ProfilePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SearchPage } from "./pages/SearchPage";

import { DonorDashboard } from "./pages/donor/DonorDashboard";
import { NewDonationPage } from "./pages/donor/NewDonationPage";
import { DonorHistoryPage } from "./pages/donor/DonorHistoryPage";

import { NgoDashboard } from "./pages/ngo/NgoDashboard";
import { NgoNearbyPage } from "./pages/ngo/NgoNearbyPage";
import { NgoHistoryPage } from "./pages/ngo/NgoHistoryPage";

import { VolunteerDashboard } from "./pages/volunteer/VolunteerDashboard";
import { VolunteerPickupsPage } from "./pages/volunteer/VolunteerPickupsPage";
import { VolunteerHistoryPage } from "./pages/volunteer/VolunteerHistoryPage";

import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminDonationsPage } from "./pages/admin/AdminDonationsPage";
import { AdminNgoApprovalsPage } from "./pages/admin/AdminNgoApprovalsPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/redirecting" element={<RoleRedirect />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Shared authenticated pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
      </Route>

      {/* Donor */}
      <Route element={<ProtectedRoute allowedRoles={["donor"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/donor" element={<DonorDashboard />} />
          <Route path="/donor/new" element={<NewDonationPage />} />
          <Route path="/donor/history" element={<DonorHistoryPage />} />
        </Route>
      </Route>

      {/* NGO */}
      <Route element={<ProtectedRoute allowedRoles={["ngo"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/ngo" element={<NgoDashboard />} />
          <Route path="/ngo/nearby" element={<NgoNearbyPage />} />
          <Route path="/ngo/history" element={<NgoHistoryPage />} />
        </Route>
      </Route>

      {/* Volunteer */}
      <Route element={<ProtectedRoute allowedRoles={["volunteer"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/volunteer" element={<VolunteerDashboard />} />
          <Route path="/volunteer/pickups" element={<VolunteerPickupsPage />} />
          <Route path="/volunteer/history" element={<VolunteerHistoryPage />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/donations" element={<AdminDonationsPage />} />
          <Route path="/admin/ngo-approvals" element={<AdminNgoApprovalsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
