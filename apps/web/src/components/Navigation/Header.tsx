"use client";

import { Link } from "../../i18n/routing";
import LanguagePicker from "./LanguagePicker";
import { Menu, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/apiFetch";

/**
 * Application-wide navigation header.
 *
 * Includes a "Messages" nav item that fetches the current user's unread
 * message count on mount and shows a red dot badge when count > 0.
 * The badge fetch is best-effort — any failure is silently ignored so a
 * network issue never breaks navigation.
 */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const hostname = window.location.hostname;
    const API_BASE = `http://${hostname}:3001`;

    apiFetch(`${API_BASE}/messages/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data: { count: number } = await res.json();
          setUnreadCount(data.count);
        }
      })
      .catch(() => {
        // Best-effort — do not surface badge fetch errors to the user.
      });
  }, []);

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl font-extrabold bg-primary text-primary-foreground px-2.5 py-1 rounded-lg tracking-tight">
            CareEquity
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          aria-label="Main navigation"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Find a Physician
          </Link>
          <Link href="/resources" className="hover:text-primary transition-colors">
            Resources
          </Link>
          <Link
            href="/patient/care-team"
            className="hover:text-primary transition-colors"
          >
            My Care Team
          </Link>

          {/* Messages with unread badge */}
          <Link
            href="/messages"
            className="relative hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            Messages
            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} unread messages`}
                className="absolute -top-1.5 -right-2.5 min-w-[1rem] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/portal/dashboard"
            className="hover:text-primary transition-colors"
          >
            Provider Portal
          </Link>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <LanguagePicker />

          <div className="hidden md:flex items-center gap-2">
            <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-[oklch(0.78_0.17_84.429)] transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div
          className="md:hidden border-t bg-white px-4 py-4 space-y-3"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <Link
            href="/"
            className="block py-2 text-sm font-medium text-slate-700 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            Find a Physician
          </Link>
          <Link
            href="/resources"
            className="block py-2 text-sm font-medium text-slate-700 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            Resources
          </Link>
          <Link
            href="/patient/care-team"
            className="block py-2 text-sm font-medium text-slate-700 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            My Care Team
          </Link>

          {/* Messages (mobile) */}
          <Link
            href="/messages"
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            <span className="relative">
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
              )}
            </span>
            Messages
            {unreadCount > 0 && (
              <span className="ml-auto text-xs font-bold text-red-500">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/portal/dashboard"
            className="block py-2 text-sm font-medium text-slate-700 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            Provider Portal
          </Link>
          <div className="pt-2 border-t flex gap-2">
            <Link
              href="/login"
              className="flex-1 py-2 text-center text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="flex-1 py-2 text-center text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-[oklch(0.78_0.17_84.429)] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
