import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyCAz1nADtYgt7S5gTUm6WGz5N9RJ2_L1Lc",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "win333-c2cee.firebaseapp.com",
  databaseURL: metaEnv.VITE_FIREBASE_DATABASE_URL || "https://win333-c2cee-default-rtdb.firebaseio.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "win333-c2cee",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "win333-c2cee.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "67795790100",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:67795790100:web:4e4f3cb7226933401c3a01",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-Y2360ZLLGL"
};

export let app: any = null;
export let analytics: any = null;
export let auth: any = null;

try {
  if (typeof window !== "undefined") {
    // Check if we are running in a restricted iframe/sandbox where storage/cookies are disabled
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("Firebase initialized successfully.");

    isSupported().then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
          console.log("Firebase Analytics initialized successfully.");
        } catch (analyticsError) {
          console.warn("Firebase Analytics could not initialize (sandbox/iframe restrictions):", analyticsError);
        }
      } else {
        console.warn("Firebase Analytics is not supported in this browser context.");
      }
    }).catch((err) => {
      console.warn("Checking Firebase support failed:", err);
    });
  } else {
    // Server-side / Node fallback
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Firebase initialization failed safely to prevent app crash:", error);
}
