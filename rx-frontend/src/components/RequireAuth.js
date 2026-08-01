"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/utils/auth";
import { ICONS } from "@/lib/navigation";

export default function RequireAuth({ children, roles, allowedRoles }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const effectiveRoles = allowedRoles?.length ? allowedRoles : roles;

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (effectiveRoles?.length && !effectiveRoles.includes(user.role)) {
      setUnauthorized(true);
      return;
    }

    setReady(true);
  }, [router, effectiveRoles]);

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-xl shadow-teal-500/25 animate-pulse-soft">
            <span className="w-8 h-8" dangerouslySetInnerHTML={{ __html: ICONS.shield }} />
          </div>
          <div className="text-center">
            <div className="text-base font-semibold text-slate-900">Secure connection</div>
            <p className="text-sm text-slate-500 mt-1">Verifying your credentials…</p>
          </div>
          <div className="h-1.5 w-44 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 animate-progress rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 animate-fade-in-up">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 animate-pulse-soft">
            <span className="w-8 h-8" dangerouslySetInnerHTML={{ __html: ICONS.shield }} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900 tracking-tight">Access restricted</h2>
          <p className="mt-2 text-sm text-slate-500">
            This page requires a role you do not have. Return to the dashboard or contact your administrator.
          </p>
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 btn-press transition focus-ring"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-600 btn-press transition focus-ring"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
