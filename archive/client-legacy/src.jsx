import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Navigation, Filter, List, Search } from "lucide-react";
import { StationCard } from "@/shared/components/StationCard";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { MapFilterSheet } from "@/shared/components/MapFilterSheet";
import { FilterChip } from "@/shared/components/FilterChip";
import { BrandLogoPin } from "@/shared/components/BrandLogoPin";
import { MapPriceLegend } from "@/shared/components/MapPriceLegend";
import { PreciseLocationButton } from "@/shared/components/PreciseLocationButton";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

const mockStations = [
  {
    id: "1",
    name: "Petron Quezon Avenue",
    brand: "Petron",
    address: "123 Quezon Ave, Quezon City",
    distance: 0.5,
    prices: [
      { type: "Unleaded 91", price: 64.50 },
      { type: "Premium 95", price: 68.20 },
      { type: "Diesel", price: 55.30 },
    ],
    lastUpdated: "2 mins ago",
    verified,
    lat: 14.6347,
    lng: 121.0440,
  },
  {
    id: "2",
    name: "Shell EDSA",
    brand: "Shell",
    address: "456 EDSA, Mandaluyong",
    distance: 1.2,
    prices: [
      { type: "Unleaded 91", price: 65.10 },
      { type: "Premium 95", price: 69.00 },
      { type: "Diesel", price: 56.10 },
    ],
    lastUpdated: "15 mins ago",
    verified,
    lat: 14.6370,
    lng: 121.0500,
  },
  {
    id: "3",
    name: "Caltex Commonwealth",
    brand: "Caltex",
    address: "789 Commonwealth Ave, QC",
    distance: 2.1,
    prices: [
      { type: "Unleaded 91", price: 64.80 },
      { type: "Premium 95", price: 68.50 },
      { type: "Diesel", price: 55.80 },
    ],
    lastUpdated: "1 hour ago",
    verified,
    lat: 14.6390,
    lng: 121.0520,
  },
  {
    id: "4",
    name: "Seaoil Timog",
    brand: "Seaoil",
    address: "45 Timog Ave, QC",
    distance: 1.5,
    prices: [
      { type: "Unleaded 91", price: 64.20 },
      { type: "Premium 95", price: 67.90 },
      { type: "Diesel", price: 55.00 },
    ],
    lastUpdated: "30 mins ago",
    verified,
    lat: 14.6360,
    lng: 121.0480,
  },
];

const fuelTypes = ["All", ...FUEL_TYPES];

export function Map() {
  const navigate = useNavigate();
  const [selectedFuelType, setSelectedFuelType] = useState("Diesel");
  const [showList, setShowList] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleApplyFilters = (filters) => {
    const applied = [];
    if (filters.location === "city" && filters.selectedCity) {
      applied.push(filters.selectedCity);
    }
    if (filters.fuelTypes.length > 0) {
      applied.push(`${filters.fuelTypes.length} fuel types`);
    }
    if (filters.brands.length > 0) {
      applied.push(`${filters.brands.length} brands`);
    }
    if (filters.verifiedOnly) {
      applied.push("Verified only");
    }
    if (filters.openNow) {
      applied.push("Open now");
    }
    setActiveFilters(applied);
  };

  const removeFilter = (filter) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter));
  };

  const handlePreciseLocation = () => {
    console.log("Recentering to precise location...");
  };

  const getStationPrice = (station) => {
    const fuelPrice = station.prices.find((p) => p.type === selectedFuelType);
    return fuelPrice?.price || 0;
  };

  const avgPrice = mockStations.reduce((sum, station) => sum + getStationPrice(station), 0) / mockStations.length;

  return null;
}
