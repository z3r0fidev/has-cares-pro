"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "../../../../i18n/routing";
import MessageThread, {
  AppointmentContext,
} from "../../../../components/Messaging/MessageThread";
import { apiFetch } from "../../../../lib/apiFetch";

/**
 * Appointment thread page — /[locale]/messages/[appointmentId]
 *
 * Renders the full message thread for a single appointment.
 * Requires authentication; redirects to /login otherwise.
 *
 * The page loads the appointment context (provider name + date) and the
 * current user's ID from the JWT, then delegates to <MessageThread> which
 * handles fetching messages, polling, and sending.
 */
export default function AppointmentThreadPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [context, setContext] = useState<AppointmentContext | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login");
      return;
    }

    // Extract user ID from JWT payload (client-side decode only — the server
    // re-validates the signature on every API call).
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.sub as string);
    } catch {
      router.push("/login");
      return;
    }

    const hostname = window.location.hostname;
    const API_BASE = `http://${hostname}:3001`;

    const loadContext = async () => {
      try {
        // Fetch the appointment to build the thread header context.
        const res = await apiFetch(
          `${API_BASE}/booking/my-appointments`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!res.ok) {
          setLoading(false);
          return;
        }

        interface AppointmentRow {
          id: string;
          appointment_date: string;
          provider: { id: string; name: string };
        }

        const appointments: AppointmentRow[] = await res.json();
        const appt = appointments.find((a) => a.id === appointmentId);

        if (appt) {
          setContext({
            id: appt.id,
            providerName: appt.provider?.name ?? "Provider",
            appointmentDate: appt.appointment_date,
          });
        } else {
          // Appointment not found for this user — might be the provider's
          // view.  Provide minimal context so the thread still renders.
          setContext({
            id: appointmentId,
            providerName: "Appointment Thread",
            appointmentDate: new Date().toISOString(),
          });
        }
      } catch {
        setContext({
          id: appointmentId,
          providerName: "Appointment Thread",
          appointmentDate: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [appointmentId, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="h-[calc(100vh-9rem)] bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center text-slate-500">
        Appointment not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Back navigation */}
      <Link
        href="/messages"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All messages
      </Link>

      <MessageThread
        appointmentId={appointmentId}
        context={context}
        currentUserId={currentUserId}
      />
    </div>
  );
}
