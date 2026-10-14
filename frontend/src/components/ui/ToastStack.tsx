import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { ToastMessage, ToastType } from '../../contexts/ToastContext';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  info: <Loader2 className="w-4 h-4 text-primary-400 animate-spin shrink-0" />,
};

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

/** The single floating toast stack for the whole app — see ToastContext.tsx for the useToast() hook. */
export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {[...toasts].reverse().map((toast) => (
        <div
          key={toast.id}
          role="alert"
          aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
          className="pointer-events-auto flex items-center space-x-2.5 bg-navy-950 text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl border border-navy-800 animate-slide-in max-w-sm"
        >
          {ICONS[toast.type]}
          <span className="text-xs font-semibold leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-white/50 hover:text-white shrink-0 cursor-pointer ml-1"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
