"use client";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}

export default function StarRating({ rating, count, size = "md" }: StarRatingProps) {
  const starSize = size === "sm" ? 14 : 18;
  const clampedRating = Math.min(5, Math.max(0, rating));

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`Rating: ${clampedRating.toFixed(1)} out of 5${count !== undefined ? `, ${count} reviews` : ""}`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.min(1, Math.max(0, clampedRating - i));
          const fillPercent = Math.round(fill * 100);
          const id = `star-clip-${i}-${Math.random().toString(36).slice(2, 7)}`;

          return (
            <svg
              key={i}
              width={starSize}
              height={starSize}
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id={id}>
                  <rect x="0" y="0" width={`${fillPercent}%`} height="20" />
                </clipPath>
              </defs>
              {/* Empty star background */}
              <path
                d="M10 1l2.39 6.26H18.5l-5.02 3.93 1.81 6.12L10 13.77l-5.29 3.54 1.81-6.12L1.5 7.26h6.11L10 1z"
                fill="#E5E7EB"
              />
              {/* Filled star overlay using clip */}
              <path
                d="M10 1l2.39 6.26H18.5l-5.02 3.93 1.81 6.12L10 13.77l-5.29 3.54 1.81-6.12L1.5 7.26h6.11L10 1z"
                fill="#F59E0B"
                clipPath={`url(#${id})`}
              />
            </svg>
          );
        })}
      </div>

      {(count !== undefined || rating > 0) && (
        <span
          className={`font-medium text-slate-700 ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          {clampedRating.toFixed(1)}
          {count !== undefined && (
            <span className="text-slate-400 font-normal ml-1">({count})</span>
          )}
        </span>
      )}
    </div>
  );
}
