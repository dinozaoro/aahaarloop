import type { Role } from "@aahaarloop/shared";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { env } from "@/config/env";
import { ClaimRepository, DonationRepository, openAppDatabase, type LocalClaim, type LocalDonation } from "@/data";
import type { ApiClaim, ApiDonation, MobileAuthResult } from "@/lib/api";
import { apiFetch, registerPushToken, getMobileAuthToken } from "@/lib/api";
import { flushOfflineRequests, getQueueCounts } from "@/lib/offline";
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
  authReady: boolean;
  hasSession: boolean;
  completeSignIn: (cookie: string) => Promise<void>;
  signOut: () => Promise<void>;
  claims: Array<{ id: string; donationId: string; servings: number; status: string }>;
  addClaim: (claim: { id: string; donationId: string; servings: number; status: string }) => void;
  refreshClaims: () => Promise<void>;
  registerPushToken: (token: string) => Promise<{ success: boolean }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<Role>("recipient");
  const [activeOrganizationId, setActiveOrganizationId] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [cachedDonations, setCachedDonations] = useState<ApiDonation[]>([]);
  const [claims, setClaims] = useState<AppContextValue["claims"]>([]);
  const [cachedUser, setCachedUser] = useState<{ id: string; role: Role; activeOrganizationId: string } | null>(null);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<string | null>(null);

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

  const refreshClaims = useCallback(async () => {
    try {
      const { claims: remote } = await apiFetch<{ claims: ApiClaim[] }>("/api/claims");
      const synced = remote.map((claim) => ({
        id: claim.id,
        donationId: claim.donationId,
        servings: claim.servings,
        status: claim.status,
      }));
      setClaims(synced);
      await Promise.all(synced.map(persistClaim));
    } catch {
      // Cached claims stay visible when the API is unavailable.
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
        const [storedRole, storedOrganization, storedSession] = await Promise.all([
          SecureStore.getItemAsync("aahaarloop.role"),
          SecureStore.getItemAsync("aahaarloop.organization"),
          SecureStore.getItemAsync("aahaarloop.session"),
        ]);
        if (storedRole === "donor" || storedRole === "recipient" || storedRole === "volunteer") setRole(storedRole);
        if (storedOrganization) setActiveOrganizationId(storedOrganization);
        setSessionCookie(storedSession ?? null);
        setSession(storedSession ?? null);
      } catch {
        // Preferences are optional; the app remains usable without SecureStore.
      } finally {
        setPreferencesHydrated(true);
        setAuthReady(true);
      }
    })();
    void loadLocalData();
    void refreshClaims();
    void refreshOffline();
    const timer = setInterval(() => void refreshOffline(), 30_000);
    return () => clearInterval(timer);
  }, [loadLocalData, refreshOffline]);

  useEffect(() => {
    if (!session) {
      setCachedUser(null);
      return;
    }
    void (async () => {
      try {
        const authResult = await getMobileAuthToken();
        const userRole = authResult.user.role;
        const roleFromServer = userRole === "donor" || userRole === "recipient" || userRole === "volunteer" ? userRole : null;
        if (roleFromServer) setRole(roleFromServer);
        if (authResult.user.activeOrganizationId) setActiveOrganizationId(authResult.user.activeOrganizationId);
        setCachedUser({
          id: authResult.user.id,
          role: roleFromServer ?? "recipient",
          activeOrganizationId: authResult.user.activeOrganizationId ?? "",
        });
      } catch (err) {
        console.warn("Mobile session unavailable:", err);
      }
    })();
    const timer = setInterval(() => void refreshOffline(), 30_000);
    return () => clearInterval(timer);
  }, [loadLocalData, refreshClaims, getMobileAuthToken]);

  useEffect(() => {
    if (!preferencesHydrated) return;
    void SecureStore.setItemAsync("aahaarloop.role", role);
    void SecureStore.setItemAsync("aahaarloop.organization", activeOrganizationId);
  }, [activeOrganizationId, preferencesHydrated, role]);

  const completeSignIn = useCallback(async (cookie: string) => {
    await SecureStore.setItemAsync("aahaarloop.session", cookie);
    setSessionCookie(cookie);
    setSession(cookie);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("aahaarloop.session");
    } catch {
      // Clearing in-memory state is enough when SecureStore is unavailable.
    }
    setSessionCookie(null);
    setSession(null);
    setCachedUser(null);
  }, []);

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
    authReady,
    hasSession: session !== null,
    completeSignIn,
    signOut,
    claims,
    refreshClaims,
    addClaim: (claim) => {
      setClaims((current) => [claim, ...current.filter((item) => item.id !== claim.id)]);
      void persistClaim(claim);
    },
    registerPushToken: async (token: string) => {
      if (!cachedUser?.id) return { success: false, error: "No user signed in" };
      return await registerPushToken(token, cachedUser.role === "donor" ? "ios" : "android");
    },
  }), [activeOrganizationId, cacheDonations, cachedDonations, claims, isOnline, pendingCount, refreshClaims, refreshOffline, role, cachedUser]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function toApiDonation(donation: LocalDonation): ApiDonation {
  return {
    id: donation.id,
    title: donation.title,
    description: donation.description ?? undefined,
    status: donation.status,
    storage: donation.storage,
    servingsTotal: donation.quantity,
    servingsAvailable: donation.remainingQuantity,
    pickupAddress: donation.address ?? undefined,
    location: donation.latitude != null && donation.longitude != null ? { latitude: donation.latitude, longitude: donation.longitude } : undefined,
    foodExpiryAt: donation.foodExpiryAt ?? undefined,
    bestBeforeAt: donation.bestBeforeAt ?? undefined,
    pickupDeadlineAt: donation.pickupDeadlineAt ?? undefined,
  };
}

function toLocalDonation(donation: ApiDonation): LocalDonation {
  return {
    id: donation.id,
    title: donation.title,
    description: donation.description ?? null,
    status: donation.status as LocalDonation["status"],
    quantity: donation.servingsTotal ?? donation.servingsAvailable ?? 0,
    remainingQuantity: donation.servingsAvailable ?? donation.servingsTotal ?? 0,
    unit: "serving",
    storage: (donation.storage === "chilled" || donation.storage === "frozen" ? donation.storage : "ambient"),
    address: donation.pickupAddress ?? null,
    latitude: donation.location?.latitude ?? null,
    longitude: donation.location?.longitude ?? null,
    foodExpiryAt: donation.foodExpiryAt ?? null,
    bestBeforeAt: donation.bestBeforeAt ?? null,
    pickupDeadlineAt: donation.pickupDeadlineAt ?? null,
    updatedAt: donation.updatedAt ?? new Date().toISOString(),
  };
}

async function persistClaim(claim: { id: string; donationId: string; servings: number; status: string }) {
  try {
    const db = await openAppDatabase();
    await new ClaimRepository(db).upsert({
      id: claim.id,
      donationId: claim.donationId,
      recipientId: "local-session",
      status: claim.status as LocalClaim["status"],
      quantity: claim.servings,
      unit: "serving",
      note: null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // A confirmed server claim remains visible in memory for this session.
  }
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}