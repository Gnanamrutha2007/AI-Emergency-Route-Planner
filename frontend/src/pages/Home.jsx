import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "./Home.css";

export default function Home() {

  const navigate = useNavigate();

  const [activeSystem, setActiveSystem] = useState(0);
  const [userEmail, setUserEmail] = useState("OPERATOR");

  const systems = [
    "AI TRAFFIC INTELLIGENCE",
    "LIVE GPS NAVIGATION",
    "HOSPITAL CAPACITY SYNC",
    "DYNAMIC ROUTE OPTIMIZATION",
  ];


  /*
   * =====================================================
   * GET CURRENT FIREBASE USER
   * =====================================================
   */

  useEffect(() => {

    const currentUser = auth.currentUser;

    if (currentUser) {

      setUserEmail(
        currentUser.email || "OPERATOR"
      );

    }

  }, []);


  /*
   * =====================================================
   * ROTATING AI SYSTEM STATUS
   * =====================================================
   */

  useEffect(() => {

    const timer = setInterval(() => {

      setActiveSystem(
        (prev) =>
          (prev + 1) % systems.length
      );

    }, 2200);

    return () => clearInterval(timer);

  }, [systems.length]);


  /*
   * =====================================================
   * SIGN OUT
   * =====================================================
   */

  const handleSignOut = async () => {

    try {

      await signOut(auth);

      sessionStorage.removeItem(
        "medirouteEmergencyAccess"
      );

      navigate("/login", {
        replace: true
      });

    } catch (error) {

      console.error(
        "Sign out error:",
        error
      );

    }

  };


  return (
    <div className="mediroute-home">

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <header className="main-navbar">

        {/* BRAND */}

        <Link
          to="/home"
          className="brand"
        >

          <div className="brand-mark">
            <span>+</span>
          </div>

          <div className="brand-text">

            <strong>
              MEDIROUTE
            </strong>

            <small>
              EMERGENCY INTELLIGENCE
            </small>

          </div>

        </Link>


        {/* MAIN NAVIGATION */}

        <nav className="desktop-nav">

          <Link to="/home">
            HOME
          </Link>

          <Link to="/dashboard">
            Dashboard
          </Link>

          <Link to="/emergency-request">
            Emergency Request
          </Link>

          <Link to="/live-navigation">
            Live Navigation
          </Link>

          <Link to="/hospitals">
            Hospitals
          </Link>

          <Link to="/ai-intelligence">
            AI Intelligence
          </Link>

          <Link to="/operations">
            Operations
          </Link>

          <Link to="/analytics">
            Analytics
          </Link>

        </nav>


        {/* =====================================================
            OPERATOR PROFILE
        ===================================================== */}

        <div
          className="operator-account"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >

          {/* PROFILE */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              lineHeight: "1.2",
            }}
          >

            <span
              style={{
                fontSize: "9px",
                fontWeight: "800",
                letterSpacing: "1px",
                color: "#42b8e8",
              }}
            >
              AUTHENTICATED OPERATOR
            </span>

            <span
              style={{
                fontSize: "10px",
                color: "#8da2ad",
                marginTop: "3px",
                maxWidth: "180px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </span>

          </div>


          {/* SIGN OUT */}

          <button
            type="button"
            onClick={handleSignOut}
            className="operator-login"
            style={{
              cursor: "pointer",
              border: "none",
            }}
          >

            SIGN OUT

            <span>
              ↪
            </span>

          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>


        {/* ===================================================
            HERO
        =================================================== */}

        <section className="hero">

          <div className="hero-background-grid"></div>


          {/* =================================================
              HERO LEFT
          ================================================= */}

          <div className="hero-left">

            <div className="system-status">

              <span className="status-light"></span>

              SYSTEM OPERATIONAL

            </div>


            <div className="hero-kicker">
              AUTONOMOUS EMERGENCY RESPONSE
            </div>


            <h1>

              Every

              <span>
                {" "}second{" "}
              </span>

              matters.

            </h1>


            <p className="hero-description">

              MediRoute connects emergency requests, AI traffic
              intelligence, live GPS navigation and hospital capacity
              into one coordinated emergency response system.

            </p>


            {/* BUTTONS */}

            <div className="hero-actions">

              <Link
                to="/emergency-request"
                className="emergency-button"
              >

                <span className="button-icon">
                  +
                </span>

                REQUEST EMERGENCY

                <span className="button-arrow">
                  →
                </span>

              </Link>


              <Link
                to="/dashboard"
                className="command-button"
              >

                DASHBOARD

                <span>
                  ↗
                </span>

              </Link>

            </div>


            {/* HERO METRICS */}

            <div className="hero-metrics">

              <div>

                <strong>
                  24/7
                </strong>

                <span>
                  Response Monitoring
                </span>

              </div>


              <div>

                <strong>
                  AI
                </strong>

                <span>
                  Decision Engine
                </span>

              </div>


              <div>

                <strong>
                  LIVE
                </strong>

                <span>
                  GPS Coordination
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              COMMAND VISUAL
          ================================================= */}

          <div className="command-visual">

            <div className="visual-header">

              <div>

                <span className="tiny-dot"></span>

                LIVE RESPONSE NETWORK

              </div>

              <span className="visual-time">
                ONLINE
              </span>

            </div>


            {/* MAP */}

            <div className="map-area">

              <div className="map-lines"></div>

              <div className="road road-one"></div>

              <div className="road road-two"></div>

              <div className="road road-three"></div>

              <div className="road road-four"></div>


              {/* ROUTE */}

              <svg
                className="route-svg"
                viewBox="0 0 600 400"
                preserveAspectRatio="none"
              >

                <path
                  d="M80 300 C180 280 170 170 270 190 C370 210 350 300 500 130"
                  className="route-shadow"
                />

                <path
                  d="M80 300 C180 280 170 170 270 190 C370 210 350 300 500 130"
                  className="route-path"
                />

                <circle
                  cx="80"
                  cy="300"
                  r="7"
                  className="route-start"
                />

                <circle
                  cx="500"
                  cy="130"
                  r="8"
                  className="route-end"
                />

              </svg>


              {/* MOVING AMBULANCE */}

              <div className="map-ambulance">

                <div className="ambulance-pulse"></div>

                <div className="ambulance-icon">
                  +
                </div>

              </div>


              {/* HOSPITAL */}

              <div className="map-hospital">

                <div className="hospital-symbol">
                  +
                </div>

              </div>


              {/* GPS */}

              <div className="gps-marker">

                <div className="gps-ring ring-one"></div>

                <div className="gps-ring ring-two"></div>

                <div className="gps-center"></div>

              </div>


              {/* AMBULANCE DATA */}

              <div className="map-card ambulance-card">

                <span>
                  UNIT 01
                </span>

                <strong>
                  AMBULANCE
                </strong>

                <small>
                  GPS TRACKING ACTIVE
                </small>

              </div>


              {/* HOSPITAL DATA */}

              <div className="map-card hospital-card">

                <span>
                  DESTINATION
                </span>

                <strong>
                  HOSPITAL
                </strong>

                <small>
                  CAPACITY AVAILABLE
                </small>

              </div>


              {/* ROUTE DATA */}

              <div className="map-card route-card">

                <span>
                  AI ROUTE
                </span>

                <strong>
                  OPTIMIZED
                </strong>

                <small>
                  ETA CALCULATING
                </small>

              </div>


              {/* MOVING SIGNAL */}

              <div className="moving-signal signal-one"></div>

              <div className="moving-signal signal-two"></div>

              <div className="moving-signal signal-three"></div>

            </div>


            {/* VISUAL FOOTER */}

            <div className="visual-footer">

              <div className="visual-module">

                <span>
                  ACTIVE AI MODULE
                </span>

                <strong>
                  {systems[activeSystem]}
                </strong>

              </div>


              <div className="visual-status">

                <span>
                  TRAFFIC
                  <b>
                    MODERATE
                  </b>
                </span>


                <span>
                  ROAD
                  <b>
                    CLEAR
                  </b>
                </span>


                <span>
                  GPS
                  <b>
                    LOCKED
                  </b>
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            SYSTEM OVERVIEW
        ===================================================== */}

        <section className="overview-section">

          <div className="section-title">

            <span>
              01 / SYSTEM OVERVIEW
            </span>

            <h2>

              One platform.

              <br />

              <em>
                Multiple intelligent decisions.
              </em>

            </h2>

          </div>


          <div className="overview-grid">


            {/* INTELLIGENT DISPATCH */}

            <div className="overview-main">

              <div className="overview-number">
                01
              </div>

              <div className="overview-icon">
                ◎
              </div>

              <h3>
                Intelligent Dispatch
              </h3>

              <p>
                Emergency requests are evaluated using severity,
                traffic conditions, ambulance location and hospital
                availability before dispatch decisions are made.
              </p>

              <Link to="/ai-intelligence">
                EXPLORE INTELLIGENCE →
              </Link>

            </div>


            {/* LIVE NAVIGATION */}

            <div className="overview-card">

              <div className="card-top">

                <span>
                  02
                </span>

                <span>
                  LIVE
                </span>

              </div>

              <div className="large-symbol">
                ◉
              </div>

              <h3>
                Live Navigation
              </h3>

              <p>
                GPS coordinates and street routing provide continuous
                ambulance movement information.
              </p>

              <Link to="/live-navigation">
                VIEW NAVIGATION →
              </Link>

            </div>


            {/* HOSPITAL */}

            <div className="overview-card">

              <div className="card-top">

                <span>
                  03
                </span>

                <span>
                  SYNC
                </span>

              </div>

              <div className="large-symbol">
                +
              </div>

              <h3>
                Hospital Network
              </h3>

              <p>
                Hospital locations and available ICU capacity are
                synchronized with emergency dispatch.
              </p>

              <Link to="/hospitals">
                VIEW HOSPITALS →
              </Link>

            </div>


            {/* AI */}

            <div className="overview-card">

              <div className="card-top">

                <span>
                  04
                </span>

                <span>
                  AI
                </span>

              </div>

              <div className="large-symbol">
                ◈
              </div>

              <h3>
                Traffic Intelligence
              </h3>

              <p>
                Machine learning estimates traffic conditions from
                time, weather and emergency severity.
              </p>

              <Link to="/ai-intelligence">
                VIEW AI ENGINE →
              </Link>

            </div>

          </div>

        </section>


        {/* =====================================================
            RESPONSE PIPELINE
        ===================================================== */}

        <section className="pipeline-section">

          <div className="pipeline-heading">

            <span>
              02 / RESPONSE PIPELINE
            </span>

            <h2>

              From emergency

              <br />

              <em>
                to coordinated response.
              </em>

            </h2>

          </div>


          <div className="pipeline">


            {/* STEP 1 */}

            <div className="pipeline-step">

              <div className="step-number">
                01
              </div>

              <div className="step-symbol">
                !
              </div>

              <h3>
                Emergency
              </h3>

              <p>
                Request and patient information enter the system.
              </p>

            </div>


            <div className="pipeline-line"></div>


            {/* STEP 2 */}

            <div className="pipeline-step">

              <div className="step-number">
                02
              </div>

              <div className="step-symbol">
                AI
              </div>

              <h3>
                Intelligence
              </h3>

              <p>
                Traffic, weather, severity and road conditions
                are evaluated.
              </p>

            </div>


            <div className="pipeline-line"></div>


            {/* STEP 3 */}

            <div className="pipeline-step">

              <div className="step-number">
                03
              </div>

              <div className="step-symbol">
                ↗
              </div>

              <h3>
                Route
              </h3>

              <p>
                Routing intelligence determines the emergency path.
              </p>

            </div>


            <div className="pipeline-line"></div>


            {/* STEP 4 */}

            <div className="pipeline-step">

              <div className="step-number">
                04
              </div>

              <div className="step-symbol">
                +
              </div>

              <h3>
                Hospital
              </h3>

              <p>
                Capacity and destination information support
                arrival coordination.
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="final-section">

          <div className="final-grid"></div>


          <div className="final-content">

            <span>
              MEDIROUTE / EMERGENCY INTELLIGENCE
            </span>

            <h2>

              Built for the

              <br />

              <em>
                critical moment.
              </em>

            </h2>

            <p>
              Enter the dashboard to monitor emergency requests,
              intelligent routing and hospital coordination.
            </p>

            <Link
              to="/dashboard"
              className="final-button"
            >

              ENTER DASHBOARD

              <span>
                →
              </span>

            </Link>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="site-footer">

        <div className="footer-brand">

          <div className="brand-mark small">

            <span>
              +
            </span>

          </div>

          <div>

            <strong>
              MEDIROUTE
            </strong>

            <small>
              EMERGENCY INTELLIGENCE
            </small>

          </div>

        </div>


        <div className="footer-links">

          <Link to="/dashboard">
            Dashboard
          </Link>

          <Link to="/emergency-request">
            Emergency Request
          </Link>

          <Link to="/live-navigation">
            Navigation
          </Link>

          <Link to="/hospitals">
            Hospitals
          </Link>

          <Link to="/ai-intelligence">
            AI Intelligence
          </Link>

          <Link to="/analytics">
            Analytics
          </Link>

        </div>


        <div className="footer-copy">

          © 2026 MediRoute Emergency Systems

        </div>

      </footer>

    </div>
  );
}