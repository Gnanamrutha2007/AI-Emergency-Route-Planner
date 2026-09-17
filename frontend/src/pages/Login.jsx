import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearMessages();
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        // Existing Firebase account only
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        setMessage(
          "Authentication successful. Opening MediRoute Home..."
        );

        // LOGIN → HOME
        setTimeout(() => {
          navigate("/home");
        }, 800);
      } else {
        // Create new Firebase account
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        setMessage(
          "Account created successfully. Opening MediRoute Home..."
        );

        // SIGN UP → HOME
        setTimeout(() => {
          navigate("/home");
        }, 800);
      }
    } catch (err) {
      console.error(
        "Firebase Authentication Error:",
        err
      );

      let errorMessage =
        "Authentication failed. Please try again.";

      switch (err.code) {
        case "auth/invalid-credential":
          errorMessage =
            "Invalid email or password.";
          break;

        case "auth/user-not-found":
          errorMessage =
            "No account exists with this email.";
          break;

        case "auth/wrong-password":
          errorMessage =
            "Incorrect password.";
          break;

        case "auth/email-already-in-use":
          errorMessage =
            "An account with this email already exists. Please sign in.";
          break;

        case "auth/invalid-email":
          errorMessage =
            "Please enter a valid email address.";
          break;

        case "auth/weak-password":
          errorMessage =
            "Password is too weak. Use at least 6 characters.";
          break;

        case "auth/too-many-requests":
          errorMessage =
            "Too many authentication attempts. Please wait and try again later.";
          break;

        case "auth/network-request-failed":
          errorMessage =
            "Network error. Please check your internet connection.";
          break;

        default:
          errorMessage =
            err.message ||
            "Authentication failed.";
      }

      setError(errorMessage);
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
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav
        style={{
          background: "#07131b",
          borderBottom:
            "1px solid rgba(255,255,255,.08)",
          padding: "15px 30px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >

          {/* LOGO */}

          <div
            onClick={() => navigate("/home")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "9px",
                background: "#e84855",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              🚑
            </div>

            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "900",
                  letterSpacing: "1px",
                }}
              >
                MEDIROUTE
              </div>

              <div
                style={{
                  color: "#607681",
                  fontSize: "7px",
                  letterSpacing: "1.5px",
                  fontWeight: "800",
                }}
              >
                EMERGENCY RESPONSE
              </div>
            </div>
          </div>

          {/* HOME */}

          <button
            onClick={() => navigate("/home")}
            style={{
              border:
                "1px solid rgba(255,255,255,.1)",
              background: "#0a1922",
              color: "#a9bbc2",
              padding: "9px 15px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "10px",
              fontWeight: "700",
            }}
          >
            ← Home
          </button>
        </div>
      </nav>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
          }}
        >

          {/* HEADER */}

          <div
            style={{
              textAlign: "center",
              marginBottom: "25px",
            }}
          >
            <div
              style={{
                color: "#42b8e8",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "2px",
              }}
            >
              MEDIROUTE / ACCESS TERMINAL
            </div>

            <h1
              style={{
                margin: "10px 0 8px",
                fontSize: "34px",
                fontWeight: "800",
              }}
            >
              Command Center Access
            </h1>

            <p
              style={{
                color: "#71868f",
                fontSize: "12px",
                lineHeight: "1.6",
              }}
            >
              Secure access to the emergency
              response platform.
            </p>
          </div>


          {/* =====================================================
              THREE OPTIONS
          ===================================================== */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            <AccessButton
              active={mode === "signin"}
              onClick={() =>
                switchMode("signin")
              }
              icon="🔐"
              title="SIGN IN"
            />

            <AccessButton
              active={mode === "signup"}
              onClick={() =>
                switchMode("signup")
              }
              icon="➕"
              title="SIGN UP"
            />

            <AccessButton
              emergency
              onClick={() =>
                navigate(
                  "/emergency-request"
                )
              }
              icon="🚨"
              title="EMERGENCY"
            />
          </div>


          {/* =====================================================
              LOGIN CARD
          ===================================================== */}

          <div
            style={{
              background: "#0a1922",
              border:
                "1px solid rgba(255,255,255,.08)",
              borderRadius: "16px",
              padding: "30px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,.3)",
            }}
          >

            {/* CARD HEADER */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  color: "#607681",
                  fontSize: "8px",
                  letterSpacing: "1.5px",
                  fontWeight: "900",
                }}
              >
                {mode === "signin"
                  ? "OPERATOR SIGN IN"
                  : "NEW OPERATOR ACCOUNT"}
              </div>

              <h2
                style={{
                  margin:
                    "8px 0 5px",
                  fontSize: "21px",
                }}
              >
                {mode === "signin"
                  ? "Authenticate Operator"
                  : "Create Operator Account"}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#71868f",
                  fontSize: "11px",
                  lineHeight: "1.5",
                }}
              >
                {mode === "signin"
                  ? "Use your registered Firebase credentials to access the command center."
                  : "Create an authorized Email/Password account for this application."}
              </p>
            </div>


            {/* FORM */}

            <form onSubmit={handleSubmit}>

              {/* EMAIL */}

              <div
                style={{
                  marginBottom: "18px",
                }}
              >
                <label style={labelStyle}>
                  OPERATOR EMAIL
                </label>

                <input
                  type="email"
                  placeholder="operator@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>


              {/* PASSWORD */}

              <div
                style={{
                  marginBottom: "22px",
                }}
              >
                <label style={labelStyle}>
                  SECURITY PASSWORD
                </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    required
                    autoComplete={
                      mode === "signin"
                        ? "current-password"
                        : "new-password"
                    }
                    style={{
                      ...inputStyle,
                      paddingRight:
                        "75px",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    style={{
                      position:
                        "absolute",
                      right: "8px",
                      top: "8px",
                      border: "none",
                      background:
                        "#0a1922",
                      color:
                        "#42b8e8",
                      padding:
                        "6px 8px",
                      cursor:
                        "pointer",
                      fontSize:
                        "9px",
                      fontWeight:
                        "800",
                    }}
                  >
                    {showPassword
                      ? "HIDE"
                      : "SHOW"}
                  </button>
                </div>
              </div>


              {/* ERROR */}

              {error && (
                <div
                  style={{
                    background:
                      "rgba(232,72,85,.08)",
                    border:
                      "1px solid rgba(232,72,85,.25)",
                    color: "#e84855",
                    padding: "13px",
                    borderRadius:
                      "9px",
                    marginBottom:
                      "15px",
                    fontSize:
                      "11px",
                    lineHeight:
                      "1.5",
                  }}
                >
                  ⚠ {error}
                </div>
              )}


              {/* SUCCESS */}

              {message && (
                <div
                  style={{
                    background:
                      "rgba(53,211,129,.08)",
                    border:
                      "1px solid rgba(53,211,129,.25)",
                    color: "#35d381",
                    padding: "13px",
                    borderRadius:
                      "9px",
                    marginBottom:
                      "15px",
                    fontSize:
                      "11px",
                    lineHeight:
                      "1.5",
                  }}
                >
                  ✓ {message}
                </div>
              )}


              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background:
                    loading
                      ? "#39474e"
                      : "#e84855",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "9px",
                  fontSize: "12px",
                  fontWeight: "900",
                  letterSpacing: ".5px",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  boxShadow:
                    loading
                      ? "none"
                      : "0 8px 25px rgba(232,72,85,.2)",
                }}
              >
                {loading
                  ? "AUTHENTICATING..."
                  : mode === "signin"
                    ? "🔐 SIGN IN TO COMMAND CENTER"
                    : "➕ CREATE OPERATOR ACCOUNT"}
              </button>
            </form>


            {/* =====================================================
                EMERGENCY OPTION
            ===================================================== */}

            <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop:
                  "1px solid rgba(255,255,255,.06)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#607681",
                  fontSize: "9px",
                  marginBottom: "10px",
                }}
              >
                NEED EMERGENCY RESPONSE?
              </div>

              <button
                onClick={() =>
                  navigate(
                    "/emergency-request"
                  )
                }
                style={{
                  width: "100%",
                  padding: "11px",
                  border:
                    "1px solid rgba(232,72,85,.25)",
                  background:
                    "rgba(232,72,85,.06)",
                  color: "#e84855",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: "900",
                }}
              >
                🚨 OPEN EMERGENCY REQUEST
              </button>
            </div>
          </div>


          {/* =====================================================
              SECURITY STATUS
          ===================================================== */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "7px",
              marginTop: "18px",
              color: "#607681",
              fontSize: "8px",
              letterSpacing: "1px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#35d381",
              }}
            />

            FIREBASE AUTHENTICATION ACTIVE
          </div>
        </div>
      </main>


      {/* FOOTER */}

      <footer
        style={{
          textAlign: "center",
          padding: "18px",
          color: "#4e626b",
          fontSize: "8px",
          letterSpacing: ".5px",
        }}
      >
        MediRoute Emergency Response Platform
        • Secure Access Terminal
      </footer>
    </div>
  );
}


/* =========================================================
   ACCESS BUTTON
========================================================= */

function AccessButton({
  active,
  emergency,
  onClick,
  icon,
  title,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "13px 6px",
        borderRadius: "9px",
        border: emergency
          ? "1px solid rgba(232,72,85,.3)"
          : active
            ? "1px solid rgba(66,184,232,.35)"
            : "1px solid rgba(255,255,255,.07)",

        background: emergency
          ? "rgba(232,72,85,.08)"
          : active
            ? "rgba(66,184,232,.1)"
            : "#0a1922",

        color: emergency
          ? "#e84855"
          : active
            ? "#42b8e8"
            : "#71868f",

        cursor: "pointer",
        fontSize: "9px",
        fontWeight: "900",
      }}
    >
      <div
        style={{
          fontSize: "15px",
          marginBottom: "5px",
        }}
      >
        {icon}
      </div>

      {title}
    </button>
  );
}


/* =========================================================
   FORM STYLES
========================================================= */

const labelStyle = {
  display: "block",
  color: "#71868f",
  fontSize: "9px",
  fontWeight: "900",
  letterSpacing: "1.5px",
  marginBottom: "8px",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "9px",
  border:
    "1px solid rgba(255,255,255,.1)",
  background: "#07131b",
  color: "#eaf2f5",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};
