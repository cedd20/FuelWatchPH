import { useState } from "react";
import { Mail, Send, X, Loader2, MessageSquare } from "lucide-react";
import { Button } from "./Button";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";

const SUPPORT_EMAIL = "kencas.cyber@gmail.com";
const SUPPORT_SUBJECT = "FuelWatch Support";

export function ContactModal({ isOpen, onClose }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/support/contact", {
        message: message.trim(),
      });
      toast.success("Support message sent successfully.");
      setMessage("");
      onClose();
    } catch (error) {
      toast.error(error?.message || "Could not send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
      {/* Backdrop with enhanced blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-2 border-white/20 dark:border-neutral-800 animate-in zoom-in-95 fade-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Top Decorative Header */}
        <div className="h-32 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700">
          <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute inset-0 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
            <Mail className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all text-white border border-white/20"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 lg:p-10 flex-1 overflow-y-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
              Contact Support
            </h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Have a concern or a question? Send it directly to our team and we'll get back to you as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute left-5 top-5 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your concern or question in detail..."
                rows={5}
                className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-neutral-800/50 rounded-3xl border-2 border-gray-100 dark:border-neutral-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm text-foreground font-medium transition-all resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full py-5 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-xl shadow-emerald-500/20 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  <span>Submit Message</span>
                </>
              )}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Response typically within 24 hours
            </p>
            
          </form>
        </div>
      </div>
    </div>
  );
}
