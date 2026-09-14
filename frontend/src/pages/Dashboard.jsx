import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const HOSPITALS = [
  { id: 1, name: "Tagore Medical College", coords: [12.8596, 80.1417], beds: 12 },
  { id: 2, name: "Chettinad Health City", coords: [12.7917, 80.2173], beds: 5 },
  { id: 3, name: "SRM General Hospital", coords: [12.8236, 80.0435], beds: 8 }
];

export default function Dashboard() {
  const defaultCenter = [12.8399, 80.1545]; // Melakottaiyur
  const hasGPS = "geolocation" in navigator;

  const [ambulanceLocation, setAmbulanceLocation] = useState(hasGPS ? null : defaultCenter);
  const [locationStatus, setLocationStatus] = useState(hasGPS ? "Acquiring GPS Signal..." : "GPS not supported. Using default.");
  
  const [severity, setSeverity] = useState("1");
  const [weather, setWeather] = useState("0");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState({ distance: 0, time: 0 });
  const [selectedHospital, setSelectedHospital] = useState(null);

  useEffect(() => {
    if (!hasGPS) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAmbulanceLocation([position.coords.latitude, position.coords.longitude]);
        setLocationStatus("Live GPS Active");
      },
      (error) => {
        console.error("GPS Error:", error);
        setLocationStatus("GPS permission denied. Using default location.");
        setAmbulanceLocation(defaultCenter); 
      },
      { enableHighAccuracy: true }
    );
  }, [hasGPS]);

  // Haversine formula to calculate geographic distance in kilometers
  const calculateDistance = (coord1, coord2) => {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const fetchStreetRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    setActiveRoute(routeCoords);
    setRouteMetrics({
      distance: (data.routes[0].distance / 1000).toFixed(1),
      time: Math.ceil(data.routes[0].duration / 60)
    });
  };

  const handlePredict = async () => {
    setLoading(true);
    const currentHour = new Date().getHours();

    try {
      const response = await fetch("http://127.0.0.1:8000/api/predict-traffic/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hour: currentHour, weather: parseInt(weather), severity: parseInt(severity) }),
      });
      const data = await response.json();
      setAiResult(data);
      
      // Smart Hospital Selection Engine
      let bestHospital = null;
      let shortestDistance = Infinity;

      HOSPITALS.forEach(hospital => {
        if (hospital.beds > 0) { // Only consider hospitals with available beds
          const dist = calculateDistance(ambulanceLocation, hospital.coords);
          if (dist < shortestDistance) {
            shortestDistance = dist;
            bestHospital = hospital;
          }
        }
      });

      setSelectedHospital(bestHospital);
      
      if (bestHospital) {
        await fetchStreetRoute(ambulanceLocation, bestHospital.coords);
      }

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!ambulanceLocation) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f7f6", fontFamily: "sans-serif" }}>
        <h2>📍 {locationStatus}</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", padding: "30px", fontFamily: "sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "#2c3e50" }}>🚑 Central Dispatch Dashboard</h2>
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ background: "white", padding: "10px 20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "4px solid #27ae60" }}>
            <span style={{ color: "#7f8c8d", fontSize: "12px", display: "block" }}>Location Status</span>
            <strong style={{ fontSize: "14px", color: "#2c3e50" }}>{locationStatus}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "25px" }}>
        
        <div style={{ flex: 2, height: "650px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 0 }}>
          <MapContainer center={ambulanceLocation} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <Marker position={ambulanceLocation}>
              <Popup>🚑 Your Live Location</Popup>
            </Marker>
            
            {HOSPITALS.map((h) => (
              <Marker key={h.id} position={h.coords}>
                <Popup><strong>{h.name}</strong><br/>ICU Beds: {h.beds}</Popup>
              </Marker>
            ))}

            {activeRoute && (
              <Polyline 
                positions={activeRoute} 
                color={aiResult?.traffic_level === 2 ? "#e74c3c" : (aiResult?.traffic_level === 1 ? "#f39c12" : "#3498db")} 
                weight={6} 
                opacity={0.8}
              />
            )}
          </MapContainer>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#34495e" }}>Dispatch Parameters</h3>
            
            <label style={{ display: "block", fontSize: "14px", color: "#7f8c8d", marginBottom: "5px" }}>Emergency Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "6px", border: "1px solid #ddd" }}>
              <option value="2">Level 1 - Critical / Trauma</option>
              <option value="1">Level 2 - Urgent</option>
              <option value="0">Level 3 - Non-Critical</option>
            </select>

            <label style={{ display: "block", fontSize: "14px", color: "#7f8c8d", marginBottom: "5px" }}>Road Weather Conditions</label>
            <select value={weather} onChange={(e) => setWeather(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "6px", border: "1px solid #ddd" }}>
              <option value="0">Clear / Dry Roads</option>
              <option value="1">Rain / Slippery Roads</option>
            </select>

            <button onClick={handlePredict} disabled={loading} style={{ width: "100%", padding: "14px", background: "#e74c3c", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>
              {loading ? "Calculating Optimum Route..." : "Dispatch Ambulance"}
            </button>
          </div>

          {aiResult && selectedHospital && (
            <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", borderTop: "5px solid #3498db" }}>
              <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>AI Routing Intelligence</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#7f8c8d" }}>Destination</span>
                  <strong style={{ display: "block", fontSize: "14px", color: "#2c3e50" }}>{selectedHospital.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#7f8c8d" }}>AI Traffic Prediction</span>
                  <strong style={{ display: "block", fontSize: "14px", color: aiResult.traffic_level === 2 ? "#e74c3c" : "#27ae60" }}>
                    {aiResult.prediction_text}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#7f8c8d" }}>Route Distance</span>
                  <strong style={{ display: "block", fontSize: "14px", color: "#2c3e50" }}>{routeMetrics.distance} km</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#7f8c8d" }}>Est. Travel Time</span>
                  <strong style={{ display: "block", fontSize: "14px", color: "#2c3e50" }}>{routeMetrics.time} mins</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}