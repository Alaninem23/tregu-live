// DashboardAdmin.jsx
import { useAuth } from "../auth/AuthContext";
export default function DashboardAdmin(){
  const { auth } = useAuth();
  return <div className="p-4"><h2>Admin Console</h2><p>Change user roles, site theme, troubleshoot accounts.</p></div>;
}