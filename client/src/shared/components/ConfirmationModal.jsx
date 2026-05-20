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
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-2 border-white/20 dark:border-neutral-800 animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
        
        {/* Top Decorative Header */}
        <div className={`h-24 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${
          type === 'warning' ? 'from-amber-400 via-orange-500 to-rose-600' : 'from-emerald-400 via-teal-500 to-cyan-600'
        }`}>
          <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute inset-0 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/30 shadow-2xl">
            {type === 'warning' ? (
              <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
            ) : (
              <Info className="w-6 h-6 text-white" strokeWidth={2.5} />
            )}
          </div>
        </div>

        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight leading-tight">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground font-medium mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex flex-row gap-3 sm:gap-4">
            {cancelText && (
              <Button
                variant="outline"
                onClick={onClose}
                fullWidth
                size="md"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={onConfirm}
              variant={type === 'warning' ? 'primary' : 'primary'}
              fullWidth
              size="md"
              className={`shadow-xl active:scale-95 ${
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
