"use client";

import { useEffect } from "react";

export function CapacitorBridge() {
  useEffect(() => {
    let unlistenBack: (() => void) | undefined;

    async function initCapacitor() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        // Native Status Bar
        try {
          const { StatusBar, Style } = await import("@capacitor/status-bar");
          await StatusBar.setStyle({ style: Style.Dark });
          if (Capacitor.getPlatform() === "android") {
            await StatusBar.setBackgroundColor({ color: "#0a0d12" }); // color-ignore: Native Android status bar API requires hex
          }
        } catch (e) {
          console.warn("[Capacitor] StatusBar init error:", e);
        }

        // Native Splash Screen Hide
        try {
          const { SplashScreen } = await import("@capacitor/splash-screen");
          await SplashScreen.hide();
        } catch (e) {
          console.warn("[Capacitor] SplashScreen init error:", e);
        }

        // Native Android Hardware Back Button Handling
        try {
          const { App } = await import("@capacitor/app");
          const backHandler = await App.addListener("backButton", ({ canGoBack }) => {
            const path = window.location.pathname;
            if (path === "/" || path === "/matches" || !canGoBack) {
              App.exitApp();
            } else {
              window.history.back();
            }
          });
          unlistenBack = () => backHandler.remove();
        } catch (e) {
          console.warn("[Capacitor] BackButton listener error:", e);
        }
      } catch (err) {
        console.warn("[Capacitor] Bridge setup skipped:", err);
      }
    }

    initCapacitor();

    return () => {
      if (unlistenBack) unlistenBack();
    };
  }, []);

  return null;
}
