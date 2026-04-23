import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-full font-bold shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-[1.02] transition-all border-2 border-emerald-400/30"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
