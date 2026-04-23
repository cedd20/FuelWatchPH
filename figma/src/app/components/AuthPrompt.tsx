import { useNavigate } from "react-router";
import { LogIn, UserPlus, X } from "lucide-react";
import { Button } from "./Button";

interface AuthPromptProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function AuthPrompt({ isOpen, onClose, message }: AuthPromptProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-sm w-full p-6 relative shadow-2xl border-2 border-gray-200 dark:border-neutral-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Sign In Required
          </h3>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/login")}
            fullWidth
            icon={LogIn}
          >
            Sign In
          </Button>
          <Button
            onClick={() => navigate("/signup")}
            variant="secondary"
            fullWidth
            icon={UserPlus}
          >
            Create Account
          </Button>
          <button
            onClick={onClose}
            className="w-full py-2 text-muted-foreground text-sm hover:text-foreground font-medium"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
