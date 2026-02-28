import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "./globals.css";
import Header from "../../components/Navigation/Header";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "CareEquity",
  description: "Minority Physician Locator Platform",
};

export function generateStaticParams() {
  return [{locale: 'en'}, {locale: 'es'}, {locale: 'ar'}];
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <body className="antialiased bg-slate-50 min-h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          {children}
          <footer className="border-t border-slate-200 bg-white mt-auto py-4 px-4 text-center text-xs text-slate-400">
            Insurance plan logos are registered trademarks of their respective owners. CareEquity is not affiliated with any insurance provider.
          </footer>
          <Toaster richColors position="bottom-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
