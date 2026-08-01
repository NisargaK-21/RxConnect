const STATUS_CONFIG = {
  Placed: {
    style: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200/70",
    dot: "bg-blue-500",
    pulse: true,
  },
  Verified: {
    style: "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border-indigo-200/70",
    dot: "bg-indigo-500",
  },
  Packed: {
    style: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200/70",
    dot: "bg-amber-500",
  },
  "Out for Delivery": {
    style: "bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 border-purple-200/70",
    dot: "bg-purple-500",
    pulse: true,
  },
  Delivered: {
    style: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
  Cancelled: {
    style: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200/70",
    dot: "bg-rose-500",
  },
  pending: {
    style: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200/70",
    dot: "bg-amber-500",
    pulse: true,
  },
  approved: {
    style: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
  rejected: {
    style: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200/70",
    dot: "bg-rose-500",
  },
  Active: {
    style: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
  Inactive: {
    style: "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border-slate-200/70",
    dot: "bg-slate-400",
  },
  placed: {
    style: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200/70",
    dot: "bg-blue-500",
    pulse: true,
  },
  verified: {
    style: "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border-indigo-200/70",
    dot: "bg-indigo-500",
  },
  packed: {
    style: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200/70",
    dot: "bg-amber-500",
  },
  "out for delivery": {
    style: "bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 border-purple-200/70",
    dot: "bg-purple-500",
    pulse: true,
  },
  delivered: {
    style: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
  cancelled: {
    style: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200/70",
    dot: "bg-rose-500",
  },
  critical: {
    style: "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border-rose-200/70",
    dot: "bg-rose-500",
    pulse: true,
  },
  acknowledged: {
    style: "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border-teal-200/70",
    dot: "bg-teal-500",
  },
  active: {
    style: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/70",
    dot: "bg-emerald-500",
  },
  inactive: {
    style: "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border-slate-200/70",
    dot: "bg-slate-400",
  },
  claimed: {
    style: "bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 border-violet-200/70",
    dot: "bg-violet-500",
  },
  picked_up: {
    style: "bg-gradient-to-r from-fuchsia-50 to-purple-50 text-fuchsia-700 border-fuchsia-200/70",
    dot: "bg-fuchsia-500",
    pulse: true,
  },
  assigned: {
    style: "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border-sky-200/70",
    dot: "bg-sky-500",
  },
};

export default function StatusBadge({ status, size = "md" }) {
  const config = STATUS_CONFIG[status] || {
    style: "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border-slate-200/70",
    dot: "bg-slate-400",
  };

  const sizes = {
    sm: "gap-1 px-2 py-0.5 text-[10px]",
    md: "gap-1.5 px-2.5 py-1 text-xs",
    lg: "gap-2 px-3.5 py-1.5 text-sm",
  };

  const dotSizes = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold tracking-wide transition-all duration-300 ${sizes[size] || sizes.md} ${config.style}`}
    >
      <span
        className={`rounded-full ${dotSizes[size] || dotSizes.md} ${config.dot} ${
          config.pulse ? "animate-pulse-soft" : ""
        }`}
      />
      {status}
    </span>
  );
}
