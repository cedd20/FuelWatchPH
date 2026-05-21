import { createElement } from "react";
import { CircleCheckBig } from "lucide-react";
import { toast } from "sonner";

export function showAuthSuccessToast(title, description) {
  toast.success(title, {
    description,
    position: "top-center",
    duration: 2600,
    closeButton: true,
    classNames: {
      toast: "auth-success-toast",
      title: "auth-success-toast__title",
      description: "auth-success-toast__description",
      icon: "auth-success-toast__icon",
      closeButton: "auth-success-toast__close",
    },
    icon: createElement(CircleCheckBig, { className: "h-4 w-4", strokeWidth: 2.5 }),
  });
}
