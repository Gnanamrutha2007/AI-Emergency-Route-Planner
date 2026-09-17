import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EmergencyRequest() {
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState("");
  const [emergencyType, setEmergencyType] = useState("Accident");
  const [severity, setSeverity] = useState("2");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const emergencyData = {
      patientName: patientName.trim(),
      emergencyType,
      severity: Number(severity),
      location: location.trim(),
      notes: notes.trim(),
    };

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/emergency-requests/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emergencyData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to create emergency request."
        );
      }

      console.log(
        "Emergency Request Created:",
        data
      );

      /*
       * =====================================================
       * EMERGENCY ACCESS SESSION
       *
       * This marks the current browser tab as an
       * emergency-only session.
       *
       * App.jsx uses this flag to restrict the emergency
       * user to:
       *
       * Emergency Request → Dashboard
       *
       * Other system pages are blocked.
       * =====================================================
       */

      sessionStorage.setItem(
        "medirouteEmergencyAccess",
        "true"
      );

     setMessage(
  'Emergency request created successfully. Request ID: ${data.emergency_id}. Redirecting to dispatch dashboard...'
);

setTimeout(() => {
  navigate("/dashboard");
}, 1200);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (err) {
      console.error(
        "Emergency Request Error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the emergency request server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#061018",
        color: "#eaf2f5",
        padding: "40px 20px",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          style={{
            color: "#e84855",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "2px",
            marginBottom: "8px",
          }}
        >
          MEDIROUTE / EMERGENCY INTAKE
        </div>

        <h1
          style={{
            margin: "0",
            fontSize: "42px",
            lineHeight: "1.2",
            fontWeight: "800",
          }}
        >
          🚑 Emergency Request
        </h1>

        <p
          style={{
            marginTop: "10px",
            color: "#71868f",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          Submit emergency information to begin
          AI-assisted response, hospital selection
          and route planning.
        </p>


        {/* =====================================================
            MAIN FORM CARD
        ===================================================== */}

        <div
          style={{
            marginTop: "35px",
            background: "#0a1922",
            border:
              "1px solid rgba(255,255,255,.08)",
            borderRadius: "16px",
            padding: "30px",
            boxShadow:
              "0 20px 50px rgba(0,0,0,.25)",
          }}
        >

          {/* SYSTEM STATUS */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              marginBottom: "28px",
              borderRadius: "10px",
              background: "#07131b",
              border:
                "1px solid rgba(255,255,255,.06)",
            }}
          >
            <div>
              <div
                style={{
                  color: "#607681",
                  fontSize: "8px",
                  letterSpacing: "1.5px",
                  fontWeight: "800",
                }}
              >
                RESPONSE SYSTEM
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                Ready for Emergency Intake
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                color: "#35d381",
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#35d381",
                  display: "inline-block",
                  boxShadow:
                    "0 0 10px rgba(53,211,129,.6)",
                }}
              />

              SYSTEM ONLINE
            </div>
          </div>


          {/* =====================================================
              FORM
          ===================================================== */}

          <form onSubmit={handleSubmit}>

            {/* PATIENT NAME */}

            <div style={fieldWrapper}>
              <label style={labelStyle}>
                PATIENT NAME
              </label>

              <input
                type="text"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) =>
                  setPatientName(e.target.value)
                }
                required
                style={inputStyle}
              />
            </div>


            {/* EMERGENCY TYPE */}

            <div style={fieldWrapper}>
              <label style={labelStyle}>
                EMERGENCY TYPE
              </label>

              <select
                value={emergencyType}
                onChange={(e) =>
                  setEmergencyType(e.target.value)
                }
                style={inputStyle}
              >
                <option value="Accident">
                  Accident
                </option>

                <option value="Cardiac Emergency">
                  Cardiac Emergency
                </option>

                <option value="Breathing Emergency">
                  Breathing Emergency
                </option>

                <option value="Stroke">
                  Stroke
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>


            {/* SEVERITY */}

            <div style={fieldWrapper}>
              <label style={labelStyle}>
                EMERGENCY SEVERITY
              </label>

              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value)
                }
                style={{
                  ...inputStyle,
                  border:
                    severity === "2"
                      ? "1px solid rgba(232,72,85,.45)"
                      : "1px solid rgba(255,255,255,.1)",
                }}
              >
                <option value="0">
                  Low
                </option>

                <option value="1">
                  Medium
                </option>

                <option value="2">
                  High / Critical
                </option>
              </select>

              <div
                style={{
                  marginTop: "8px",
                  color:
                    severity === "2"
                      ? "#e84855"
                      : "#71868f",
                  fontSize: "10px",
                }}
              >
                {severity === "2"
                  ? "⚠ Critical emergency response selected"
                  : "Severity will be considered during AI analysis"}
              </div>
            </div>


            {/* LOCATION */}

            <div style={fieldWrapper}>
              <label style={labelStyle}>
                PATIENT LOCATION
              </label>

              <input
                type="text"
                placeholder="Enter location or landmark"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                required
                style={inputStyle}
              />

              <div
                style={{
                  marginTop: "8px",
                  color: "#607681",
                  fontSize: "10px",
                }}
              >
                📍 Provide a landmark or recognizable
                location for emergency response planning.
              </div>
            </div>


            {/* NOTES */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <label style={labelStyle}>
                ADDITIONAL NOTES
              </label>

              <textarea
                placeholder="Enter additional emergency information..."
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                rows="5"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "120px",
                }}
              />
            </div>


            {/* SUCCESS MESSAGE */}

            {message && (
              <div
                style={{
                  background:
                    "rgba(53,211,129,.08)",
                  border:
                    "1px solid rgba(53,211,129,.25)",
                  color: "#35d381",
                  padding: "14px",
                  borderRadius: "10px",
                  marginBottom: "18px",
                  fontSize: "12px",
                  lineHeight: "1.5",
                }}
              >
                ✓ {message}
              </div>
            )}


            {/* ERROR MESSAGE */}

            {error && (
              <div
                style={{
                  background:
                    "rgba(232,72,85,.08)",
                  border:
                    "1px solid rgba(232,72,85,.25)",
                  color: "#e84855",
                  padding: "14px",
                  borderRadius: "10px",
                  marginBottom: "18px",
                  fontSize: "12px",
                  lineHeight: "1.5",
                }}
              >
                ⚠ {error}
              </div>
            )}


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                background: loading
                  ? "#39474e"
                  : "#e84855",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "900",
                letterSpacing: ".5px",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                transition:
                  "all .2s ease",
                boxShadow: loading
                  ? "none"
                  : "0 8px 25px rgba(232,72,85,.2)",
              }}
            >
              {loading
                ? "CREATING EMERGENCY REQUEST..."
                : "🚑 CREATE EMERGENCY REQUEST"}
            </button>

          </form>
        </div>


        {/* =====================================================
            RESPONSE PIPELINE
        ===================================================== */}

        <div
          style={{
            marginTop: "20px",
            padding: "22px",
            borderRadius: "14px",
            background: "#0a1922",
            border:
              "1px solid rgba(255,255,255,.08)",
          }}
        >
          <div
            style={{
              color: "#607681",
              fontSize: "8px",
              fontWeight: "800",
              letterSpacing: "1.5px",
            }}
          >
            RESPONSE PIPELINE
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <PipelineStep
              number="01"
              text="Emergency Intake"
            />

            <PipelineStep
              number="02"
              text="AI Analysis"
            />

            <PipelineStep
              number="03"
              text="Hospital Selection"
            />

            <PipelineStep
              number="04"
              text="Route Planning"
            />
          </div>
        </div>


        {/* =====================================================
            BACK TO DASHBOARD
        ===================================================== */}

        <button
          onClick={() =>
            navigate("/dashboard")
          }
          style={{
            marginTop: "20px",
            border:
              "1px solid rgba(255,255,255,.08)",
            background: "#0a1922",
            color: "#71868f",
            padding: "11px 18px",
            borderRadius: "9px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: "700",
          }}
        >
          ← Back to Dashboard
        </button>

      </div>
    </div>
  );
}


/* =========================================================
   PIPELINE STEP
========================================================= */

function PipelineStep({
  number,
  text,
}) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "9px",
        background: "#07131b",
        border:
          "1px solid rgba(255,255,255,.05)",
      }}
    >
      <div
        style={{
          color: "#42b8e8",
          fontSize: "9px",
          fontWeight: "900",
        }}
      >
        {number}
      </div>

      <div
        style={{
          marginTop: "7px",
          color: "#a9bbc2",
          fontSize: "10px",
          fontWeight: "700",
        }}
      >
        {text}
      </div>
    </div>
  );
}


/* =========================================================
   FORM STYLES
========================================================= */

const fieldWrapper = {
  marginBottom: "22px",
};

const labelStyle = {
  display: "block",
  color: "#71868f",
  fontSize: "9px",
  fontWeight: "900",
  letterSpacing: "1.5px",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  marginTop: "8px",
  borderRadius: "9px",
  border:
    "1px solid rgba(255,255,255,.1)",
  background: "#07131b",
  color: "#eaf2f5",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

