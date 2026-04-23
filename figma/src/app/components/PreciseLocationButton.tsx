import { useState } from "react";
import { MapPinned, Loader2, AlertCircle, XCircle } from "lucide-react";

interface PreciseLocationButtonProps {
  onLocate: () => void;
}

type LocationState = "idle" | "locating" | "success" | "denied" | "unavailable";

export function PreciseLocationButton({ onLocate }: PreciseLocationButtonProps) {
  const [state, setState] = useState<LocationState>("idle");

  const handleClick = () => {
    setState("locating");

    if (!navigator.geolocation) {
      setState("unavailable");
      setTimeout(() => setState("idle"), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState("success");
        onLocate();
        setTimeout(() => setState("idle"), 2000);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState("denied");
        } else {
          setState("unavailable");
        }
        setTimeout(() => setState("idle"), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const getButtonContent = () => {
    switch (state) {
      case "locating":
        return {
          icon: Loader2,
          label: "Locating...",
          className: "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white animate-pulse border-2 border-emerald-400/30",
          iconClassName: "animate-spin",
        };
      case "success":
        return {
          icon: MapPinned,
          label: "Location Found",
          className: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-2 border-teal-400/30",
          iconClassName: "",
        };
      case "denied":
        return {
          icon: XCircle,
          label: "Permission Denied",
          className: "bg-gradient-to-r from-rose-500 to-red-600 text-white border-2 border-rose-400/30",
          iconClassName: "",
        };
      case "unavailable":
        return {
          icon: AlertCircle,
          label: "Location Unavailable",
          className: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-2 border-yellow-400/30",
          iconClassName: "",
        };
      default:
        return {
          icon: MapPinned,
          label: "Precise Location",
          className: "bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 text-foreground hover:bg-gray-50 dark:hover:bg-neutral-800",
          iconClassName: "",
        };
    }
  };

  const content = getButtonContent();
  const Icon = content.icon;

  return (
    <button
      onClick={handleClick}
      disabled={state === "locating"}
      className={`px-4 py-2.5 rounded-xl shadow-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-[1.02] ${content.className}`}
    >
      <Icon className={`w-4 h-4 ${content.iconClassName}`} strokeWidth={2.5} />
      <span className="whitespace-nowrap">{content.label}</span>
    </button>
  );
}
