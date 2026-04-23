export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-gray-50 dark:bg-neutral-800 flex items-center justify-center mb-6 shadow-xl shadow-black/5 border-2 border-gray-100 dark:border-neutral-800">
        <Icon className="w-12 h-12 text-emerald-600" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-sm font-medium">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-2xl shadow-emerald-500/30 hover:scale-[1.05] transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
