import fuelLogo from "@/imports/FuelWithoutBG.svg";

export function AuthBrand({ compact = false, className = "" }) {
  const imageSize = compact
    ? "h-12 w-12 sm:h-14 sm:w-14"
    : "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20 lg:h-24 lg:w-24";

  const titleSize = compact
    ? "text-base sm:text-lg"
    : "text-2xl sm:text-3xl lg:text-[2rem]";

  return (
    <div className={`flex items-center gap-4 ${className}`.trim()}>
      <div className="relative shrink-0">
        <div className="absolute inset-2 rounded-full bg-[#2A6B58]/35 blur-2xl" />
        <img
          src={fuelLogo}
          alt="FuelWatch PH logo"
          className={`${imageSize} relative z-10 object-contain drop-shadow-[0_18px_40px_rgba(25,56,52,0.5)]`}
        />
      </div>

      <div className="min-w-0">
        <div className={`${titleSize} font-black tracking-tight text-white`}>
          FuelWatch PH
        </div>
      </div>
    </div>
  );
}
