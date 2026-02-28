"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, CalendarDays, FileText, User, Calendar, Download } from "lucide-react";
import { Link } from "../../../../i18n/routing";

/**
 * Formats a Date into the iCalendar date-time string format (UTC).
 * Example output: "20260301T140000Z"
 */
function toICSDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Builds a minimal RFC 5545-compliant .ics string for a single appointment
 * event, then triggers a browser Blob download.
 */
function downloadICS(params: {
  providerName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}) {
  const uid = `${Date.now()}-careequity@careequity.app`;
  const now = toICSDate(new Date());
  const start = toICSDate(params.startDate);
  const end = toICSDate(params.endDate);
  const summary = `Appointment with ${params.providerName}`;
  const description = params.reason ? params.reason.replace(/\n/g, "\\n") : "";

  // Each line in an .ics file must be at most 75 octets; long lines are folded
  // with CRLF + single space. For simplicity we keep values short here.
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CareEquity//CareEquity//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "appointment.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Builds a Google Calendar deep-link URL for the given appointment details.
 * No API key is required — this uses the public "render" endpoint.
 */
function buildGoogleCalendarUrl(params: {
  providerName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}): string {
  const fmt = (d: Date) => toICSDate(d);
  const base = "https://calendar.google.com/calendar/render";
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: `Appointment with ${params.providerName}`,
    dates: `${fmt(params.startDate)}/${fmt(params.endDate)}`,
    details: params.reason,
  });
  return `${base}?${query.toString()}`;
}

export default function BookingConfirmationPage() {
  const t = useTranslations("Booking");
  const params = useSearchParams();

  const providerName = params.get("providerName");
  const providerId = params.get("providerId");
  const rawDate = params.get("date");
  const reason = params.get("reason") ?? "";

  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Derive start/end dates for calendar integrations (default to 1-hour slot)
  const startDate = rawDate ? new Date(rawDate) : null;
  const endDate = startDate ? new Date(startDate.getTime() + 60 * 60 * 1000) : null;

  const showCalendar = !!(providerName && startDate && endDate);

  const calendarParams = showCalendar
    ? {
        providerName: providerName!,
        startDate: startDate!,
        endDate: endDate!,
        reason,
      }
    : null;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-md p-8">
        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle className="text-green-500" size={36} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
            {t("confirmationTitle")}
          </h1>
          <p className="text-sm text-slate-500">{t("confirmationSubtitle")}</p>
        </div>

        {/* Details */}
        <div className="space-y-4 border-t border-slate-100 pt-6">
          {providerName && (
            <div className="flex items-start gap-3">
              <User className="text-slate-400 mt-0.5 flex-shrink-0" size={18} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                  {t("confirmationWith")}
                </p>
                <p className="text-sm font-medium text-slate-800">{providerName}</p>
              </div>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-start gap-3">
              <CalendarDays className="text-slate-400 mt-0.5 flex-shrink-0" size={18} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                  {t("confirmationDate")}
                </p>
                <p className="text-sm font-medium text-slate-800">{formattedDate}</p>
              </div>
            </div>
          )}

          {reason && (
            <div className="flex items-start gap-3">
              <FileText className="text-slate-400 mt-0.5 flex-shrink-0" size={18} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                  {t("confirmationReason")}
                </p>
                <p className="text-sm text-slate-800">{reason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Add to Calendar */}
        {showCalendar && calendarParams && (
          <div className="mt-6 p-4 rounded-xl border border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {t("addToCalendar")}
            </p>
            <div className="flex flex-col gap-2">
              {/* Google Calendar */}
              <a
                href={buildGoogleCalendarUrl(calendarParams)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                aria-label="Add to Google Calendar (opens in new tab)"
              >
                <Calendar size={16} className="text-[#1A73E8] flex-shrink-0" aria-hidden="true" />
                Google Calendar
              </a>

              {/* Download .ics */}
              <button
                onClick={() => downloadICS(calendarParams)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors w-full text-left"
                aria-label="Download iCalendar file (.ics) for Apple Calendar, Outlook, and others"
              >
                <Download size={16} className="text-slate-500 flex-shrink-0" aria-hidden="true" />
                Download .ics (Apple Calendar, Outlook)
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {providerId && (
            <Link
              href={`/providers/${providerId}`}
              className="w-full text-center px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors"
            >
              {t("confirmationBackProfile")}
            </Link>
          )}
          <Link
            href="/"
            className="w-full text-center px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            {t("confirmationBackSearch")}
          </Link>
        </div>
      </div>
    </main>
  );
}
