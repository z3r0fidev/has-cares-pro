"use client";

import { Link } from "../../i18n/routing";
import LanguagePicker from "./LanguagePicker";

export default function Header() {
  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-blue-600 text-white px-2 py-1 rounded">CareEquity</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600">Find a Physician</Link>
            <Link href="/patient/care-team" className="hover:text-blue-600">My Care Team</Link>
            <Link href="/portal/dashboard" className="hover:text-blue-600">Provider Portal</Link>
          </nav>
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          <LanguagePicker />
        </div>
      </div>
    </header>
  );
}
