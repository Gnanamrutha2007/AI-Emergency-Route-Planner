import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmergencyRequest from "./pages/EmergencyRequest";

function App() {
  return (
    <Router>
      <nav
        style={{
          display: "flex",
          gap: "15px",
          padding: "12px 20px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/emergency-request">Emergency Request</Link>
      </nav>

      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/emergency-request"
            element={<EmergencyRequest />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;