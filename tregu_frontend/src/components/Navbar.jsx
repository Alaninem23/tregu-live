import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { auth, logout } = useAuth();
  return (
    <nav className="flex gap-4 p-3 border-b">
      <Link to="/">Tregu</Link>
      <Link to="/feed">News Feed</Link>
      {auth.user ? (
        <>
          {auth.user.role === "buyer" && <Link to="/dashboard/buyer">My Dashboard</Link>}
          {auth.user.role === "seller" && <Link to="/dashboard/seller">Seller Dashboard</Link>}
          {auth.user.role === "admin" && <Link to="/dashboard/admin">Admin</Link>}
          <button onClick={logout} className="ml-auto border px-3 py-1 rounded">Log out</button>
        </>
      ) : (
        <div className="ml-auto flex gap-3">
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </div>
      )}
    </nav>
  );
}
