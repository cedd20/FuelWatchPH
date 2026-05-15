export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  icon: Icon,
  type = "button",
}) {
  const baseStyles = "rounded-full font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap";

  const variantStyles = {
    primary: "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 border-2 border-emerald-400/20",
    secondary: "bg-white dark:bg-neutral-800 text-foreground border-2 border-gray-200 dark:border-neutral-700 shadow-lg shadow-black/5 hover:shadow-xl hover:scale-[1.02] hover:bg-gray-50 dark:hover:bg-neutral-700",
    outline: "border-2 border-gray-200 dark:border-neutral-700 text-foreground bg-white dark:bg-neutral-900 shadow-md hover:shadow-lg hover:border-emerald-400/50 hover:scale-[1.02]",
    ghost: "text-foreground hover:bg-gray-100 dark:hover:bg-neutral-800",
    success: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] border-2 border-teal-400/30",
    destructive: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] border-2 border-rose-400/30",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-xs lg:text-sm",
    md: "px-6 py-3 lg:px-7 lg:py-3.5 text-sm lg:text-base",
    lg: "px-8 py-3.5 lg:px-10 lg:py-4.5 text-base lg:text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {Icon && <Icon className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={2.5} />}
      {children}
    </button>
  );
}
