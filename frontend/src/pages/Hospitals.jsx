import { useEffect, useState } from "react";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/hospitals/"
        );

        if (!response.ok) {
          throw new Error("Failed to load hospitals");
        }

        const data = await response.json();

        const hospitalList = Array.isArray(data)
          ? data
          : data.hospitals || [];

        setHospitals(hospitalList);
      } catch (error) {
        console.error("Hospital loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#061018",
        color: "#eaf2f5",
        padding: "40px",
        fontFamily: "Inter, system-ui, sans-serif",
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
            color: "#35d381",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "2px",
          }}
        >
          MEDIROUTE / HOSPITAL NETWORK
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "10px 0",
          }}
        >
          🏥 Hospital Network
        </h1>

        <p
          style={{
            color: "#71868f",
          }}
        >
          Real-time hospital capacity and emergency
          destination availability.
        </p>

        {loading ? (
          <p>Loading hospital network...</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginTop: "35px",
            }}
          >
            {hospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HospitalCard({ hospital }) {
  const beds = Number(hospital.beds || 0);

  const isFull = beds === 0;

  return (
    <div
      style={{
        padding: "25px",
        borderRadius: "14px",
        background: "#0a1922",
        border: isFull
          ? "1px solid rgba(232,72,85,.3)"
          : "1px solid rgba(53,211,129,.18)",
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
            fontSize: "28px",
          }}
        >
          🏥
        </span>

        <span
          style={{
            padding: "6px 10px",
            borderRadius: "20px",
            background: isFull
              ? "rgba(232,72,85,.1)"
              : "rgba(53,211,129,.1)",
            color: isFull
              ? "#e84855"
              : "#35d381",
            fontSize: "9px",
            fontWeight: "900",
          }}
        >
          {hospital.status}
        </span>
      </div>

      <h2
        style={{
          marginTop: "20px",
          fontSize: "20px",
        }}
      >
        {hospital.name}
      </h2>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          borderRadius: "9px",
          background: "#07131b",
        }}
      >
        <div
          style={{
            color: "#607681",
            fontSize: "8px",
            letterSpacing: "1px",
          }}
        >
          AVAILABLE ICU BEDS
        </div>

        <strong
          style={{
            display: "block",
            marginTop: "8px",
            fontSize: "30px",
            color: isFull
              ? "#e84855"
              : "#35d381",
          }}
        >
          {beds}
        </strong>
      </div>

      <div
        style={{
          marginTop: "15px",
          color: "#71868f",
          fontSize: "11px",
        }}
      >
        📍 {hospital.coords?.[0]}, {hospital.coords?.[1]}
      </div>
    </div>
  );
}