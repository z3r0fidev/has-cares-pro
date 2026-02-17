import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "./globals.css";
import Header from "../../components/Navigation/Header";

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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
