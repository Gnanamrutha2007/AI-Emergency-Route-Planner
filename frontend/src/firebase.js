import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCS1N68B8xB6cRm9jiFWvz4Xome-9c1olU",
  authDomain: "hospital-management-5b171.firebaseapp.com",
  projectId: "hospital-management-5b171",
  storageBucket: "hospital-management-5b171.firebasestorage.app",
  messagingSenderId: "542509357130",
  appId: "1:542509357130:web:8cd83b204ad3d8066b6eb3",
  measurementId: "G-XDHQLFEYPG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;