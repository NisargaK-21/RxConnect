"use client";

import { useEffect, useState } from "react";

let toastIdCounter = 0;
let listeners = [];
let toasts = [];

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message, options = {}) {
  const id = ++toastIdCounter;
  const newToast = {
    id,
    message,
    variant: options.variant || "default",
    duration: options.duration ?? 4000,
    title: options.title,
  };
  toasts = [...toasts, newToast];
  notify();

  if (newToast.duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, newToast.duration);
  }

  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function useToasts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const listener = (state) => setItems(state);
    listeners.push(listener);
    setItems([...toasts]);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return items;
}

export default function ToastContainer() {
  const items = useToasts();

  const variantConfig = {
    default: {
      bg: "bg-white",
      border: "border-slate-200",
      icon: (
        <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      ),
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="checkmark-svg" />
          </svg>
        </div>
      ),
    },
    error: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      icon: (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
          <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      ),
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      ),
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
      ),
    },
  };

  const titleColors = {
    default: "text-slate-800",
    success: "text-emerald-800",
    error: "text-rose-800",
    warning: "text-amber-800",
    info: "text-blue-800",
  };

  const messageColors = {
    default: "text-slate-600",
    success: "text-emerald-700",
    error: "text-rose-700",
    warning: "text-amber-700",
    info: "text-blue-700",
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {items.map((t, index) => {
        const cfg = variantConfig[t.variant] || variantConfig.default;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto animate-toast-in ${cfg.bg} ${cfg.border} border rounded-2xl shadow-xl shadow-slate-900/10 backdrop-blur-sm overflow-hidden`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-start gap-3 p-4 pr-3">
              <div className="shrink-0 mt-0.5">
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                {t.title && (
                  <h4 className={`text-sm font-bold leading-tight ${titleColors[t.variant] || titleColors.default} mb-1`}>
                    {t.title}
                  </h4>
                )}
                <p className={`text-sm leading-relaxed ${messageColors[t.variant] || messageColors.default}`}>
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors btn-press focus-ring"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="h-1 bg-black/5">
              <div
                className={`h-full ${
                  t.variant === "success"
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                    : t.variant === "error"
                    ? "bg-gradient-to-r from-rose-400 to-rose-600"
                    : t.variant === "warning"
                    ? "bg-gradient-to-r from-amber-400 to-amber-600"
                    : t.variant === "info"
                    ? "bg-gradient-to-r from-blue-400 to-blue-600"
                    : "bg-gradient-to-r from-slate-400 to-slate-600"
                } progress-bar`}
                style={
                  {
                    "--progress-width": "100%",
                    animationDuration: `${t.duration || 4000}ms`,
                  }
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
