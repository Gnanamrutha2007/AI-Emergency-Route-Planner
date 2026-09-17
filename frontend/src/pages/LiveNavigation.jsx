
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [12.8399, 80.1545];

/* ---------------------------------------------------------
   MAP ICONS
--------------------------------------------------------- */

const ambulanceIcon = new L.DivIcon({
  className: "ambulance-marker",

  html: `
    <div style="
      width:42px;
      height:42px;
      border-radius:50%;
      background:#e84855;
      border:3px solid white;
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:22px;
      font-weight:900;
      box-shadow:0 0 20px rgba(232,72,85,.7);
    ">+</div>
  `,

  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const hospitalIcon = new L.DivIcon({
  className: "hospital-marker",

  html: `
    <div style="
      width:38px;
      height:38px;
      border-radius:50%;
      background:#35d381;
      border:3px solid white;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#061018;
      font-size:22px;
      font-weight:900;
      box-shadow:0 0 18px rgba(53,211,129,.6);
    ">+</div>
  `,

  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

/* ---------------------------------------------------------
   MAP AUTO-CENTER
--------------------------------------------------------- */

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);

  return null;
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function LiveNavigation() {
  const location = useLocation();

  /* NEW: Navigation controller */
  const navigate = useNavigate();

  const navigationData = location.state || {};

  const incomingAmbulanceLocation =
    navigationData.ambulanceLocation;

  const incomingHospital =
    navigationData.selectedHospital;

  const incomingTrafficLevel =
    navigationData.trafficLevel;

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [ambulanceLocation, setAmbulanceLocation] =
    useState(
      incomingAmbulanceLocation || DEFAULT_CENTER
    );

  const [hospitals, setHospitals] = useState([]);

  const [selectedHospital, setSelectedHospital] =
    useState(incomingHospital || null);

  const [route, setRoute] = useState([]);

  const [routeMetrics, setRouteMetrics] = useState({
    distance: 0,
    time: 0,
  });

  const [traffic, setTraffic] = useState(
    incomingTrafficLevel === undefined
      ? "Analyzing..."
      : incomingTrafficLevel === 0
        ? "Clear Traffic"
        : incomingTrafficLevel === 1
          ? "Moderate Traffic"
          : "Heavy Traffic"
  );

  const [roadStatus, setRoadStatus] =
    useState("Checking...");

  const [gpsStatus, setGpsStatus] =
    useState("Acquiring GPS...");

  const [navigationStatus, setNavigationStatus] =
    useState(
      incomingHospital
        ? "Route Ready"
        : "Standby"
    );

  const [isNavigating, setIsNavigating] =
    useState(false);

  const [navSteps, setNavSteps] = useState([]);

  const [navigationInterval, setNavigationInterval] =
    useState(null);

  const [routeRefresh, setRouteRefresh] =
    useState(0);

  /* -------------------------------------------------------
     GPS
  ------------------------------------------------------- */

  useEffect(() => {
    if (incomingAmbulanceLocation) {
      setGpsStatus("GPS Locked");
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus("GPS Not Supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAmbulanceLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);

        setGpsStatus("GPS Locked");
      },

      () => {
        setGpsStatus("Using Fallback Location");
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [incomingAmbulanceLocation]);

  /* -------------------------------------------------------
     LOAD HOSPITALS
  ------------------------------------------------------- */

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/hospitals/"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load hospitals."
          );
        }

        const data = await response.json();

        console.log(
          "Hospital API Response:",
          data
        );

        /*
          Django currently returns the
          hospital list directly as an array.
        */

        const hospitalList = Array.isArray(data)
          ? data
          : data.hospitals || [];

        const formattedHospitals =
          hospitalList.map((hospital) => ({
            id: hospital.id,

            name: hospital.name,

            beds: Number(
              hospital.beds || 0
            ),

            coords: [
              Number(hospital.coords[0]),
              Number(hospital.coords[1]),
            ],

            status: hospital.status,
          }));

        console.log(
          "Formatted Hospitals:",
          formattedHospitals
        );

        setHospitals(
          formattedHospitals
        );

        /*
          If Dashboard already sent a hospital,
          keep that selected hospital.

          Otherwise choose the first hospital
          with available ICU beds.
        */

        if (!incomingHospital) {
          const availableHospital =
            formattedHospitals.find(
              (hospital) =>
                hospital.beds > 0
            );

          if (availableHospital) {
            setSelectedHospital(
              availableHospital
            );

            setNavigationStatus(
              "Route Ready"
            );
          }
        }
      } catch (error) {
        console.error(
          "Hospital loading error:",
          error
        );
      }
    };

    loadHospitals();
  }, [incomingHospital]);

  /* -------------------------------------------------------
     LOAD ACTUAL ROAD ROUTE
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      !selectedHospital ||
      !ambulanceLocation
    ) {
      return;
    }

    const loadRoute = async () => {
      try {
        setNavigationStatus(
          "Calculating Route..."
        );

        const start =
          ambulanceLocation;

        const end =
          selectedHospital.coords;

        const response =
          await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`
          );

        const data =
          await response.json();

        if (
          !data.routes ||
          !data.routes.length
        ) {
          console.error(
            "No road route found."
          );

          setNavigationStatus(
            "Route Unavailable"
          );

          return;
        }

        const routeData =
          data.routes[0];

        /* Distance + ETA */

        setRouteMetrics({
          distance: (
            routeData.distance / 1000
          ).toFixed(1),

          time: Math.ceil(
            routeData.duration / 60
          ),
        });

        /* Route coordinates */

        const coordinates =
          routeData.geometry.coordinates.map(
            ([longitude, latitude]) => [
              latitude,
              longitude,
            ]
          );

        setRoute(
          coordinates
        );

        /* Turn-by-turn instructions */

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

        setNavigationStatus(
          "Route Ready"
        );

        console.log(
          "Live Navigation Route:",
          routeData
        );
      } catch (error) {
        console.error(
          "Live Navigation route error:",
          error
        );

        setNavigationStatus(
          "Route Error"
        );
      }
    };

    loadRoute();
  }, [
    ambulanceLocation,
    selectedHospital,
    routeRefresh,
  ]);

  /* -------------------------------------------------------
     AI TRAFFIC + ROAD CONDITIONS
  ------------------------------------------------------- */

  useEffect(() => {
    const loadConditions = async () => {
      try {
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

                weather: 0,

                severity: 2,
              }),
            }
          );

        const trafficData =
          await trafficResponse.json();

        if (trafficResponse.ok) {
          setTraffic(
            trafficData.prediction_text
          );
        }

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

                weather: 0,

                severity: 2,
              }),
            }
          );

        const roadData =
          await roadResponse.json();

        if (roadResponse.ok) {
          setRoadStatus(
            roadData.road_condition
          );
        }
      } catch (error) {
        console.error(
          "Condition analysis error:",
          error
        );
      }
    };

    loadConditions();
  }, []);

  /* -------------------------------------------------------
     START NAVIGATION
  ------------------------------------------------------- */

  const startNavigation = () => {
    if (
      !selectedHospital ||
      route.length === 0
    ) {
      return;
    }

    setIsNavigating(true);

    setNavigationStatus(
      "Navigation Active"
    );

    let index = 0;

    const interval =
      setInterval(() => {
        if (
          index >= route.length
        ) {
          clearInterval(
            interval
          );

          setNavigationInterval(
            null
          );

          setIsNavigating(
            false
          );

          setNavigationStatus(
            "Arrived at Hospital"
          );

          setAmbulanceLocation(
            selectedHospital.coords
          );

          setRouteMetrics({
            distance: "0.0",
            time: 0,
          });

          return;
        }

        const currentPosition =
          route[index];

        setAmbulanceLocation(
          currentPosition
        );

        /*
          Approximate remaining
          route percentage
        */

        const remaining =
          (route.length - index) /
          route.length;

        setRouteMetrics(
          (previous) => ({
            distance: (
              Number(
                previous.distance ||
                  0
              ) * remaining
            ).toFixed(1),

            time: Math.ceil(
              Number(
                previous.time ||
                  0
              ) * remaining
            ),
          })
        );

        index += Math.max(
          1,
          Math.floor(
            route.length / 40
          )
        );
      }, 1000);

    setNavigationInterval(
      interval
    );
  };

  /* -------------------------------------------------------
     STOP NAVIGATION
  ------------------------------------------------------- */

  const stopNavigation = () => {
    if (navigationInterval) {
      clearInterval(
        navigationInterval
      );

      setNavigationInterval(
        null
      );
    }

    setIsNavigating(false);

    setNavigationStatus(
      "Navigation Paused"
    );
  };

  /* -------------------------------------------------------
     REROUTE
  ------------------------------------------------------- */

  const reroute = () => {
    if (!selectedHospital) {
      return;
    }

    setNavigationStatus(
      "Recalculating Route..."
    );

    setRoute([]);

    setRouteRefresh(
      (previous) =>
        previous + 1
    );
  };

  /* -------------------------------------------------------
     ARRIVED
  ------------------------------------------------------- */

  const markArrived = () => {
    if (navigationInterval) {
      clearInterval(
        navigationInterval
      );

      setNavigationInterval(
        null
      );
    }

    setIsNavigating(false);

    setNavigationStatus(
      "Arrived at Hospital"
    );
  };

  /* -------------------------------------------------------
     GO BACK TO HOME
  ------------------------------------------------------- */

  const goBackHome = () => {
    /*
      Stop any active simulated
      navigation before leaving.
    */

    if (navigationInterval) {
      clearInterval(
        navigationInterval
      );

      setNavigationInterval(
        null
      );
    }

    setIsNavigating(false);

    navigate("/home");
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div
      style={{
        minHeight: "100vh",

        background:
          "#061018",

        color:
          "#eaf2f5",

        padding:
          "30px",

        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth:
            "1500px",

          margin:
            "0 auto",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            marginBottom:
              "25px",
          }}
        >
          <div>

            <div
              style={{
                color:
                  "#e84855",

                fontSize:
                  "11px",

                fontWeight:
                  "800",

                letterSpacing:
                  "2px",
              }}
            >
              MEDIROUTE / LIVE RESPONSE
            </div>

            <h1
              style={{
                margin:
                  "8px 0",

                fontSize:
                  "42px",

                letterSpacing:
                  "-2px",
              }}
            >
              Live Navigation
            </h1>

            <p
              style={{
                margin:
                  0,

                color:
                  "#71868f",
              }}
            >
              Real-time ambulance routing and
              emergency coordination.
            </p>

          </div>

          <div
            style={{
              padding:
                "12px 18px",

              borderRadius:
                "8px",

              background:
                "rgba(53,211,129,.08)",

              border:
                "1px solid rgba(53,211,129,.25)",

              color:
                "#35d381",

              fontSize:
                "11px",

              fontWeight:
                "800",
            }}
          >
            ● {gpsStatus}
          </div>
        </div>

        {/* =================================================
            STATUS CARDS
        ================================================= */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",

            gap:
              "15px",

            marginBottom:
              "20px",
          }}
        >

          <StatusCard
            title="GPS STATUS"
            value={gpsStatus}
            icon="◉"
          />

          <StatusCard
            title="TRAFFIC"
            value={traffic}
            icon="≋"
          />

          <StatusCard
            title="ROAD CONDITION"
            value={roadStatus}
            icon="↗"
          />

          <StatusCard
            title="DESTINATION"
            value={
              selectedHospital
                ? selectedHospital.name
                : "Selecting..."
            }
            icon="+"
          />

        </div>

        {/* =================================================
            MAIN AREA
        ================================================= */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "1fr 350px",

            gap:
              "20px",
          }}
        >

          {/* =================================================
              MAP
          ================================================= */}

          <div
            style={{
              height:
                "650px",

              borderRadius:
                "16px",

              overflow:
                "hidden",

              border:
                "1px solid rgba(255,255,255,.08)",
            }}
          >

            <MapContainer
              center={
                ambulanceLocation
              }

              zoom={
                13
              }

              style={{
                width:
                  "100%",

                height:
                  "100%",
              }}
            >

              <MapCenter
                position={
                  ambulanceLocation
                }
              />

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"

                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* AMBULANCE */}

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
                    Ambulance Unit 01
                  </strong>

                  <br />

                  GPS tracking active

                </Popup>
              </Marker>

              {/* HOSPITALS */}

              {hospitals.map(
                (hospital) => (
                  <Marker
                    key={
                      hospital.id
                    }

                    position={
                      hospital.coords
                    }

                    icon={
                      hospitalIcon
                    }

                    eventHandlers={{
                      click: () =>
                        setSelectedHospital(
                          hospital
                        ),
                    }}
                  >

                    <Popup>

                      <strong>
                        {
                          hospital.name
                        }
                      </strong>

                      <br />

                      ICU Beds:{" "}
                      {
                        hospital.beds
                      }

                      <br />

                      Status:{" "}
                      {
                        hospital.status
                      }

                    </Popup>

                  </Marker>
                )
              )}

              {/* ROUTE */}

              {route.length >
                0 && (
                <Polyline
                  positions={
                    route
                  }

                  pathOptions={{
                    color:
                      "#e84855",

                    weight:
                      6,

                    opacity:
                      0.9,
                  }}
                />
              )}

            </MapContainer>

          </div>

          {/* =================================================
              CONTROL PANEL
          ================================================= */}

          <div
            style={{
              background:
                "#0a1922",

              border:
                "1px solid rgba(255,255,255,.07)",

              borderRadius:
                "16px",

              padding:
                "22px",
            }}
          >

            <div
              style={{
                color:
                  "#e84855",

                fontSize:
                  "9px",

                fontWeight:
                  "900",

                letterSpacing:
                  "2px",
              }}
            >
              NAVIGATION CONTROL
            </div>

            <h2
              style={{
                margin:
                  "10px 0 25px",

                fontSize:
                  "24px",
              }}
            >
              Route Command
            </h2>

            <InfoRow
              label="AMBULANCE"
              value="UNIT 01"
            />

            <InfoRow
              label="GPS"
              value={gpsStatus}
            />

            <InfoRow
              label="TRAFFIC"
              value={traffic}
            />

            <InfoRow
              label="ROAD"
              value={roadStatus}
            />

            <InfoRow
              label="STATUS"
              value={navigationStatus}
            />

            {/* ROUTE METRICS */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                gap:
                  "10px",

                marginTop:
                  "20px",
              }}
            >

              <MetricBox
                label="DISTANCE"
                value={`${routeMetrics.distance} km`}
              />

              <MetricBox
                label="ETA"
                value={`${routeMetrics.time} min`}
              />

            </div>

            <div
              style={{
                height:
                  "1px",

                background:
                  "rgba(255,255,255,.07)",

                margin:
                  "25px 0",
              }}
            />

            {/* DESTINATION */}

            <div
              style={{
                color:
                  "#607681",

                fontSize:
                  "8px",

                letterSpacing:
                  "1.5px",

                marginBottom:
                  "10px",
              }}
            >
              DESTINATION HOSPITAL
            </div>

            <select
              id="destination-hospital"
              name="destination-hospital"

              value={
                selectedHospital?.id ||
                ""
              }

              onChange={(e) => {
                const hospital =
                  hospitals.find(
                    (h) =>
                      String(h.id) ===
                      e.target.value
                  );

                setSelectedHospital(
                  hospital
                );
              }}

              style={{
                width:
                  "100%",

                padding:
                  "13px",

                borderRadius:
                  "7px",

                background:
                  "#07131b",

                color:
                  "#dce8eb",

                border:
                  "1px solid rgba(255,255,255,.12)",
              }}
            >

              <option value="">
                Select hospital
              </option>

              {hospitals.map(
                (hospital) => (
                  <option
                    key={
                      hospital.id
                    }

                    value={
                      hospital.id
                    }
                  >
                    {
                      hospital.name
                    }
                  </option>
                )
              )}

            </select>

            {/* CAPACITY */}

            {selectedHospital && (
              <div
                style={{
                  marginTop:
                    "20px",

                  padding:
                    "16px",

                  borderRadius:
                    "9px",

                  background:
                    "rgba(53,211,129,.05)",

                  border:
                    "1px solid rgba(53,211,129,.14)",
                }}
              >

                <div
                  style={{
                    color:
                      "#607681",

                    fontSize:
                      "8px",

                    letterSpacing:
                      "1px",
                  }}
                >
                  AVAILABLE CAPACITY
                </div>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "8px",

                    fontSize:
                      "28px",

                    color:
                      "#35d381",
                  }}
                >
                  {
                    selectedHospital.beds
                  }
                </strong>

                <span
                  style={{
                    color:
                      "#71868f",

                    fontSize:
                      "11px",
                  }}
                >
                  ICU beds
                </span>

              </div>
            )}

            {/* ACTION BUTTONS */}

            <div
              style={{
                display:
                  "grid",

                gap:
                  "10px",

                marginTop:
                  "20px",
              }}
            >

              {!isNavigating ? (
                <button
                  onClick={
                    startNavigation
                  }

                  disabled={
                    !selectedHospital ||
                    route.length === 0
                  }

                  style={buttonStyle(
                    "#e84855"
                  )}
                >
                  ▶ START NAVIGATION
                </button>
              ) : (
                <button
                  onClick={
                    stopNavigation
                  }

                  style={buttonStyle(
                    "#d99132"
                  )}
                >
                  ⏸ PAUSE NAVIGATION
                </button>
              )}

              <button
                onClick={
                  reroute
                }

                disabled={
                  !selectedHospital
                }

                style={buttonStyle(
                  "#42b8e8"
                )}
              >
                ↻ RECALCULATE ROUTE
              </button>

              <button
                onClick={
                  markArrived
                }

                disabled={
                  !selectedHospital
                }

                style={buttonStyle(
                  "#35d381"
                )}
              >
                ✓ ARRIVED AT HOSPITAL
              </button>

            </div>

            {/* NAVIGATION STATUS */}

            <div
              style={{
                marginTop:
                  "20px",

                padding:
                  "14px",

                borderRadius:
                  "8px",

                background:
                  "rgba(232,72,85,.07)",

                border:
                  "1px solid rgba(232,72,85,.18)",

                color:
                  "#e84855",

                fontSize:
                  "10px",

                fontWeight:
                  "800",

                lineHeight:
                  1.6,
              }}
            >
              ● {navigationStatus}

              <br />

              Street routing connected
            </div>

            {/* DIRECTIONS */}

            {navSteps.length >
              0 && (
              <div
                style={{
                  marginTop:
                    "22px",
                }}
              >

                <div
                  style={{
                    color:
                      "#607681",

                    fontSize:
                      "8px",

                    letterSpacing:
                      "1.4px",

                    marginBottom:
                      "10px",
                  }}
                >
                  TURN-BY-TURN DIRECTIONS
                </div>

                <div
                  style={{
                    maxHeight:
                      "180px",

                    overflowY:
                      "auto",
                  }}
                >

                  {navSteps
                    .slice(0, 8)
                    .map(
                      (
                        step,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }

                          style={{
                            padding:
                              "9px 0",

                            borderBottom:
                              "1px solid rgba(255,255,255,.05)",

                            color:
                              "#8ca0a8",

                            fontSize:
                              "10px",

                            lineHeight:
                              1.5,
                          }}
                        >

                          <strong
                            style={{
                              color:
                                "#42b8e8",

                              marginRight:
                                "8px",
                            }}
                          >
                            {index + 1}.
                          </strong>

                          {step}

                        </div>
                      )
                    )}

                </div>

              </div>
            )}

            {/* =================================================
                BACK TO HOME
            ================================================= */}

            <div
              style={{
                marginTop:
                  "28px",

                paddingTop:
                  "20px",

                borderTop:
                  "1px solid rgba(255,255,255,.07)",
              }}
            >

              <button
                onClick={
                  goBackHome
                }

                style={{
                  width:
                    "100%",

                  padding:
                    "13px",

                  borderRadius:
                    "8px",

                  background:
                    "transparent",

                  color:
                    "#9fb0b8",

                  border:
                    "1px solid rgba(255,255,255,.15)",

                  fontSize:
                    "10px",

                  fontWeight:
                    "900",

                  letterSpacing:
                    "0.8px",

                  cursor:
                    "pointer",

                  transition:
                    "all .2s ease",
                }}
              >
                ← BACK TO HOME
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ---------------------------------------------------------
   STATUS CARD
--------------------------------------------------------- */

function StatusCard({
  title,
  value,
  icon,
}) {
  return (
    <div
      style={{
        padding:
          "18px",

        borderRadius:
          "12px",

        background:
          "#0a1922",

        border:
          "1px solid rgba(255,255,255,.07)",
      }}
    >

      <div
        style={{
          color:
            "#607681",

          fontSize:
            "8px",

          letterSpacing:
            "1.4px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "12px",

          marginTop:
            "10px",
        }}
      >

        <span
          style={{
            color:
              "#42b8e8",

            fontSize:
              "22px",
          }}
        >
          {icon}
        </span>

        <strong
          style={{
            fontSize:
              "13px",
          }}
        >
          {value}
        </strong>

      </div>

    </div>
  );
}

/* ---------------------------------------------------------
   INFO ROW
--------------------------------------------------------- */

function InfoRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display:
          "flex",

        justifyContent:
          "space-between",

        gap:
          "15px",

        padding:
          "13px 0",

        borderBottom:
          "1px solid rgba(255,255,255,.05)",
      }}
    >

      <span
        style={{
          color:
            "#607681",

          fontSize:
            "8px",

          letterSpacing:
            "1px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color:
            "#dce8eb",

          fontSize:
            "10px",

          textAlign:
            "right",
        }}
      >
        {value}
      </strong>

    </div>
  );
}

/* ---------------------------------------------------------
   METRIC BOX
--------------------------------------------------------- */

function MetricBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding:
          "12px",

        borderRadius:
          "8px",

        background:
          "#07131b",

        border:
          "1px solid rgba(255,255,255,.06)",
      }}
    >

      <div
        style={{
          color:
            "#607681",

          fontSize:
            "7px",

          letterSpacing:
            "1px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          display:
            "block",

          marginTop:
            "6px",

          color:
            "#dce8eb",

          fontSize:
            "16px",
        }}
      >
        {value}
      </strong>

    </div>
  );
}

/* ---------------------------------------------------------
   BUTTON STYLE
--------------------------------------------------------- */

function buttonStyle(
  background
) {
  return {
    width:
      "100%",

    padding:
      "13px",

    border:
      "none",

    borderRadius:
      "7px",

    background,

    color:
      "white",

    fontSize:
      "10px",

    fontWeight:
      "900",

    letterSpacing:
      "0.8px",

    cursor:
      "pointer",
  };
}
