import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children, role }) {
  const { auth } = useAuth();
  if (!auth?.user) return <Navigate to="/login" replace />;
  if (role && auth.user.role !== role) return <Navigate to="/" replace />;
  return children;
}
