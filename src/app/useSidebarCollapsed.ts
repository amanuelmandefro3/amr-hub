"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "amr-hub:sidebar-collapsed";

export function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    });
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return { isCollapsed, toggle };
}
