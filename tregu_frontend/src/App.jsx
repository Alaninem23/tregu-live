// App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardBuyer from "./pages/DashboardBuyer";
import DashboardSeller from "./pages/DashboardSeller";
import DashboardAdmin from "./pages/DashboardAdmin";
import RequireAuth from "./auth/RequireAuth";

export default function App(){
  return (
    <div>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/feed" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />

        <Route path="/dashboard/buyer" element={
          <RequireAuth role="buyer"><DashboardBuyer/></RequireAuth>
        }/>
        <Route path="/dashboard/seller" element={
          <RequireAuth role="seller"><DashboardSeller/></RequireAuth>
        }/>
        <Route path="/dashboard/admin" element={
          <RequireAuth role="admin"><DashboardAdmin/></RequireAuth>
        }/>
      </Routes>
    </div>
  );
}
