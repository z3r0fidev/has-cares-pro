"use client";

import { MessageSquare } from "lucide-react";
import { Link } from "../../i18n/routing";
import { cn } from "@/lib/utils";

/** Shape of a single thread summary returned from GET /messages */
export interface ThreadSummaryData {
  appointmentId: string;
  appointment: {
    id: string;
    appointment_date: string;
    provider: {
      id: string;
      name: string;
    };
    patient: {
      id: string;
      email: string;
    };
  };
  lastMessage: {
    id: string;
    body: string;
    created_at: string;
    senderId: string;
    sender: {
      id: string;
      email: string;
    };
  };
  unreadCount: number;
}

interface ThreadListProps {
  threads: ThreadSummaryData[];
  currentUserId: string;
}

/**
 * ThreadList renders the messaging inbox — one row per appointment thread
 * that has at least one message.
 *
 * Each row shows:
 * - The counterpart's name (provider name for patients; patient email for
 *   providers)
 * - The last message preview (truncated)
 * - A relative timestamp
 * - An unread count badge when there are unread messages
 */
export default function ThreadList({
  threads,
  currentUserId,
}: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">No messages yet</p>
        <p className="text-slate-400 text-sm mt-1">
          Messages tied to your appointments will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {threads.map((thread) => {
        const isSentByMe = thread.lastMessage.senderId === currentUserId;
        const counterpart =
          thread.appointment.provider.name ||
          thread.appointment.patient.email;
        const preview = thread.lastMessage.body.slice(0, 80);
        const hasMore = thread.lastMessage.body.length > 80;

        const timeLabel = formatRelativeTime(
          new Date(thread.lastMessage.created_at),
        );

        return (
          <li key={thread.appointmentId}>
            <Link
              href={`/messages/${thread.appointmentId}`}
              className="flex items-start gap-4 px-4 py-4 hover:bg-slate-50 transition-colors"
            >
              {/* Avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">
                  {counterpart.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Thread info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm truncate",
                      thread.unreadCount > 0
                        ? "font-bold text-slate-900"
                        : "font-medium text-slate-700",
                    )}
                  >
                    {counterpart}
                  </p>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">
                    {timeLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {isSentByMe && (
                    <span className="text-slate-400 mr-1">You:</span>
                  )}
                  {preview}
                  {hasMore && "…"}
                </p>
              </div>

              {/* Unread badge */}
              {thread.unreadCount > 0 && (
                <span className="flex-shrink-0 mt-0.5 min-w-[1.25rem] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                  {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Returns a human-friendly relative time label (e.g. "2 h ago", "Yesterday"). */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h ago`;

  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
