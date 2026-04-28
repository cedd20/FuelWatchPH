import { AlertTriangle, Info } from "lucide-react";
import { Button } from "./Button";

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message, 
  confirmText = "Proceed", 
  cancelText = "Cancel",
  type = "warning" // warning, info
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-2 border-white/20 dark:border-neutral-800 animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
        
        {/* Top Decorative Header */}
        <div className={`h-32 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${
          type === 'warning' ? 'from-amber-400 via-orange-500 to-rose-600' : 'from-emerald-400 via-teal-500 to-cyan-600'
        }`}>
          <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute inset-0 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
            {type === 'warning' ? (
              <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
            ) : (
              <Info className="w-8 h-8 text-white" strokeWidth={2.5} />
            )}
          </div>
        </div>

        <div className="p-8 lg:p-10 text-center">
          <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 tracking-tight leading-tight">
            {title}
          </h3>
          <p className="text-muted-foreground font-medium mb-10 leading-relaxed">
            {message}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onClose}
              className="px-6 py-4 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-foreground font-bold rounded-2xl transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <Button
              onClick={onConfirm}
              variant={type === 'warning' ? 'primary' : 'primary'}
              className={`py-4 shadow-xl active:scale-95 ${
                type === 'warning' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : ''
              }`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
