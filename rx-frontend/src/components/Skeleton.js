export default function Skeleton({
  className = "",
  variant = "rect",
  rounded = "lg",
}) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  const variantClasses = {
    rect: "",
    text: "h-4",
    heading: "h-8",
    circle: "",
  };

  const baseClasses = "animate-shimmer";

  if (variant === "circle") {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
      />
    );
  }

  return (
    <div
      className={`${baseClasses} ${roundedClasses[rounded]} ${variantClasses[variant]} ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 animate-pulse-soft">
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-5/6" />
        <Skeleton variant="text" className="w-4/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-24" rounded="md" />
        <Skeleton className="h-9 w-24" rounded="md" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden animate-pulse-soft">
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} variant="text" className="flex-1" />
          ))}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} variant="text" className="flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
