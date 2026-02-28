"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import MessageBubble from "./MessageBubble";

/** Shape of a message returned from GET /messages/thread/:appointmentId */
export interface MessageData {
  id: string;
  body: string;
  senderId: string;
  read: boolean;
  created_at: string;
  sender: {
    id: string;
    email: string;
    role: string;
  };
}

/** Minimal appointment context displayed at the top of the thread. */
export interface AppointmentContext {
  id: string;
  providerName: string;
  appointmentDate: string;
}

interface MessageThreadProps {
  appointmentId: string;
  context: AppointmentContext;
  currentUserId: string;
}

const POLL_INTERVAL_MS = 10_000;

/**
 * MessageThread renders the full conversation for a single appointment.
 *
 * - Auto-scrolls to the latest message on mount and after new messages arrive.
 * - Polls every 10 s for new messages (long-polling / websocket upgrade is
 *   a planned improvement tracked in TODO.md).
 * - Marks all unread incoming messages as read when the thread is viewed.
 */
export default function MessageThread({
  appointmentId,
  context,
  currentUserId,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const API_BASE = `http://${hostname}:3001`;

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await apiFetch(
        `${API_BASE}/messages/thread/${appointmentId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const data: MessageData[] = await res.json();
      setMessages(data);

      // Mark unread incoming messages as read (fire-and-forget).
      const unread = data.filter(
        (m) => !m.read && m.senderId !== currentUserId,
      );
      for (const msg of unread) {
        apiFetch(`${API_BASE}/messages/${msg.id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {
          // Non-critical — silently ignore mark-read failures.
        });
      }
    } catch {
      // Network errors during polling are non-fatal.
    } finally {
      setLoading(false);
    }
  }, [appointmentId, currentUserId, API_BASE]);

  // Initial load + polling.
  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  // Scroll to bottom whenever the message list grows.
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    const token = getToken();
    if (!token) return;

    setSending(true);
    try {
      const res = await apiFetch(
        `${API_BASE}/messages/thread/${appointmentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: body.trim() }),
        },
      );

      if (!res.ok) {
        toast.error("Failed to send message. Please try again.");
        return;
      }

      const newMsg: MessageData = await res.json();
      setMessages((prev) => [...prev, newMsg]);
      setBody("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter submits the form.
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const formattedDate = new Date(context.appointmentDate).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Thread header — appointment context */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <p className="font-bold text-slate-900">{context.providerName}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Appointment: {formattedDate}
        </p>
      </div>

      {/* Scrollable message list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {loading && (
          <p className="text-center text-slate-400 text-sm py-8">
            Loading messages...
          </p>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No messages yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              Send the first message below.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            body={msg.body}
            createdAt={msg.created_at}
            senderName={msg.sender.email}
            isSelf={msg.senderId === currentUserId}
          />
        ))}

        {/* Sentinel element used for auto-scroll. */}
        <div ref={bottomRef} />
      </div>

      {/* Compose area */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-100 px-4 py-3 flex gap-3 items-end flex-shrink-0 bg-white"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Ctrl+Enter to send)"
          maxLength={2000}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          aria-label="Send message"
          className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-[oklch(0.78_0.17_84.429)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
