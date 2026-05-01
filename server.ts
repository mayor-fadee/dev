import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };
import jwt from "jsonwebtoken";
import { CENTRAL_AI_CONFIG } from "./aiConfig";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_router_2026";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(firebaseConfig.firestoreDatabaseId);
const auth = admin.auth();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Middleware to verify Firebase ID Token
  const verifyToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    try {
      let decodedUser: any = null;

      // 1. Try Firebase Verification
      try {
        decodedUser = await auth.verifyIdToken(token);
        console.log("DEBUG: Firebase Token Verified for:", decodedUser.email);
      } catch (fbError: any) {
        // 2. Try Manual JWT Verification (Fallback)
        try {
          decodedUser = jwt.verify(token, JWT_SECRET);
          console.log("DEBUG: Custom JWT Verified for:", decodedUser.email);
        } catch (jwtError: any) {
          console.error("DEBUG: Auth Failure (Firebase):", fbError.message);
          console.error("DEBUG: Auth Failure (JWT):", jwtError.message);
          
          // Clear prefix if it was a very long token for logs
          const tokenPreview = token.substring(0, 15) + "...";
          console.error(`DEBUG: Failed Token Preview: ${tokenPreview}`);
          
          return res.status(401).json({ 
            error: "Invalid token", 
            details: {
              firebase: fbError.code || fbError.message,
              jwt: jwtError.message
            }
          });
        }
      }

      req.user = decodedUser;

      // Safe Auto-promotion logic (Don't let DB errors trigger 401)
      try {
        if (req.user.email === "projects.fadi497@gmail.com") {
          const uid = req.user.uid;
          const userRef = db.collection("users").doc(uid);
          const userDoc = await userRef.get();
          
          if (!userDoc.exists || (userDoc.data()?.plan !== "admin" && userDoc.data()?.role !== "admin")) {
            console.log("DEBUG: Auto-promoting lead user to admin in DB...");
            await userRef.set({
              email: req.user.email,
              plan: "admin",
              role: "admin",
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            await db.collection("admins").doc(uid).set({
              email: req.user.email,
              promotedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      } catch (promoError: any) {
        console.error("DEBUG: Promotion logic error (non-fatal):", promoError.message);
        // We don't return 401 here because the user IS authenticated, just the promotion failed
      }

      next();
    } catch (unexpectedError: any) {
      console.error("DEBUG: Unexpected error in verifyToken:", unexpectedError);
      res.status(500).json({ error: "Internal server error during authentication" });
    }
  };

  // Middleware to check for Admin role
  const verifyAdmin = async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      if (userData?.plan === "admin" || userData?.role === "admin") {
        next();
      } else {
        res.status(403).json({ error: "Forbidden: Admin access required" });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error checking admin status" });
    }
  };

  // --- USER SYNC & PROMOTION ---
  app.get("/api/user/sync", verifyToken, async (req: any, res) => {
    try {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data() || {};
      
      // Issue a manual JWT if they are an admin (for extra security layer/user request)
      let adminToken = null;
      if (userData.plan === "admin" || userData.role === "admin" || req.user.email === "projects.fadi497@gmail.com") {
        adminToken = jwt.sign({ 
          uid: req.user.uid, 
          email: req.user.email, 
          role: "admin" 
        }, JWT_SECRET, { expiresIn: "7d" });
        console.log("DEBUG: Generated 7d Admin Token for:", req.user.email);
      }

      res.json({ ...userData, adminToken });
    } catch (error) {
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // --- AI ROUTING ENGINE (HIDDEN LOGIC) ---
  app.post("/api/ai/generate", verifyToken, async (req: any, res) => {
    const { feature, prompt: userPrompt, config, metadata } = req.body;
    
    // Logic is hardcoded here so frontend users cannot influence model choice
    const routerConfig = CENTRAL_AI_CONFIG[feature as keyof typeof CENTRAL_AI_CONFIG];

    if (!routerConfig) {
      return res.status(400).json({ error: "Invalid task type or feature" });
    }

    try {
      // 1. CHECK USAGE LIMITS
      const userRef = db.collection("users").doc(req.user.uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data() || {};
      const isPremium = userData.plan === "pro" || userData.plan === "admin" || userData.plan === "premium";

      if (!isPremium) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const usageSnap = await db.collection("usage_logs")
          .where("userId", "==", req.user.uid)
          .where("feature", "==", feature)
          .where("timestamp", ">=", today)
          .get();

        if (usageSnap.size >= 3) {
          return res.status(403).json({ 
            error: "Daily limit reached", 
            message: "Free users are limited to 3 generations per day. Upgrade to Pro for unlimited access." 
          });
        }
      }

      // 2. CONSTRUCT SYSTEM PROMPT
      let finalPrompt = userPrompt;
      if (feature === "bot-generator") {
        const { botName, botType, description } = metadata || {};
        finalPrompt = `ACT AS A SENIOR PYTHON DEVELOPER.
Generate a COMPLETE, ready-to-run Telegram bot in Python using search for 'pyTelegramBotAPI'.

Bot Name: ${botName || "MyBot"}
Bot Type: ${botType}
Description: ${description}

Strict Output Requirements:
1. Return ONLY the python code.
2. Include /start, /help, and a main keyword handler.
3. Use environment variables for the token (os.getenv('TELEGRAM_TOKEN')).
4. Add robust error handling.
5. If type is 'AI chat', include a mocked 'get_ai_response' function.
6. If type is 'menu', use InlineKeyboardMarkup.

CODE:`;
      }

      // 3. EXECUTE GEMINI API CALL (REST)
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${routerConfig.model}:generateContent?key=${apiKey}`;
      
      const apiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: config || { responseMimeType: "text/plain" }
        })
      });

      const data: any = await apiResponse.json();
      console.log("FULL GEMINI RESPONSE:", JSON.stringify(data, null, 2));

      if (!data.candidates || data.candidates.length === 0) {
        console.error("No candidates returned from Gemini");
        return res.status(500).json({ error: "AI Error: No response generated" });
      }

      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) throw new Error("Empty response from AI (No text found in parts)");
      
      // PERSISTENT USAGE LOGGING
      await db.collection("usage_logs").add({
        userId: req.user.uid,
        feature,
        model_used: routerConfig.model,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        prompt_preview: userPrompt.substring(0, 100) + "..."
      });

      res.json({ result: responseText });
    } catch (error: any) {
      console.error("Central Router Error:", error);
      res.status(500).json({ error: "AI Engine Failure", details: error.message });
    }
  });

  // --- ADMIN PANEL API ---
  app.get("/api/admin/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const usersSnap = await db.collection("users").get();
      const projectsSnap = await db.collection("projects").get();
      const logsSnap = await db.collection("usage_logs").get();
      
      res.json({
        totalUsers: usersSnap.size,
        totalProjects: projectsSnap.size,
        totalRequests: logsSnap.size,
        revenue: usersSnap.docs.filter(d => d.data().plan === "premium").length * 2.99
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // --- REPLACED: ADMIN PANEL API (READ-ONLY AI VIEW) ---
  app.get("/api/admin/ai-models", verifyToken, verifyAdmin, async (req, res) => {
    // Return the hardcoded backend config to the admin (Monitoring only)
    res.json(Object.entries(CENTRAL_AI_CONFIG).map(([id, cfg]) => ({ id, ...cfg })));
  });

  // API Proxy for API Tester to avoid CORS
  app.all("/api/proxy", async (req, res) => {
    const { url, method, headers, body } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: method || "GET",
        headers: headers || {},
        body: method !== "GET" && body ? JSON.stringify(body) : undefined,
      });
      const endTime = Date.now();
      
      const responseBody = await response.text();
      let json;
      try {
        json = JSON.parse(responseBody);
      } catch (e) {
        json = responseBody;
      }

      res.json({
        status: response.status,
        statusText: response.statusText,
        data: json,
        headers: Object.fromEntries(response.headers.entries()),
        responseTime: endTime - startTime,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch",
        status: 500,
      });
    }
  });

  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
