import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDxSGsK9nrb2dEMS_glb5rQYUWPBPTUCH0",
  authDomain: "su-hospital-ipc.firebaseapp.com",
  databaseURL: "https://su-hospital-ipc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "su-hospital-ipc",
  storageBucket: "su-hospital-ipc.firebasestorage.app",
  messagingSenderId: "502091248471",
  appId: "1:502091248471:web:f25357122f48c69fd94412"
};

const app = initializeApp(firebaseConfig);

// 🔥 Realtime Database export (ده اللي انت شغال بيه)
export const db = getDatabase(app);