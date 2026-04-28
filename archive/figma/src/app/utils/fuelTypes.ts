export const FUEL_TYPES = [
  "Diesel",
  "Premium Diesel",
  "Unleaded 91",
  "Premium 95",
  "Premium 97",
  "Kerosene",
] as const;

export type FuelType = typeof FUEL_TYPES[number];

export const BRAND_ABBREVIATIONS: Record<string, string> = {
  "Shell": "SHL",
  "Caltex": "CAL",
  "Petron": "PET",
  "Seaoil": "SEA",
  "Cleanfuel": "CLN",
  "Unioil": "UNI",
  "Phoenix": "PHX",
  "TotalEnergies": "TOT",
  "Jetti": "JET",
  "RePhil": "RPH",
  "Flying V": "FLV",
};

export function getBrandAbbreviation(brandName: string): string {
  return BRAND_ABBREVIATIONS[brandName] || brandName.substring(0, 3).toUpperCase();
}

export function getPriceLevelColor(price: number, avgPrice: number, isDark: boolean = false) {
  const diff = price - avgPrice;
  const threshold = avgPrice * 0.015; // 1.5% threshold

  if (diff < -threshold) {
    return {
      bg: isDark ? "bg-success/20" : "bg-success/10",
      border: "border-success",
      text: "text-success",
      colorHex: isDark ? "#22C55E" : "#16A34A",
      label: "Lowest"
    };
  } else if (diff > threshold) {
    return {
      bg: isDark ? "bg-destructive/20" : "bg-destructive/10",
      border: "border-destructive",
      text: "text-destructive",
      colorHex: isDark ? "#F87171" : "#DC2626",
      label: "Highest"
    };
  } else {
    return {
      bg: isDark ? "bg-warning/20" : "bg-warning/10",
      border: "border-warning",
      text: "text-warning",
      colorHex: isDark ? "#FBBF24" : "#F59E0B",
      label: "Average"
    };
  }
}
