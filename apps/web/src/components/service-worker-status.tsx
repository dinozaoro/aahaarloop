"use client";

import { useEffect, useRef, useState } from "react";

type WorkerMessage = { type?: string; url?: string };

export function ServiceWorkerStatus() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [stale, setStale] = useState<string[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let reloaded = false;

    function onMessage(event: MessageEvent) {
      const data = event.data as WorkerMessage | null;
      if (data?.type === "NEW_VERSION_AVAILABLE") {
        setUpdateAvailable(true);
      }
      if (data?.type === "STALE_DATA" && data.url) {
        setStale((paths) =>
          paths.includes(data.url!) ? paths : [...paths, data.url!],
        );
      }
    }

    function onControllerChange() {
      if (!reloaded) {
        reloaded = true;
        window.location.reload();
      }
    }

    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      registrationRef.current = registration;
    });

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  if (!updateAvailable && stale.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 rounded-2xl bg-[#063a2a] px-4 py-3 text-sm text-[#fffbed] shadow-lg"
    >
      {updateAvailable ? (
        <div className="flex items-center gap-3">
          <span>A new version is ready.</span>
          <button
            type="button"
            className="rounded-full bg-[#fffbed] px-3 py-1 font-semibold text-[#063a2a]"
            onClick={() =>
              registrationRef.current?.waiting?.postMessage("SKIP_WAITING")
            }
          >
            Update
          </button>
        </div>
      ) : null}
      {stale.length > 0 ? (
        <span>Showing saved data — reconnect to refresh.</span>
      ) : null}
    </div>
  );
}
