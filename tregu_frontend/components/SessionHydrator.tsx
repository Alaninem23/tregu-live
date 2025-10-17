"use client"
import { useEffect } from "react"

export default function SessionHydrator(){
  useEffect(() => {
    try{
      // Check if user already has session data in localStorage
      const hasCookie = typeof document !== "undefined" && document.cookie.includes("tregu_session=");
      const hasLocalUser = typeof window !== "undefined" && localStorage.getItem("tregu:user");
      
      if (!hasCookie && !hasLocalUser) {
        // Create a minimal anonymous session in localStorage
        const mode  = localStorage.getItem("tregu:accountMode") || "personal";
        const plan  = localStorage.getItem("tregu:tier") || (mode === "business" ? "standard" : "starter");
        const seats = Math.max(1, Number(localStorage.getItem("tregu:seats") || "1"));
        
        // Store anonymous session data
        localStorage.setItem("tregu:accountMode", mode);
        localStorage.setItem("tregu:tier", plan);
        localStorage.setItem("tregu:seats", String(seats));
        
        // Note: Real registration happens at /join page when user provides credentials
      }
    }catch{}
  }, []);
  return null;
}