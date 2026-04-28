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
  const baseStyles = "rounded-full font-bold transition-all flex items-center justify-center gap-2";

  const variantStyles = {
    primary: "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 border-2 border-emerald-400/30",
    secondary: "bg-white dark:bg-neutral-800 text-foreground border-2 border-gray-200 dark:border-neutral-700 shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-[1.02] hover:bg-gray-50 dark:hover:bg-neutral-700 font-bold",
    outline: "border-2 border-gray-200 dark:border-neutral-700 text-foreground bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl hover:border-emerald-400/50 hover:scale-[1.02]",
    ghost: "text-foreground hover:bg-gray-100 dark:hover:bg-neutral-800",
    success: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-2xl shadow-teal-500/50 hover:shadow-teal-500/70 hover:scale-[1.02] border-2 border-teal-400/30",
    destructive: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-2xl shadow-rose-500/50 hover:shadow-rose-500/70 hover:scale-[1.02] border-2 border-rose-400/30",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3.5 lg:px-8 lg:py-4 text-base lg:text-lg",
    lg: "px-8 py-4 text-lg lg:px-10 lg:py-5 lg:text-xl",
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
