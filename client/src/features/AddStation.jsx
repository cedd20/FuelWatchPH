import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, Loader2, Move } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { useCreateStation, useUpdateStation } from "@/hooks/useStations";
import { useReportPrice, useReportPricesBatch } from "@/hooks/usePrices";
import { KarmaService } from "@/lib/karmaService";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

// Fix Leaflet default marker icon for Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom draggable green pin icon for the placement marker
const placementIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #10b981, #0d9488);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(16,185,129,0.5);
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// ─── Map Click & Drag Handler Component ────────────────────────────────────
// This inner component uses useMapEvents so it can only be rendered inside MapContainer
function MapInteractions({ onPinSet, onMapMove }) {
  useMapEvents({
    click(e) {
      // TODO: Replace with map click event from backend map tile provider
      onPinSet(e.latlng.lat, e.latlng.lng, "click");
    },
    moveend(e) {
      const center = e.target.getCenter();
      if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
        // Use an explicit check for the prop to avoid potential ReferenceError in some environments
        if (typeof onMapMove === 'function') {
          onMapMove(center.lat, center.lng);
        }
      }
    }
  });
  return null;
}

// ─── Reverse Geocode Helper ─────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  // TODO: Replace with API call to backend geocoding service
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  const a = data.address || {};
  const city = a.city || a.town || a.municipality || a.city_district || "";
  const parts = [
    a.house_number,
    a.road,
    a.neighbourhood || a.suburb,
    city,
    a.state || a.province,
    a.postcode,
    a.country,
  ].filter(Boolean);
  return { 
    address: parts.join(", ") || data.display_name || "Address not found",
    city: city 
  };
}

function getFuelPriceValue(station, fuelLabel) {
  const price = station?.prices?.find((entry) => entry.type === fuelLabel)?.price;
  return price === undefined || price === null ? "" : String(price);
}

// ─── Main AddStation Component ──────────────────────────────────────────────
export function AddStation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const mapRef = useRef(null);
  const existingStation = location.state?.station ?? null;
  const isEditMode = Boolean(existingStation);

  const queryClient = useQueryClient();
  const createStationMutation = useCreateStation();
  const updateStationMutation = useUpdateStation();
  const reportPricesBatchMutation = useReportPricesBatch();

  // Form state
  const [stationName, setStationName] = useState(existingStation?.name ?? "");
  const [address, setAddress] = useState(existingStation?.address ?? "");
  const [city, setCity] = useState(existingStation?.city ?? "");
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [prices, setPrices] = useState({
    diesel: getFuelPriceValue(existingStation, "Diesel"),
    premiumdiesel: getFuelPriceValue(existingStation, "Premium Diesel"),
    unleaded91: getFuelPriceValue(existingStation, "Unleaded 91"),
    unleaded95: getFuelPriceValue(existingStation, "Unleaded 95"),
    unleaded98: getFuelPriceValue(existingStation, "Unleaded 98"),
    kerosene: getFuelPriceValue(existingStation, "Kerosene"),
  });

  // Pin placement state
  const [stationLat, setStationLat] = useState(existingStation?.lat ?? null);
  const [stationLng, setStationLng] = useState(existingStation?.lng ?? null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocodingPin, setIsGeocodingPin] = useState(false);
  const [pinMode, setPinMode] = useState(false); // true = user placing pin manually
  // Default map center: Metro Manila
  const [mapCenter, setMapCenter] = useState(existingStation?.lat && existingStation?.lng ? [existingStation.lat, existingStation.lng] : [14.5995, 120.9842]);
  
  // OSM Suggestions state
  const [osmSuggestions, setOsmSuggestions] = useState([]);
  const [isFetchingOSM, setIsFetchingOSM] = useState(false);

  // ── Auth Check ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  // ── Auto-fly map to new pin position ──────────────────────────────────────
  useEffect(() => {
    // Robust check for valid coordinates to prevent "Invalid LatLng object: (NaN, NaN)"
    const isValidLat = typeof stationLat === 'number' && Number.isFinite(stationLat);
    const isValidLng = typeof stationLng === 'number' && Number.isFinite(stationLng);
    
    if (isValidLat && isValidLng && mapRef.current) {
      try {
        const map = mapRef.current;
        const currentCenter = map.getCenter();
        
        // Only fly if the distance is significant to avoid loops
        const dist = Math.sqrt(Math.pow(currentCenter.lat - stationLat, 2) + Math.pow(currentCenter.lng - stationLng, 2));
        if (dist > 0.0001) {
          map.flyTo([stationLat, stationLng], 17, { animate: true, duration: 0.8 });
        }
      } catch (e) {
        console.warn("flyTo failed:", e);
      }
    }
  }, [stationLat, stationLng]);

  // ── Handle pin placement (from click or GPS) ───────────────────────────────
  const handlePinSet = useCallback(async (lat, lng, source = "click") => {
    setStationLat(lat);
    setStationLng(lng);
    setShowDuplicateWarning(false);
    setDuplicateInfo(null);

    // Reverse geocode the clicked position to fill in the address
    setIsGeocodingPin(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setAddress(result.address);
      // Standardize city name (Title Case)
      const standardizedCity = result.city
        ? result.city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : "Unknown City";
      setCity(standardizedCity);
      
      if (source === "click") {
        toast.success("Pin placed! Drag it to fine-tune the position.");
      }
    } catch {
      toast.error("Could not resolve address for this location.");
    } finally {
      setIsGeocodingPin(false);
    }
  }, []);

  // ── Handle marker drag end ─────────────────────────────────────────────────
  const handleMarkerDragEnd = useCallback(async (e) => {
    const { lat, lng } = e.target.getLatLng();
    await handlePinSet(lat, lng, "drag");
    toast.success("Pin repositioned! Address updated.");
  }, [handlePinSet]);

  // ── Fetch OSM Suggestions ────────────────────────────────────────────────
  const fetchOSMSuggestions = useCallback(async (lat, lng) => {
    if (isEditMode) return;
    setIsFetchingOSM(true);
    try {
      const radius = 1500; // 1.5km
      const query = `[out:json];node["amenity"="fuel"](around:${radius},${lat},${lng});out;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        console.warn(`OSM API returned status ${res.status}`);
        return;
      }
      
      const data = await res.json();
      
      const suggestions = (data.elements || []).map(el => ({
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: el.tags.name || "Unknown Station",
        brand: el.tags.brand || el.tags.name || "Independent",
      }));
      setOsmSuggestions(suggestions);
    } catch (err) {
      console.warn("Failed to fetch OSM suggestions", err);
    } finally {
      setIsFetchingOSM(false);
    }
  }, [isEditMode]);

  const osmFetchTimeoutRef = useRef(null);

  // ── Handle map move ────────────────────────────────────────────────────────
  const handleMapMove = useCallback((lat, lng) => {
    // Update map center and fetch suggestions based on new center
    setMapCenter([lat, lng]);
    
    if (osmFetchTimeoutRef.current) {
      clearTimeout(osmFetchTimeoutRef.current);
    }
    
    osmFetchTimeoutRef.current = setTimeout(() => {
      fetchOSMSuggestions(lat, lng);
    }, 1500);
  }, [fetchOSMSuggestions]);


  const handleOSMSuggestionClick = useCallback(async (suggestion) => {
    setStationName(suggestion.name);
    await handlePinSet(suggestion.lat, suggestion.lng, "osm");
    toast.success(`Auto-filled from OSM: ${suggestion.name}`);
  }, [handlePinSet]);

  // ── Use GPS Current Location ───────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        await handlePinSet(latitude, longitude, "gps");
        toast.success("GPS location detected! You can still drag the pin to adjust.");
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        toast.error(`Location error: ${error.message}. Check browser permissions.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Form submission ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (stationLat == null || stationLng == null) {
      toast.error("Please place a pin on the map.");
      setIsSubmitting(false);
      return;
    }

    try {
      const stationPayload = {
        name: stationName,
        brand: stationName.split(" ")[0] || "Independent",
        address,
        city,
        province: "Philippines", // Default
        lat: stationLat,
        lng: stationLng,
      };

      let stationId;
      if (isEditMode && existingStation?.id) {
        await updateStationMutation.mutateAsync({ id: existingStation.id, data: stationPayload });
        stationId = existingStation.id;
      } else {
        const newStation = await createStationMutation.mutateAsync(stationPayload);
        stationId = newStation.id;

        // Track contribution in KarmaService
        KarmaService.addContribution('Added Station', {
          stationName: stationName
        });
      }

      // Submit prices in batch
      const priceBatch = [
        { key: "diesel", type: "Diesel" },
        { key: "premiumdiesel", type: "Premium Diesel" },
        { key: "unleaded91", type: "Unleaded 91" },
        { key: "unleaded95", type: "Unleaded 95" },
        { key: "unleaded98", type: "Unleaded 98" },
        { key: "kerosene", type: "Kerosene" },
      ]
      .filter((entry) => prices[entry.key] !== "")
      .map(entry => ({
        station_id: stationId,
        fuel_type: entry.type,
        price: parseFloat(prices[entry.key]),
        observed_at: new Date().toISOString()
      }));

      if (priceBatch.length > 0) {
        await reportPricesBatchMutation.mutateAsync(priceBatch);
      }

      // Invalidate notifications to show the "Station Added" notification immediately
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      setShowSuccess(true);
      setTimeout(() => {
        navigate(isEditMode ? `/app/station/${stationId}` : "/app/home");
      }, 2000);
    } catch (error) {
      toast.error("Failed to save station. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-teal-500/50">
          <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">{isEditMode ? "Station Updated!" : "Station Added!"}</h2>
        <p className="text-center text-muted-foreground font-medium">
          {isEditMode ? "Your station changes have been saved" : "Thank you for contributing to the community"}
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Redirecting to map...
        </p>
      </div>
    );
  }

  return (
    <>
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => {
          setShowAuthPrompt(false);
          navigate(-1);
        }}
        message="Sign in to add new stations and help the community discover fuel prices."
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20 lg:pb-10">

        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 lg:pb-12 px-4 lg:px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-3 lg:mb-4">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </button>
              <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">{isEditMode ? "Edit Station" : "Add New Station"}</h1>
            </div>
            <p className="text-white/95 text-sm lg:text-base font-medium drop-shadow-lg pl-1 lg:pl-0">
              Place a pin on the map to set the exact location
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 lg:px-8 py-6 lg:py-10">
          <div className="max-w-6xl mx-auto">

            {/* ── DESKTOP 3-COL LAYOUT ── */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">

              {/* Left 2/3 — Form Fields + Map */}
              <div className="lg:col-span-2 space-y-8">

                {/* Station Information Card */}
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-8 shadow-2xl shadow-black/10">
                  <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">Station Information</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-base font-bold text-foreground mb-3">Station Name *</label>
                      <input
                        type="text"
                        value={stationName}
                        onChange={(e) => { setStationName(e.target.value); setShowDuplicateWarning(false); }}
                        placeholder="e.g., Petron EDSA"
                        className="w-full px-5 py-4 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-lg text-foreground font-medium text-base transition-all"
                        required
                      />
                    </div>

                    {/* Duplicate Warning */}
                    {showDuplicateWarning && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-400/50 rounded-2xl p-6 flex items-start gap-4 shadow-xl shadow-yellow-500/10">
                        <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-warning mb-2 text-base">Duplicate Location Detected</div>
                          <div className="text-sm text-warning/80 mb-1">
                            "{duplicateInfo?.name}" already exists {duplicateInfo?.distance}m from this location.
                          </div>
                          <div className="text-sm text-warning/70">
                            Please drag the pin to a different position.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full Address */}
                    <div>
                      <label className="block text-base font-bold text-foreground mb-3">Full Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                        {isGeocodingPin && (
                          <Loader2 className="absolute right-4 top-4 w-5 h-5 text-emerald-500 animate-spin" />
                        )}
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Click on the map or use GPS to auto-fill address"
                          rows={3}
                          className="w-full pl-12 pr-12 py-4 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 resize-none shadow-lg text-foreground font-medium text-base transition-all"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="mt-3 text-base text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 hover:underline disabled:opacity-50"
                      >
                        {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                        {isLocating ? "Locating..." : "Use current location"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Interactive Map Pin Placement Card ── */}
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 overflow-hidden">
                  {/* Map Header */}
                  <div className="px-8 py-5 border-b-2 border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground tracking-tight">Pin Location</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {stationLat
                          ? `📍 ${stationLat.toFixed(6)}, ${stationLng.toFixed(6)} — Drag pin to fine-tune`
                          : "Click anywhere on the map to place a pin"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                      <Move className="w-3.5 h-3.5" />
                      <span>Click or drag</span>
                    </div>
                  </div>
                  {/* Map */}
                  <div className="h-72 relative">
                    <MapContainer
                      ref={mapRef}
                      center={mapCenter}
                      zoom={14}
                      zoomControl={true}
                      className="w-full h-full"
                      style={{ cursor: "crosshair" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {/* Click handler */}
                      <MapInteractions onPinSet={handlePinSet} onMapMove={handleMapMove} />
                      {/* OSM Suggestions */}
                      {osmSuggestions.map(s => (
                        <Marker 
                          key={s.id} 
                          position={[s.lat, s.lng]} 
                          icon={L.divIcon({
                            className: "",
                            html: `<div style="width: 12px; height: 12px; background: #9ca3af; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
                            iconSize: [12, 12],
                            iconAnchor: [6, 6]
                          })}
                          eventHandlers={{ click: () => handleOSMSuggestionClick(s) }}
                        >
                        </Marker>
                      ))}
                      {/* Draggable Pin */}
                      {Number.isFinite(stationLat) && Number.isFinite(stationLng) && (
                        <Marker
                          position={[stationLat, stationLng]}
                          icon={placementIcon}
                          draggable={true}
                          eventHandlers={{ dragend: handleMarkerDragEnd }}
                        />
                      )}
                    </MapContainer>
                    {/* Overlay hint when no pin placed */}
                    {!stationLat && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border-2 border-emerald-400/30 text-center">
                          <MapPin className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-sm font-bold text-foreground">Click on the map to place pin</p>
                          <p className="text-xs text-muted-foreground mt-1">Or use GPS button above</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fuel Prices Card */}
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-8 shadow-2xl shadow-black/10">
                  <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">
                    Initial Fuel Prices <span className="text-muted-foreground font-medium text-base">(Optional)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      { key: "diesel", label: "Diesel" },
                      { key: "premiumdiesel", label: "Premium Diesel" },
                      { key: "unleaded91", label: "Unleaded 91" },
                      { key: "unleaded95", label: "Unleaded 95" },
                      { key: "unleaded98", label: "Unleaded 98" },
                      { key: "kerosene", label: "Kerosene" },
                    ].map((fuel) => (
                      <div key={fuel.key}>
                        <label className="block text-sm font-bold text-muted-foreground mb-2">{fuel.label}</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-base">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            value={prices[fuel.key]}
                            onChange={(e) => setPrices({ ...prices, [fuel.key]: e.target.value })}
                            placeholder="0.00"
                            className="w-full pl-10 pr-5 py-4 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-lg text-foreground font-medium text-base transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 1/3 — Sidebar */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-6 space-y-6">

                  {/* Pin Status Card */}
                  <div className={`rounded-3xl border-2 p-6 shadow-2xl transition-all ${
                    stationLat
                      ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-400/40 shadow-emerald-500/10"
                      : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 shadow-black/10"
                  }`}>
                    <h4 className="text-lg font-bold text-foreground mb-3 tracking-tight">Pin Status</h4>
                    {stationLat ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-bold text-sm">Location set!</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono bg-muted rounded-lg px-3 py-2">
                          {stationLat.toFixed(6)}, {stationLng.toFixed(6)}
                        </p>
                        <p className="text-xs text-muted-foreground">Drag the pin on the map to fine-tune.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-5 h-5" />
                          <span className="font-medium text-sm">No pin placed yet</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Click on the map or use GPS to place a pin.</p>
                      </div>
                    )}
                  </div>

                  {/* Guidelines Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 backdrop-blur-2xl border-2 border-emerald-400/30 rounded-3xl p-7 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/20 dark:bg-emerald-400/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                      <h4 className="text-lg font-bold text-foreground mb-4 tracking-tight">Guidelines</h4>
                      <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span>Click on the map to place the exact pin</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span>Drag the pin to fine-tune position</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span>Verify station name matches signage</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span>Add prices only if currently at the station</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span>Duplicate locations within 20m will be blocked</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-6 shadow-2xl shadow-black/10">
                    <Button type="submit" fullWidth disabled={!stationLat}>
                      {stationLat ? (isEditMode ? "Save Changes" : "Add Station") : "Place pin first"}
                    </Button>
                    {!stationLat && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        A pin location is required to submit
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── MOBILE LAYOUT ── */}
            <div className="lg:hidden space-y-6">

              {/* Station Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Station Name *</label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => { setStationName(e.target.value); setShowDuplicateWarning(false); }}
                  placeholder="e.g., Petron EDSA"
                  className="w-full px-4 py-3.5 bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg text-foreground font-medium"
                  required
                />
              </div>

              {showDuplicateWarning && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-400/50 rounded-2xl p-5 flex items-start gap-3 shadow-xl shadow-yellow-500/10">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-warning mb-1">Duplicate Location</div>
                    <div className="text-sm text-warning/80">
                      "{duplicateInfo?.name}" exists {duplicateInfo?.distance}m away. Drag the pin to move it.
                    </div>
                  </div>
                </div>
              )}

              {/* GPS Button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="w-full py-3 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400/30 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all disabled:opacity-50"
              >
                {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                {isLocating ? "Locating..." : "Use My GPS Location"}
              </button>

              {/* Mobile Interactive Map */}
              <div className="rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-neutral-700 shadow-xl">
                <div className="px-4 py-3 bg-white dark:bg-neutral-900 border-b-2 border-gray-100 dark:border-neutral-800">
                  <p className="text-sm font-bold text-foreground">
                    {stationLat ? "📍 Pin placed — drag to adjust" : "Tap map to place pin"}
                  </p>
                  {stationLat && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {stationLat.toFixed(5)}, {stationLng.toFixed(5)}
                    </p>
                  )}
                </div>
                <div className="h-56 relative">
                  <MapContainer
                    center={mapCenter}
                    zoom={14}
                    zoomControl={false}
                    className="w-full h-full"
                    style={{ cursor: "crosshair" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapInteractions onPinSet={handlePinSet} onMapMove={handleMapMove} />
                    {stationLat && stationLng && (
                      <Marker
                        position={[stationLat, stationLng]}
                        icon={placementIcon}
                        draggable={true}
                        eventHandlers={{ dragend: handleMarkerDragEnd }}
                      />
                    )}
                  </MapContainer>
                  {!stationLat && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl px-4 py-3 text-center shadow-lg border border-emerald-400/20">
                        <MapPin className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                        <p className="text-xs font-bold text-foreground">Tap to place pin</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  {isGeocodingPin && <Loader2 className="absolute right-3 top-3 w-5 h-5 text-emerald-500 animate-spin" />}
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Tap the map to auto-fill address"
                    rows={3}
                    className="w-full pl-11 pr-11 py-3 bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-lg text-foreground font-medium"
                    required
                  />
                </div>
              </div>

              {/* Fuel Prices */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Initial Fuel Prices (Optional)</h3>
                <div className="space-y-3">
                  {[
                    { key: "diesel", label: "Diesel" },
                    { key: "premiumdiesel", label: "Premium Diesel" },
                    { key: "unleaded91", label: "Unleaded 91" },
                    { key: "unleaded95", label: "Unleaded 95" },
                    { key: "unleaded98", label: "Unleaded 98" },
                    { key: "kerosene", label: "Kerosene" },
                  ].map((fuel) => (
                    <div key={fuel.key}>
                      <label className="block text-sm text-muted-foreground mb-1">{fuel.label}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          value={prices[fuel.key]}
                          onChange={(e) => setPrices({ ...prices, [fuel.key]: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-9 pr-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg text-foreground font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400/30 rounded-2xl p-5 shadow-xl shadow-emerald-500/10">
                <h4 className="font-semibold text-foreground mb-2">Guidelines</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Click or tap on the map to place the pin</li>
                  <li>• Drag it to fine-tune the exact position</li>
                  <li>• Verify station name matches signage</li>
                  <li>• Duplicate locations within 20m will be blocked</li>
                </ul>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button type="submit" fullWidth disabled={!stationLat || isSubmitting} loading={isSubmitting}>
                  {isSubmitting ? (isEditMode ? "Saving Changes..." : "Adding Station...") : stationLat ? (isEditMode ? "Save Changes" : "Add Station") : "Place pin on map first"}
                </Button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </>
  );
}
