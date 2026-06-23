import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBliEfa9t4eqIrKlYz-AXBJtpAqATxYlhA",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "movie-bd-b2d00.firebaseapp.com",
  databaseURL: `https://${metaEnv.VITE_FIREBASE_PROJECT_ID || "movie-bd-b2d00"}-default-rtdb.firebaseio.com`,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "movie-bd-b2d00",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "movie-bd-b2d00.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "844771007114",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:844771007114:web:282194ccce0489287dab73",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-FJ2V2HG1JM"
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
