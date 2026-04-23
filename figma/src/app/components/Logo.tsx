import logoImage from "../../imports/FuelWatch_PH_LOGO-1.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <img
      src={logoImage}
      alt="FuelWatch PH Logo"
      className={`${sizes[size]} ${className}`}
    />
  );
}
