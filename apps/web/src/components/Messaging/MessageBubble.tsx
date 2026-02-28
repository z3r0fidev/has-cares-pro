"use client";

import { cn } from "@/lib/utils";

export interface MessageBubbleProps {
  /** The text content of the message. */
  body: string;
  /** ISO timestamp string for when the message was created. */
  createdAt: string;
  /** Display name or email of the sender. */
  senderName: string;
  /** Whether this message was authored by the current user. */
  isSelf: boolean;
}

/**
 * MessageBubble renders a single message in the conversation thread.
 *
 * Layout:
 * - Messages from the current user appear right-aligned with brand-gold
 *   background (matching the CareEquity primary colour token).
 * - Messages from the other party appear left-aligned with a white
 *   background and a subtle border.
 *
 * A "(PHI redacted)" pill is shown whenever the body contains a
 * `[REDACTED …]` token left by the server-side Redactor.
 */
export default function MessageBubble({
  body,
  createdAt,
  senderName,
  isSelf,
}: MessageBubbleProps) {
  const hasRedaction = body.includes("[REDACTED");

  const formatted = new Date(createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 max-w-[75%]",
        isSelf ? "items-end self-end" : "items-start self-start",
      )}
    >
      {/* Sender label */}
      <span className="text-[11px] text-slate-400 px-1">
        {isSelf ? "You" : senderName}
      </span>

      {/* Bubble */}
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isSelf
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm",
        )}
      >
        {body}

        {hasRedaction && (
          <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold opacity-70 italic">
            (PHI redacted)
          </span>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-slate-400 px-1">{formatted}</span>
    </div>
  );
}
