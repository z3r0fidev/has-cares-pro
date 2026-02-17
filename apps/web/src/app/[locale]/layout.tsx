import type { Metadata } from "next";
import "./globals.css";

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
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
