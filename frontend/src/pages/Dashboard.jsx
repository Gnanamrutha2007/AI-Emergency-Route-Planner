import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ambulanceIcon = L.divIcon({
  className: 'custom-ambulance',
  html: '<div style="background-color: #e74c3c; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(231,76,60,0.6); display: flex; align-items: center; justify-content: center; font-size: 15px;">🚑</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const hospitalIcon = L.divIcon({
  className: 'custom-hospital',
  html: '<div style="background-color: #27ae60; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(39,174,96,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px;">🏥</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const DEFAULT_CENTER = [12.8399, 80.1545];

export default function Dashboard() {
  const hasGPS = "geolocation" in navigator;

  const [ambulanceLocation, setAmbulanceLocation] = useState(hasGPS ? null : DEFAULT_CENTER);
  const [locationStatus, setLocationStatus] = useState(hasGPS ? "Acquiring GPS Signal..." : "GPS not supported.");
  
  const [hospitals, setHospitals] = useState([]);
  const [severity, setSeverity] = useState("1");
  const [weatherText, setWeatherText] = useState("Analyzing local atmosphere...");
  const [weatherVal, setWeatherVal] = useState("0");
  
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState({ distance: 0, time: 0 });
  const [navSteps, setNavSteps] = useState([]); 
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  const [unitStatus, setUnitStatus] = useState("Standby");
  const [dispatchHistory, setDispatchHistory] = useState([]);

  const fetchHospitals = () => {
    fetch("http://127.0.0.1:8000/api/hospitals/")
      .then(res => res.json())
      .then(data => setHospitals(data))
      .catch(err => console.error("Failed to fetch hospitals:", err));
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

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

  // Simulate Google Maps Navigation Movement along the route coordinates
  const simulateAmbulanceNavigation = (coords) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < coords.length) {
        setAmbulanceLocation(coords[index]);
        const remainingSteps = coords.length - index;
        const fraction = remainingSteps / coords.length;
        setRouteMetrics(prev => ({
          distance: (prev.distance * fraction).toFixed(1),
          time: Math.ceil(prev.time * fraction)
        }));
        index += Math.max(1, Math.floor(coords.length / 30));
      } else {
        clearInterval(interval);
        setUnitStatus("Arrived at Hospital 🏥");
      }
    }, 800);
  };

  const fetchStreetRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    
    const routeData = data.routes[0];
    const coords = routeData.geometry.coordinates.map(c => [c[1], c[0]]);
    setActiveRoute(coords);
    
    setRouteMetrics({
      distance: (routeData.distance / 1000).toFixed(1),
      time: Math.ceil(routeData.duration / 60)
    });

    if (routeData.legs && routeData.legs[0].steps) {
      const instructions = routeData.legs[0].steps.map(step => {
        const type = step.maneuver.type;
        const modifier = step.maneuver.modifier || "";
        const road = step.name ? `onto ${step.name}` : "";
        return `Head ${modifier} ${type} ${road}`.replace(/\s+/g, ' ').trim();
      });
      setNavSteps(instructions);
    }

    simulateAmbulanceNavigation(coords);
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
      hospitals.forEach(h => {
        if (h.beds > 0) {
          const d = calculateDistance(ambulanceLocation, h.coords);
          if (d < minDist) { minDist = d; best = h; }
        }
      });

      if (!best) {
        alert("All nearby hospitals are at full capacity!");
        setLoading(false);
        return;
      }

      setSelectedHospital(best);
      setUnitStatus("En Route (Live Nav) 🧭");

      await fetchStreetRoute(ambulanceLocation, best.coords);

      let updatedRemainingBeds = best.beds - 1;
      try {
        const bedRes = await fetch("http://127.0.0.1:8000/api/decrement-bed/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hospital_id: best.id })
        });
        const bedData = await bedRes.json();
        if (bedData && typeof bedData.remaining_beds !== "undefined") {
          updatedRemainingBeds = bedData.remaining_beds;
        }
      } catch (bedErr) {
        console.warn("Backend bed decrement call failed:", bedErr);
      }

      const newAuditEntry = {
        id: Date.now(),
        hospital: best.name,
        remainingBeds: updatedRemainingBeds,
        severity: severity === "2" ? "Critical" : "Urgent",
        time: new Date().toLocaleTimeString()
      };

      setDispatchHistory(prev => [newAuditEntry, ...prev]);
      fetchHospitals();

    } catch (err) {
      console.error("Dispatch error:", err);
      alert("Error processing dispatch.");
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
      
      {/* Top Navbar Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "18px 24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#2c3e50" }}>🚑 Autonomous Emergency Response Command</h2>
          <span style={{ fontSize: "12px", color: "#7f8c8d" }}>Live GPS Navigation, Bed Sync & AI Routing Intelligence</span>
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ background: "#f8f9fa", padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ color: "#7f8c8d", fontSize: "11px", display: "block" }}>UNIT STATUS</span>
            <strong style={{ fontSize: "13px", color: unitStatus.includes("En Route") ? "#e74c3c" : "#27ae60" }}>● {unitStatus}</strong>
          </div>
          <div style={{ background: "#f8f9fa", padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ color: "#7f8c8d", fontSize: "11px", display: "block" }}>TELEMETRY</span>
            <strong style={{ fontSize: "13px", color: "#2980b9" }}>{locationStatus}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Controls */}
      <div style={{ display: "flex", gap: "25px" }}>
        
        {/* Map Container */}
        <div style={{ flex: 2, height: "620px", borderRadius: "12px", overflow: "hidden", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 0 }}>
          <MapContainer center={ambulanceLocation} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <Marker position={ambulanceLocation} icon={ambulanceIcon}>
              <Popup>🚑 Active Dispatch Unit (Moving)</Popup>
            </Marker>
            
            {hospitals.map((h) => (
              <Marker key={h.id} position={h.coords} icon={hospitalIcon}>
                <Popup>
                  <strong>{h.name}</strong><br/>
                  DB ICU Beds Available: <span style={{ color: h.beds > 0 ? "green" : "red", fontWeight: "bold" }}>{h.beds}</span>
                </Popup>
              </Marker>
            ))}

            {activeRoute && (
              <Polyline positions={activeRoute} color={aiResult?.traffic_level === 2 ? "#e74c3c" : "#3498db"} weight={6} opacity={0.8} />
            )}
          </MapContainer>
        </div>

        {/* Right Sidebar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Dispatch Panel */}
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #eaeaea" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#2c3e50" }}>Dispatch Parameters</h3>
            
            <label style={{ display: "block", fontSize: "13px", color: "#7f8c8d", marginBottom: "6px" }}>Emergency Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "6px", background: "#f8f9fa", color: "#2c3e50", border: "1px solid #ddd" }}>
              <option value="2">Level 1 - Critical / Trauma</option>
              <option value="1">Level 2 - Urgent Care</option>
              <option value="0">Level 3 - Stable</option>
            </select>

            <label style={{ display: "block", fontSize: "13px", color: "#7f8c8d", marginBottom: "6px" }}>Environmental Telemetry</label>
            <div style={{ padding: "10px", marginBottom: "20px", borderRadius: "6px", background: "#f8f9fa", border: "1px solid #ddd", color: "#2c3e50", fontSize: "13px", fontWeight: "bold" }}>
              {weatherText}
            </div>

            <button onClick={handleDispatch} disabled={loading} style={{ width: "100%", padding: "14px", background: "#e74c3c", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(231,76,60,0.3)" }}>
              {loading ? "Allocating Beds & Routing..." : "⚡ Start Live Navigation Dispatch"}
            </button>
          </div>

          {/* AI Intelligence & Turn-by-Turn Guidance */}
          {aiResult && selectedHospital && (
            <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #eaeaea", borderLeft: "5px solid #2980b9", maxHeight: "280px", overflowY: "auto" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#2c3e50" }}>🧭 Live GPS Navigation Guidance</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", marginBottom: "12px" }}>
                <div><span style={{ color: "#7f8c8d", display: "block" }}>DESTINATION</span><strong>{selectedHospital.name}</strong></div>
                <div><span style={{ color: "#7f8c8d", display: "block" }}>LIVE ETA / DIST</span><strong>{routeMetrics.time} mins ({routeMetrics.distance} km)</strong></div>
              </div>

              <div style={{ borderTop: "1px solid #eee", paddingTop: "10px" }}>
                <span style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "bold", display: "block", marginBottom: "6px" }}>TURN-BY-TURN INSTRUCTIONS:</span>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#2c3e50", lineHeight: "1.6" }}>
                  {navSteps.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Session Dispatch Log */}
      <div style={{ marginTop: "24px", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #eaeaea" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#2c3e50" }}>📋 Live Database Audit Log</h3>
        {dispatchHistory.length === 0 ? (
          <p style={{ margin: 0, fontSize: "13px", color: "#7f8c8d" }}>No dispatches recorded yet. Click dispatch to test live navigation & bed reduction.</p>
        ) : (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {dispatchHistory.map(item => (
              <div key={item.id} style={{ background: "#f8f9fa", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px" }}>
                <span style={{ color: "#2980b9" }}>{item.time}</span> — <strong>{item.hospital}</strong> ({item.remainingBeds} ICU beds remaining)
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}