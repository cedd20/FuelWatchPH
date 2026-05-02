import { useCallback, useState } from "react";
import { useLocation } from "react-router";
import { useAuth } from "@/app/providers/AuthContext";

export function useAuthGuard({
  defaultReturnTo = "/app/map",
  message = "Sign in to continue.",
} = {}) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [returnTo, setReturnTo] = useState(defaultReturnTo);

  const requireAuth = useCallback(
    (nextReturnTo = `${location.pathname}${location.search}`) => {
      if (isAuthenticated) {
        return true;
      }

      setReturnTo(nextReturnTo || defaultReturnTo);
      setShowAuthPrompt(true);
      return false;
    },
    [defaultReturnTo, isAuthenticated, location.pathname, location.search]
  );

  const closeAuthPrompt = useCallback(() => {
    setShowAuthPrompt(false);
  }, []);

  return {
    isAuthenticated,
    message,
    returnTo,
    requireAuth,
    closeAuthPrompt,
    showAuthPrompt,
  };
}
