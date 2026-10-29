import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading hospital data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}

export function EmptyState({ title = 'No records found', description = 'There are no items matching your criteria.', action }) {
  return (
    <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
        📦
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function AlertBanner({ type = 'info', message, onClose }) {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
  };

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${styles[type]} shadow-sm mb-4`}>
      <span className="font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-4 font-bold text-xs opacity-70 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-left">
          <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-600 mb-6">{message}</p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm ${
                isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
