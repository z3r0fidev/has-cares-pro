"use client";

import { useState } from 'react';
import { SPECIALTIES, INSURANCE_PROVIDERS } from '@careequity/core/src/types/index';
import { useTranslations } from 'next-intl';

interface SearchFormProps {
  onSearch: (filters: { zip: string; specialty: string; insurance: string }) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const t = useTranslations('Search');
  const common = useTranslations('Home');
  const [zip, setZip] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [insurance, setInsurance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ zip, specialty, insurance });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-6" aria-label="Physician search form">
      <div>
        <label htmlFor="zip-code" className="block mb-2 text-sm font-bold text-slate-700">
          {t('zip')}
        </label>
        <input
          id="zip-code"
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-slate-900"
          placeholder="e.g. 19143"
          aria-required="false"
        />
      </div>

      <div>
        <label htmlFor="specialty-select" className="block mb-2 text-sm font-bold text-slate-700">
          {t('specialty')}
        </label>
        <select
          id="specialty-select"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-slate-900"
          aria-label="Filter by medical specialty"
        >
          <option value="">{t('allSpecialties')}</option>
          {SPECIALTIES.sort().map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="insurance-select" className="block mb-2 text-sm font-bold text-slate-700">
          {t('insurance')}
        </label>
        <select
          id="insurance-select"
          value={insurance}
          onChange={(e) => setInsurance(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-slate-900"
          aria-label="Filter by accepted insurance"
        >
          <option value="">{t('allInsurance')}</option>
          {INSURANCE_PROVIDERS.sort().map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      <button 
        type="submit" 
        className="w-full py-3 bg-blue-700 text-white rounded-lg font-bold text-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-200 transition-all shadow-sm"
      >
        {common('search')}
      </button>
    </form>
  );
}
