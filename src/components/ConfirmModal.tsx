import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  AlertCircle, 
  ShieldCheck, 
  X 
} from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode | string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white dark:bg-[#0B2B26] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative top bar */}
        <div 
          className={`h-1.5 w-full ${
            isDanger 
              ? 'bg-rose-500' 
              : isWarning 
              ? 'bg-amber-500' 
              : 'bg-emerald-600'
          }`} 
        />

        {/* Close icon button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Tutup (ESC)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-4">
          {/* Header with Icon and Trust Badge */}
          <div className="flex items-start gap-3.5">
            <div 
              className={`p-3 rounded-2xl shrink-0 ${
                isDanger 
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-8 ring-rose-50 dark:ring-rose-900/20' 
                  : isWarning 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-8 ring-amber-50 dark:ring-amber-900/20' 
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-900/20'
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-5 h-5" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-[#8EB69B] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Konfirmasi Keamanan BQA</span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                {title}
              </h3>
            </div>
          </div>

          {/* Message Body */}
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2.5 rounded-xl font-bold text-white transition-all text-xs sm:text-sm shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-98 shadow-rose-200 dark:shadow-none'
                  : isWarning
                  ? 'bg-amber-600 hover:bg-amber-700 active:scale-98 shadow-amber-200 dark:shadow-none'
                  : 'bg-[#163832] hover:bg-[#0B2B26] active:scale-98 shadow-emerald-200 dark:shadow-none'
              }`}
            >
              {isLoading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
