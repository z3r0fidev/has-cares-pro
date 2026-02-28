"use client";

import StarRating from '../Provider/StarRating';

export interface ReviewData {
  id: string;
  patient_id: string;
  rating_total: number;
  content: string;
  is_verified_patient: boolean;
  created_at: string;
}

interface ReviewCardProps {
  review: ReviewData;
}

/**
 * Renders a single patient review, including a "Verified Patient" badge when
 * the reviewer has a confirmed appointment on record with the provider.
 */
export default function ReviewCard({ review }: ReviewCardProps) {
  const dateLabel = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Derive a display name from the patient UUID — show only the first 8 chars
  // so the review is attributable without exposing the full ID.
  const displayName = `Patient ${review.patient_id.slice(0, 8).toUpperCase()}`;

  return (
    <article className="flex flex-col gap-3 py-4 border-b border-slate-100 last:border-b-0">
      {/* Header row: avatar placeholder + name + date */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold flex-shrink-0"
            aria-hidden="true"
          >
            {displayName.charAt(8)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-400">{dateLabel}</p>
          </div>
        </div>

        {/* Verified Patient badge */}
        {review.is_verified_patient && (
          <span
            className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0"
            title="This reviewer has a confirmed appointment with this provider"
          >
            {/* Checkmark icon (inline SVG to avoid a heavy icon library dep) */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" />
              <path
                d="M3.5 6l1.75 1.75L8.5 4.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Verified Patient
          </span>
        )}
      </div>

      {/* Star rating */}
      <StarRating rating={review.rating_total} size="sm" />

      {/* Review text */}
      <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>
    </article>
  );
}
