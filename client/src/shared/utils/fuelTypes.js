export const FUEL_TYPES = [
  "UL91",
  "PR95",
  "PR97",
  "DSL",
  "PDSL",
  "Kerosene",
];

export const DB_FUEL_TYPE_MAPPING = {
  "UL91": "Unleaded 91",
  "PR95": "Unleaded 95",
  "PR97": "Unleaded 98",
  "DSL": "Diesel",
  "PDSL": "Premium Diesel",
  "Kerosene": "Kerosene",
};

export const ALIAS_FUEL_TYPE_MAPPING = {
  "Unleaded 91": "UL91",
  "Unleaded 95": "PR95",
  "Unleaded 98": "PR97",
  "Diesel": "DSL",
  "Premium Diesel": "PDSL",
  "Kerosene": "Kerosene",
};

export function toDBFuelType(label) {
  if (!label) return label;
  return DB_FUEL_TYPE_MAPPING[label] || label;
}

export function toAliasFuelType(label) {
  if (!label) return label;
  return ALIAS_FUEL_TYPE_MAPPING[label] || label;
}

export function canonicalizeFuelType(label) {
  return toAliasFuelType(label);
}

export const BRAND_ABBREVIATIONS = {
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

export function getBrandAbbreviation(brandName) {
  return BRAND_ABBREVIATIONS[brandName] || brandName.substring(0, 3).toUpperCase();
}

export function getPriceLevelColor(price, avgPrice, isDark = false) {
  const diff = price - avgPrice;
  const threshold = avgPrice * 0.015;

  if (diff < -threshold) {
    return {
      bg: isDark ? "bg-emerald-500/20" : "bg-emerald-50",
      border: "border-emerald-500",
      text: "text-emerald-600",
      colorHex: "#10b981",
      label: "Lowest"
    };
  } else if (diff > threshold) {
    return {
      bg: isDark ? "bg-rose-500/20" : "bg-rose-50",
      border: "border-rose-500",
      text: "text-rose-600",
      colorHex: "#f43f5e",
      label: "Highest"
    };
  } else {
    return {
      bg: isDark ? "bg-yellow-500/20" : "bg-yellow-50",
      border: "border-yellow-500",
      text: "text-yellow-600",
      colorHex: "#eab308",
      label: "Average"
    };
  }
}
