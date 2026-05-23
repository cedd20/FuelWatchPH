import FuelLogo from "@/imports/FuelWithoutBG.svg";

export function AdminLogo({ size = "md", className = "" }) {
  const sizes = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto",
    lg: "h-24 lg:h-28 w-auto",
  };

  return (
    <img
      src={FuelLogo}
      alt="FuelWatch PH logo"
      className={`${sizes[size] || sizes.md} max-w-full object-contain ${className}`.trim()}
    />
  );
}
