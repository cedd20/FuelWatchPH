// Complete list of Philippine cities and municipalities
// Sorted by region for geo-proximity grouping
// Source: Philippine Statistics Authority PSGC

export const PHILIPPINE_REGIONS = {
  'NCR': 'National Capital Region',
  'CAR': 'Cordillera Administrative Region',
  'Region I': 'Ilocos Region',
  'Region II': 'Cagayan Valley',
  'Region III': 'Central Luzon',
  'Region IV-A': 'CALABARZON',
  'Region IV-B': 'MIMAROPA',
  'Region V': 'Bicol Region',
  'Region VI': 'Western Visayas',
  'Region VII': 'Central Visayas',
  'Region VIII': 'Eastern Visayas',
  'Region IX': 'Zamboanga Peninsula',
  'Region X': 'Northern Mindanao',
  'Region XI': 'Davao Region',
  'Region XII': 'SOCCSKSARGEN',
  'Region XIII': 'Caraga',
  'BARMM': 'Bangsamoro Autonomous Region',
};

export const PHILIPPINE_CITIES = [
  // NCR — Metro Manila (All Cities and Municipality)
  { city: 'Manila', province: 'Metro Manila', region: 'NCR', lat: 14.5995, lng: 120.9842 },
  { city: 'Quezon City', province: 'Metro Manila', region: 'NCR', lat: 14.6760, lng: 121.0437 },
  { city: 'Makati', province: 'Metro Manila', region: 'NCR', lat: 14.5547, lng: 121.0244 },
  { city: 'Pasig', province: 'Metro Manila', region: 'NCR', lat: 14.5764, lng: 121.0851 },
  { city: 'Taguig', province: 'Metro Manila', region: 'NCR', lat: 14.5243, lng: 121.0613 },
  { city: 'Mandaluyong', province: 'Metro Manila', region: 'NCR', lat: 14.5794, lng: 121.0359 },
  { city: 'Marikina', province: 'Metro Manila', region: 'NCR', lat: 14.6507, lng: 121.1029 },
  { city: 'Pasay', province: 'Metro Manila', region: 'NCR', lat: 14.5378, lng: 121.0014 },
  { city: 'Parañaque', province: 'Metro Manila', region: 'NCR', lat: 14.4793, lng: 121.0198 },
  { city: 'Las Piñas', province: 'Metro Manila', region: 'NCR', lat: 14.4445, lng: 120.9936 },
  { city: 'Muntinlupa', province: 'Metro Manila', region: 'NCR', lat: 14.4079, lng: 121.0415 },
  { city: 'Caloocan', province: 'Metro Manila', region: 'NCR', lat: 14.6494, lng: 120.9676 },
  { city: 'Malabon', province: 'Metro Manila', region: 'NCR', lat: 14.6628, lng: 120.9571 },
  { city: 'Navotas', province: 'Metro Manila', region: 'NCR', lat: 14.6667, lng: 120.9427 },
  { city: 'Valenzuela', province: 'Metro Manila', region: 'NCR', lat: 14.7011, lng: 120.9830 },
  { city: 'San Juan', province: 'Metro Manila', region: 'NCR', lat: 14.6000, lng: 121.0333 },
  { city: 'Pateros', province: 'Metro Manila', region: 'NCR', lat: 14.5450, lng: 121.0689 },

  // Region I — Ilocos
  { city: 'Laoag', province: 'Ilocos Norte', region: 'Region I', lat: 18.1977, lng: 120.5936 },
  { city: 'Vigan', province: 'Ilocos Sur', region: 'Region I', lat: 17.5747, lng: 120.3869 },
  { city: 'Candon', province: 'Ilocos Sur', region: 'Region I', lat: 17.1100, lng: 120.4480 },
  { city: 'San Fernando', province: 'La Union', region: 'Region I', lat: 16.6159, lng: 120.3166 },
  { city: 'Dagupan', province: 'Pangasinan', region: 'Region I', lat: 16.0433, lng: 120.3333 },
  { city: 'San Carlos', province: 'Pangasinan', region: 'Region I', lat: 15.9281, lng: 120.3489 },
  { city: 'Urdaneta', province: 'Pangasinan', region: 'Region I', lat: 15.9750, lng: 120.5708 },
  { city: 'Alaminos', province: 'Pangasinan', region: 'Region I', lat: 16.1555, lng: 119.9805 },
  { city: 'Lingayen', province: 'Pangasinan', region: 'Region I', lat: 16.0210, lng: 120.2320 },

  // Region II — Cagayan Valley
  { city: 'Tuguegarao', province: 'Cagayan', region: 'Region II', lat: 17.6132, lng: 121.7271 },
  { city: 'Cauayan', province: 'Isabela', region: 'Region II', lat: 16.9333, lng: 121.7667 },
  { city: 'Ilagan', province: 'Isabela', region: 'Region II', lat: 17.1367, lng: 121.8833 },
  { city: 'Santiago', province: 'Isabela', region: 'Region II', lat: 16.6885, lng: 121.5492 },
  { city: 'Bayombong', province: 'Nueva Vizcaya', region: 'Region II', lat: 16.4833, lng: 121.1500 },

  // Region III — Central Luzon
  { city: 'Angeles City', province: 'Pampanga', region: 'Region III', lat: 15.1450, lng: 120.5887 },
  { city: 'Mabalacat', province: 'Pampanga', region: 'Region III', lat: 15.2200, lng: 120.5730 },
  { city: 'San Fernando', province: 'Pampanga', region: 'Region III', lat: 15.0285, lng: 120.6943 },
  { city: 'Olongapo', province: 'Zambales', region: 'Region III', lat: 14.8292, lng: 120.2828 },
  { city: 'Malolos', province: 'Bulacan', region: 'Region III', lat: 14.8527, lng: 120.8119 },
  { city: 'Meycauayan', province: 'Bulacan', region: 'Region III', lat: 14.7362, lng: 120.9609 },
  { city: 'San Jose del Monte', province: 'Bulacan', region: 'Region III', lat: 14.8142, lng: 121.0453 },
  { city: 'Cabanatuan', province: 'Nueva Ecija', region: 'Region III', lat: 15.4885, lng: 120.9734 },
  { city: 'Tarlac City', province: 'Tarlac', region: 'Region III', lat: 15.4755, lng: 120.5960 },
  { city: 'Balanga', province: 'Bataan', region: 'Region III', lat: 14.6781, lng: 120.5394 },

  // Region IV-A — CALABARZON
  { city: 'Antipolo', province: 'Rizal', region: 'Region IV-A', lat: 14.5865, lng: 121.1760 },
  { city: 'Bacoor', province: 'Cavite', region: 'Region IV-A', lat: 14.4624, lng: 120.9645 },
  { city: 'Dasmariñas', province: 'Cavite', region: 'Region IV-A', lat: 14.3294, lng: 120.9367 },
  { city: 'Imus', province: 'Cavite', region: 'Region IV-A', lat: 14.4297, lng: 120.9367 },
  { city: 'Tagaytay', province: 'Cavite', region: 'Region IV-A', lat: 14.1153, lng: 120.9621 },
  { city: 'Calamba', province: 'Laguna', region: 'Region IV-A', lat: 14.2116, lng: 121.1653 },
  { city: 'Sta. Rosa', province: 'Laguna', region: 'Region IV-A', lat: 14.3122, lng: 121.1114 },
  { city: 'Biñan', province: 'Laguna', region: 'Region IV-A', lat: 14.3406, lng: 121.0803 },
  { city: 'San Pedro', province: 'Laguna', region: 'Region IV-A', lat: 14.3588, lng: 121.0472 },
  { city: 'San Pablo', province: 'Laguna', region: 'Region IV-A', lat: 14.0711, lng: 121.3250 },
  { city: 'Batangas City', province: 'Batangas', region: 'Region IV-A', lat: 13.7565, lng: 121.0583 },
  { city: 'Lipa', province: 'Batangas', region: 'Region IV-A', lat: 13.9411, lng: 121.1640 },
  { city: 'Tanauan', province: 'Batangas', region: 'Region IV-A', lat: 14.0847, lng: 121.1517 },
  { city: 'Lucena', province: 'Quezon', region: 'Region IV-A', lat: 13.9373, lng: 121.6170 },
  { city: 'Gumaca', province: 'Quezon', region: 'Region IV-A', lat: 14.6608, lng: 121.8078 },
  { city: 'Tagkawayan', province: 'Quezon', region: 'Region IV-A', lat: 14.6925, lng: 121.8364 },

  // Region IV-B — MIMAROPA
  { city: 'Calapan', province: 'Oriental Mindoro', region: 'Region IV-B', lat: 13.4116, lng: 121.1794 },
  { city: 'Puerto Princesa', province: 'Palawan', region: 'Region IV-B', lat: 9.7392, lng: 118.7353 },

  // Region V — Bicol
  { city: 'Legazpi', province: 'Albay', region: 'Region V', lat: 13.1391, lng: 123.7438 },
  { city: 'Naga', province: 'Camarines Sur', region: 'Region V', lat: 13.6192, lng: 123.1814 },
  { city: 'Sorsogon City', province: 'Sorsogon', region: 'Region V', lat: 12.9667, lng: 124.0000 },
  { city: 'Masbate City', province: 'Masbate', region: 'Region V', lat: 12.3667, lng: 123.6167 },

  // Region VI — Western Visayas
  { city: 'Iloilo City', province: 'Iloilo', region: 'Region VI', lat: 10.7202, lng: 122.5621 },
  { city: 'Bacolod', province: 'Negros Occidental', region: 'Region VI', lat: 10.6765, lng: 122.9509 },
  { city: 'San Carlos', province: 'Negros Occidental', region: 'Region VI', lat: 10.4833, lng: 123.4167 },
  { city: 'Roxas City', province: 'Capiz', region: 'Region VI', lat: 11.5854, lng: 122.7511 },

  // Region VII — Central Visayas
  { city: 'Cebu City', province: 'Cebu', region: 'Region VII', lat: 10.3157, lng: 123.8854 },
  { city: 'Mandaue', province: 'Cebu', region: 'Region VII', lat: 10.3540, lng: 123.9311 },
  { city: 'Lapu-Lapu', province: 'Cebu', region: 'Region VII', lat: 10.3103, lng: 123.9494 },
  { city: 'Talisay', province: 'Cebu', region: 'Region VII', lat: 10.2447, lng: 123.8483 },
  { city: 'Tagbilaran', province: 'Bohol', region: 'Region VII', lat: 9.6500, lng: 123.8500 },
  { city: 'Dumaguete', province: 'Negros Oriental', region: 'Region VII', lat: 9.3068, lng: 123.3054 },

  // Region VIII — Eastern Visayas
  { city: 'Tacloban', province: 'Leyte', region: 'Region VIII', lat: 11.2543, lng: 125.0000 },
  { city: 'Ormoc', province: 'Leyte', region: 'Region VIII', lat: 11.0000, lng: 124.6000 },
  { city: 'Calbayog', province: 'Samar', region: 'Region VIII', lat: 12.0667, lng: 124.6000 },

  // Region IX — Zamboanga Peninsula
  { city: 'Zamboanga City', province: 'Zamboanga del Sur', region: 'Region IX', lat: 6.9103, lng: 122.0739 },
  { city: 'Pagadian', province: 'Zamboanga del Sur', region: 'Region IX', lat: 7.8250, lng: 123.4333 },
  { city: 'Dipolog', province: 'Zamboanga del Norte', region: 'Region IX', lat: 8.5833, lng: 123.3333 },

  // Region X — Northern Mindanao
  { city: 'Cagayan de Oro', province: 'Misamis Oriental', region: 'Region X', lat: 8.4542, lng: 124.6319 },
  { city: 'Iligan', province: 'Lanao del Norte', region: 'Region X', lat: 8.2280, lng: 124.2452 },
  { city: 'Malaybalay', province: 'Bukidnon', region: 'Region X', lat: 8.1575, lng: 125.1278 },
  { city: 'Ozamiz', province: 'Misamis Occidental', region: 'Region X', lat: 8.1472, lng: 123.8428 },

  // Region XI — Davao
  { city: 'Davao City', province: 'Davao del Sur', region: 'Region XI', lat: 7.1907, lng: 125.4553 },
  { city: 'Tagum', province: 'Davao del Norte', region: 'Region XI', lat: 7.4478, lng: 125.8077 },
  { city: 'Digos', province: 'Davao del Sur', region: 'Region XI', lat: 6.7498, lng: 125.3574 },

  // Region XII — SOCCSKSARGEN
  { city: 'General Santos', province: 'South Cotabato', region: 'Region XII', lat: 6.1164, lng: 125.1716 },
  { city: 'Koronadal', province: 'South Cotabato', region: 'Region XII', lat: 6.5036, lng: 124.8464 },
  { city: 'Cotabato City', province: 'Maguindanao del Norte', region: 'Region XII', lat: 7.2208, lng: 124.2444 },

  // Region XIII — Caraga
  { city: 'Butuan', province: 'Agusan del Norte', region: 'Region XIII', lat: 8.9476, lng: 125.5430 },
  { city: 'Surigao City', province: 'Surigao del Norte', region: 'Region XIII', lat: 9.7833, lng: 125.4833 },

  // BARMM — Bangsamoro
  { city: 'Marawi', province: 'Lanao del Sur', region: 'BARMM', lat: 8.0000, lng: 124.3000 },
  { city: 'Lamitan', province: 'Basilan', region: 'BARMM', lat: 6.6583, lng: 122.1333 },

  // CAR — Cordillera
  { city: 'Baguio', province: 'Benguet', region: 'CAR', lat: 16.4023, lng: 120.5960 },
  { city: 'Tabuk', province: 'Kalinga', region: 'CAR', lat: 17.4500, lng: 121.4333 },
];

/**
 * Returns cities sorted by proximity to a given lat/lng.
 * Cities nearest to the user's location appear first.
 * @param {number} userLat
 * @param {number} userLng
 * @returns {Array} sorted city objects
 */
export function getCitiesSortedByProximity(userLat, userLng) {
  if (!userLat || !userLng) return PHILIPPINE_CITIES;

  return [...PHILIPPINE_CITIES].sort((a, b) => {
    const distA = Math.sqrt(
      Math.pow(a.lat - userLat, 2) + Math.pow(a.lng - userLng, 2)
    );
    const distB = Math.sqrt(
      Math.pow(b.lat - userLat, 2) + Math.pow(b.lng - userLng, 2)
    );
    return distA - distB;
  });
}

export const CITY_NAMES = PHILIPPINE_CITIES.map(c => c.city);

// Utility to get a unique key for a city
export const getCityKey = (cityObj) => `${cityObj.city}-${cityObj.province}`;
