import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { Role } from "../types";

const HOME_BY_ROLE: Record<Role, string> = {
  donor: "/donor",
  ngo: "/ngo",
  volunteer: "/volunteer",
  admin: "/admin",
};

export function RoleRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    navigate(HOME_BY_ROLE[user.role_name], { replace: true });
  }, [user, loading, navigate]);

  return <LoadingScreen label="Taking you to your dashboard…" />;
}
