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
          data.message || data.error || "Failed to create emergency request."
        );
      }

      console.log("Emergency Request Created:", data);

      setMessage(
        `Emergency request created successfully. Request ID: ${data.emergency_id}`
      );

      // Give the user a moment to see the success message.
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      console.error("Emergency Request Error:", err);
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
        background: "#f4f7f6",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "white",
          padding: "35px",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            border: "none",
            background: "transparent",
            color: "#7f8c8d",
            cursor: "pointer",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          ← Back to Dashboard
        </button>

        <h1
          style={{
            margin: "0 0 8px",
            color: "#2c3e50",
            lineHeight: "1.2",
          }}
        >
          Emergency Request
        </h1>

        <p
          style={{
            color: "#7f8c8d",
            marginBottom: "30px",
          }}
        >
          Enter emergency details to begin AI-assisted dispatch.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#2c3e50",
              }}
            >
              Patient Name
            </label>

            <input
              type="text"
              placeholder="Enter patient name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#2c3e50",
              }}
            >
              Emergency Type
            </label>

            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              style={inputStyle}
            >
              <option value="Accident">Accident</option>
              <option value="Cardiac Emergency">
                Cardiac Emergency
              </option>
              <option value="Breathing Emergency">
                Breathing Emergency
              </option>
              <option value="Stroke">Stroke</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#2c3e50",
              }}
            >
              Emergency Severity
            </label>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={inputStyle}
            >
              <option value="0">Low</option>
              <option value="1">Medium</option>
              <option value="2">High / Critical</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#2c3e50",
              }}
            >
              Patient Location
            </label>

            <input
              type="text"
              placeholder="Enter location or landmark"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#2c3e50",
              }}
            >
              Additional Notes
            </label>

            <textarea
              placeholder="Enter any additional emergency information"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="5"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          {message && (
            <div
              style={{
                background: "#eafaf1",
                color: "#1e8449",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#fdedec",
                color: "#c0392b",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#95a5a6" : "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Creating Emergency Request..."
              : "Create Emergency Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "7px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  boxSizing: "border-box",
};