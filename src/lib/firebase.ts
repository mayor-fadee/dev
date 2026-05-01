import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, initializeFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to improve connectivity in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Connectivity Test (Critical Constraint)
async function testConnection() {
  try {
    // Attempt a simple read to check connectivity
    await getDocFromServer(doc(db, "test_connection", "ping"));
  } catch (error) {
    if (error instanceof Error && (error.message.includes("offline") || error.message.includes("unavailable"))) {
      console.warn("Firestore connectivity warning: The client might be in offline mode or backend is unreachable.", error.message);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let token = localStorage.getItem("admin_token");
  let isCustomToken = !!token;
  
  if (!token) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    token = await user.getIdToken();
    console.log("DEBUG: Sending Firebase ID Token");
  } else {
    console.log("DEBUG: Sending cached Admin JWT Token");
  }

  const sendRequest = async (tokenToUse: string) => {
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${tokenToUse}`,
      "Content-Type": "application/json",
    };
    return fetch(url, { ...options, headers });
  };

  let response = await sendRequest(token);

  // If unauthorized while using a custom token, clear it and try once more with Firebase token
  if (response.status === 401 && isCustomToken) {
    console.warn("DEBUG: Admin JWT rejected (401), clearing and retrying with Firebase Token...");
    localStorage.removeItem("admin_token");
    
    const user = auth.currentUser;
    if (user) {
      const newToken = await user.getIdToken(true); // Force refresh
      response = await sendRequest(newToken);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("admin_token");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}
