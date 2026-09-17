import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/dashboard" },
    {
      label: "Emergency Request",
      path: "/emergency-request",
    },
    {
      label: "Live Navigation",
      path: "/live-navigation",
    },
    {
      label: "Hospitals",
      path: "/hospitals",
    },
    {
      label: "AI Intelligence",
      path: "/ai-intelligence",
    },
    {
      label: "Operations",
      path: "/operations",
    },
    {
      label: "Analytics",
      path: "/analytics",
    },
  ];

  return (
    <nav
      style={{
        width: "100%",
        background: "#07131b",
        borderBottom:
          "1px solid rgba(255,255,255,.08)",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "15px 25px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* LOGO */}

        <div
          onClick={() => navigate("/")}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: "170px",
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
              boxShadow:
                "0 0 18px rgba(232,72,85,.2)",
            }}
          >
            🚑
          </div>

          <div>
            <div
              style={{
                color: "#eaf2f5",
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

        {/* NAVIGATION */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {navItems.map((item) => {
            const active =
              location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() =>
                  navigate(item.path)
                }
                style={{
                  border: "none",
                  background: active
                    ? "rgba(66,184,232,.1)"
                    : "transparent",
                  color: active
                    ? "#42b8e8"
                    : "#71868f",
                  padding: "9px 11px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: active
                    ? "800"
                    : "600",
                  transition:
                    "all .2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}