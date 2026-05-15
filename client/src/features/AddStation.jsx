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
<<<<<<< HEAD
                <div>
                   <h3 className="font-black text-sm">Station Location</h3>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tap map to place pin</p>
=======

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
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                      />
                      {/* Click handler */}
                      <MapInteractions onPinSet={handlePinSet} onMapMove={handleMapMove} />
                          url={tileLayerUrl}
                          key={tileLayerUrl}
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
                    </MapContainer>
                    {/* Fixed Center Pin Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[400] pointer-events-none drop-shadow-xl transition-transform duration-200" style={{ transformOrigin: 'bottom center' }}>
                      <div style={{
                        width: "36px", height: "36px",
                        background: "linear-gradient(135deg, #10b981, #0d9488)",
                        borderRadius: "50% 50% 50% 0",
                        transform: "rotate(-45deg)",
                        border: "3px solid white",
                        boxShadow: "0 4px 12px rgba(16,185,129,0.5)"
                      }}></div>
                    </div>
                    {/* Location Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUseCurrentLocation();
                      }}
                      className="absolute bottom-4 right-4 z-[1000] w-10 h-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg border border-gray-200 dark:border-neutral-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                      title="Go to my location"
                    >
                      <LocateFixed className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </button>
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
                      { key: "diesel", label: "DSL" },
                      { key: "premiumdiesel", label: "PDSL" },
                      { key: "unleaded91", label: "UL91" },
                      { key: "unleaded95", label: "PR95" },
                      { key: "unleaded98", label: "PR97" },
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
>>>>>>> ac377a1f9bae0a8d5c8145126303cd533e839c49
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
<<<<<<< HEAD
                {isGeocodingPin && <div className="absolute right-4 top-4"><Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /></div>}
=======
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
                    ref={mapRef}
                    center={mapCenter}
                    zoom={14}
                    zoomControl={false}
                    className="w-full h-full"
                    style={{ cursor: "crosshair" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url={tileLayerUrl}
                      key={tileLayerUrl}
                    />
                    <MapInteractions onPinSet={handlePinSet} onMapMove={handleMapMove} />
                  </MapContainer>
                  {/* Fixed Center Pin Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[400] pointer-events-none drop-shadow-xl transition-transform duration-200" style={{ transformOrigin: 'bottom center' }}>
                    <div style={{
                      width: "36px", height: "36px",
                      background: "linear-gradient(135deg, #10b981, #0d9488)",
                      borderRadius: "50% 50% 50% 0",
                      transform: "rotate(-45deg)",
                      border: "3px solid white",
                      boxShadow: "0 4px 12px rgba(16,185,129,0.5)"
                    }}></div>
                  </div>
                  {/* Location Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUseCurrentLocation();
                    }}
                    className="absolute bottom-4 right-4 z-[1000] w-10 h-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg border border-gray-200 dark:border-neutral-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    title="Go to my location"
                  >
                    <LocateFixed className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </button>
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
                    { key: "diesel", label: "DSL" },
                    { key: "premiumdiesel", label: "PDSL" },
                    { key: "unleaded91", label: "UL91" },
                    { key: "unleaded95", label: "PR95" },
                    { key: "unleaded98", label: "PR97" },
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
>>>>>>> ac377a1f9bae0a8d5c8145126303cd533e839c49
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
