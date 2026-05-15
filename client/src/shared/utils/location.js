import { PHILIPPINE_CITIES } from "@/shared/utils/philippineCities";

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function normalizeCityName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(city|municipality)\s+of\b/gi, "")
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function findCanonicalCityName(cityName, candidateCities = []) {
  const normalizedCityName = normalizeCityName(cityName);
  if (!normalizedCityName) return "";

  const allCandidates = [
    ...candidateCities,
    ...PHILIPPINE_CITIES.map((city) => city.city),
  ];

  const exactMatch = allCandidates.find(
    (candidate) => normalizeCityName(candidate) === normalizedCityName,
  );

  return exactMatch || String(cityName).trim();
}

function getDistanceInKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestPhilippineCity(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";

  const nearest = PHILIPPINE_CITIES.reduce((closest, city) => {
    const distance = getDistanceInKm(lat, lng, city.lat, city.lng);

    if (!closest || distance < closest.distance) {
      return { name: city.city, distance };
    }

    return closest;
  }, null);

  return nearest?.name || "";
}

export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&email=contact@fuelwatchph.com`;
  
  try {
    const response = await fetch(url, { 
      headers: { 
        "Accept-Language": "en",
      } 
    });

    if (!response.ok) {
      console.warn(`Reverse geocoding failed with status ${response.status}`);
      return { address: "", city: "" };
    }

    const data = await response.json();
    const address = data.address || {};
    const city =
      address.city ||
      address.town ||
      address.municipality ||
      address.city_district ||
      address.county ||
      "";

    const parts = [
      address.house_number,
      address.road,
      address.neighbourhood || address.suburb,
      city,
      address.state || address.province,
      address.postcode,
      address.country,
    ].filter(Boolean);

    return {
      address: parts.join(", ") || data.display_name || "Address not found",
      city,
    };
  } catch (error) {
    console.warn("Reverse geocode error:", error);
    return { address: "", city: "" };
  }
}

export async function resolveCityFromCoordinates(lat, lng, candidateCities = []) {
  const geocoded = await reverseGeocode(lat, lng);
  const canonicalCity =
    findCanonicalCityName(geocoded.city, candidateCities) ||
    getNearestPhilippineCity(lat, lng);

  return {
    ...geocoded,
    city: canonicalCity,
  };
}
