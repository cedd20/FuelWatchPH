import logoImage from "../../imports/FuelWatch_PH_LOGO-1.png";

export function Logo({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10 lg:w-12 lg:h-12",
    lg: "w-24 h-24 lg:w-28 lg:h-28",
  };

  return (
    <img
      src={logoImage}
      alt="FuelWatch PH Logo"
      className={`${sizes[size] || sizes.md} ${className} object-contain`}
    />
  );
}
