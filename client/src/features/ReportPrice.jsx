import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Fuel,
  CalendarDays,
  Clock3,
  CircleDollarSign,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/shared/components/Button";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { getStationById, submitPriceReport } from "@/shared/utils/stationStorage";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { toast } from "sonner";

export function ReportPrice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [station, setStation] = useState(null);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState(["Diesel"]);
  const [fuelPrices, setFuelPrices] = useState({});
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportTime, setReportTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [remarks, setRemarks] = useState("");
  const [reporterReference, setReporterReference] = useState(() => user?.email || "frontend-tester");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setStation(getStationById(id));
  }, [id]);

  useEffect(() => {
    if (user?.email) {
      setReporterReference(user.email);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl) {
        URL.revokeObjectURL(proofPreviewUrl);
      }
    };
  }, [proofPreviewUrl]);

  const selectedFuelDetails = useMemo(() => {
    return selectedFuelTypes.map((fuelType) => ({
      fuelType,
      currentSavedPrice: station?.prices.find((entry) => entry.type === fuelType) || null,
    }));
  }, [selectedFuelTypes, station]);

  const toggleFuelType = (fuelType) => {
    const isAlreadySelected = selectedFuelTypes.includes(fuelType);

    setSelectedFuelTypes((prev) =>
      isAlreadySelected ? prev.filter((type) => type !== fuelType) : [...prev, fuelType]
    );

    if (isAlreadySelected) {
      setFuelPrices((prev) => {
        const next = { ...prev };
        delete next[fuelType];
        return next;
      });
    }

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[fuelType];
      delete next.selectedFuelTypes;
      return next;
    });
  };

  const handlePriceChange = (fuelType, value) => {
    setFuelPrices((prev) => ({
      ...prev,
      [fuelType]: value,
    }));

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[fuelType];
      return next;
    });
  };

  const handleProofFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (proofPreviewUrl) {
      URL.revokeObjectURL(proofPreviewUrl);
    }

    setProofFile(file);
    setProofPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
  };

  const handleRemoveProof = () => {
    if (proofPreviewUrl) {
      URL.revokeObjectURL(proofPreviewUrl);
    }
    setProofFile(null);
    setProofPreviewUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (!station) {
      toast.error("Station not found");
      return;
    }

    const nextErrors = {};

    if (selectedFuelTypes.length === 0) {
      nextErrors.selectedFuelTypes = "Select at least one fuel type.";
    }

    selectedFuelTypes.forEach((fuelType) => {
      const parsedPrice = Number(fuelPrices[fuelType]);
      if (fuelPrices[fuelType] == null || fuelPrices[fuelType] === "") {
        nextErrors[fuelType] = `Enter a price for ${fuelType}.`;
      } else if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        nextErrors[fuelType] = `Enter a valid numeric price for ${fuelType}.`;
      }
    });

    if (!reportDate) {
      nextErrors.reportDate = "Select a report date.";
    }

    if (!reportTime) {
      nextErrors.reportTime = "Select a report time.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      toast.error("Complete the required fuel prices and report details.");
      return;
    }

    setIsSubmitting(true);

    const reportedAt = `${reportDate}T${reportTime}`;
    const results = selectedFuelTypes.map((fuelType) =>
      submitPriceReport(id, {
        fuelType,
        price: Number(fuelPrices[fuelType]),
        reportedAt,
        remarks,
        proofPlaceholder: proofFile?.name || "",
        reporterReference,
      })
    );

    setIsSubmitting(false);

    const failedResult = results.find((result) => !result.success);
    if (failedResult) {
      toast.error(failedResult.message || "Unable to save this price report.");
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      toast.success(
        selectedFuelTypes.length === 1
          ? "Fuel price report submitted successfully."
          : `${selectedFuelTypes.length} fuel price reports submitted successfully.`
      );
      navigate(`/app/station/${id}`);
    }, 1800);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Report Submitted</h2>
        <p className="text-center text-muted-foreground">
          Your latest fuel prices have been saved successfully.
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
        message="Sign in to report fuel prices and help maintain accurate station updates."
      />
      <div className="min-h-screen bg-background pb-40 lg:pb-20">
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-7 px-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Report Fuel Price</h1>
          </div>
          <p className="text-white/80 text-sm">
            Submit the latest prices you see at this station.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-4 shadow-sm">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-4">
              <div className="text-sm font-bold text-foreground leading-tight">
                {station?.name || "Selected station"}
              </div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {station?.address || "Station reference will be attached to this report."}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Fuel Types</label>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Fuel className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-muted-foreground">
                  Select one or more fuel types
                </span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
                {FUEL_TYPES.map((type) => (
                  <FuelTypeChip
                    key={type}
                    label={type}
                    active={selectedFuelTypes.includes(type)}
                    onClick={() => toggleFuelType(type)}
                  />
                ))}
              </div>
              {validationErrors.selectedFuelTypes && (
                <p className="mt-3 text-xs font-medium text-rose-600">
                  {validationErrors.selectedFuelTypes}
                </p>
              )}
            </div>
          </div>

          {selectedFuelDetails.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-4 space-y-4 shadow-sm">
              <div className="text-sm font-semibold text-foreground">Price Per Liter</div>
              {selectedFuelDetails.map(({ fuelType, currentSavedPrice }) => (
                <div
                  key={fuelType}
                  className="rounded-xl border border-gray-200 dark:border-neutral-800 p-4 bg-gray-50/60 dark:bg-neutral-950/30"
                >
                  <div className="font-semibold text-foreground">{fuelType}</div>
                  <div className="text-xs text-muted-foreground mt-1 mb-3">
                    {currentSavedPrice
                      ? `Current saved price: ₱${currentSavedPrice.price.toFixed(2)} per liter`
                      : "No active saved price yet"}
                  </div>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={fuelPrices[fuelType] || ""}
                      onChange={(e) => handlePriceChange(fuelType, e.target.value)}
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border focus:outline-none focus:ring-2 text-foreground ${
                        validationErrors[fuelType]
                          ? "border-rose-400 focus:ring-rose-500/30"
                          : "border-border focus:ring-emerald-500/50"
                      }`}
                    />
                  </div>
                  {validationErrors[fuelType] && (
                    <p className="mt-2 text-xs font-medium text-rose-600">
                      {validationErrors[fuelType]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-4 shadow-sm">
              <label className="block text-sm font-medium text-foreground mb-2">Date of Report</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border focus:outline-none focus:ring-2 text-foreground ${
                    validationErrors.reportDate
                      ? "border-rose-400 focus:ring-rose-500/30"
                      : "border-border focus:ring-emerald-500/50"
                  }`}
                />
              </div>
              {validationErrors.reportDate && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {validationErrors.reportDate}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-4 shadow-sm">
              <label className="block text-sm font-medium text-foreground mb-2">Time of Report</label>
              <div className="relative">
                <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="time"
                  value={reportTime}
                  onChange={(e) => setReportTime(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border focus:outline-none focus:ring-2 text-foreground ${
                    validationErrors.reportTime
                      ? "border-rose-400 focus:ring-rose-500/30"
                      : "border-border focus:ring-emerald-500/50"
                  }`}
                />
              </div>
              {validationErrors.reportTime && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {validationErrors.reportTime}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-4 space-y-4 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Proof (Optional)</label>
              <label className="block">
                <input type="file" accept="image/*" onChange={handleProofFileChange} className="hidden" />
                <div className="rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/10 px-4 py-5 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                      <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Upload proof image</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Receipt photo, pump display photo, or station price board photo.
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              {proofFile && (
                <div className="mt-3 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {proofFile.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.max(1, Math.round(proofFile.size / 1024))} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveProof}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {proofPreviewUrl && (
                    <img
                      src={proofPreviewUrl}
                      alt="Proof preview"
                      className="mt-3 w-full h-40 object-cover rounded-xl border border-gray-200 dark:border-neutral-800"
                    />
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add context such as queue length, pump status, or where the price was seen."
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Reporter Reference</label>
              <input
                type="text"
                value={reporterReference}
                onChange={(e) => setReporterReference(e.target.value)}
                placeholder="Your name or email"
                className="w-full px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-foreground"
              />
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Fuel prices only</p>
              <p className="text-muted-foreground">
                Use Report Issues for station problems like wrong location, duplicate stations, or closure reports.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth disabled={isSubmitting || !station} variant="primary">
              {isSubmitting
                ? "Submitting..."
                : selectedFuelTypes.length > 1
                  ? "Submit Price Report"
                  : "Report Latest Price"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
