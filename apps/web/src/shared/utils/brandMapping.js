import caltexLogo from "../../imports/Caltex.png";
import flyingVLogo from "../../imports/Flying V.jpg";
import jettiLogo from "../../imports/Jetti.png";
import petronLogo from "../../imports/Petron-Logo.jpg";
import phoenixLogo from "../../imports/Phoenix.png";
import rephilLogo from "../../imports/RePhil.png";
import seaoilLogo from "../../imports/Seaoil.png";
import shellLogo from "../../imports/Shell-Logo.png";
import totalLogo from "../../imports/TotalEnergies.png";
import unioilLogo from "../../imports/Unioil.png";
import unoLogo from "../../imports/Uno.png";

const BRANDS = [
  { name: "Caltex", logo: caltexLogo, filename: "caltex" },
  { name: "Flying V", logo: flyingVLogo, filename: "flyingv" },
  { name: "Jetti", logo: jettiLogo, filename: "jetti" },
  { name: "Petron", logo: petronLogo, filename: "petronlogo" },
  { name: "Phoenix", logo: phoenixLogo, filename: "phoenix" },
  { name: "RePhil", logo: rephilLogo, filename: "rephil" },
  { name: "Seaoil", logo: seaoilLogo, filename: "seaoil" },
  { name: "Shell", logo: shellLogo, filename: "shelllogo" },
  { name: "TotalEnergies", logo: totalLogo, filename: "totalenergies" },
  { name: "Unioil", logo: unioilLogo, filename: "unioil" },
  { name: "Uno", logo: unoLogo, filename: "uno" },
];

/**
 * Normalizes a string for matching by removing special characters, spaces, and converting to lowercase.
 */
const normalize = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

/**
 * Gets the logo for a station name.
 * @param {string} stationName 
 * @returns {string|null} The logo path or null if no match.
 */
export const getBrandLogo = (stationName) => {
  if (!stationName) return null;
  const normalizedName = normalize(stationName);

  for (const brand of BRANDS) {
    const normalizedBrand = normalize(brand.filename);
    const normalizedDisplayName = normalize(brand.name);
    
    // Check if station name contains brand name, or brand filename contains station name
    if (
      normalizedName.includes(normalizedBrand) || 
      normalizedBrand.includes(normalizedName) ||
      normalizedName.includes(normalizedDisplayName)
    ) {
      return brand.logo;
    }
  }

  return null;
};

/**
 * Generates an acronym for a station name.
 * @param {string} name 
 * @returns {string}
 */
export const getAcronym = (name) => {
  if (!name) return "FW";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
