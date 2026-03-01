"use client";

/**
 * CoverageCheckWidget
 *
 * Collapsible "Check My Coverage" section rendered on the provider profile
 * page, below the Insurance Accepted chips. Allows a patient to verify
 * real-time eligibility using the POST /eligibility/check endpoint.
 *
 * - The insurance plan selector is pre-populated from the provider's accepted
 *   insurance list.
 * - The provider NPI is injected as a prop and sent transparently.
 * - Eligible responses show a green "You're covered" card with copay /
 *   deductible details. Ineligible responses show a red "Not in network" card.
 */

import { useState } from 'react';
import {
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion';
import { ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverageCheckWidgetProps {
  /** Provider's NPI — pre-filled and sent with every request */
  providerNpi: string;
  /** Comma-separated insurance string from the provider record */
  insuranceList: string[];
}

interface EligibilityResult {
  eligible: boolean;
  planName: string;
  coverageStart?: string;
  copay?: number;
  deductible?: number;
  source: 'availity' | 'mock';
}

const API_URL = () =>
  typeof window !== 'undefined'
    ? `http://${window.location.hostname}:3001`
    : 'http://localhost:3001';

export default function CoverageCheckWidget({
  providerNpi,
  insuranceList,
}: CoverageCheckWidgetProps) {
  const [memberId, setMemberId] = useState('');
  const [memberDob, setMemberDob] = useState('');
  const [planCode, setPlanCode] = useState(insuranceList[0] ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be signed in to check coverage. Please log in and try again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL()}/eligibility/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId,
          memberDob,
          insurancePlanCode: planCode,
          providerNpi,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? `Request failed (${res.status})`);
      }

      const data = (await res.json()) as EligibilityResult;
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccordionRoot type="single" collapsible className="w-full">
      <AccordionItem value="coverage" className="border rounded-xl px-4 bg-white">
        <AccordionTrigger className="text-sm font-semibold text-slate-800 hover:no-underline">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            Check My Coverage
          </span>
        </AccordionTrigger>

        <AccordionContent>
          <form onSubmit={handleSubmit} className="space-y-3 pb-2">
            {/* Member ID */}
            <div>
              <label
                htmlFor="eligibility-member-id"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Member ID
              </label>
              <input
                id="eligibility-member-id"
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Found on your insurance card"
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="eligibility-dob"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Date of Birth
              </label>
              <input
                id="eligibility-dob"
                type="date"
                value={memberDob}
                onChange={(e) => setMemberDob(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Insurance Plan */}
            <div>
              <label
                htmlFor="eligibility-plan"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Insurance Plan
              </label>
              <select
                id="eligibility-plan"
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {insuranceList.map((ins) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !memberId || !memberDob || !planCode}
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-semibold transition-colors',
                'bg-primary text-primary-foreground',
                'hover:bg-[oklch(0.78_0.17_84.429)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking…
                </span>
              ) : (
                'Check Coverage'
              )}
            </button>
          </form>

          {/* Error state */}
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Result state */}
          {result && (
            <div
              className={cn(
                'mt-3 p-4 rounded-lg border',
                result.eligible
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200',
              )}
            >
              <div className="flex items-start gap-3">
                {result.eligible ? (
                  <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldX className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-grow space-y-1">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      result.eligible ? 'text-green-800' : 'text-red-800',
                    )}
                  >
                    {result.eligible
                      ? "You're covered"
                      : 'Not in network'}
                  </p>

                  <p className="text-xs text-slate-600">{result.planName}</p>

                  {result.eligible && (
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {result.copay !== undefined && (
                        <>
                          <dt className="text-slate-500">Copay</dt>
                          <dd className="font-medium text-slate-800">
                            ${result.copay}
                          </dd>
                        </>
                      )}
                      {result.deductible !== undefined && (
                        <>
                          <dt className="text-slate-500">Deductible</dt>
                          <dd className="font-medium text-slate-800">
                            ${result.deductible.toLocaleString()}
                          </dd>
                        </>
                      )}
                      {result.coverageStart && (
                        <>
                          <dt className="text-slate-500">Coverage since</dt>
                          <dd className="font-medium text-slate-800">
                            {result.coverageStart}
                          </dd>
                        </>
                      )}
                    </dl>
                  )}

                  {result.source === 'mock' && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Demo data — connect Availity for live verification
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  );
}
