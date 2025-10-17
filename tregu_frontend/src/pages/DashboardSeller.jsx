// DashboardSeller.jsx
import { useAuth } from "../auth/AuthContext";
export default function DashboardSeller(){
  const { auth } = useAuth();
  return <div className="p-4"><h2>Seller Dashboard</h2><p>Manage inventory, orders, payouts, and post to the public feed.</p></div>;
}