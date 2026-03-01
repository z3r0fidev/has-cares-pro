"use client";

/**
 * FhirAvailabilityGrid
 *
 * Replacement for InlineAvailabilityGrid when live EHR slot data is
 * available from GET /fhir/availability/:npi.
 *
 * Visual design mirrors InlineAvailabilityGrid exactly (6-column grid,
 * gold highlight on selected slot) but is driven by AvailabilitySlot[]
 * instead of the static availability string-range format.
 *
 * Shows a small "Live availability from EHR" badge when real data is
 * present so patients know these times are real-time accurate.
 */

import { useState, useMemo } from 'react';
import type { AvailabilitySlot } from '@careequity/core';
import { Activity } from 'lucide-react';

interface FhirAvailabilityGridProps {
  slots: AvailabilitySlot[];
  onSlotSelect: (isoDateTime: string) => void;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Returns YYYY-MM-DD for a Date in UTC */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface DayColumn {
  date: Date;
  slots: AvailabilitySlot[];
}

export default function FhirAvailabilityGrid({
  slots,
  onSlotSelect,
}: FhirAvailabilityGridProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  /** Source label derived from the first slot that has a non-manual source */
  const sourceLabel = useMemo(() => {
    const epicSlot = slots.find((s) => s.source === 'epic');
    if (epicSlot) return 'Epic';
    const athenaSlot = slots.find((s) => s.source === 'athenahealth');
    if (athenaSlot) return 'Athenahealth';
    return null;
  }, [slots]);

  /** Group slots by calendar date (UTC) and build 6-day columns */
  const days = useMemo((): DayColumn[] => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Pre-index slots by date key for O(1) lookup
    const byDate = new Map<string, AvailabilitySlot[]>();
    for (const slot of slots) {
      if (slot.status !== 'free') continue;
      const key = slot.start.slice(0, 10); // YYYY-MM-DD
      const existing = byDate.get(key) ?? [];
      existing.push(slot);
      byDate.set(key, existing);
    }

    const result: DayColumn[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() + i);
      const key = toDateKey(d);
      result.push({ date: d, slots: byDate.get(key) ?? [] });
    }
    return result;
  }, [slots]);

  const handleSelect = (slot: AvailabilitySlot) => {
    setSelectedKey(slot.start);
    onSlotSelect(slot.start);
  };

  const hasAnySlot = days.some((d) => d.slots.length > 0);

  if (!hasAnySlot) {
    return (
      <p className="text-sm text-slate-400 italic">
        No live slots available — call the office to schedule.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Next Available
        </p>
        {sourceLabel && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#1A73E8] bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
            <Activity className="w-3 h-3" />
            Live from {sourceLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-1">
        {days.map(({ date, slots: daySlots }) => (
          <div key={toDateKey(date)} className="flex flex-col items-center gap-1">
            {/* Day header */}
            <div className="text-center leading-none mb-0.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">
                {DAY_SHORT[date.getUTCDay()]}
              </div>
              <div className="text-sm font-bold text-slate-800">
                {date.getUTCDate()}
              </div>
              <div className="text-[10px] text-slate-400">
                {MONTH_SHORT[date.getUTCMonth()]}
              </div>
            </div>

            {/* Slot buttons (capped at 4 per day to match InlineAvailabilityGrid) */}
            {daySlots.length === 0 ? (
              <div className="w-full text-center text-[10px] text-slate-300 py-1">
                —
              </div>
            ) : (
              daySlots.slice(0, 4).map((slot) => {
                const isSelected = selectedKey === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => handleSelect(slot)}
                    className={`w-full text-[10px] px-0.5 py-1 rounded border font-medium transition-all text-center
                      ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-primary border-primary/40 hover:bg-primary/10'
                      }`}
                  >
                    {formatTime(slot.start)}
                  </button>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
