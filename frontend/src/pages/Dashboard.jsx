
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* =========================================================
   AMBULANCE ICON
========================================================= */

const ambulanceIcon = L.divIcon({
  className: "custom-ambulance",
  html: `
    <div style="
      background:#e74c3c;
      width:36px;
      height:36px;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 4px 14px rgba(231,76,60,0.65);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:16px;
    ">
      🚑
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/* =========================================================
   HOSPITAL ICON
========================================================= */

const hospitalIcon = L.divIcon({
  className: "custom-hospital",
  html: `
    <div style="
      background:#27ae60;
      width:36px;
      height:36px;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 4px 14px rgba(39,174,96,0.55);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:15px;
    ">
      🏥
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/* =========================================================
   DEFAULT LOCATION
========================================================= */

const DEFAULT_CENTER = [12.8399, 80.1545];

export default function Dashboard() {
  const navigate = useNavigate();

  const hasGPS = "geolocation" in navigator;

  /* =======================================================
     STATE
  ======================================================= */

  const [ambulanceLocation, setAmbulanceLocation] = useState(
    hasGPS ? null : DEFAULT_CENTER
  );

  const [locationStatus, setLocationStatus] = useState(
    hasGPS
      ? "Acquiring GPS Signal..."
      : "GPS not supported"
  );

  const [hospitals, setHospitals] = useState([]);
  const [emergencyRequests, setEmergencyRequests] =
    useState([]);

  const [severity, setSeverity] = useState("1");

  const [weatherText, setWeatherText] = useState(
    "Analyzing local atmosphere..."
  );

  const [weatherVal, setWeatherVal] = useState("0");

  const [aiResult, setAiResult] = useState(null);

  const [roadData, setRoadData] = useState(null);

  const [loading, setLoading] = useState(false);

  const [aStarRoute, setAStarRoute] = useState(null);

  const [activeRoute, setActiveRoute] = useState(null);

  const [routeMetrics, setRouteMetrics] = useState({
    distance: 0,
    time: 0,
  });

  const [navSteps, setNavSteps] = useState([]);

  const [selectedHospital, setSelectedHospital] =
    useState(null);

  const [unitStatus, setUnitStatus] =
    useState("Standby");

  const [dispatchHistory, setDispatchHistory] =
    useState([]);

  /* =========================================================
     FETCH HOSPITALS
  ========================================================= */

  const fetchHospitals = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/hospitals/"
      );

      const data = await response.json();

      setHospitals(data);
    } catch (error) {
      console.error(
        "Failed to fetch hospitals:",
        error
      );
    }
  };

  /* =========================================================
     FETCH EMERGENCY REQUESTS
  ========================================================= */

  const fetchEmergencyRequests = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/emergency-requests/list/"
      );

      const data = await response.json();

      setEmergencyRequests(data);
    } catch (error) {
      console.error(
        "Failed to fetch emergency requests:",
        error
      );
    }
  };

  /* =========================================================
     INITIAL DATA
  ========================================================= */

  useEffect(() => {
    fetchHospitals();
    fetchEmergencyRequests();
  }, []);

  /* =========================================================
     GET LATEST EMERGENCY SEVERITY
  ========================================================= */

  useEffect(() => {
    if (emergencyRequests.length > 0) {
      const latestRequest =
        emergencyRequests[0];

      setSeverity(
        String(latestRequest.severity)
      );
    }
  }, [emergencyRequests]);

  /* =========================================================
     WEATHER
  ========================================================= */

  const fetchLiveWeather = async (
    lat,
    lon
  ) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation`
      );

      const data =
        await response.json();

      const rain =
        data.current?.precipitation || 0;

      const currentHour =
        new Date().getHours();

      const isNight =
        currentHour < 6 ||
        currentHour >= 18;

      const skyIcon =
        isNight ? "🌙" : "☀️";

      if (rain > 0) {
        setWeatherVal("1");

        setWeatherText(
          `Rain Detected (${rain} mm) 🌧️`
        );
      } else {
        setWeatherVal("0");

        setWeatherText(
          `Clear Roads ${skyIcon}`
        );
      }
    } catch (error) {
      console.error(
        "Weather error:",
        error
      );

      setWeatherVal("0");

      setWeatherText(
        "Clear Conditions (Fallback) ☀️"
      );
    }
  };

  /* =========================================================
     GPS
  ========================================================= */

  useEffect(() => {
    if (!hasGPS) {
      setAmbulanceLocation(
        DEFAULT_CENTER
      );

      fetchLiveWeather(
        DEFAULT_CENTER[0],
        DEFAULT_CENTER[1]
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat =
          position.coords.latitude;

        const lon =
          position.coords.longitude;

        setAmbulanceLocation([
          lat,
          lon,
        ]);

        setLocationStatus(
          "Live GPS Locked 🟢"
        );

        fetchLiveWeather(
          lat,
          lon
        );
      },
      () => {
        setLocationStatus(
          "GPS Denied - Using Default Location"
        );

        setAmbulanceLocation(
          DEFAULT_CENTER
        );

        fetchLiveWeather(
          DEFAULT_CENTER[0],
          DEFAULT_CENTER[1]
        );
      },
      {
        enableHighAccuracy: true,
      }
    );
  }, [hasGPS]);

  /* =========================================================
     DISTANCE CALCULATION
  ========================================================= */

  const calculateDistance = (
    c1,
    c2
  ) => {
    const [lat1, lon1] = c1;

    const [lat2, lon2] = c2;

    const R = 6371;

    const dLat =
      (lat2 - lat1) *
      (Math.PI / 180);

    const dLon =
      (lon2 - lon1) *
      (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(
        lat1 * (Math.PI / 180)
      ) *
        Math.cos(
          lat2 * (Math.PI / 180)
        ) *
        Math.sin(dLon / 2) ** 2;

    return (
      R *
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      )
    );
  };

  /* =========================================================
     A* ROUTE
  ========================================================= */

  const fetchAStarRoute = async (
    start,
    goal,
    trafficLevel
  ) => {
    try {
      const response =
        await fetch(
          "http://127.0.0.1:8000/api/calculate-route/",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              start,
              goal,
              traffic_level:
                trafficLevel,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "A* route calculation failed"
        );
      }

      console.log(
        "A* Route:",
        data
      );

      setAStarRoute(
        data.route
      );

      return data.route;
    } catch (error) {
      console.error(
        "A* Route Error:",
        error
      );

      setAStarRoute(null);

      return null;
    }
  };

  /* =========================================================
     ACTUAL ROAD ROUTE - OSRM

     Dashboard ONLY displays the route.

     It does NOT simulate ambulance movement.
========================================================= */

  const fetchStreetRoute = async (
    start,
    end
  ) => {
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start[1]},${start[0]};` +
        `${end[1]},${end[0]}` +
        `?overview=full&geometries=geojson&steps=true`;

      const response =
        await fetch(url);

      const data =
        await response.json();

      if (
        !data.routes ||
        data.routes.length === 0
      ) {
        throw new Error(
          "No road route found"
        );
      }

      const routeData =
        data.routes[0];

      const coords =
        routeData.geometry.coordinates.map(
          (coordinate) => [
            coordinate[1],
            coordinate[0],
          ]
        );

      /* -----------------------------------------------
         DISPLAY ROUTE ONLY
      ------------------------------------------------ */

      setActiveRoute(coords);

      /* -----------------------------------------------
         TRIP METRICS
      ------------------------------------------------ */

      setRouteMetrics({
        distance: (
          routeData.distance / 1000
        ).toFixed(1),

        time: Math.ceil(
          routeData.duration / 60
        ),
      });

      /* -----------------------------------------------
         TURN BY TURN
      ------------------------------------------------ */

      if (
        routeData.legs &&
        routeData.legs[0] &&
        routeData.legs[0].steps
      ) {
        const instructions =
          routeData.legs[0].steps.map(
            (step) => {
              const type =
                step.maneuver?.type ||
                "";

              const modifier =
                step.maneuver?.modifier ||
                "";

              const road =
                step.name
                  ? `onto ${step.name}`
                  : "";

              return `Head ${modifier} ${type} ${road}`
                .replace(
                  /\s+/g,
                  " "
                )
                .trim();
            }
          );

        setNavSteps(
          instructions
        );
      }

      return coords;
    } catch (error) {
      console.error(
        "OSRM Route Error:",
        error
      );

      setActiveRoute(null);

      return null;
    }
  };

  /* =========================================================
     MAIN EMERGENCY DISPATCH
  ========================================================= */

  const handleDispatch = async () => {
    if (!ambulanceLocation) {
      alert(
        "Ambulance GPS location is not available yet."
      );

      return;
    }

    if (
      hospitals.length === 0
    ) {
      alert(
        "Hospital data is not available."
      );

      return;
    }

    setLoading(true);

    try {
      /* =====================================================
         1. EMERGENCY SEVERITY
      ===================================================== */

      const emergencySeverity =
        emergencyRequests.length > 0
          ? Number(
              emergencyRequests[0]
                .severity
            )
          : Number(severity);

      /* =====================================================
         2. AI TRAFFIC PREDICTION
      ===================================================== */

      const trafficResponse =
        await fetch(
          "http://127.0.0.1:8000/api/predict-traffic/",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              hour:
                new Date().getHours(),

              weather:
                Number(weatherVal),

              severity:
                emergencySeverity,
            }),
          }
        );

      const trafficData =
        await trafficResponse.json();

      if (!trafficResponse.ok) {
        throw new Error(
          trafficData.message ||
            "Traffic prediction failed"
        );
      }

      setAiResult(
        trafficData
      );

      /* =====================================================
         3. ROAD CONDITION
      ===================================================== */

      const roadResponse =
        await fetch(
          "http://127.0.0.1:8000/api/road-conditions/",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              traffic_level:
                Number(
                  trafficData.traffic_level ||
                    0
                ),

              weather:
                Number(weatherVal),

              severity:
                emergencySeverity,
            }),
          }
        );

      const roadAnalysis =
        await roadResponse.json();

      if (!roadResponse.ok) {
        throw new Error(
          roadAnalysis.message ||
            "Road condition analysis failed"
        );
      }

      setRoadData(
        roadAnalysis
      );

      /* =====================================================
         4. HOSPITAL SELECTION
      ===================================================== */

      let bestHospital = null;

      let bestScore =
        Infinity;

      const trafficLevel =
        Number(
          trafficData.traffic_level ||
            0
        );

      hospitals.forEach(
        (hospital) => {
          if (
            hospital.beds > 0
          ) {
            const distance =
              calculateDistance(
                ambulanceLocation,
                hospital.coords
              );

            const trafficFactor =
              trafficLevel === 2
                ? 1.5
                : trafficLevel === 1
                ? 1.2
                : 1.0;

            const bedFactor =
              1 +
              hospital.beds / 20;

            const score =
              (distance *
                trafficFactor) /
              bedFactor;

            if (
              score <
              bestScore
            ) {
              bestScore =
                score;

              bestHospital =
                hospital;
            }
          }
        }
      );

      if (!bestHospital) {
        alert(
          "All nearby hospitals are at full capacity!"
        );

        return;
      }

      setSelectedHospital(
        bestHospital
      );

      /* =====================================================
         5. ROUTE ANALYSIS
      ===================================================== */

      setUnitStatus(
        "Calculating Trip..."
      );

      await fetchAStarRoute(
        ambulanceLocation,
        bestHospital.coords,
        trafficLevel
      );

      await fetchStreetRoute(
        ambulanceLocation,
        bestHospital.coords
      );

      /* =====================================================
         6. DISPATCH STATUS

         IMPORTANT:
         We DO NOT move the ambulance here.
      ===================================================== */

      setUnitStatus(
        "Trip Ready — Awaiting Live Tracking"
      );

      /* =====================================================
         7. BED DECREMENT
      ===================================================== */

      let updatedRemainingBeds =
        bestHospital.beds - 1;

      try {
        const bedResponse =
          await fetch(
            "http://127.0.0.1:8000/api/decrement-bed/",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                hospital_id:
                  bestHospital.id,
              }),
            }
          );

        const bedData =
          await bedResponse.json();

        if (
          bedData &&
          typeof bedData.remaining_beds !==
            "undefined"
        ) {
          updatedRemainingBeds =
            bedData.remaining_beds;
        }
      } catch (bedError) {
        console.warn(
          "Backend bed decrement failed:",
          bedError
        );
      }

      /* =====================================================
         8. DISPATCH HISTORY
      ===================================================== */

      const severityLabel =
        emergencySeverity === 2
          ? "Critical"
          : emergencySeverity === 1
          ? "Urgent"
          : "Stable";

      const newAuditEntry = {
        id: Date.now(),

        hospital:
          bestHospital.name,

        remainingBeds:
          updatedRemainingBeds,

        severity:
          severityLabel,

        time:
          new Date().toLocaleTimeString(),
      };

      setDispatchHistory(
        (previous) => [
          newAuditEntry,
          ...previous,
        ]
      );

      /* =====================================================
         9. REFRESH HOSPITAL DATA
      ===================================================== */

      await fetchHospitals();
    } catch (error) {
      console.error(
        "Dispatch error:",
        error
      );

      alert(
        `Error processing emergency dispatch: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LIVE TRACKING

     Store trip information so LiveNavigation can use it.
  ========================================================= */

  const openLiveTracking = () => {
    if (
      !ambulanceLocation ||
      !selectedHospital
    ) {
      alert(
        "Please complete the emergency dispatch first."
      );

      return;
    }

    const tripData = {
      start:
        ambulanceLocation,

      destination:
        selectedHospital.coords,

      hospital:
        selectedHospital,

      distance:
        routeMetrics.distance,

      eta:
        routeMetrics.time,

      traffic:
        aiResult,

      road:
        roadData,

      weather:
        weatherText,

      aStarRoute:
        aStarRoute,

      activeRoute:
        activeRoute,

      navSteps:
        navSteps,
    };

    sessionStorage.setItem(
      "medirouteTrip",
      JSON.stringify(tripData)
    );

    navigate(
      "/live-navigation"
    );
  };

  /* =========================================================
     GPS LOADING SCREEN
  ========================================================= */

  if (!ambulanceLocation) {
    return (
      <div
        style={{
          background:
            "radial-gradient(circle at top, #16232f 0%, #071018 45%, #03070b 100%)",

          color: "#fff",

          height: "100vh",

          display: "flex",

          justifyContent:
            "center",

          alignItems:
            "center",

          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",

            padding: "40px",

            background:
              "rgba(255,255,255,0.05)",

            border:
              "1px solid rgba(255,255,255,0.1)",

            borderRadius:
              "18px",
          }}
        >
          <div
            style={{
              fontSize: "45px",

              marginBottom:
                "15px",
            }}
          >
            📍
          </div>

          <h2
            style={{
              margin: 0,
            }}
          >
            {locationStatus}
          </h2>

          <p
            style={{
              color:
                "#8fa3b5",
            }}
          >
            Establishing emergency
            telemetry connection...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN DASHBOARD
  ========================================================= */

  return (
    <div
      style={{
        minHeight: "100vh",

        padding: "24px",

        color: "#eaf2f7",

        fontFamily:
          "Arial, Helvetica, sans-serif",

        background:
          "radial-gradient(circle at 15% 0%, #173044 0%, #0b1822 35%, #050b10 70%, #020508 100%)",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          marginBottom:
            "20px",

          padding:
            "18px 22px",

          borderRadius:
            "16px",

          background:
            "rgba(12,24,34,0.94)",

          border:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            "0 10px 35px rgba(0,0,0,0.35)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "28px",
              }}
            >
              🚑
            </span>

            <div>
              <h2
                style={{
                  margin: 0,

                  fontSize:
                    "21px",

                  color:
                    "#ffffff",
                }}
              >
                MEDIROUTE COMMAND CENTER
              </h2>

              <span
                style={{
                  fontSize:
                    "12px",

                  color:
                    "#8297a8",
                }}
              >
                Emergency Trip Planning &
                Dispatch Intelligence
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",

            gap: "12px",
          }}
        >
          <div
            style={{
              padding:
                "9px 15px",

              borderRadius:
                "10px",

              background:
                "rgba(231,76,60,0.08)",

              border:
                "1px solid rgba(231,76,60,0.25)",
            }}
          >
            <span
              style={{
                color:
                  "#718797",

                fontSize:
                  "10px",

                display:
                  "block",

                marginBottom:
                  "3px",
              }}
            >
              TRIP STATUS
            </span>

            <strong
              style={{
                fontSize:
                  "12px",

                color:
                  unitStatus.includes(
                    "Ready"
                  )
                    ? "#54b8f5"
                    : unitStatus.includes(
                        "Arrived"
                      )
                    ? "#48d597"
                    : "#f2c94c",
              }}
            >
              ● {unitStatus}
            </strong>
          </div>

          <div
            style={{
              padding:
                "9px 15px",

              borderRadius:
                "10px",

              background:
                "rgba(41,128,185,0.08)",

              border:
                "1px solid rgba(41,128,185,0.25)",
            }}
          >
            <span
              style={{
                color:
                  "#718797",

                fontSize:
                  "10px",

                display:
                  "block",

                marginBottom:
                  "3px",
              }}
            >
              GPS
            </span>

            <strong
              style={{
                fontSize:
                  "12px",

                color:
                  "#54b8f5",
              }}
            >
              {locationStatus}
            </strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          EMERGENCY SUMMARY
      ===================================================== */}

      {emergencyRequests.length >
        0 && (
        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "1.4fr 1fr 1fr 1fr",

            gap: "14px",

            marginBottom:
              "20px",
          }}
        >
          <div
            style={{
              background:
                "rgba(231,76,60,0.12)",

              border:
                "1px solid rgba(231,76,60,0.3)",

              borderRadius:
                "14px",

              padding:
                "17px",
            }}
          >
            <span
              style={{
                color:
                  "#899eae",

                fontSize:
                  "10px",

                display:
                  "block",

                marginBottom:
                  "6px",
              }}
            >
              ACTIVE EMERGENCY
            </span>

            <strong
              style={{
                fontSize:
                  "17px",

                color:
                  "#ffffff",
              }}
            >
              {
                emergencyRequests[0]
                  .patient_name
              }
            </strong>

            <div
              style={{
                marginTop:
                  "5px",

                color:
                  "#ff8c82",

                fontSize:
                  "12px",
              }}
            >
              {
                emergencyRequests[0]
                  .emergency_type
              }
            </div>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,0.045)",

              border:
                "1px solid rgba(255,255,255,0.08)",

              borderRadius:
                "14px",

              padding:
                "17px",
            }}
          >
            <span
              style={{
                color:
                  "#899eae",

                fontSize:
                  "10px",

                display:
                  "block",

                marginBottom:
                  "6px",
              }}
            >
              SEVERITY
            </span>

            <strong
              style={{
                fontSize:
                  "17px",

                color:
                  severity ===
                  "2"
                    ? "#ff6257"
                    : severity ===
                      "1"
                    ? "#f2c94c"
                    : "#48d597",
              }}
            >
              {severity ===
              "2"
                ? "LEVEL 1 — CRITICAL"
                : severity ===
                  "1"
                ? "LEVEL 2 — URGENT"
                : "LEVEL 3 — STABLE"}
            </strong>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,0.045)",

              border:
                "1px solid rgba(255,255,255,0.08)",

              borderRadius:
                "14px",

              padding:
                "17px",
            }}
          >
            <span
              style={{
                color:
                  "#899eae",

                fontSize:
                  "10px",

                display:
                  "block",

                marginBottom:
                  "6px",
              }}
            >
              INCIDENT LOCATION
            </span>

            <strong
              style={{
                fontSize:
                  "14px",

                color:
                  "#ffffff",
              }}
            >
              {
                emergencyRequests[0]
                  .location
              }
            </strong>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,0.045)",

              border:
                "1px solid rgba(255,255,255,0.08)",

              borderRadius:
                "14px",

              padding:
                "17px",
            }}
          >
            <span
              style={{
                color:
                  "#899eae",

                fontSize:
                  "10px",

                display:
                  "block",

                marginBottom:
                  "6px",
              }}
            >
              REQUEST STATUS
            </span>

            <strong
              style={{
                fontSize:
                  "16px",

                color:
                  "#f2c94c",
              }}
            >
              ●{" "}
              {
                emergencyRequests[0]
                  .status
              }
            </strong>
          </div>
        </div>
      )}

      {/* =====================================================
          TRIP OVERVIEW
      ===================================================== */}

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "1fr 1fr 1fr",

          gap: "16px",

          marginBottom:
            "20px",
        }}
      >
        {/* START */}

        <div
          style={{
            background:
              "rgba(12,24,34,0.95)",

            border:
              "1px solid rgba(52,152,219,0.25)",

            borderRadius:
              "14px",

            padding:
              "20px",

            borderLeft:
              "4px solid #3498db",
          }}
        >
          <span
            style={{
              color:
                "#718797",

              fontSize:
                "10px",

              display:
                "block",

              marginBottom:
                "7px",
            }}
          >
            🟢 TRIP START
          </span>

          <strong
            style={{
              fontSize:
                "15px",

              color:
                "#ffffff",
            }}
          >
            Ambulance Current
            Location
          </strong>

          <div
            style={{
              marginTop:
                "8px",

              color:
                "#54b8f5",

              fontSize:
                "12px",
            }}
          >
            {ambulanceLocation[0].toFixed(
              5
            )}
            ,{" "}
            {ambulanceLocation[1].toFixed(
              5
            )}
          </div>
        </div>

        {/* DESTINATION */}

        <div
          style={{
            background:
              "rgba(12,24,34,0.95)",

            border:
              "1px solid rgba(39,174,96,0.25)",

            borderRadius:
              "14px",

            padding:
              "20px",

            borderLeft:
              "4px solid #27ae60",
          }}
        >
          <span
            style={{
              color:
                "#718797",

              fontSize:
                "10px",

              display:
                "block",

              marginBottom:
                "7px",
            }}
          >
            🔴 TRIP END
          </span>

          <strong
            style={{
              fontSize:
                "15px",

              color:
                "#ffffff",
            }}
          >
            {selectedHospital
              ? selectedHospital.name
              : "Awaiting Hospital Selection"}
          </strong>

          {selectedHospital && (
            <div
              style={{
                marginTop:
                  "8px",

                color:
                  "#48d597",

                fontSize:
                  "12px",
              }}
            >
              Destination Hospital
            </div>
          )}
        </div>

        {/* TRIP METRICS */}

        <div
          style={{
            background:
              "rgba(12,24,34,0.95)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "14px",

            padding:
              "20px",
          }}
        >
          <span
            style={{
              color:
                "#718797",

              fontSize:
                "10px",

              display:
                "block",

              marginBottom:
                "9px",
            }}
          >
            📏 TRIP ESTIMATE
          </span>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "1fr 1fr",

              gap: "12px",
            }}
          >
            <div>
              <strong
                style={{
                  fontSize:
                    "19px",

                  color:
                    "#54b8f5",
                }}
              >
                {routeMetrics.distance}
              </strong>

              <span
                style={{
                  display:
                    "block",

                  color:
                    "#718797",

                  fontSize:
                    "10px",
                }}
              >
                KM
              </span>
            </div>

            <div>
              <strong
                style={{
                  fontSize:
                    "19px",

                  color:
                    "#54b8f5",
                }}
              >
                {routeMetrics.time}
              </strong>

              <span
                style={{
                  display:
                    "block",

                  color:
                    "#718797",

                  fontSize:
                    "10px",
                }}
              >
                MIN ETA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAP + INTELLIGENCE
      ===================================================== */}

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "1.8fr 1fr",

          gap: "20px",
        }}
      >
        {/* ===================================================
            MAP
        =================================================== */}

        <div
          style={{
            height:
              "600px",

            borderRadius:
              "16px",

            overflow:
              "hidden",

            border:
              "1px solid rgba(255,255,255,0.1)",

            boxShadow:
              "0 12px 40px rgba(0,0,0,0.45)",

            position:
              "relative",
          }}
        >
          <MapContainer
            center={
              ambulanceLocation
            }
            zoom={13}
            style={{
              height:
                "100%",

              width:
                "100%",
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* START */}

            <Marker
              position={
                ambulanceLocation
              }
              icon={
                ambulanceIcon
              }
            >
              <Popup>
                <strong>
                  🚑 START
                </strong>
                <br />
                Ambulance Current
                Location
              </Popup>
            </Marker>

            {/* END */}

            {selectedHospital && (
              <Marker
                position={
                  selectedHospital.coords
                }
                icon={
                  hospitalIcon
                }
              >
                <Popup>
                  <strong>
                    🏥 END
                  </strong>
                  <br />
                  {
                    selectedHospital.name
                  }
                  <br />
                  ICU Beds:{" "}
                  {
                    selectedHospital.beds
                  }
                </Popup>
              </Marker>
            )}

            {/* A* DECISION PATH */}

            {aStarRoute && (
              <Polyline
                positions={
                  aStarRoute
                }
                color="#f39c12"
                weight={4}
                opacity={0.8}
                dashArray="8,8"
              />
            )}

            {/* ACTUAL ROAD */}

            {activeRoute && (
              <Polyline
                positions={
                  activeRoute
                }
                color="#3498db"
                weight={6}
                opacity={0.9}
              />
            )}
          </MapContainer>

          {/* MAP LABEL */}

          <div
            style={{
              position:
                "absolute",

              top:
                "18px",

              left:
                "18px",

              zIndex:
                1000,

              background:
                "rgba(4,10,15,0.92)",

              padding:
                "12px 15px",

              borderRadius:
                "10px",

              color:
                "#ffffff",

              fontSize:
                "11px",

              border:
                "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <strong>
              TRIP OVERVIEW
            </strong>

            <div
              style={{
                marginTop:
                  "7px",

                color:
                  "#a8b8c3",
              }}
            >
              🟢 Start → 🔴 End
            </div>
          </div>

          {/* LEGEND */}

          <div
            style={{
              position:
                "absolute",

              bottom:
                "18px",

              left:
                "18px",

              zIndex:
                1000,

              background:
                "rgba(4,10,15,0.92)",

              padding:
                "12px 15px",

              borderRadius:
                "10px",

              color:
                "#ffffff",

              fontSize:
                "11px",

              border:
                "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div
              style={{
                marginBottom:
                  "6px",
              }}
            >
              <span
                style={{
                  color:
                    "#f39c12",
                }}
              >
                ┄ ┄
              </span>{" "}
              A* Decision Path
            </div>

            <div>
              <span
                style={{
                  color:
                    "#3498db",
                }}
              >
                ━━━
              </span>{" "}
              Actual Road Route
            </div>
          </div>
        </div>

        {/* ===================================================
            INTELLIGENCE PANEL
        =================================================== */}

        <div
          style={{
            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "14px",

            maxHeight:
              "600px",

            overflowY:
              "auto",
          }}
        >
          {/* DISPATCH CONTROL */}

          <div
            style={{
              background:
                "rgba(12,24,34,0.95)",

              padding:
                "20px",

              borderRadius:
                "14px",

              border:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 15px",

                color:
                  "#ffffff",

                fontSize:
                  "15px",
              }}
            >
              ⚡ Dispatch Control
            </h3>

            <label
              style={{
                display:
                  "block",

                fontSize:
                  "10px",

                color:
                  "#718797",

                marginBottom:
                  "6px",
              }}
            >
              EMERGENCY SEVERITY
            </label>

            <select
              value={
                severity
              }
              onChange={(
                event
              ) =>
                setSeverity(
                  event.target
                    .value
                )
              }
              style={{
                width:
                  "100%",

                padding:
                  "11px",

                marginBottom:
                  "13px",

                borderRadius:
                  "8px",

                background:
                  "#101e29",

                color:
                  "#ffffff",

                border:
                  "1px solid #29404f",
              }}
            >
              <option value="2">
                Level 1 - Critical /
                Trauma
              </option>

              <option value="1">
                Level 2 - Urgent Care
              </option>

              <option value="0">
                Level 3 - Stable
              </option>
            </select>

            <div
              style={{
                padding:
                  "11px",

                marginBottom:
                  "14px",

                borderRadius:
                  "8px",

                background:
                  "#101e29",

                border:
                  "1px solid #29404f",

                color:
                  "#d8e5ed",

                fontSize:
                  "12px",
              }}
            >
              🌦 {weatherText}
            </div>

            <button
              onClick={
                handleDispatch
              }
              disabled={
                loading
              }
              style={{
                width:
                  "100%",

                padding:
                  "14px",

                background:
                  loading
                    ? "#6b3030"
                    : "#e74c3c",

                color:
                  "#ffffff",

                border:
                  "none",

                borderRadius:
                  "9px",

                fontSize:
                  "13px",

                fontWeight:
                  "bold",

                cursor:
                  loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "ANALYZING TRIP..."
                : "🚨 START EMERGENCY DISPATCH"}
            </button>

            {/* LIVE TRACK BUTTON */}

            {selectedHospital &&
              activeRoute && (
                <button
                  onClick={
                    openLiveTracking
                  }
                  style={{
                    width:
                      "100%",

                    padding:
                      "14px",

                    marginTop:
                      "10px",

                    background:
                      "#3498db",

                    color:
                      "#ffffff",

                    border:
                      "none",

                    borderRadius:
                      "9px",

                    fontSize:
                      "13px",

                    fontWeight:
                      "bold",

                    cursor:
                      "pointer",

                    boxShadow:
                      "0 5px 18px rgba(52,152,219,0.25)",
                  }}
                >
                  🧭 LIVE TRACK
                </button>
              )}
          </div>

          {/* AI TRAFFIC */}

          {aiResult && (
            <div
              style={{
                background:
                  "rgba(12,24,34,0.95)",

                padding:
                  "18px",

                borderRadius:
                  "14px",

                border:
                  "1px solid rgba(243,156,18,0.2)",

                borderLeft:
                  "4px solid #f39c12",
              }}
            >
              <h3
                style={{
                  margin:
                    "0 0 14px",

                  color:
                    "#ffffff",

                  fontSize:
                    "14px",
                }}
              >
                🤖 AI Traffic
                Intelligence
              </h3>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "1fr 1fr",

                  gap:
                    "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      display:
                        "block",

                      fontSize:
                        "9px",

                      color:
                        "#718797",

                      marginBottom:
                        "5px",
                    }}
                  >
                    TRAFFIC
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "15px",

                      color:
                        aiResult.traffic_level ===
                        2
                          ? "#ff6257"
                          : aiResult.traffic_level ===
                            1
                          ? "#f2c94c"
                          : "#48d597",
                    }}
                  >
                    {
                      aiResult.prediction_text
                    }
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display:
                        "block",

                      fontSize:
                        "9px",

                      color:
                        "#718797",

                      marginBottom:
                        "5px",
                    }}
                  >
                    RECOMMENDED SPEED
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "15px",

                      color:
                        "#ffffff",
                    }}
                  >
                    {
                      aiResult.recommended_speed_kmh
                    }{" "}
                    km/h
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* ROAD INTELLIGENCE */}

          {roadData && (
            <div
              style={{
                background:
                  "rgba(12,24,34,0.95)",

                padding:
                  "18px",

                borderRadius:
                  "14px",

                border:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  margin:
                    "0 0 14px",

                  color:
                    "#ffffff",

                  fontSize:
                    "14px",
                }}
              >
                🚧 Road Intelligence
              </h3>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "1fr 1fr",

                  gap:
                    "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      display:
                        "block",

                      fontSize:
                        "9px",

                      color:
                        "#718797",
                    }}
                  >
                    ROAD CONDITION
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "13px",

                      color:
                        roadData.road_block
                          ? "#ff6257"
                          : "#48d597",
                    }}
                  >
                    {
                      roadData.road_condition
                    }
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display:
                        "block",

                      fontSize:
                        "9px",

                      color:
                        "#718797",
                    }}
                  >
                    RISK LEVEL
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "13px",

                      color:
                        roadData.risk_level ===
                        "High"
                          ? "#ff6257"
                          : roadData.risk_level ===
                            "Moderate"
                          ? "#f2c94c"
                          : "#48d597",
                    }}
                  >
                    {
                      roadData.risk_level
                    }
                  </strong>
                </div>
              </div>

              {roadData.road_block && (
                <div
                  style={{
                    marginTop:
                      "12px",

                    padding:
                      "9px",

                    borderRadius:
                      "7px",

                    background:
                      "rgba(231,76,60,0.12)",

                    color:
                      "#ff8a80",

                    fontSize:
                      "11px",

                    fontWeight:
                      "bold",
                  }}
                >
                  ⚠️ ROAD BLOCK
                  RISK DETECTED
                </div>
              )}
            </div>
          )}

          {/* HOSPITAL */}

          {selectedHospital && (
            <div
              style={{
                background:
                  "rgba(12,24,34,0.95)",

                padding:
                  "18px",

                borderRadius:
                  "14px",

                border:
                  "1px solid rgba(39,174,96,0.25)",

                borderLeft:
                  "4px solid #27ae60",
              }}
            >
              <h3
                style={{
                  margin:
                    "0 0 12px",

                  color:
                    "#ffffff",

                  fontSize:
                    "14px",
                }}
              >
                🏥 Hospital Allocation
              </h3>

              <strong
                style={{
                  display:
                    "block",

                  fontSize:
                    "15px",

                  color:
                    "#ffffff",

                  marginBottom:
                    "10px",
                }}
              >
                {
                  selectedHospital.name
                }
              </strong>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "1fr 1fr",

                  gap:
                    "10px",
                }}
              >
                <div>
                  <span
                    style={{
                      display:
                        "block",

                      color:
                        "#718797",

                      fontSize:
                        "9px",
                    }}
                  >
                    ICU BEDS
                  </span>

                  <strong
                    style={{
                      color:
                        "#48d597",
                    }}
                  >
                    {
                      selectedHospital.beds
                    }
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display:
                        "block",

                      color:
                        "#718797",

                      fontSize:
                        "9px",
                    }}
                  >
                    STATUS
                  </span>

                  <strong
                    style={{
                      color:
                        "#48d597",
                    }}
                  >
                    {
                      selectedHospital.status ||
                      "Available"
                    }
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* TRIP ROUTE DETAILS */}

          {selectedHospital &&
            activeRoute && (
              <div
                style={{
                  background:
                    "rgba(12,24,34,0.95)",

                  padding:
                    "18px",

                  borderRadius:
                    "14px",

                  border:
                    "1px solid rgba(52,152,219,0.25)",

                  borderLeft:
                    "4px solid #3498db",
                }}
              >
                <h3
                  style={{
                    margin:
                      "0 0 14px",

                    color:
                      "#ffffff",

                    fontSize:
                      "14px",
                  }}
                >
                  🧭 Trip Route
                </h3>

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "1fr 1fr",

                    gap:
                      "12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display:
                          "block",

                        color:
                          "#718797",

                        fontSize:
                          "9px",
                      }}
                    >
                      DISTANCE
                    </span>

                    <strong
                      style={{
                        color:
                          "#54b8f5",

                        fontSize:
                          "15px",
                      }}
                    >
                      {
                        routeMetrics.distance
                      }{" "}
                      km
                    </strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display:
                          "block",

                        color:
                          "#718797",

                        fontSize:
                          "9px",
                      }}
                    >
                      ETA
                    </span>

                    <strong
                      style={{
                        color:
                          "#54b8f5",

                        fontSize:
                          "15px",
                      }}
                    >
                      {
                        routeMetrics.time
                      }{" "}
                      min
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop:
                      "14px",

                    padding:
                      "10px",

                    borderRadius:
                      "8px",

                    background:
                      "rgba(52,152,219,0.08)",

                    color:
                      "#9ccff0",

                    fontSize:
                      "10px",

                    lineHeight:
                      "1.5",
                  }}
                >
                  🟠 A* calculates the
                  optimized decision path.
                  <br />
                  🔵 OSRM provides the actual
                  street route.
                </div>
              </div>
            )}
        </div>
      </div>

      {/* =====================================================
          BOTTOM INFORMATION
      ===================================================== */}

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap: "20px",

          marginTop:
            "20px",
        }}
      >
        {/* DISPATCH HISTORY */}

        <div
          style={{
            background:
              "rgba(12,24,34,0.95)",

            padding:
              "20px",

            borderRadius:
              "14px",

            border:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3
            style={{
              margin:
                "0 0 14px",

              color:
                "#ffffff",

              fontSize:
                "14px",
            }}
          >
            📋 Dispatch History
          </h3>

          {dispatchHistory.length ===
          0 ? (
            <p
              style={{
                margin: 0,

                fontSize:
                  "11px",

                color:
                  "#718797",
              }}
            >
              No dispatches recorded
              in this session.
            </p>
          ) : (
            dispatchHistory.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  style={{
                    background:
                      "rgba(255,255,255,0.04)",

                    padding:
                      "11px 12px",

                    borderRadius:
                      "8px",

                    marginBottom:
                      "8px",

                    border:
                      "1px solid rgba(255,255,255,0.07)",

                    fontSize:
                      "11px",

                    color:
                      "#c8d6df",
                  }}
                >
                  <span
                    style={{
                      color:
                        "#54b8f5",
                    }}
                  >
                    {
                      item.time
                    }
                  </span>

                  {" — "}

                  <strong
                    style={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {
                      item.hospital
                    }
                  </strong>

                  {" — "}

                  {
                    item.remainingBeds
                  }{" "}
                  beds remaining
                </div>
              )
            )
          )}
        </div>

        {/* EMERGENCY DATABASE */}

        <div
          style={{
            background:
              "rgba(12,24,34,0.95)",

            padding:
              "20px",

            borderRadius:
              "14px",

            border:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3
            style={{
              margin:
                "0 0 14px",

              color:
                "#ffffff",

              fontSize:
                "14px",
            }}
          >
            🚑 Emergency Requests
          </h3>

          {emergencyRequests.length ===
          0 ? (
            <p
              style={{
                margin: 0,

                fontSize:
                  "11px",

                color:
                  "#718797",
              }}
            >
              No emergency requests
              found.
            </p>
          ) : (
            <div
              style={{
                maxHeight:
                  "190px",

                overflowY:
                  "auto",
              }}
            >
              {emergencyRequests.map(
                (request) => (
                  <div
                    key={
                      request.id
                    }
                    style={{
                      padding:
                        "12px",

                      marginBottom:
                        "8px",

                      borderRadius:
                        "9px",

                      background:
                        "rgba(255,255,255,0.035)",

                      border:
                        "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#ffffff",

                        fontSize:
                          "12px",
                      }}
                    >
                      {
                        request.patient_name
                      }
                    </strong>

                    <div
                      style={{
                        marginTop:
                          "5px",

                        fontSize:
                          "10px",

                        color:
                          "#a7bac7",
                      }}
                    >
                      {
                        request.emergency_type
                      }{" "}
                      • Severity{" "}
                      {
                        request.severity
                      }
                    </div>

                    <div
                      style={{
                        fontSize:
                          "10px",

                        color:
                          "#a7bac7",
                      }}
                    >
                      📍{" "}
                      {
                        request.location
                      }
                    </div>

                    <div
                      style={{
                        fontSize:
                          "10px",

                        color:
                          "#54b8f5",

                        marginTop:
                          "4px",
                      }}
                    >
                      Status:{" "}
                      {
                        request.status
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
