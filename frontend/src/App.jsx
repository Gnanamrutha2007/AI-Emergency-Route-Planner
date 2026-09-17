import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmergencyRequest from "./pages/EmergencyRequest";

import LiveNavigation from "./pages/LiveNavigation";
import Hospitals from "./pages/Hospitals";
import AIIntelligence from "./pages/AIIntelligence";
import Operations from "./pages/Operations";
import Analytics from "./pages/Analytics";


function AccessController() {

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);


  /*
   * =====================================================
   * FIREBASE AUTHENTICATION LISTENER
   * =====================================================
   *
   * Firebase remembers the user's login session.
   *
   * If the user is already logged in:
   *     user = Firebase user
   *
   * If the user is not logged in:
   *     user = null
   *
   * We do NOT sign the user out automatically.
   *
   * =====================================================
   */

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {

        setUser(currentUser);
        setAuthLoading(false);

      }
    );


    return () => unsubscribe();

  }, []);


  /*
   * =====================================================
   * LOADING SCREEN
   * =====================================================
   */

  if (authLoading) {

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#061018",
          color: "#42b8e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Inter, system-ui, sans-serif",
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "1px",
        }}
      >
        AUTHENTICATING MEDIROUTE...
      </div>
    );

  }


  /*
   * =====================================================
   * EMERGENCY ACCESS CHECK
   * =====================================================
   *
   * Emergency users are identified by a temporary
   * sessionStorage flag created after submitting
   * an Emergency Request.
   *
   * The emergency session is limited to:
   *
   *     /emergency-request
   *     /dashboard
   *
   * =====================================================
   */

  const emergencyAccess =
    sessionStorage.getItem(
      "medirouteEmergencyAccess"
    ) === "true";


  /*
   * =====================================================
   * EMERGENCY-ONLY USER
   * =====================================================
   *
   * Emergency users are NOT required to have
   * a Firebase account.
   *
   * They can access ONLY:
   *
   *     Emergency Request
   *     Dashboard
   *
   * Any other URL redirects to Dashboard.
   *
   * =====================================================
   */

  if (emergencyAccess && !user) {

    return (
      <Routes>

        <Route
          path="/emergency-request"
          element={<EmergencyRequest />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    );

  }


  /*
   * =====================================================
   * NORMAL LOGGED-IN USER
   * =====================================================
   *
   * Firebase user exists.
   *
   * The user can access the complete MediRoute system.
   *
   * =====================================================
   */

  if (user) {

    /*
     * If a normal Firebase user is logged in,
     * remove any leftover emergency-only flag.
     */

    if (
      sessionStorage.getItem(
        "medirouteEmergencyAccess"
      )
    ) {

      sessionStorage.removeItem(
        "medirouteEmergencyAccess"
      );

    }


    return (
      <Routes>

        {/* Root → Home */}

        <Route
          path="/"
          element={
            <Navigate
              to="/home"
              replace
            />
          }
        />


        {/* Login → Home if already authenticated */}

        <Route
          path="/login"
          element={
            <Navigate
              to="/home"
              replace
            />
          }
        />


        {/* Main Home */}

        <Route
          path="/home"
          element={<Home />}
        />


        {/* Dashboard */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* Emergency Request */}

        <Route
          path="/emergency-request"
          element={<EmergencyRequest />}
        />


        {/* Live Navigation */}

        <Route
          path="/live-navigation"
          element={<LiveNavigation />}
        />


        {/* Hospitals */}

        <Route
          path="/hospitals"
          element={<Hospitals />}
        />


        {/* AI Intelligence */}

        <Route
          path="/ai-intelligence"
          element={<AIIntelligence />}
        />


        {/* Operations */}

        <Route
          path="/operations"
          element={<Operations />}
        />


        {/* Analytics */}

        <Route
          path="/analytics"
          element={<Analytics />}
        />


        {/* Unknown route → Home */}

        <Route
          path="*"
          element={
            <Navigate
              to="/home"
              replace
            />
          }
        />

      </Routes>
    );

  }


  /*
   * =====================================================
   * NOT LOGGED-IN USER
   * =====================================================
   *
   * Normal flow:
   *
   *     Login
   *       ↓
   *     Sign In / Sign Up
   *       ↓
   *     Home
   *
   * Emergency flow:
   *
   *     Login
   *       ↓
   *     Emergency
   *       ↓
   *     Emergency Request
   *       ↓
   *     Dashboard
   *
   * =====================================================
   */

  return (
    <Routes>

      {/* First visit */}

      <Route
        path="/"
        element={<Login />}
      />


      {/* Normal Login */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* Emergency entry */}

      <Route
        path="/emergency-request"
        element={<EmergencyRequest />}
      />


      {/* Any unknown URL → Login */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );

}


/*
 * =====================================================
 * MAIN APP
 * =====================================================
 */

function App() {

  return (
    <BrowserRouter>

      <AccessController />

    </BrowserRouter>
  );

}


export default App;