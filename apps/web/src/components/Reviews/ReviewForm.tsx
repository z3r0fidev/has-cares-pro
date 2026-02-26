"use client";

import { useState } from 'react';
import { Button } from "@careequity/ui";

interface ReviewFormProps {
  onSubmit: (review: { rating_total: number; content: string }) => void;
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [content, setContent] = useState('');

  const display = hovered || rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating_total: rating, content });
    setRating(0);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-semibold text-slate-800">Share Your Experience</h3>

      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Your Rating
        </label>
        <div className="flex items-center gap-3">
          <div
            className="flex gap-0.5"
            onMouseLeave={() => setHovered(0)}
            role="group"
            aria-label="Star rating"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} out of 5`}
                className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10 1l2.39 6.26H18.5l-5.02 3.93 1.81 6.12L10 13.77l-5.29 3.54 1.81-6.12L1.5 7.26h6.11L10 1z"
                    fill={star <= display ? '#F59E0B' : '#E5E7EB'}
                    style={{ transition: 'fill 0.1s' }}
                  />
                </svg>
              </button>
            ))}
          </div>
          {display > 0 && (
            <span className="text-sm font-medium text-slate-600">{LABELS[display]}</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Your Review
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Tell others about your experience with this provider…"
        />
      </div>

      <Button type="submit" disabled={rating === 0} className="w-full">
        Submit Review
      </Button>
    </form>
  );
}
