"use client";

import { useState } from 'react';

interface ReviewFormProps {
  providerId: string;
  onSubmit: (review: { rating_total: number; content: string }) => void;
}

export default function ReviewForm({ providerId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating_total: rating, content });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded mt-4">
      <h3 className="text-lg font-bold mb-2">Leave a Review</h3>
      <div className="mb-4">
        <label className="block mb-2">Rating (1-5)</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="p-2 border rounded"
        >
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>{r} Stars</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2">Review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded h-24"
        />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Submit Review
      </button>
    </form>
  );
}
