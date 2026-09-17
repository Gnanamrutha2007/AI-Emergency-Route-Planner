import { useEffect, useState } from "react";

export default function Analytics() {
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [requestsResponse, hospitalsResponse] =
          await Promise.all([
            fetch(
              "http://127.0.0.1:8000/api/emergency-requests/list/"
            ),
            fetch(
              "http://127.0.0.1:8000/api/hospitals/"
            ),
          ]);

        const requestsData =
          await requestsResponse.json();

        const hospitalsData =
          await hospitalsResponse.json();

        const requestList = Array.isArray(
          requestsData
        )
          ? requestsData
          : requestsData.requests || [];

        const hospitalList = Array.isArray(
          hospitalsData
        )
          ? hospitalsData
          : hospitalsData.hospitals || [];

        setRequests(requestList);
        setHospitals(hospitalList);
      } catch (error) {
        console.error(
          "Analytics loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const totalRequests = requests.length;

  const criticalRequests = requests.filter(
    (request) =>
      Number(request.severity) === 2
  ).length;

  const pendingRequests = requests.filter(
    (request) =>
      request.status === "Pending"
  ).length;

  const totalBeds = hospitals.reduce(
    (total, hospital) =>
      total + Number(hospital.beds || 0),
    0
  );

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
          MEDIROUTE / ANALYTICS
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "10px 0",
          }}
        >
          📈 Analytics & Reports
        </h1>

        <p
          style={{
            color: "#71868f",
          }}
        >
          Operational statistics from the emergency
          response system.
        </p>

        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                marginTop: "35px",
              }}
            >
              <StatCard
                label="TOTAL EMERGENCY REQUESTS"
                value={totalRequests}
                icon="🚑"
              />

              <StatCard
                label="CRITICAL REQUESTS"
                value={criticalRequests}
                icon="⚠️"
              />

              <StatCard
                label="PENDING REQUESTS"
                value={pendingRequests}
                icon="⏳"
              />

              <StatCard
                label="HOSPITALS MONITORED"
                value={hospitals.length}
                icon="🏥"
              />

              <StatCard
                label="AVAILABLE ICU BEDS"
                value={totalBeds}
                icon="🛏️"
              />
            </div>

            <div
              style={{
                marginTop: "25px",
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
                HOSPITAL CAPACITY OVERVIEW
              </div>

              <h2
                style={{
                  marginBottom: "20px",
                }}
              >
                Current ICU Availability
              </h2>

              {hospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom:
                      "1px solid rgba(255,255,255,.05)",
                  }}
                >
                  <span>
                    {hospital.name}
                  </span>

                  <strong
                    style={{
                      color:
                        Number(hospital.beds) === 0
                          ? "#e84855"
                          : "#35d381",
                    }}
                  >
                    {hospital.beds} ICU beds
                  </strong>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}) {
  return (
    <div
      style={{
        padding: "22px",
        borderRadius: "14px",
        background: "#0a1922",
        border:
          "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "24px",
          }}
        >
          {icon}
        </span>

        <span
          style={{
            color: "#607681",
            fontSize: "8px",
            letterSpacing: "1px",
            textAlign: "right",
          }}
        >
          {label}
        </span>
      </div>

      <strong
        style={{
          display: "block",
          marginTop: "18px",
          fontSize: "32px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}