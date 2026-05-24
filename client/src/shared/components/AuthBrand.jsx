import fuelLogo from "@/imports/FuelWithoutBG.svg";

export function AuthBrand({ compact = false, className = "" }) {
  const imageSize = compact
    ? "h-12 w-auto sm:h-14"
    : "h-[4.5rem] w-auto sm:h-20 lg:h-24";

  return (
    <div className={`relative inline-flex shrink-0 ${className}`.trim()}>
      <div className="relative shrink-0">
        <div className="absolute inset-2 rounded-full bg-[#2A6B58]/35 blur-2xl" />
        <img
          src={fuelLogo}
          alt="FuelWatch PH logo"
          className={`${imageSize} relative z-10 object-contain drop-shadow-[0_18px_40px_rgba(25,56,52,0.5)]`}
        />
      </div>
    </div>
  );
}
