import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MapPin, User, Calendar, AlertTriangle, CheckCircle, XCircle, Edit2, Flag, X } from "lucide-react";

type ActionModal = "resolve" | "dismiss" | "flag" | null;

const mockReport = {
  id: "1",
  stationName: "Shell EDSA - Ortigas",
  stationAddress: "123 EDSA, Mandaluyong City",
  reportType: "incorrect_price",
  reportTypeLabel: "Incorrect Price",
  reportedBy: "Maria Santos",
  reporterEmail: "maria.santos@email.com",
  reportDate: "2024-05-07 10:30:00",
  status: "pending",
  description: "The listed price for Regular gasoline is ₱55.50, but the actual price at the station is ₱57.20. I filled up this morning and confirmed with the station attendant.",
  evidence: [
    "Photo of price board showing ₱57.20",
    "Receipt from fill-up showing ₱57.20/liter",
  ],
  currentListedPrice: "₱55.50",
  reportedPrice: "₱57.20",
  fuelType: "Regular Gasoline",
  lastUpdated: "2024-05-06 14:30:00",
  lastUpdatedBy: "Pedro Reyes",
};

export function StationReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<ActionModal>(null);
  const [notes, setNotes] = useState("");
  const [newPrice, setNewPrice] = useState(mockReport.reportedPrice);

  const handleResolve = () => {
    console.log("Resolving report:", id, "Notes:", notes, "New Price:", newPrice);
    setActiveModal(null);
    setNotes("");
    navigate("/admin/station-reports");
  };

  const handleDismiss = () => {
    if (!notes.trim()) {
      alert("Please provide a reason for dismissing this report");
      return;
    }
    console.log("Dismissing report:", id, "Reason:", notes);
    setActiveModal(null);
    setNotes("");
    navigate("/admin/station-reports");
  };

  const handleFlag = () => {
    console.log("Flagging report for review:", id, "Notes:", notes);
    setActiveModal(null);
    setNotes("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/50 border-yellow-400/40";
      case "under_review":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border-blue-400/40";
      case "resolved":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400/40";
      case "dismissed":
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 border-gray-400/40";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 border-gray-400/40";
    }
  };

  return (
    <>
      <div className="p-4 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/admin/station-reports")}
            className="mb-4 lg:mb-6 flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm lg:text-base text-foreground hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>

          {/* Page Header */}
          <div className="mb-4 lg:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Station Report Details</h1>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border-2 w-fit ${getStatusColor(
                  mockReport.status
                )}`}
              >
                {mockReport.status.charAt(0).toUpperCase() + mockReport.status.slice(1).replace("_", " ")}
              </span>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground">Review and take action on station report #{id}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              {/* Station Information */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-4 lg:p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg lg:text-xl font-bold text-white">{mockReport.stationName}</h2>
                      <p className="text-white/80 text-xs lg:text-sm">{mockReport.stationAddress}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div className="p-3 lg:p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1 font-semibold">Current Listed Price</div>
                      <div className="text-xl lg:text-2xl font-bold text-foreground">{mockReport.currentListedPrice}</div>
                      <div className="text-xs text-muted-foreground mt-1">{mockReport.fuelType}</div>
                    </div>
                    <div className="p-3 lg:p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border-2 border-rose-400/40">
                      <div className="text-xs text-rose-600 dark:text-rose-400 mb-1 font-semibold">Reported Price</div>
                      <div className="text-xl lg:text-2xl font-bold text-rose-600 dark:text-rose-400">{mockReport.reportedPrice}</div>
                      <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">{mockReport.fuelType}</div>
                    </div>
                  </div>
                  <div className="mt-3 lg:mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-400/40">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Last Update</div>
                    <div className="text-xs lg:text-sm text-foreground">
                      {new Date(mockReport.lastUpdated).toLocaleString()} by {mockReport.lastUpdatedBy}
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-rose-600 to-red-600 p-4 lg:p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg lg:text-xl font-bold text-white">Report Information</h2>
                      <p className="text-white/80 text-xs lg:text-sm">{mockReport.reportTypeLabel}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{mockReport.description}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-2">Evidence Provided</h3>
                      <ul className="space-y-2">
                        {mockReport.evidence.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reporter Information */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 lg:p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg lg:text-xl font-bold text-white">Reported By</h2>
                      <p className="text-white/80 text-xs lg:text-sm truncate">{mockReport.reportedBy}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{mockReport.reportedBy}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground break-all">{mockReport.reporterEmail}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs lg:text-sm text-muted-foreground">
                        {new Date(mockReport.reportDate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Sidebar - Right Column (Desktop) / Bottom (Mobile) */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg lg:sticky lg:top-8">
                <div className="p-4 lg:p-5 border-b-2 border-gray-200 dark:border-neutral-700">
                  <h3 className="text-base lg:text-lg font-bold text-foreground">Actions</h3>
                </div>
                <div className="p-4 lg:p-5 space-y-3">
                  <button
                    onClick={() => setActiveModal("resolve")}
                    className="w-full px-4 lg:px-5 py-2.5 lg:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm lg:text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                    Resolve Report
                  </button>
                  <button
                    onClick={() => setActiveModal("dismiss")}
                    className="w-full px-4 lg:px-5 py-2.5 lg:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold text-sm lg:text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => setActiveModal("flag")}
                    className="w-full px-4 lg:px-5 py-2.5 lg:py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground rounded-xl font-bold text-sm lg:text-base hover:bg-gray-50 dark:hover:bg-neutral-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Flag className="w-4 h-4 lg:w-5 lg:h-5" />
                    Flag for Review
                  </button>
                </div>
                <div className="p-4 lg:p-5 border-t-2 border-gray-200 dark:border-neutral-700">
                  <h4 className="text-sm font-bold text-foreground mb-3">Guidelines</h4>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">•</span>
                      <span>Verify price with multiple sources</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">•</span>
                      <span>Check reporter's accuracy history</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">•</span>
                      <span>Review evidence provided</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">•</span>
                      <span>Contact station if needed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolve Report Modal */}
      {activeModal === "resolve" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-emerald-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Resolve Report</h3>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setNotes("");
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-muted-foreground mb-5">
              Resolving this report will update the station's fuel price to the reported value. This action is logged and
              cannot be undone.
            </p>

            <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Current Price:</span>
                <span className="text-lg font-bold text-foreground">{mockReport.currentListedPrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-muted-foreground">New Price:</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{mockReport.reportedPrice}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Confirm New Price</label>
              <input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-bold"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Resolution Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this resolution..."
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setNotes("");
                }}
                className="flex-1 px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Report Modal */}
      {activeModal === "dismiss" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-gray-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Dismiss Report</h3>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setNotes("");
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-muted-foreground mb-5">
              Dismissing this report means it will be marked as invalid or incorrect. Please provide a reason for your
              decision.
            </p>

            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Reason for Dismissal *</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain why this report is being dismissed..."
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all outline-none resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setNotes("");
                }}
                className="flex-1 px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag for Review Modal */}
      {activeModal === "flag" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-blue-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Flag for Review</h3>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setNotes("");
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-muted-foreground mb-5">
              Flagging this report will mark it for additional review. Use this when you need more time or information before
              making a decision.
            </p>

            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Review Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about why this needs review..."
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setNotes("");
                }}
                className="flex-1 px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
