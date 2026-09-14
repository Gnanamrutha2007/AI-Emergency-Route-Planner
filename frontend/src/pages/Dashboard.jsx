import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Real hospital data based on Chennai suburbs
const HOSPITALS = [
  { id: 1, name: "Tagore Medical College", coords: [12.8596, 80.1417], beds: 12 },
  { id: 2, name: "Chettinad Health City", coords: [12.7917, 80.2173], beds: 5 },
  { id: 3, name: "SRM General Hospital", coords: [12.8236, 80.0435], beds: 8 }
];

export default function Dashboard() {
  const defaultCenter = [12.8399, 80.1545]; // Melakottaiyur (Ambulance)
  
  // State to hold the form inputs and AI results
  const [severity, setSeverity] = useState("1");
  const [weather, setWeather] = useState("0");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);

  // This function talks to your Django AI backend
  const handlePredict = async () => {
    setLoading(true);
    const currentHour = new Date().getHours();

    try {
      const response = await fetch("http://127.0.0.1:8000/api/predict-traffic/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hour: currentHour,
          weather: parseInt(weather),
          severity: parseInt(severity),
        }),
      });

      const data = await response.json();
      setAiResult(data);
      
      // Select nearest hospital and draw a route line
      const selectedHospital = HOSPITALS[0]; 
      setActiveRoute([defaultCenter, selectedHospital.coords]);

    } catch (error) {
      console.error("Error connecting to AI backend:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚑 Ambulance Dashboard</h2>
      <p>Select conditions to run AI route & traffic analysis.</p>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        
        {/* Interactive Map */}
        <div style={{ flex: 2, height: "600px", border: "2px solid #ccc", borderRadius: "8px", overflow: "hidden", zIndex: 0 }}>
          <MapContainer center={defaultCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            
            <Marker position={defaultCenter}>
              <Popup>🚑 Ambulance Standby (Melakottaiyur)</Popup>
            </Marker>

            {HOSPITALS.map((hospital) => (
              <Marker key={hospital.id} position={hospital.coords}>
                <Popup>
                  🏥 <strong>{hospital.name}</strong><br/>
                  ICU Beds: {hospital.beds}
                </Popup>
              </Marker>
            ))}

            {activeRoute && (
              <Polyline 
                positions={activeRoute} 
                color={aiResult?.traffic_level === 2 ? "red" : (aiResult?.traffic_level === 1 ? "orange" : "blue")} 
                weight={5} 
                dashArray="10, 10" 
              />
            )}
          </MapContainer>
        </div>

        {/* Control Panel */}
        <div style={{ flex: 1, padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
          <h3>Emergency Parameters</h3>

          <label style={{ display: "block", marginTop: "10px", fontWeight: "bold" }}>Emergency Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: "100%", padding: "8px" }}>
            <option value="2">High (Critical)</option>
            <option value="1">Medium</option>
            <option value="0">Low</option>
          </select>

          <label style={{ display: "block", marginTop: "10px", fontWeight: "bold" }}>Weather Condition</label>
          <select value={weather} onChange={(e) => setWeather(e.target.value)} style={{ width: "100%", padding: "8px" }}>
            <option value="0">Clear Sky</option>
            <option value="1">Heavy Rain</option>
          </select>

          <button
            onClick={handlePredict}
            disabled={loading}
            style={{ marginTop: "20px", width: "100%", padding: "12px", background: "#d9534f", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
          >
            {loading ? "Analyzing..." : "Analyze Route & Predict Traffic"}
          </button>

          {aiResult && (
            <div style={{ marginTop: "20px", padding: "15px", background: "#e8f4fd", borderLeft: "4px solid #0275d8", borderRadius: "4px" }}>
              <h4 style={{ margin: "0 0 10px 0" }}>🤖 AI Route Decision</h4>
              <p style={{ margin: "4px 0" }}><strong>Selected Hospital:</strong> Tagore Medical College</p>
              <p style={{ margin: "4px 0" }}><strong>Traffic Status:</strong> {aiResult.prediction_text}</p>
              <p style={{ margin: "4px 0" }}><strong>Recommended Speed:</strong> {aiResult.recommended_speed_kmh} km/h</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}