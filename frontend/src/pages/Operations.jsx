import { useEffect, useState } from "react";

export default function Operations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/emergency-requests/list/"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load emergency requests"
          );
        }

        const data = await response.json();

        console.log(
          "Emergency Requests:",
          data
        );

        setRequests(
          Array.isArray(data)
            ? data
            : data.requests || []
        );
      } catch (error) {
        console.error(
          "Emergency request loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
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
            color: "#e84855",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "2px",
          }}
        >
          MEDIROUTE / EMERGENCY OPERATIONS
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "10px 0",
          }}
        >
          📋 Emergency Operations
        </h1>

        <p
          style={{
            color: "#71868f",
          }}
        >
          Monitor incoming emergency requests and
          response status.
        </p>

        {loading ? (
          <p>Loading emergency operations...</p>
        ) : requests.length === 0 ? (
          <div
            style={{
              marginTop: "35px",
              padding: "30px",
              borderRadius: "14px",
              background: "#0a1922",
              border:
                "1px solid rgba(255,255,255,.08)",
              color: "#71868f",
            }}
          >
            No emergency requests available.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "15px",
              marginTop: "35px",
            }}
          >
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }) {
  const severity = Number(
    request.severity || 1
  );

  const severityText =
    severity === 2
      ? "Critical"
      : severity === 1
        ? "Urgent"
        : "Stable";

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
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        <div>
          <div
            style={{
              color: "#607681",
              fontSize: "8px",
              letterSpacing: "1.5px",
            }}
          >
            EMERGENCY REQUEST #{request.id}
          </div>

          <h2
            style={{
              margin: "8px 0",
              fontSize: "21px",
            }}
          >
            {request.patient_name}
          </h2>
        </div>

        <span
          style={{
            padding: "7px 12px",
            borderRadius: "20px",
            background:
              severity === 2
                ? "rgba(232,72,85,.12)"
                : "rgba(66,184,232,.1)",
            color:
              severity === 2
                ? "#e84855"
                : "#42b8e8",
            fontSize: "9px",
            fontWeight: "900",
          }}
        >
          {severityText}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "12px",
          marginTop: "18px",
        }}
      >
        <InfoBox
          label="EMERGENCY TYPE"
          value={request.emergency_type}
        />

        <InfoBox
          label="LOCATION"
          value={request.location}
        />

        <InfoBox
          label="STATUS"
          value={request.status}
        />
      </div>

      {request.notes && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            borderRadius: "8px",
            background: "#07131b",
            color: "#8ca0a8",
            fontSize: "11px",
          }}
        >
          <strong>Notes:</strong>{" "}
          {request.notes}
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        background: "#07131b",
      }}
    >
      <div
        style={{
          color: "#607681",
          fontSize: "7px",
          letterSpacing: "1px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "7px",
          fontSize: "11px",
          fontWeight: "700",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}