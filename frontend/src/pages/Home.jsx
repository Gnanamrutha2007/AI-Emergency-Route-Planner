import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      
      {/* Top Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "20px 40px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h3 style={{ margin: 0, color: "#2c3e50", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🚑</span> MediRoute Enterprise
        </h3>
        <button onClick={() => navigate("/login")} style={{ padding: "10px 24px", background: "#27ae60", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 6px rgba(39,174,96,0.3)" }}>
          Operator Login
        </button>
      </div>

      {/* Hero Section */}
      <div style={{ textAlign: "center", maxWidth: "800px", margin: "60px auto" }}>
        <span style={{ background: "#ebf5fb", color: "#2980b9", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
          Next-Generation Emergency Response Platform
        </span>
        
        {/* FIXED: Added lineHeight: "1.2" and marginBottom to prevent overlapping */}
        <h1 style={{ fontSize: "42px", color: "#2c3e50", margin: "20px 0", lineHeight: "1.2" }}>
          Autonomous Ambulance Dispatch & Real-Time Routing Intelligence
        </h1>
        
        <p style={{ fontSize: "16px", color: "#7f8c8d", lineHeight: "1.6", marginBottom: "35px" }}>
          Minimizing pre-hospital transit delays through live browser GPS telemetry, automated environmental detection, machine learning traffic forecasting, and dynamic hospital bed allocation.
        </p>
        <button onClick={() => navigate("/dashboard")} style={{ padding: "16px 36px", background: "#e74c3c", color: "white", border: "none", borderRadius: "10px", fontSize: "18px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 6px 16px rgba(231,76,60,0.4)" }}>
          Launch Command Dashboard 🚀
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", maxWidth: "1000px", margin: "0 auto 40px auto" }}>
        
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: "4px solid #e74c3c" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>🛰️ Live GPS & Weather</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#7f8c8d", lineHeight: "1.5" }}>Automatically tracks vehicle coordinates and pings meteorological data for real-time adjustments.</p>
        </div>

        <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: "4px solid #3498db" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>🤖 AI Traffic Prediction</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#7f8c8d", lineHeight: "1.5" }}>Backend processes time, weather, and severity through a trained machine learning model.</p>
        </div>

        <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: "4px solid #27ae60" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>🏥 Smart Bed Allocation</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#7f8c8d", lineHeight: "1.5" }}>Calculates Haversine distance and checks live bed capacities to route to the optimal hospital.</p>
        </div>

      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", color: "#95a5a6", fontSize: "12px" }}>
        <p style={{ margin: 0 }}>MediRoute Emergency Systems • All Rights Reserved</p>
      </div>

    </div>
  );
}