
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000/api";

const colors = {
  bg: "#07111c",
  panel: "#0d1b29",
  border: "#203447",
  cyan: "#48d9f5",
  muted: "#91a7b8",
  white: "#edf6fc",
  green: "#4de0ad",
  orange: "#ffbf69",
  red: "#ff7777",
};

function getWeatherDescription(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Mainly clear / cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Other conditions";
}

function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) {
    return "Unavailable";
  }

  const total = Math.round(Number(seconds));
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

function Panel({ children, style = {} }) {
  return (
    <section
      style={{
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: 22,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children, color = colors.muted }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.7,
        color,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  detail,
  accent = colors.cyan,
}) {
  return (
    <Panel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Eyebrow>{title}</Eyebrow>
        <span style={{ fontSize: 23 }}>{icon}</span>
      </div>

      <div
        style={{
          marginTop: 19,
          fontSize: 25,
          fontWeight: 800,
          letterSpacing: -0.7,
          color: colors.white,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          lineHeight: 1.6,
          color: accent,
        }}
      >
        {detail}
      </div>
    </Panel>
  );
}

function SpeedBar({ label, speed, maxSpeed, color }) {
  const percentage =
    speed == null || !Number.isFinite(Number(speed))
      ? 0
      : Math.max(
          0,
          Math.min(100, (Number(speed) / maxSpeed) * 100)
        );

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 9,
        }}
      >
        <span style={{ color: colors.muted, fontSize: 13 }}>
          {label}
        </span>
        <strong style={{ color: colors.white, fontSize: 13 }}>
          {speed != null ? `${speed} km/h` : "Unavailable"}
        </strong>
      </div>

      <div
        style={{
          height: 7,
          borderRadius: 20,
          overflow: "hidden",
          background: "#223342",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            borderRadius: 20,
            background: color,
            transition: "width .4s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function AIIntelligence() {
  const [traffic, setTraffic] = useState(null);
  const [liveTraffic, setLiveTraffic] = useState(null);
  const [road, setRoad] = useState(null);
  const [weather, setWeather] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weatherError, setWeatherError] = useState("");
  const [liveTrafficError, setLiveTrafficError] = useState("");
  const [severity, setSeverity] = useState("2");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadAIData() {
      try {
        if (active) setError("");

        // Fetch current weather.
        const weatherResponse = await fetch(
          `${API}/live-weather/`
        );

        if (!weatherResponse.ok) {
          throw new Error("Live weather service is unavailable.");
        }

        const weatherData = await weatherResponse.json();

        if (
          weatherData.status !== "success" ||
          !weatherData.current
        ) {
          throw new Error("Live weather data was not returned.");
        }

        const current = weatherData.current;
        const weatherInput = Number(
          weatherData.weather_input_for_model
        );

        if (![0, 1].includes(weatherInput)) {
          throw new Error("Weather input is invalid.");
        }

        if (active) {
          setWeather({
            ...current,
            description: getWeatherDescription(
              Number(current.weather_code)
            ),
            source: weatherData.source,
            modelInput: weatherInput,
          });
          setWeatherError("");
        }

        // Fetch real traffic independently from the AI prediction.
        try {
          const response = await fetch(
            `${API}/live-traffic/`
          );

          if (!response.ok) {
            throw new Error("Live traffic service is unavailable.");
          }

          const data = await response.json();

          if (data.status !== "success" || !data.traffic) {
            throw new Error("Live traffic data was not returned.");
          }

          if (active) {
            setLiveTraffic(data);
            setLiveTrafficError("");
          }
        } catch (err) {
          if (active) {
            setLiveTrafficError(
              err.message || "Unable to load live traffic."
            );
          }
        }

        // Run the existing AI traffic prediction.
        const trafficResponse = await fetch(
          `${API}/predict-traffic/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              hour: new Date().getHours(),
              weather: weatherInput,
              severity: Number(severity),
            }),
          }
        );

        if (!trafficResponse.ok) {
          throw new Error("AI traffic prediction failed.");
        }

        const trafficData = await trafficResponse.json();

        if (trafficData.status !== "success") {
          throw new Error(
            trafficData.message || "AI traffic prediction failed."
          );
        }

        // Analyse road risk using the existing backend rules.
        const roadResponse = await fetch(
          `${API}/road-conditions/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              traffic_level: Number(trafficData.traffic_level),
              weather: weatherInput,
              severity: Number(severity),
            }),
          }
        );

        if (!roadResponse.ok) {
          throw new Error("Road condition analysis failed.");
        }

        const roadData = await roadResponse.json();

        if (active) {
          setTraffic(trafficData);
          setRoad(roadData);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load AI analysis."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAIData();
    const interval = setInterval(loadAIData, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [severity]);

  // The live-traffic endpoint nests the measurements inside data.traffic.
  const observed = liveTraffic?.traffic;
  const currentSpeed = observed?.current_speed_kmh;
  const freeFlowSpeed = observed?.free_flow_speed_kmh;
  const currentTravelTime = observed?.current_travel_time_seconds;
  const freeFlowTravelTime = observed?.free_flow_travel_time_seconds;
  const confidence = observed?.confidence;
  const isClosed = observed?.road_closure;
  const liveTrafficLabel = observed?.traffic_text;
  const speedScale = Math.max(Number(freeFlowSpeed) || 0, 1);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.white,
        padding: "clamp(18px, 4vw, 42px)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 18,
            marginBottom: 30,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 15,
                display: "grid",
                placeItems: "center",
                fontSize: 27,
                background: "#103449",
                border: "1px solid #23536a",
              }}
            >
              ✦
            </div>

            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                }}
              >
                MEDIROUTE
              </div>
              <Eyebrow>AI Response Intelligence</Eyebrow>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "10px 14px",
              borderRadius: 30,
              border: "1px solid #245443",
              background: "#102b27",
              color: colors.green,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: colors.green,
                borderRadius: "50%",
                boxShadow: `0 0 10px ${colors.green}`,
              }}
            />
            SERVICES MONITOR
          </div>
        </header>

        <div style={{ marginBottom: 25 }}>
          <Eyebrow color={colors.cyan}>Live monitoring centre</Eyebrow>
          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 43px)",
              margin: "9px 0",
              letterSpacing: -1.5,
            }}
          >
            AI Intelligence
          </h1>
          <p
            style={{
              color: colors.muted,
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            Real-time road observations, weather conditions and
            emergency route intelligence.
          </p>
        </div>

        {/* Controls and refresh information */}
        <Panel
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 15,
            marginBottom: 22,
          }}
        >
          <div>
            <Eyebrow>Emergency priority</Eyebrow>
            <div style={{ marginTop: 7, color: colors.muted, fontSize: 12 }}>
              Adjust the severity used by the existing AI model.
            </div>
          </div>

          <select
            aria-label="Emergency severity"
            value={severity}
            onChange={(event) => {
              setLoading(true);
              setSeverity(event.target.value);
            }}
            style={{
              minWidth: 190,
              padding: "12px 15px",
              borderRadius: 10,
              background: "#142838",
              border: `1px solid ${colors.border}`,
              color: colors.white,
              fontSize: 14,
              outline: "none",
            }}
          >
            <option value="0">Low</option>
            <option value="1">Medium</option>
            <option value="2">High / Critical</option>
          </select>
        </Panel>

        {loading && (
          <p style={{ color: colors.cyan }}>
            Refreshing live observations and AI analysis…
          </p>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 20,
              padding: 15,
              borderRadius: 12,
              color: colors.red,
              background: "#321c25",
              border: "1px solid #65313a",
            }}
          >
            AI analysis: {error}
          </div>
        )}

        {/* Live traffic hero */}
        <Panel
          style={{
            padding: "clamp(20px, 4vw, 32px)",
            marginBottom: 20,
            background:
              "linear-gradient(120deg, #102b3b 0%, #0c1c2b 60%, #102b28 100%)",
            borderColor: "#285064",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <Eyebrow color={colors.cyan}>
                Live traffic observation · TomTom
              </Eyebrow>
              <h2
                style={{
                  fontSize: "clamp(27px, 4vw, 38px)",
                  margin: "13px 0 8px",
                  letterSpacing: -1,
                }}
              >
                {liveTrafficLabel || "Waiting for live traffic"}
              </h2>
              <div style={{ color: colors.muted, fontSize: 13 }}>
                {liveTraffic?.source || "Connecting to traffic provider"}
              </div>
            </div>

            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                fontSize: 30,
                color: colors.green,
                background: "#153a35",
                border: "1px solid #2a6253",
              }}
            >
              ↗
            </div>
          </div>

          {liveTrafficError && (
            <p style={{ color: colors.red, fontSize: 13 }}>
              {liveTrafficError}
            </p>
          )}

          {isClosed === true && (
            <div
              style={{
                marginTop: 20,
                padding: 13,
                borderRadius: 10,
                color: colors.red,
                background: "#351e26",
                fontWeight: 800,
              }}
            >
              ⚠ Road closure reported by the traffic provider
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 14,
              marginTop: 26,
            }}
          >
            <div
              style={{
                background: "#091925",
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 19,
              }}
            >
              <Eyebrow>Current speed</Eyebrow>
              <div style={{ fontSize: 34, fontWeight: 900, marginTop: 12 }}>
                {currentSpeed ?? "—"}
                <span style={{ fontSize: 14, color: colors.muted }}>
                  {" "}km/h
                </span>
              </div>
              <SpeedBar
                label="Observed speed"
                speed={currentSpeed}
                maxSpeed={speedScale}
                color={colors.cyan}
              />
            </div>

            <div
              style={{
                background: "#091925",
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 19,
              }}
            >
              <Eyebrow>Free-flow speed</Eyebrow>
              <div style={{ fontSize: 34, fontWeight: 900, marginTop: 12 }}>
                {freeFlowSpeed ?? "—"}
                <span style={{ fontSize: 14, color: colors.muted }}>
                  {" "}km/h
                </span>
              </div>
              <SpeedBar
                label="Normal-flow reference"
                speed={freeFlowSpeed}
                maxSpeed={speedScale}
                color={colors.green}
              />
            </div>

            <div
              style={{
                background: "#091925",
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 19,
              }}
            >
              <Eyebrow>Current journey time</Eyebrow>
              <div style={{ fontSize: 29, fontWeight: 900, marginTop: 12 }}>
                {formatDuration(currentTravelTime)}
              </div>
              <div style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>
                Free flow: {formatDuration(freeFlowTravelTime)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              marginTop: 22,
              color: colors.muted,
              fontSize: 12,
            }}
          >
            <span>
              Provider confidence:{" "}
              <strong style={{ color: colors.white }}>
                {confidence != null
                  ? `${(Number(confidence) * 100).toFixed(1)}%`
                  : "Unavailable"}
              </strong>
            </span>
            <span>
              Road closure:{" "}
              <strong style={{ color: isClosed ? colors.red : colors.green }}>
                {isClosed == null
                  ? "Unknown"
                  : isClosed
                    ? "Reported"
                    : "Not reported"}
              </strong>
            </span>
          </div>
        </Panel>

        {/* AI and weather cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
          }}
        >
          <MetricCard
            icon="✧"
            title="AI traffic prediction"
            value={traffic?.prediction_text || "Unavailable"}
            detail={
              traffic
                ? `Recommended speed: ${traffic.recommended_speed_kmh} km/h`
                : "Waiting for AI model"
            }
            accent="#70caff"
          />

          <MetricCard
            icon="⚠"
            title="Road risk analysis"
            value={road?.road_condition || "Unavailable"}
            detail={
              road
                ? `Risk level: ${road.risk_level ?? "Unknown"}`
                : "Waiting for road analysis"
            }
            accent={colors.orange}
          />

          <MetricCard
            icon="☁"
            title="Live weather"
            value={
              weather
                ? `${weather.temperature_2m}°C`
                : "Unavailable"
            }
            detail={
              weather
                ? `${weather.description} · Feels like ${weather.apparent_temperature}°C`
                : weatherError || "Waiting for weather service"
            }
            accent="#8bd8ff"
          />

          <MetricCard
            icon="◉"
            title="Humidity & wind"
            value={
              weather
                ? `${weather.relative_humidity_2m}%`
                : "Unavailable"
            }
            detail={
              weather
                ? `Wind ${weather.wind_speed_10m} km/h · Rain ${weather.rain} mm`
                : "Waiting for live weather"
            }
            accent="#b5a4ff"
          />

          <MetricCard
            icon="☂"
            title="Precipitation"
            value={
              weather ? `${weather.precipitation} mm` : "Unavailable"
            }
            detail={
              weather
                ? `Weather model input: ${weather.modelInput}`
                : "Waiting for weather data"
            }
            accent="#6bdcc3"
          />

          <MetricCard
            icon="◷"
            title="Last AI update"
            value={
              lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "Pending"
            }
            detail="Automatic refresh every 60 seconds"
            accent={colors.cyan}
          />
        </div>

        {/* Explanation */}
        <Panel style={{ marginTop: 20 }}>
          <Eyebrow color={colors.cyan}>System overview</Eyebrow>
          <h3 style={{ margin: "12px 0" }}>How the decision pipeline works</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            {[
              ["01", "Weather observation", "Open-Meteo supplies current weather."],
              ["02", "Live road observation", "TomTom supplies reported speed and journey time."],
              ["03", "AI prediction", "Your existing model predicts traffic using hour, weather and severity."],
              ["04", "Road-risk analysis", "Existing backend rules assess the predicted conditions."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                style={{
                  padding: 15,
                  borderRadius: 12,
                  background: "#091724",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    color: colors.cyan,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {number}
                </div>
                <div style={{ marginTop: 10, fontWeight: 800 }}>
                  {title}
                </div>
                <p
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    lineHeight: 1.7,
                    marginBottom: 0,
                  }}
                >
                  {description}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              color: colors.muted,
              fontSize: 12,
              lineHeight: 1.7,
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            Live traffic observations and AI predictions are shown
            separately because they represent different types of data.
            The traffic observation applies to the location configured
            in your backend, not automatically to every route on the map.
          </p>
        </Panel>

        <footer
          style={{
            color: "#617989",
            fontSize: 11,
            textAlign: "center",
            marginTop: 25,
          }}
        >
          MEDIROUTE · AI EMERGENCY RESPONSE INTELLIGENCE
        </footer>
      </div>
    </main>
  );
}