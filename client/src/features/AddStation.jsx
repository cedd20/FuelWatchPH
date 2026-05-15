import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, Loader2, Move, LocateFixed, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/shared/components/Button";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { useCreateStation, useUpdateStation } from "@/hooks/useStations";
import { useReportPrice, useReportPricesBatch } from "@/hooks/usePrices";
import { KarmaService } from "@/lib/karmaService";
import { reverseGeocode } from "@/shared/utils/location";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useTheme } from "@/app/providers/ThemeContext";

// Fix Leaflet default marker icon for Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapInteractions({ onPinSet, onMapMove }) {
  useMapEvents({
    click(e) {
      onPinSet(e.latlng.lat, e.latlng.lng, "click");
    },
    moveend(e) {
      const center = e.target.getCenter();
      if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
        if (typeof onMapMove === 'function') {
          onMapMove(center.lat, center.lng);
        }
      }
    }
  });
  return null;
}

function getFuelPriceValue(station, fuelLabel) {
  const price = station?.prices?.find((entry) => entry.type === fuelLabel)?.price;
  return price === undefined || price === null ? "" : String(price);
}

export function AddStation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const existingStation = location.state?.station ?? null;
  const isEditMode = Boolean(existingStation);
  const tileLayerUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const queryClient = useQueryClient();
  const createStationMutation = useCreateStation();
  const updateStationMutation = useUpdateStation();
  const reportPricesBatchMutation = useReportPricesBatch();

  const [stationName, setStationName] = useState(existingStation?.name ?? "");
  const [address, setAddress] = useState(existingStation?.address ?? "");
  const [city, setCity] = useState(existingStation?.city ?? "");
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [prices, setPrices] = useState({
    diesel: getFuelPriceValue(existingStation, "DSL"),
    premiumdiesel: getFuelPriceValue(existingStation, "PDSL"),
    unleaded91: getFuelPriceValue(existingStation, "UL91"),
    unleaded95: getFuelPriceValue(existingStation, "PR95"),
    unleaded98: getFuelPriceValue(existingStation, "PR97"),
    kerosene: getFuelPriceValue(existingStation, "Kerosene"),
  });

  const [stationLat, setStationLat] = useState(() => {
    const lat = Number(existingStation?.lat);
    return Number.isFinite(lat) ? lat : null;
  });
  const [stationLng, setStationLng] = useState(() => {
    const lng = Number(existingStation?.lng);
    return Number.isFinite(lng) ? lng : null;
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocodingPin, setIsGeocodingPin] = useState(false);
  const [mapCenter, setMapCenter] = useState(() => {
    const lat = Number(existingStation?.lat);
    const lng = Number(existingStation?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : [14.5995, 120.9842];
  });
  
  const [osmSuggestions, setOsmSuggestions] = useState([]);
  const [isFetchingOSM, setIsFetchingOSM] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) setShowAuthPrompt(true);
  }, [isAuthenticated]);

  const flyToLocation = useCallback((lat, lng, zoom = 17) => {
    if (mapRef.current && Number.isFinite(lat) && Number.isFinite(lng)) {
      mapRef.current.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 });
    }
  }, []);

  const handlePinSet = useCallback(async (lat, lng, source = "click", silent = false) => {
    setStationLat(lat);
    setStationLng(lng);
    setMapCenter([lat, lng]);
    setShowDuplicateWarning(false);
    setIsGeocodingPin(true);
    try {
      const result = await reverseGeocode(lat, lng);
      if (result.address) {
        setAddress(result.address);
        setCity(result.city || "Unknown City");
      }
      if (!silent) toast.success(source === "gps" ? "GPS location found!" : "Location set!");
    } catch {
      if (!silent) toast.error("Could not resolve address.");
    } finally {
      setIsGeocodingPin(false);
    }
  }, []);

  const fetchOSMSuggestions = useCallback(async (lat, lng) => {
    if (isEditMode) return;
    setIsFetchingOSM(true);
    try {
      const radius = 1500;
      const query = `[out:json];node["amenity"="fuel"](around:${radius},${lat},${lng});out;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setOsmSuggestions((data.elements || []).map(el => ({
          id: el.id, lat: Number(el.lat), lng: Number(el.lon),
          name: el.tags.name || "Unknown Station"
        })));
      }
    } catch (err) {
      console.warn("OSM error", err);
    } finally {
      setIsFetchingOSM(false);
    }
  }, [isEditMode]);

  const osmFetchTimeoutRef = useRef(null);

  const handleMapMove = useCallback((lat, lng) => {
    setStationLat(lat);
    setStationLng(lng);
    if (osmFetchTimeoutRef.current) clearTimeout(osmFetchTimeoutRef.current);
    osmFetchTimeoutRef.current = setTimeout(() => {
      fetchOSMSuggestions(lat, lng);
      handlePinSet(lat, lng, "drag", true);
    }, 2000);
  }, [fetchOSMSuggestions, handlePinSet]);

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) return toast.error("GPS not supported");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        flyToLocation(lat, lng);
        await handlePinSet(lat, lng, "gps");
        setIsLocating(false);
      },
      (e) => { setIsLocating(false); toast.error(e.message); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stationLat == null) return toast.error("Place a pin first");
    setIsSubmitting(true);
    try {
      const payload = { name: stationName, brand: stationName.split(" ")[0], address, city, lat: stationLat, lng: stationLng };
      let sId;
      if (isEditMode) {
        await updateStationMutation.mutateAsync({ id: existingStation.id, data: payload });
        sId = existingStation.id;
      } else {
        const ns = await createStationMutation.mutateAsync(payload);
        sId = ns.id;
        KarmaService.addContribution('Added Station', { stationName });
      }

      const priceBatch = Object.entries(prices)
        .filter(([_, v]) => v !== "")
        .map(([k, v]) => ({
          station_id: sId,
          fuel_type: { diesel: "DSL", premiumdiesel: "PDSL", unleaded91: "UL91", unleaded95: "PR95", unleaded98: "PR97", kerosene: "Kerosene" }[k],
          price: parseFloat(v),
          observed_at: new Date().toISOString()
        }));

      if (priceBatch.length > 0) await reportPricesBatchMutation.mutateAsync(priceBatch);
      queryClient.invalidateQueries({ queryKey: ["notifications", "stations"] });
      setShowSuccess(true);
      setTimeout(() => navigate(isEditMode ? `/app/station/${sId}` : "/app/home"), 2000);
    } catch {
      toast.error("Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#050A09] flex flex-col items-center justify-center p-6 text-white text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-3xl font-black mb-2">{isEditMode ? "Updated!" : "Success!"}</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Redirecting to Dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <AuthPrompt isOpen={showAuthPrompt} onClose={() => { setShowAuthPrompt(false); navigate(-1); }} message="Sign in to contribute." />
      <div className="min-h-screen bg-[#050A09] text-white pb-24">
        
        {/* Header */}
        <div className="relative pt-12 pb-20 px-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="max-w-4xl mx-auto relative z-10">
            <button onClick={() => navigate(-1)} className="mb-6 p-3 bg-[#0C1A17] rounded-full border border-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-4xl font-black tracking-tight mb-2">{isEditMode ? "Edit Station" : "New Station"}</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Place pin to set location</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 -mt-10 space-y-6">
          
          {/* Map Section */}
          <div className="bg-[#0C1A17] rounded-[2.5rem] border border-emerald-500/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                   <h3 className="font-black text-sm">Station Location</h3>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tap map to place pin</p>
                </div>
              </div>
              <button type="button" onClick={handleUseCurrentLocation} className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-xl">
                <LocateFixed className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-64 relative">
               <MapContainer ref={mapRef} center={mapCenter} zoom={15} zoomControl={false} className="w-full h-full grayscale-[0.8] contrast-[1.2]">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapInteractions onPinSet={handlePinSet} onMapMove={handleMapMove} />
                  {osmSuggestions.map(s => (
                    <Marker key={s.id} position={[s.lat, s.lng]} icon={L.divIcon({ className: "", html: `<div class="w-2 h-2 bg-gray-500 rounded-full border border-white"></div>` })} />
                  ))}
               </MapContainer>
               {/* Fixed Center Pin */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[400] pointer-events-none">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#0C1A17] shadow-2xl shadow-emerald-500/50 flex items-center justify-center">
                     <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-[#0C1A17] rounded-[2.5rem] border border-emerald-500/10 p-8 shadow-2xl space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Station Details</label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                placeholder="Station Name (e.g. Petron EDSA)"
                className="w-full bg-[#1A2E2A] border border-emerald-500/5 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-gray-700"
                required
              />
              <div className="relative">
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address will auto-fill from pin..."
                  rows={2}
                  className="w-full bg-[#1A2E2A] border border-emerald-500/5 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-gray-700 resize-none"
                  required
                />
                {isGeocodingPin && <div className="absolute right-4 top-4"><Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /></div>}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-emerald-500/5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Initial Fuel Prices</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(prices).map(k => (
                  <div key={k} className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500/50 uppercase">{ {diesel: "DSL", premiumdiesel: "PDSL", unleaded91: "UL91", unleaded95: "PR95", unleaded98: "PR97", kerosene: "KER"}[k] }</div>
                    <input
                      type="number"
                      step="0.01"
                      value={prices[k]}
                      onChange={(e) => setPrices({ ...prices, [k]: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-[#1A2E2A] border border-emerald-500/5 rounded-2xl pl-12 pr-4 py-4 font-black text-white focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-gray-700 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <button
              type="submit"
              disabled={!stationLat || isSubmitting}
              className="w-full bg-emerald-500 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? "Processing..." : isEditMode ? "Save Changes" : "Create Station"}
            </button>
          </motion.div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-6 text-center">
             <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Contributor Bonus</span>
             </div>
             <p className="text-[10px] text-gray-500 font-bold">Earn <span className="text-emerald-400">+50 Karma</span> for adding verified locations.</p>
          </div>

        </form>
      </div>
    </>
  );
}
