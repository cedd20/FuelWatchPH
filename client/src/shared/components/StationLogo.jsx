import { getBrandLogo, getAcronym } from "../utils/brandMapping";

export function StationLogo({ name, size = "md", className = "" }) {
  const logo = getBrandLogo(name);
  const acronym = getAcronym(name);

  const sizes = {
    xs: "w-8 h-8 text-xs",
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-2xl",
  };

  const containerClass = `${sizes[size] || sizes.md} ${className} flex items-center justify-center rounded-2xl overflow-hidden flex-shrink-0 shadow-lg`;

  if (logo) {
    return (
      <div className={`${containerClass} bg-white dark:bg-neutral-800 border-2 border-gray-100 dark:border-neutral-700`}>
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain p-1.5 lg:p-2"
        />
      </div>
    );
  }

  return (
    <div className={`${containerClass} bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-emerald-400/30`}>
      <span className="font-black text-white tracking-tighter drop-shadow-md">
        {acronym}
      </span>
    </div>
  );
}
