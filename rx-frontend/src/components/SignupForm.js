"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "../services/auth.service";
import { toast } from "@/components/Toast";

export default function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const roleOptions = [
    { value: "customer", label: "Customer", desc: "Browse and order medicines" },
    { value: "staff", label: "Staff", desc: "Process orders at branches" },
    { value: "pharmacist", label: "Pharmacist", desc: "Review prescriptions" },
    { value: "delivery", label: "Delivery", desc: "Manage deliveries" },
    { value: "admin", label: "Admin", desc: "Full platform access" },
  ];

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    else if (formData.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Invalid email address";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Password must be at least 6 characters";
    if (!formData.role) e.role = "Please select a role";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await signup(formData);
      toast(data.message || "Account created successfully", {
        variant: "success",
        title: "Welcome to RxConnect!",
      });
      router.push("/login");
    } catch (err) {
      toast(err.response?.data?.message || "Signup failed", {
        variant: "error",
        title: "Could not create account",
      });
      setErrors({
        form: err.response?.data?.message || "Signup failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-300/20 to-teal-300/20 blur-3xl -z-10 animate-pulse-soft" />
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-300/20 to-blue-300/20 blur-3xl -z-10 animate-pulse-soft" />

      <div className="w-full max-w-lg animate-scale-in">
        <Link href="/" className="flex items-center justify-center gap-3 mb-10 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 text-white shadow-xl shadow-teal-500/25 transition-transform group-hover:scale-105">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent text-2xl font-bold tracking-tight">
              RxConnect
            </span>
            <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-1">
              Healthcare Platform
            </span>
          </div>
        </Link>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden animate-fade-in-up stagger-1">
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign up to access the RxConnect platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {errors.form && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 animate-shake">
                <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm text-rose-700 font-medium">{errors.form}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Full name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Dr. John Smith"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-field w-full rounded-2xl border px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus-ring focus:outline-none ${
                    errors.name ? "border-rose-300 focus:ring-rose-500/20" : "border-slate-200"
                  }`}
                  disabled={loading}
                  autoComplete="name"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              {errors.name && (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@pharmacy.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field w-full rounded-2xl border px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus-ring focus:outline-none ${
                    errors.email ? "border-rose-300 focus:ring-rose-500/20" : "border-slate-200"
                  }`}
                  disabled={loading}
                  autoComplete="email"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field w-full rounded-2xl border px-4 py-3 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus-ring focus:outline-none ${
                    errors.password ? "border-rose-300 focus:ring-rose-500/20" : "border-slate-200"
                  }`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                </svg>
                Select your role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {roleOptions.map((role) => {
                  const isSelected = formData.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        setFormData((p) => ({ ...p, role: role.value }));
                        if (errors.role) setErrors((p) => ({ ...p, role: "" }));
                      }}
                      disabled={loading}
                      className={`relative p-3 rounded-2xl border text-left transition-all duration-200 btn-press focus-ring focus:outline-none ${
                        isSelected
                          ? "bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-300 shadow-md shadow-teal-500/10"
                          : "bg-slate-50/50 border-slate-200 hover:border-teal-200 hover:bg-teal-50/30"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center animate-scale-in">
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <span className={`block text-sm font-bold ${isSelected ? "text-teal-700" : "text-slate-700"}`}>
                        {role.label}
                      </span>
                      <span className={`block mt-0.5 text-[10px] leading-tight ${isSelected ? "text-teal-600" : "text-slate-500"}`}>
                        {role.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.role && (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors.role}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:from-teal-700 hover:to-emerald-700 transition-all btn-press focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-teal-600 hover:text-teal-700 transition-colors hover:underline decoration-teal-300 underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
