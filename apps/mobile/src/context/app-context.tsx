import type { Role } from "@aahaarloop/shared";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { env } from "@/config/env";
import { ClaimRepository, DonationRepository, openAppDatabase, type LocalClaim, type LocalDonation } from "@/data";
import type { ApiDonation, MobileAuthResult } from "@/lib/api";
import { flushOfflineRequests, getQueueCounts, registerPushToken, getMobileAuthToken } from "@/lib/api";
import { AccessibilityInfo } from "react-native";

interface AppContextValue {
  role: Role;
  setRole: (role: Role) => void;
  activeOrganizationId: string;
  setActiveOrganizationId: (id: string) => void;
  isOnline: boolean;
  pendingCount: number;
  cachedDonations: ApiDonation[];
  cachedUser: { id: string; role: Role; activeOrganizationId: string } | null;
  cacheDonations: (donations: ApiDonation[]) => Promise<void>;
  refreshOffline: () => Promise<void>;
  getMobileAuthToken: () => Promise<MobileAuthResult>;
  claims: Array<{ id: string; donationId: string; servings: number; status: string }>;
  addClaim: (claim: { id: string; donationId: string; servings: number; status: string }) => void;
  registerPushToken: (token: string) => Promise<{ success: boolean }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<Role>("recipient");
  const [activeOrganizationId, setActiveOrganizationId] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [cachedDonations, setCachedDonations] = useState<ApiDonation[]>([]);
  const [cachedUser, setCachedUser] = useState<{ id: string; role: Role; activeOrganizationId: string } | null>(null);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const [mobileAuthToken, setMobileAuthToken] = useState<string | null>(null);

  const loadLocalData = useCallback(async () => {
    try {
      const db = await openAppDatabase();
      const [donations, localClaims] = await Promise.all([
        new DonationRepository(db).list(),
        new ClaimRepository(db).list().catch(() => [] as LocalClaim[]),
      ]);
      setCachedDonations(donations.map(toApiDonation));
      setClaims(localClaims.map((claim) => ({ id: claim.id, donationId: claim.donationId, servings: claim.quantity, status: claim.status })));
    } catch {
      // The app can still use the network when local storage is unavailable.
    }
  }, []);

  const cacheDonations = useCallback(async (donations: ApiDonation[]) => {
    try {
      const db = await openAppDatabase();
      const repository = new DonationRepository(db);
      await Promise.all(donations.map((donation) => repository.upsert(toLocalDonation(donation))));
      setCachedDonations(donations);
    } catch {
      // Cache failure must never hide a successful network response.
    }
  }, []);

  const refreshOffline = useCallback(async () => {
    await loadLocalData();
    try {
      await fetch(env.apiUrl, { method: "HEAD" });
      setIsOnline(true);
      await flushOfflineRequests();
    } catch {
      setIsOnline(false);
    }
    try {
      const counts = await getQueueCounts();
      setPendingCount(counts.pending + counts.in_progress + counts.failed);
    } catch {
      // SQLite is unavailable only during an unusual first-launch failure.
    }
  }, [loadLocalData]);

  useEffect(() => {
    void (async () => {
      try {
        const [storedRole, storedOrganization] = await Promise.all([
          SecureStore.getItemAsync("aahaarloop.role"),
          SecureStore.getItemAsync("aahaarloop.organization"),
        ]);
        if (storedRole === "donor" || storedRole === "recipient" || storedRole === "volunteer") setRole(storedRole);
        if (storedOrganization) setActiveOrganizationId(storedOrganization);
      } catch {
        // Preferences are optional; the app remains usable without SecureStore.
      } finally {
        setPreferencesHydrated(true);
      }
    })();
    void loadLocalData();
    void refreshOffline();
    // Get mobile auth token for native API calls
    try {
      const authResult = await getMobileAuthToken();
      setMobileAuthToken(authResult.user.id);
      setCachedUser({
        id: authResult.user.id,
        role: authResult.user.role ? (authResult.user.role === "donor" ? "donor" : authResult.user.role === "recipient" ? "recipient" : "volunteer") : "recipient",
        activeOrganizationId: authResult.user.activeOrganizationId || "",
      });
    } catch (err) {
      // Auth token not available yet; the app can still function with offline/local data.
      console.warn("Mobile auth token unavailable:", err);
    }
    const timer = setInterval(() => void refreshOffline(), 30_000);
    return () => clearInterval(timer);
  }, [loadLocalData, getMobileAuthToken]);

  useEffect(() => {
    if (!preferencesHydrated) return;
    void SecureStore.setItemAsync("aahaarloop.role", role);
    void SecureStore.setItemAsync("aahaarloop.organization", activeOrganizationId);
  }, [activeOrganizationId, preferencesHydrated, role]);

  const value = useMemo<AppContextValue>(() => ({
    role,
    setRole,
    activeOrganizationId,
    setActiveOrganizationId,
    isOnline,
    pendingCount,
    cachedDonations,
    cachedUser,
    cacheDonations,
    refreshOffline,
    getMobileAuthToken,
    claims,
    addClaim: (claim) => {
      setClaims((current) => [claim, ...current.filter((item) => item.id !== claim.id)]);
      void persistClaim(claim);
    },
    registerPushToken: async (token: string) => {
      if (!cachedUser?.id) return { success: false, error: "No user signed in" };
      return await registerPushToken(token, cachedUser.role === "donor" ? "ios" : "android");
    },
  }), [activeOrganizationId, cacheDonations, cachedDonations, claims, isOnline, pendingCount, refreshOffline, role, cachedUser]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;