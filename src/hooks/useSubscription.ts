import { useState, useEffect } from "react";
import { auth, db, handleFirestoreError, OperationType, fetchWithAuth } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

export interface SubscriptionData {
  plan: "free" | "premium" | "admin";
  generationsUsed: number;
  maxGenerations: number;
  canUseSmartMode: boolean;
  canSaveProjects: boolean;
  isAdmin: boolean;
}

const ADMIN_EMAIL = "projects.fadi497@gmail.com";

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!auth.currentUser) return;
    
    try {
      // 1. Trigger server-side sync (handles auto-promotion for specified email and returns JWT)
      try {
        const syncResponse = await fetchWithAuth("/api/user/sync");
        if (syncResponse.adminToken) {
          localStorage.setItem("admin_token", syncResponse.adminToken);
        }
      } catch (e) {
        console.warn("Server sync failed, falling back to cached local data");
      }

      // 2. Fetch data from Firestore (reflects server updates)
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      const isSuperAdminEmail = auth.currentUser.email === ADMIN_EMAIL;
      
      if (!userSnap.exists()) {
        const initialData = {
          userId: auth.currentUser.uid,
          email: auth.currentUser.email,
          plan: isSuperAdminEmail ? "admin" : "free",
          generationCount: 0,
          lastResetDate: serverTimestamp(),
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, initialData);
        setSubscription({
          plan: isSuperAdminEmail ? "admin" : "free",
          generationsUsed: 0,
          maxGenerations: isSuperAdminEmail ? Infinity : 3,
          canUseSmartMode: isSuperAdminEmail,
          canSaveProjects: true,
          isAdmin: isSuperAdminEmail,
        });
      } else {
        const data = userSnap.data();
        const isAdmin = data.plan === "admin" || data.role === "admin" || isSuperAdminEmail;
        
        setSubscription({
          plan: (data.plan as any) || (isSuperAdminEmail ? "admin" : "free"),
          generationsUsed: data.generationCount || 0,
          maxGenerations: isAdmin || data.plan === "premium" ? Infinity : 3,
          canUseSmartMode: isAdmin || data.plan === "premium",
          canSaveProjects: true,
          isAdmin: isAdmin,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [auth.currentUser]);

  const incrementUsage = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        generationCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      fetchSubscription();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
    }
  };

  return { subscription, loading, incrementUsage, refresh: fetchSubscription };
}
