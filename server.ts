import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import "dotenv/config";

interface Movie {
  id: string;
  title: string;
  banglaTitle?: string;
  category: string;
  rating: string;
  releaseDate: string;
  imageUrl: string;
  teaserImageUrl?: string;
  downloadUrl: string;
  isBanner: boolean;
  isUpcoming: boolean;
  status: 'Released' | 'Upcoming' | 'Coming Soon';
  initials?: string;
  timerSeconds?: number;
  adSlots: string[];
}

interface AppSettings {
  defaultTimerSeconds: number;
  telegramBotUrl: string;
  facebookGroupUrl: string;
  mainChannelUrl: string;
  chatGroupUrl: string;
  adultChannelUrl: string;
  livetvChannelUrl: string;
  rotationHours: number; // e.g. 1 or 3 hours
  categories: string[];
  allowedTelegramUsernames: string;
}

interface DbSchema {
  movies: Movie[];
  settings: AppSettings;
  lastUpdated?: number;
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure data directory and DB file exist with premium cinematic defaults
function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const defaultSettings: AppSettings = {
    defaultTimerSeconds: 10,
    telegramBotUrl: "https://t.me/MovieGo_HD_bot",
    facebookGroupUrl: "https://facebook.com/groups/movieelink",
    mainChannelUrl: "https://t.me/MovieGo_HD_bot?start=channel",
    chatGroupUrl: "https://t.me/MovieGo_HD_bot?start=chat",
    adultChannelUrl: "https://t.me/MovieGo_HD_bot?start=adult",
    livetvChannelUrl: "https://t.me/MovieGo_HD_bot?start=livetv",
    rotationHours: 1, // 1-hourly ad rotation
    categories: ["All", "Movie", "Bachelor Point", "Bangla", "Hindi", "Animation"],
    allowedTelegramUsernames: "@foysal_537, @bio_matrixs, @TRADER_TAMIM_3"
  };

  const defaultMovies: Movie[] = [];

  if (!fs.existsSync(DB_PATH)) {
    const defaultDb: DbSchema = {
      movies: [],
      settings: defaultSettings,
    };
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf8");
      console.log("Database initialized with empty movies list.");
    } catch (err: any) {
      console.warn("Could not write initial default database to disk (filesystem read-only?):", err.message || err);
    }
  }
}

function getFirebaseConfig() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let fileConfig: any = {};
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf8");
      fileConfig = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse firebase-applet-config.json:", e);
    }
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || fileConfig.projectId || "win333-c2cee";
  const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || fileConfig.firestoreDatabaseId || "(default)";

  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || fileConfig.apiKey || "";

  return {
    projectId,
    databaseId,
    apiKey
  };
}

// Global flag to track if admin was initialized
let isAdminInitialized = false;
function initFirestore() {
  const config = getFirebaseConfig();
  
  if (getApps().length === 0) {
    try {
      initializeApp({
        projectId: config.projectId,
      });
      console.log(`Firebase Admin initialized for Firestore project: ${config.projectId}`);
    } catch (err: any) {
      console.error("Firebase Admin initialization failed:", err);
    }
  }
  
  const app = getApp();
  // If a specific database ID other than (default) is needed, pass it here
  if (config.databaseId && config.databaseId !== "(default)") {
    return getFirestore(app, config.databaseId);
  }
  return getFirestore(app);
}

async function syncFromFirestore() {
  try {
    const config = getFirebaseConfig();
    if (!config.apiKey && !process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log("Firestore sync skipped: No configuration found.");
      return;
    }

    console.log("Synchronizing data from Cloud Firestore...");
    const db = initFirestore();
    const doc = await db.collection("app_data").doc("main_db").get();
    
    if (doc.exists) {
      const remoteData = doc.data() as DbSchema;
      if (remoteData && Array.isArray(remoteData.movies)) {
        const localData = readDb();
        const remoteLastUpdated = remoteData.lastUpdated || 0;
        const localLastUpdated = localData.lastUpdated || 0;

        // If remote is strictly newer, or local is empty but remote has data
        if (remoteLastUpdated > localLastUpdated || (localData.movies.length === 0 && remoteData.movies.length > 0)) {
          console.log(`Updating local database from Firestore (Remote: ${remoteData.movies.length} movies)`);
          globalCachedDb = remoteData;
          try {
            if (!fs.existsSync(path.dirname(DB_PATH))) {
              fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
            }
            fs.writeFileSync(DB_PATH, JSON.stringify(remoteData, null, 2), "utf8");
          } catch (we) {}
        } else if (localLastUpdated > remoteLastUpdated && localData.movies.length > 0) {
          // Local is newer, push to Firestore
          console.log("Local database is newer. Syncing UP to Firestore...");
          syncToFirestore(localData).catch(() => {});
        }
      }
    } else {
      console.log("No remote database document found. Uploading current local state...");
      const currentLocal = readDb();
      syncToFirestore(currentLocal).catch(() => {});
    }
    lastFirestoreSyncTime = Date.now();
  } catch (err: any) {
    console.warn("Cloud Firestore sync failed:", err.message);
  }
}

async function syncToFirestore(data: DbSchema) {
  try {
    const config = getFirebaseConfig();
    if (!config.apiKey && !process.env.FIREBASE_SERVICE_ACCOUNT) return;

    console.log("Backing up database to Cloud Firestore Admin API...");
    const db = initFirestore();
    // Ensure we include a timestamp if missing
    if (!data.lastUpdated) data.lastUpdated = Date.now();
    await db.collection("app_data").doc("main_db").set(data);
    console.log("Successfully backed up database to Cloud Firestore Admin!");
    lastFirestoreSyncTime = Date.now();
  } catch (err: any) {
    console.warn("Failed to back up to Firestore Admin:", err.message);
  }
}

// In-memory runtime cache to prevent lost data during transient disk errors or scaling re-reads
let globalCachedDb: DbSchema | null = null;
let lastFirestoreSyncTime = 0;

async function ensureFreshData() {
  const now = Date.now();
  // Check every 30 seconds if we need to pull
  if (now - lastFirestoreSyncTime > 30000) {
    lastFirestoreSyncTime = now;
    try {
      await syncFromFirestore();
    } catch (err: any) {
      console.warn("Background fresh data check failed:", err.message);
    }
  }
}

// Read database
function readDb(): DbSchema {
  if (globalCachedDb) {
    return globalCachedDb;
  }
  try {
    initDb();
    if (!fs.existsSync(DB_PATH)) {
      throw new Error("DB file missing");
    }
    const content = fs.readFileSync(DB_PATH, "utf8").trim();
    if (!content) {
      throw new Error("DB file empty");
    }
    const parsed = JSON.parse(content);
    if (!parsed || !Array.isArray(parsed.movies)) {
      throw new Error("Invalid DB structure");
    }
    globalCachedDb = parsed;
    return parsed;
  } catch (error) {
    console.error("Error reading database:", error);
    
    if (globalCachedDb) return globalCachedDb;

    // Last resort default object ONLY if no disk and no cache
    const defaultSettings: AppSettings = {
      defaultTimerSeconds: 10,
      telegramBotUrl: "https://t.me/MovieGo_HD_bot",
      facebookGroupUrl: "https://facebook.com/groups/movieelink",
      mainChannelUrl: "https://t.me/MovieGo_HD_bot?start=channel",
      chatGroupUrl: "https://t.me/MovieGo_HD_bot?start=chat",
      adultChannelUrl: "https://t.me/MovieGo_HD_bot?start=adult",
      livetvChannelUrl: "https://t.me/MovieGo_HD_bot?start=livetv",
      rotationHours: 1,
      categories: ["All", "Movie", "Bachelor Point", "Bangla", "Hindi", "Animation"],
      allowedTelegramUsernames: "@foysal_537, @bio_matrixs, @TRADER_TAMIM_3"
    };
    return { movies: [], settings: defaultSettings };
  }
}

// Write database
function writeDb(data: DbSchema) {
  data.lastUpdated = Date.now();
  globalCachedDb = data;
  lastFirestoreSyncTime = Date.now();
  
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Atomic-like write
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempPath, DB_PATH);
    
    console.log("Database saved to disk.");
    syncToFirestore(data).catch(() => {});
  } catch (error: any) {
    console.error("Error writing database:", error.message);
  }
}

export const app = express();

// Initialize database & sync from Firestore
initDb();
syncFromFirestore();

app.use(express.json());

// Prevent caching for all API endpoints (especially for Telegram Micro-app Webviews)
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// API Route - Get all movies
app.get("/api/movies", async (req, res) => {
  await ensureFreshData();
  const db = readDb();
  res.json(db.movies);
});

// API Route - Get single movie
app.get("/api/movies/:id", async (req, res) => {
  await ensureFreshData();
  const db = readDb();
  const movie = db.movies.find((m) => m.id === req.params.id);
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ error: "Movie not found" });
  }
});

// Helper to normalize ad slots
function normalizeAdSlots(adSlots: any): string[] {
  if (!Array.isArray(adSlots)) {
    return Array(10).fill("https://t.me/MovieGo_HD_bot");
  }
  const filtered = adSlots.map(s => typeof s === 'string' ? s.trim() : "").filter(Boolean);
  if (filtered.length === 0) {
    return Array(10).fill("https://t.me/MovieGo_HD_bot");
  }
  const finalSlots: string[] = [];
  for (let i = 0; i < 10; i++) {
    finalSlots.push(filtered[i % filtered.length]);
  }
  return finalSlots;
}

// API Route - Add movie (secured by admin validation on frontend or token)
app.post("/api/movies", async (req, res) => {
  await ensureFreshData();
  const db = readDb();
  const newMovie: Movie = {
    id: "movie_" + Date.now().toString(),
    title: req.body.title || "Untitled Movie",
    banglaTitle: req.body.banglaTitle || "",
    category: req.body.category || "All",
    rating: req.body.rating || "7.0",
    releaseDate: req.body.releaseDate || new Date().toLocaleDateString(),
    imageUrl: req.body.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800",
    teaserImageUrl: req.body.teaserImageUrl || "",
    downloadUrl: req.body.downloadUrl || "https://t.me/MovieGo_HD_bot",
    isBanner: !!req.body.isBanner,
    isUpcoming: !!req.body.isUpcoming,
    status: req.body.status || "Released",
    initials: req.body.initials || "FA",
    timerSeconds: req.body.timerSeconds ? Number(req.body.timerSeconds) : undefined,
    adSlots: normalizeAdSlots(req.body.adSlots)
  };

  db.movies.push(newMovie);
  writeDb(db);
  res.status(201).json(newMovie);
});

// API Route - Update movie
app.put("/api/movies/:id", async (req, res) => {
  await ensureFreshData();
  const db = readDb();
  const index = db.movies.findIndex((m) => m.id === req.params.id);
  if (index !== -1) {
    const bodyCopy = { ...req.body };
    if (bodyCopy.adSlots) {
      bodyCopy.adSlots = normalizeAdSlots(bodyCopy.adSlots);
    }
    const updatedMovie = {
      ...db.movies[index],
      ...bodyCopy,
      // Keep same ID
      id: req.params.id
    };
    db.movies[index] = updatedMovie;
    writeDb(db);
    res.json(updatedMovie);
  } else {
    res.status(404).json({ error: "Movie not found" });
  }
});

// API Route - Delete movie
app.delete("/api/movies/:id", async (req, res) => {
  await ensureFreshData();
  const db = readDb();
  const initialLength = db.movies.length;
  db.movies = db.movies.filter((m) => m.id !== req.params.id);
  if (db.movies.length < initialLength) {
    writeDb(db);
    res.json({ success: true, message: "Movie deleted" });
  } else {
    res.status(404).json({ error: "Movie not found" });
  }
});

// API Route - Fetch settings
app.get("/api/settings", async (req, res) => {
  await ensureFreshData();
  const db = readDb();
  res.json(db.settings);
});

// API Route - Update settings
app.post("/api/settings", async (req, res) => {
  try {
    const requestBody = req.body || {};
    console.log("POST /api/settings received body:", JSON.stringify(requestBody));
    
    await ensureFreshData();
    const db = readDb();
    if (!db) {
      throw new Error("Local database file read returned null or corrupt data.");
    }
    
    // Safety fallback in case db.settings is missing or corrupted
    const currentSettings = db.settings || {
      defaultTimerSeconds: 10,
      telegramBotUrl: "",
      facebookGroupUrl: "",
      mainChannelUrl: "",
      chatGroupUrl: "",
      adultChannelUrl: "",
      livetvChannelUrl: "",
      rotationHours: 1,
      categories: ["All"],
      allowedTelegramUsernames: ""
    };
    
    db.settings = {
      ...currentSettings,
      ...requestBody
    };
    
    writeDb(db);
    res.json(db.settings);
  } catch (err: any) {
    console.error("CRITICAL ERROR inside POST /api/settings:", err);
    res.status(500).json({
      error: err.message || "Unknown server error",
      stack: err.stack
    });
  }
});

// API Route - Fetch active Firebase config
app.get("/api/firebase-config", (req, res) => {
  res.json(getFirebaseConfig());
});

// API Route - Admin Login Validation
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  
  // Hardcoded backup check for legacy credentials
  if (email === "foysal0@gmail.com" && password === "mehedi123@") {
    return res.json({ success: true, token: "admin_verified_secure_session_token" });
  }

  // Dynamic server-side verification using Firebase Auth REST API
  try {
    const firebaseApiKey = getFirebaseConfig().apiKey;
    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      }
    );

    const data = await firebaseResponse.json();

    if (firebaseResponse.ok && data.localId) {
      return res.json({ success: true, token: "admin_verified_secure_session_token" });
    } else {
      const errMsg = data.error?.message || "INVALID_LOGIN_CREDENTIALS";
      let localizedError = "ভুল ইমেল বা পাসওয়ার্ড!";
      if (errMsg === "EMAIL_NOT_FOUND" || errMsg === "INVALID_PASSWORD" || errMsg === "INVALID_LOGIN_CREDENTIALS") {
        localizedError = "ভুল ইমেল বা পাসওয়ার্ড!";
      } else if (errMsg === "USER_DISABLED") {
        localizedError = "এই ব্যবহারকারী অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।";
      } else if (errMsg === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        localizedError = "অতিরিক্ত ভুল প্রচেষ্টার কারণে অ্যাকাউন্টটি সাময়িকভাবে লক করা হয়েছে। পরে চেষ্টা করুন।";
      }
      return res.status(401).json({ success: false, error: localizedError });
    }
  } catch (error) {
    console.error("Server-side Firebase Auth REST verification failed:", error);
    return res.status(500).json({ success: false, error: "সার্ভার যোগাযোগ সমস্যা! অনুগ্রহ করে আবার চেষ্টা করুন।" });
  }
});

// API Route - Get current rotating ad slot URL from setting
app.get("/api/rotating-ad-index", (req, res) => {
  const db = readDb();
  const rotationHours = db.settings.rotationHours || 1;
  
  // Rotate every 3 hours (or hourly, or dynamically configured)
  const nowMs = Date.now();
  const hoursSinceEpoch = Math.floor(nowMs / (3600 * 1000));
  const activeSlot = Math.floor(hoursSinceEpoch / rotationHours) % 10;
  
  res.json({
    activeSlotIndex: activeSlot,
    nextRotationMinutesLeft: Math.ceil(((rotationHours * 3600 * 1000) - (nowMs % (rotationHours * 3600 * 1000))) / 60000)
  });
});

async function startServer() {

  // Load initial dataset from Firestore immediately on boot
  syncFromFirestore().then(() => {
    // One-time cleanup for default seeded movies from previous versions
    if (globalCachedDb && globalCachedDb.movies) {
      const originalCount = globalCachedDb.movies.length;
      const legacyTitles = ["Rockstar 2026 Movie HD", "SOLDIER 2026 Shakib Khan Movie", "Soptodingar Guptodhon"];
      
      globalCachedDb.movies = globalCachedDb.movies.filter(m => {
        const isLegacyId = m.id.startsWith("m") && !m.id.startsWith("movie_");
        const isLegacyTitle = legacyTitles.includes(m.title);
        return !(isLegacyId || isLegacyTitle);
      });

      if (globalCachedDb.movies.length !== originalCount) {
        console.log(`Detected legacy default movies. Removed ${originalCount - globalCachedDb.movies.length} example entries to ensure a fresh start.`);
        writeDb(globalCachedDb);
        syncToFirestore(globalCachedDb).catch(console.error);
      }
    }
  }).catch(e => console.error("Initial Firestore sync failed:", e));

  // Handle Vite development middleware / production static build
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server loaded to run on host 0.0.0.0, routing live traffic on port ${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}
