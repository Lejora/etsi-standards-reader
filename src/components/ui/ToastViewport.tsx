import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ToastMessage } from "../../features/reader/types";

const toneClasses = {
  success: "border-brand-100 text-brand-700",
  error: "border-red-100 text-red-700",
  info: "border-slate-200 text-slate-700",
};

function ToneIcon({ tone }: { tone: ToastMessage["tone"] }) {
  if (tone === "success") return <CheckCircle2 size={17} className="text-brand-600" />;
  if (tone === "error") return <AlertCircle size={17} className="text-red-500" />;
  return <Info size={17} className="text-slate-500" />;
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss(id: number): void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[340px] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss(id: number): void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 3300);
    const dismissTimer = window.setTimeout(() => onDismiss(toast.id), 3540);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [onDismiss, toast.id]);

  return (
    <div
      className={`${leaving ? "toast-out" : "toast-in"} pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-[0_10px_32px_rgba(16,24,40,0.14)] ${toneClasses[toast.tone]}`}
      role="status"
    >
      <ToneIcon tone={toast.tone} />
      <p className="min-w-0 flex-1 text-sm leading-5">{toast.message}</p>
      <button
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-slate-700"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={15} />
      </button>
    </div>
  );
}
