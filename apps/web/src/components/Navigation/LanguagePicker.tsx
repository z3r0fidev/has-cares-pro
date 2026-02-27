"use client";

import { usePathname, useRouter, routing } from "../../i18n/routing";
import { useParams } from "next/navigation";

export default function LanguagePicker() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = params.locale as string;

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex gap-2 text-sm font-medium">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLanguageChange(locale)}
          className={`px-2 py-1 rounded transition-colors ${
            currentLocale === locale
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-label={`Change language to ${locale.toUpperCase()}`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
