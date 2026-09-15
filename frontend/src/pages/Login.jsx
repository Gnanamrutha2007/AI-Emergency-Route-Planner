import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between", fontFamily: "sans-serif" }}>
      
      {/* Top Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "20px 40px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h3 style={{ margin: 0, color: "#2c3e50", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }} onClick={() => navigate("/")}>
          <span>🚑</span> MediRoute Enterprise
        </h3>
        <button onClick={() => navigate("/")} style={{ padding: "8px 18px", background: "#7f8c8d", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
          Back to Home
        </button>
      </div>

      {/* Inline Login Container */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "20px" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.06)", width: "100%", maxWidth: "420px", border: "1px solid #eaeaea" }}>
          
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>🔒</div>
            <h2 style={{ margin: "0 0 8px 0", color: "#2c3e50", fontSize: "22px", lineHeight: "1.2" }}>Operator Authentication</h2>
            <span style={{ fontSize: "13px", color: "#7f8c8d" }}>Enter credentials to access dispatch telemetry</span>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#7f8c8d", marginBottom: "6px" }}>Operator Username</label>
              <input 
                type="text" 
                placeholder="e.g. dispatcher_unit1" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" }}
                required 
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#7f8c8d", marginBottom: "6px" }}>Security Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" }}
                required 
              />
            </div>

            <button type="submit" style={{ width: "100%", padding: "14px", background: "#e74c3c", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(231,76,60,0.3)" }}>
              Authenticate & Launch ➔
            </button>
          </form>

        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", color: "#95a5a6", fontSize: "12px", padding: "20px" }}>
        <p style={{ margin: 0 }}>Secure Dispatch Terminal v2.4 • Authorized Personnel Only</p>
      </div>

    </div>
  );
}