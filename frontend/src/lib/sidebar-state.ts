"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "lsr_sidebar_open";

let isOpen = true;

// Initialize on client side from localStorage if available
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      isOpen = saved === "true";
    }
  } catch {
    // Ignore storage errors
  }
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  });
}

export function getSidebarOpen(): boolean {
  return isOpen;
}

export function setSidebarOpen(open: boolean) {
  if (isOpen === open) return;
  isOpen = open;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      // Ignore storage errors
    }
  }
  notify();
}

export function toggleSidebar() {
  setSidebarOpen(!isOpen);
}

export function useSidebarOpen(): boolean {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => isOpen,
    () => true // SSR default snapshot
  );
}

