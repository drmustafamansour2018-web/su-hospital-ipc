import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, remove } from "firebase/database"; // أضفنا remove هنا

const firebaseConfig = {
  apiKey: "AIzaSyDxSGsK9nrb2dEMS_glb5rQYUWPBPTUCH0",
  authDomain: "su-hospital-ipc.firebaseapp.com",
  databaseURL: "https://su-hospital-ipc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "su-hospital-ipc",
  storageBucket: "su-hospital-ipc.firebasestorage.app",
  messagingSenderId: "502091248471",
  appId: "1:502091248471:web:f25357122f48c69fd94412"
};

// ابدأ تشغيل الفايربيز
const app = initializeApp(firebaseConfig);

// تصدير الـ Database والوظائف المهمة
export const db = getDatabase(app);
export { ref, set, push, onValue, remove }; // أضفنا remove هنا أيضاً