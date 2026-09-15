import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Map Markers using Leaflet DivIcon for Light Theme
const ambulanceIcon = L.divIcon({
  className: 'custom-ambulance',
  html: '<div style="background-color: #e74c3c; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(231,76,60,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px;">🚑</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const hospitalIcon = L.divIcon({
  className: 'custom-hospital',
  html: '<div style="background-color: #27ae60; width: 30px; height: 30px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(39,174,96,0.4); display: flex; align-items: center; justify-content: center; font-size: 13px;">🏥</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const DEFAULT_CENTER = [12.8399, 80.1545]; // VIT Chennai / Melakottaiyur region
const HOSPITALS = [
  { id: 1, name: "Tagore Medical College", coords: [12.8596, 80.1417], beds: 12, status: "Optimal" },
  { id: 2, name: "Chettinad Health City", coords: [12.7917, 80.2173], beds: 5, status: "Moderate" },
  { id: 3, name: "SRM General Hospital", coords: [12.8236, 80.0435], beds: 8, status: "Optimal" }
];

export default function Dashboard() {
  const hasGPS = "geolocation" in navigator;

  const [ambulanceLocation, setAmbulanceLocation] = useState(hasGPS ? null : DEFAULT_CENTER);
  const [locationStatus, setLocationStatus] = useState(hasGPS ? "Acquiring GPS Signal..." : "GPS not supported.");
  
  const [severity, setSeverity] = useState("1");
  const [weatherText, setWeatherText] = useState("Analyzing local atmosphere...");
  const [weatherVal, setWeatherVal] = useState("0");
  
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState({ distance: 0, time: 0 });
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  const [unitStatus, setUnitStatus] = useState("Standby");
  const [dispatchHistory, setDispatchHistory] = useState([]);

  // Fetch live weather via Open-Meteo
  const fetchLiveWeather = async (lat, lon) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation`);
      const data = await res.json();
      const rain = data.current.precipitation;
      
      const isNight = new Date().getHours() < 6 || new Date().getHours() >= 18;
      const skyIcon = isNight ? "🌙" : "☀️";

      if (rain > 0) {
        setWeatherVal("1");
        setWeatherText(`Rain Detected (${rain}mm) 🌧️`);
      } else {
        setWeatherVal("0");
        setWeatherText(`Clear Roads ${skyIcon}`);
      }
    } catch {
      setWeatherText("Clear (Fallback) ☀️");
    }
  };

  useEffect(() => {
    if (!hasGPS) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setAmbulanceLocation([lat, lon]);
        setLocationStatus("Live GPS Locked 🟢");
        fetchLiveWeather(lat, lon);
      },
      () => {
        setLocationStatus("GPS Denied - Using Default");
        setAmbulanceLocation(DEFAULT_CENTER);
        fetchLiveWeather(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      },
      { enableHighAccuracy: true }
    );
  }, [hasGPS]);

  const calculateDistance = (c1, c2) => {
    const [lat1, lon1] = c1;
    const [lat2, lon2] = c2;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2)**2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const fetchStreetRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    
    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    setActiveRoute(coords);
    setRouteMetrics({
      distance: (data.routes[0].distance / 1000).toFixed(1),
      time: Math.ceil(data.routes[0].duration / 60)
    });
  };

  const handleDispatch = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/predict-traffic/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hour: new Date().getHours(), weather: parseInt(weatherVal), severity: parseInt(severity) }),
      });
      const data = await res.json();
      setAiResult(data);

      let best = null;
      let minDist = Infinity;
      HOSPITALS.forEach(h => {
        if (h.beds > 0) {
          const d = calculateDistance(ambulanceLocation, h.coords);
          if (d < minDist) { minDist = d; best = h; }
        }
      });

      setSelectedHospital(best);
      setUnitStatus("En Route");
      if (best) await fetchStreetRoute(ambulanceLocation, best.coords);

      setDispatchHistory(prev => [
        { id: Date.now(), hospital: best.name, severity: severity === "2" ? "Critical" : "Urgent", time: new Date().toLocaleTimeString() },
        ...prev
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!ambulanceLocation) {
    return (
      <div style={{ background: "#f4f7f6", color: "#2c3e50", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "sans-serif" }}>
        <h2>📍 {locationStatus}</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", padding: "30px", color: "#2c3e50", fontFamily: "sans-serif" }}>
      
      {/* Top Header Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "18px 24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#2c3e50" }}>🚑 Autonomous Emergency Response Command</h2>
          <span style={{ fontSize: "12px", color: "#7f8c8d" }}>Real-Time AI Dispatch & Telemetry System</span>
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ background: "#f8f9fa", padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ color: "#7f8c8d", fontSize: "11px", display: "block" }}>UNIT STATUS</span>
            <strong style={{ fontSize: "13px", color: unitStatus === "En Route" ? "#e74c3c" : "#27ae60" }}>● {unitStatus}</strong>
          </div>
          <div style={{ background: "#f8f9fa", padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ color: "#7f8c8d", fontSize: "11px", display: "block" }}>TELEMETRY</span>
            <strong style={{ fontSize: "13px", color: "#2980b9" }}>{locationStatus}</strong>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: "flex", gap: "25px" }}>
        
        {/* Map View */}
        <div style={{ flex: 2, height: "620px", borderRadius: "12px", overflow: "hidden", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 0 }}>
          <MapContainer center={ambulanceLocation} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <Marker position={ambulanceLocation} icon={ambulanceIcon}>
              <Popup>🚑 Active Unit Location (Your Position)</Popup>
            </Marker>
            
            {HOSPITALS.map((h) => (
              <Marker key={h.id} position={h.coords} icon={hospitalIcon}>
                <Popup><strong>{h.name}</strong><br/>ICU Beds Available: {h.beds}</Popup>
              </Marker>
            ))}

            {activeRoute && (
              <Polyline positions={activeRoute} color={aiResult?.traffic_level === 2 ? "#e74c3c" : "#3498db"} weight={6} opacity={0.8} />
            )}
          </MapContainer>
        </div>

        {/* Right Side Control Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Input Module */}
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #eaeaea" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#2c3e50" }}>Dispatch Parameters</h3>
            
            <label style={{ display: "block", fontSize: "13px", color: "#7f8c8d", marginBottom: "6px" }}>Emergency Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "6px", background: "#f8f9fa", color: "#2c3e50", border: "1px solid #ddd" }}>
              <option value="2">Level 1 - Critical / Trauma</option>
              <option value="1">Level 2 - Urgent Care</option>
              <option value="0">Level 3 - Stable</option>
            </select>

            <label style={{ display: "block", fontSize: "13px", color: "#7f8c8d", marginBottom: "6px" }}>Live Environmental Telemetry</label>
            <div style={{ padding: "10px", marginBottom: "20px", borderRadius: "6px", background: "#f8f9fa", border: "1px solid #ddd", color: "#2c3e50", fontSize: "14px", fontWeight: "bold" }}>
              {weatherText}
            </div>

            <button onClick={handleDispatch} disabled={loading} style={{ width: "100%", padding: "14px", background: "#e74c3c", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(231,76,60,0.3)", transition: "0.2s" }}>
              {loading ? "Optimizing Route & Beds..." : "⚡ Dispatch Smart Ambulance"}
            </button>
          </div>

          {/* AI Decision Card */}
          {aiResult && selectedHospital && (
            <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #eaeaea", borderLeft: "5px solid #2980b9" }}>
              <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#2c3e50" }}>🤖 AI Route Intelligence</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                <div><span style={{ color: "#7f8c8d", display: "block", fontSize: "11px" }}>TARGET HOSPITAL</span><strong style={{ color: "#2c3e50" }}>{selectedHospital.name}</strong></div>
                <div><span style={{ color: "#7f8c8d", display: "block", fontSize: "11px" }}>TRAFFIC STATUS</span><strong style={{ color: aiResult.traffic_level === 2 ? "#e74c3c" : "#27ae60" }}>{aiResult.prediction_text}</strong></div>
                <div><span style={{ color: "#7f8c8d", display: "block", fontSize: "11px" }}>ROUTE DISTANCE</span><strong style={{ color: "#2c3e50" }}>{routeMetrics.distance} km</strong></div>
                <div><span style={{ color: "#7f8c8d", display: "block", fontSize: "11px" }}>ESTIMATED ETA</span><strong style={{ color: "#2980b9" }}>{routeMetrics.time} mins</strong></div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Session Dispatch Log Footer */}
      <div style={{ marginTop: "24px", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #eaeaea" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#2c3e50" }}>📋 Session Dispatch Log</h3>
        {dispatchHistory.length === 0 ? (
          <p style={{ margin: 0, fontSize: "13px", color: "#7f8c8d" }}>No active dispatches recorded in this session yet.</p>
        ) : (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {dispatchHistory.map(item => (
              <div key={item.id} style={{ background: "#f8f9fa", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px" }}>
                <span style={{ color: "#2980b9" }}>{item.time}</span> — <strong>{item.hospital}</strong> ({item.severity})
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}