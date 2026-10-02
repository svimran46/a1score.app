"use client";

import { useState, useEffect, useCallback } from "react";
import { watchlistAdapter } from "@/lib/watchlist/storage";
import { DEFAULT_VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "./vapid";

const LOCAL_PREF_KEY = "a1score_push_pref_v1";

export function useNotifications() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threshold, setThresholdState] = useState<number>(0.05); // Default ±5%
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Initialize environment and check existing push subscription
  useEffect(() => {
    setIsMounted(true);

    if (typeof window === "undefined") return;

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Detect PWA Standalone Mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Check Push & Notification API Support
    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);

    if (!supported) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);

    // Read stored threshold preference
    try {
      const storedPref = localStorage.getItem(LOCAL_PREF_KEY);
      if (storedPref) {
        const parsed = JSON.parse(storedPref);
        if (typeof parsed.threshold === "number") {
          setThresholdState(parsed.threshold);
        }
      }
    } catch {}

    // Check active service worker push subscription
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setIsSubscribed(!!sub);
      })
      .catch((err) => {
        console.warn("[Notifications] Error reading PushSubscription:", err);
      });
  }, []);

  const needsInstallForPush = isIOS && !isStandalone;

  // Sync followed player IDs with subscription
  const syncFollowedPlayers = useCallback(
    async (customThreshold?: number) => {
      if (!isSupported || typeof window === "undefined") return;

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return;

        const followedPlayerIds = watchlistAdapter
          .getFavorites()
          .filter((f) => f.type === "player")
          .map((p) => p.id);

        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            followedPlayerIds,
            threshold: customThreshold !== undefined ? customThreshold : threshold,
          }),
        });
      } catch (err) {
        console.warn("[Notifications] Error syncing followed players:", err);
      }
    },
    [isSupported, threshold]
  );

  // Subscribe to Web Push
  const subscribe = useCallback(
    async (customThreshold?: number): Promise<boolean> => {
      if (!isSupported || typeof window === "undefined") return false;

      // On iOS in regular Safari, web push is unsupported without installation
      if (needsInstallForPush) {
        setShowInstallGuide(true);
        return false;
      }

      setIsLoading(true);

      try {
        // Request Notification permission
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== "granted") {
          setIsLoading(false);
          return false;
        }

        const reg = await navigator.serviceWorker.ready;

        const applicationServerKey = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource,
        });

        const activeThreshold = customThreshold !== undefined ? customThreshold : threshold;

        // Gather followed player IDs
        const followedPlayerIds = watchlistAdapter
          .getFavorites()
          .filter((f) => f.type === "player")
          .map((p) => p.id);

        // Store subscription on server (anonymous)
        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            followedPlayerIds,
            threshold: activeThreshold,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        setIsSubscribed(true);
        try {
          localStorage.setItem(
            LOCAL_PREF_KEY,
            JSON.stringify({ threshold: activeThreshold, subscribed: true })
          );
        } catch {}

        setIsLoading(false);
        return true;
      } catch (err) {
        console.error("[Notifications] Subscription failed:", err);
        setIsLoading(false);
        return false;
      }
    },
    [isSupported, needsInstallForPush, threshold]
  );

  // Unsubscribe from Web Push
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || typeof window === "undefined") return false;

    setIsLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        // Delete from server store
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      setIsSubscribed(false);
      try {
        localStorage.removeItem(LOCAL_PREF_KEY);
      } catch {}

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("[Notifications] Unsubscribe error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  // Set user's chosen threshold (±3%, ±5%, ±10%)
  const setThreshold = useCallback(
    (newThreshold: number) => {
      setThresholdState(newThreshold);
      try {
        localStorage.setItem(
          LOCAL_PREF_KEY,
          JSON.stringify({ threshold: newThreshold, subscribed: isSubscribed })
        );
      } catch {}

      if (isSubscribed) {
        syncFollowedPlayers(newThreshold);
      }
    },
    [isSubscribed, syncFollowedPlayers]
  );

  // Trigger test notification
  const sendTestNotification = useCallback(
    async (multiple = false): Promise<boolean> => {
      if (!isSubscribed) return false;

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return false;

        const res = await fetch("/api/notifications/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            multiple,
          }),
        });
        return res.ok;
      } catch (err) {
        console.error("[Notifications] Test notification failed:", err);
        return false;
      }
    },
    [isSubscribed]
  );

  return {
    isMounted,
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    threshold,
    setThreshold,
    subscribe,
    unsubscribe,
    sendTestNotification,
    syncFollowedPlayers,
    isIOS,
    isStandalone,
    needsInstallForPush,
    showInstallGuide,
    setShowInstallGuide,
  };
}
