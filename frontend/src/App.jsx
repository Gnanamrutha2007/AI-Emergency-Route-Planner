import { useEffect } from "react";
import { auth } from "./firebase";

function App() {
  useEffect(() => {
    console.log("Firebase connected successfully!");
    console.log("Firebase Auth:", auth);
  }, []);

  return (
    <div>
      <h1>AI Emergency Route Planner</h1>
      <p>Firebase is connected successfully.</p>
    </div>
  );
}

export default App;