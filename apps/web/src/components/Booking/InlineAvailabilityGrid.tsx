"use client";

import { useState, useMemo } from 'react';

interface InlineAvailabilityGridProps {
  availability?: Partial<Record<string, string>>;
  onSlotSelect: (isoDateTime: string) => void;
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function to12h(h: number, m: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function parseHour(token: string): number | null {
  const match = token.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const pm = match[3].toUpperCase() === 'PM';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h;
}

function generateSlots(range: string): { hour: number; minute: number }[] {
  const parts = range.split('-').map((s) => s.trim());
  if (parts.length < 2) return [];
  const startH = parseHour(parts[0]);
  const endH = parseHour(parts[1]);
  if (startH === null || endH === null || endH <= startH) return [];

  const slots: { hour: number; minute: number }[] = [];
  const candidates = [9, 10, 11, 14, 15, 16];
  for (const h of candidates) {
    if (h >= startH && h < endH) {
      slots.push({ hour: h, minute: 0 });
      if (slots.length >= 4) break;
    }
  }
  return slots;
}

export default function InlineAvailabilityGrid({
  availability,
  onSlotSelect,
}: InlineAvailabilityGridProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const days = useMemo(() => {
    const result: { date: Date; slots: { hour: number; minute: number }[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayKey = DAY_KEYS[d.getDay()];
      const range = availability?.[dayKey];
      const slots = range ? generateSlots(range) : [];
      result.push({ date: d, slots });
    }
    return result;
  }, [availability]);

  const handleSelect = (date: Date, hour: number, minute: number) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, minute, 0, 0);
    const iso = slotDate.toISOString();
    setSelectedKey(iso);
    onSlotSelect(iso);
  };

  const hasAnySlot = days.some((d) => d.slots.length > 0);

  if (!hasAnySlot) {
    return (
      <p className="text-sm text-slate-400 italic">
        No availability listed — call the office to schedule.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Next Available
      </p>
      <div className="grid grid-cols-6 gap-1">
        {days.map(({ date, slots }) => (
          <div key={date.toISOString()} className="flex flex-col items-center gap-1">
            <div className="text-center leading-none mb-0.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">
                {DAY_SHORT[date.getDay()]}
              </div>
              <div className="text-sm font-bold text-slate-800">{date.getDate()}</div>
              <div className="text-[10px] text-slate-400">{MONTH_SHORT[date.getMonth()]}</div>
            </div>

            {slots.length === 0 ? (
              <div className="w-full text-center text-[10px] text-slate-300 py-1">—</div>
            ) : (
              slots.map(({ hour, minute }) => {
                const slotDate = new Date(date);
                slotDate.setHours(hour, minute, 0, 0);
                const iso = slotDate.toISOString();
                const isSelected = selectedKey === iso;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => handleSelect(date, hour, minute)}
                    className={`w-full text-[10px] px-0.5 py-1 rounded border font-medium transition-all text-center
                      ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-primary border-primary/40 hover:bg-primary/10'
                      }`}
                  >
                    {to12h(hour, minute)}
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
