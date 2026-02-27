"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, CalendarDays, FileText, User } from "lucide-react";
import { Link } from "../../../../i18n/routing";

export default function BookingConfirmationPage() {
  const t = useTranslations("Booking");
  const params = useSearchParams();

  const providerName = params.get("providerName");
  const providerId = params.get("providerId");
  const rawDate = params.get("date");
  const reason = params.get("reason");

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

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
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
