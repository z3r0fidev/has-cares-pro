"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import ThreadList, {
  ThreadSummaryData,
} from "../../../components/Messaging/ThreadList";
import { apiFetch } from "../../../lib/apiFetch";

/**
 * Messages index page — /[locale]/messages
 *
 * Lists all appointment threads that have at least one message.
 * Requires authentication; redirects to /login otherwise.
 */
export default function MessagesPage() {
  const t = useTranslations("Messaging");
  const router = useRouter();

  const [threads, setThreads] = useState<ThreadSummaryData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    // Decode the JWT payload (without verification — server validates it).
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.sub as string);
    } catch {
      router.push("/login");
      return;
    }

    const hostname = window.location.hostname;
    const API_BASE = `http://${hostname}:3001`;

    const load = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: ThreadSummaryData[] = await res.json();
          setThreads(data);
        }
      } catch {
        // Non-fatal; show empty state.
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
      </div>

      {/* Thread list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading…
          </div>
        ) : (
          <ThreadList threads={threads} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}
