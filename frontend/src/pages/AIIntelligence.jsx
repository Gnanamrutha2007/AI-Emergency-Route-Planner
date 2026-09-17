import { useEffect, useState } from "react";

export default function AIIntelligence() {
  const [traffic, setTraffic] = useState(null);
  const [road, setRoad] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAIData = async () => {
      try {
        const trafficResponse = await fetch(
          "http://127.0.0.1:8000/api/predict-traffic/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              hour: new Date().getHours(),
              weather: 0,
              severity: 2,
            }),
          }
        );

        const trafficData =
          await trafficResponse.json();

        setTraffic(trafficData);

        const roadResponse = await fetch(
          "http://127.0.0.1:8000/api/road-conditions/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              traffic_level:
                Number(
                  trafficData.traffic_level || 0
                ),
              weather: 0,
              severity: 2,
            }),
          }
        );

        const roadData =
          await roadResponse.json();

        setRoad(roadData);
      } catch (error) {
        console.error(
          "AI Intelligence error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadAIData();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#061018",
        color: "#eaf2f5",
        padding: "40px",
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            color: "#42b8e8",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "2px",
          }}
        >
          MEDIROUTE / AI SYSTEM
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "10px 0",
          }}
        >
          AI Intelligence
        </h1>

        <p
          style={{
            color: "#71868f",
          }}
        >
          Traffic prediction, road-risk analysis
          and intelligent emergency routing.
        </p>

        {loading ? (
          <p>Loading AI analysis...</p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",
                gap: "20px",
                marginTop: "35px",
              }}
            >
              <AIBox
                title="AI TRAFFIC PREDICTION"
                value={
                  traffic?.prediction_text ||
                  "Unavailable"
                }
                detail={
                  traffic
                    ? `Recommended speed: ${traffic.recommended_speed_kmh} km/h`
                    : ""
                }
              />

              <AIBox
                title="ROAD CONDITION ANALYSIS"
                value={
                  road?.road_condition ||
                  "Unavailable"
                }
                detail={
                  road
                    ? `Risk Level: ${road.risk_level}`
                    : ""
                }
              />
            </div>

            <div
              style={{
                marginTop: "20px",
                padding: "25px",
                borderRadius: "14px",
                background: "#0a1922",
                border:
                  "1px solid rgba(255,255,255,.08)",
              }}
            >
              <div
                style={{
                  color: "#607681",
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                }}
              >
                AI DECISION PIPELINE
              </div>

              <h2>
                Emergency Route Intelligence
              </h2>

              <p
                style={{
                  color: "#8ca0a8",
                  lineHeight: 1.7,
                }}
              >
                The system evaluates traffic,
                road conditions and emergency
                severity before supporting hospital
                selection and route planning.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AIBox({
  title,
  value,
  detail,
}) {
  return (
    <div
      style={{
        padding: "25px",
        borderRadius: "14px",
        background: "#0a1922",
        border:
          "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div
        style={{
          color: "#607681",
          fontSize: "9px",
          letterSpacing: "1.5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "26px",
          fontWeight: "800",
          marginTop: "15px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#42b8e8",
          marginTop: "10px",
          fontSize: "12px",
        }}
      >
        {detail}
      </div>
    </div>
  );
}