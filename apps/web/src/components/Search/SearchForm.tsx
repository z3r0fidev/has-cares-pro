"use client";

import { useState } from 'react';
import { SPECIALTIES } from '@careequity/core/src/types/index';

interface SearchFormProps {
  onSearch: (filters: { zip: string; specialty: string }) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [zip, setZip] = useState('');
  const [specialty, setSpecialty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ zip, specialty });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded">
      <div className="mb-4">
        <label className="block mb-2">ZIP Code</label>
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g. 19143"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Specialty</label>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="">All Specialties</option>
          {SPECIALTIES.sort().map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded w-full font-bold hover:bg-blue-700 transition-colors">
        Search Providers
      </button>
    </form>
  );
}
