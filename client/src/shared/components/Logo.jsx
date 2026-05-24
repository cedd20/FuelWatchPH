import fuelLogo from "@/imports/FuelWithoutBG.svg";

export function Logo({ size = "md", className = "" }) {
  const sizes = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto lg:h-12",
    lg: "h-24 w-auto lg:h-28",
  };

  return (
    <img
      src={fuelLogo}
      alt="FuelWatch PH logo"
      className={`${sizes[size] || sizes.md} max-w-full object-contain ${className}`.trim()}
    />
  );
}
