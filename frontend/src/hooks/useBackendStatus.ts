"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export type BackendStatus = "connected" | "error" | "checking";

/**
 * Custom hook that polls the backend /health endpoint every 10 seconds.
 */
export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const data = await api.health();
        if (mounted) {
          setStatus("connected");
          setVersion(data.version);
        }
      } catch {
        if (mounted) setStatus("error");
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { status, version };
}
