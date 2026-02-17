"use client";

import { useState } from 'react';
import { SPECIALTIES, INSURANCE_PROVIDERS } from '@careequity/core/src/types/index';

interface SearchFormProps {
  onSearch: (filters: { zip: string; specialty: string; insurance: string }) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [zip, setZip] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [insurance, setInsurance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ zip, specialty, insurance });
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
      <div className="mb-4">
        <label className="block mb-2">Insurance</label>
        <select
          value={insurance}
          onChange={(e) => setInsurance(e.target.value)}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="">All Insurance</option>
          {INSURANCE_PROVIDERS.sort().map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded w-full font-bold hover:bg-blue-700 transition-colors">
        Search Providers
      </button>
    </form>
  );
}
