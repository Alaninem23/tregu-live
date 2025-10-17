// DashboardBuyer.jsx
import { useAuth } from "../auth/AuthContext";
export default function DashboardBuyer(){
  const { auth } = useAuth();
  return <div className="p-4"><h2>Buyer Dashboard</h2><p>Welcome {auth.user.email}. Browse & track orders here.</p></div>;
}