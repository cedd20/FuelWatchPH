import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Calendar,
  FileText,
  User,
  Phone,
  X,
  ZoomIn,
} from "lucide-react";

const mockVerificationDetail = {
  id: "1",
  userName: "Juan Dela Cruz",
  email: "juan.delacruz@email.com",
  phone: "+63 912 345 6789",
  accountCreated: "2024-01-15",
  idType: "National ID",
  idNumber: "1234-5678-9012",
  submittedDate: "2024-05-07 14:30:00",
  status: "pending",
  idFrontImage: "https://via.placeholder.com/800x500/10b981/ffffff?text=National+ID+Front",
  idBackImage: "https://via.placeholder.com/800x500/10b981/ffffff?text=National+ID+Back",
  selfieImage: "https://via.placeholder.com/800x500/10b981/ffffff?text=Selfie+with+ID",
  userNotes: "Please verify my identity for fuel price contributor status. Thank you!",
  adminNotes: "",
  verificationHistory: [
    { date: "2024-05-07", action: "Submitted verification", status: "pending" },
  ],
};

type ModalType = "approve" | "reject" | "correction" | "image" | null;

export function VerificationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [actionNote, setActionNote] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [adminNotesText, setAdminNotesText] = useState(mockVerificationDetail.adminNotes);

  const handleApprove = () => {
    console.log("Approving verification:", id, actionNote);
    setActiveModal(null);
    setActionNote("");
    navigate("/admin/verification-queue");
  };

  const handleReject = () => {
    console.log("Rejecting verification:", id, actionNote);
    setActiveModal(null);
    setActionNote("");
    navigate("/admin/verification-queue");
  };

  const handleRequestCorrection = () => {
    console.log("Requesting correction:", id, actionNote);
    setActiveModal(null);
    setActionNote("");
    navigate("/admin/verification-queue");
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setActiveModal("image");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400/40";
      case "rejected":
        return "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 border-rose-400/40";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/50 border-yellow-400/40";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 border-gray-400/40";
    }
  };

  return (
    <>
      <div className="p-4 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-5 lg:mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/verification-queue")}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-neutral-700 active:scale-95 transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-foreground" strokeWidth={2.5} />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl lg:text-3xl font-bold text-foreground truncate">Verification Request</h1>
                <p className="text-xs lg:text-sm text-muted-foreground">Request ID: #{mockVerificationDetail.id}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-bold border-2 capitalize self-start sm:self-center ${getStatusColor(
                mockVerificationDetail.status
              )}`}
            >
              {mockVerificationDetail.status}
            </span>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
            {/* Left Column - User Info & Documents (2/3) */}
            <div className="lg:col-span-2 space-y-5 lg:space-y-6">
              {/* User Information Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
                <h2 className="text-lg lg:text-xl font-bold text-foreground mb-4 lg:mb-5">User Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                  <div className="flex items-start gap-2.5 lg:gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground font-bold mb-0.5 lg:mb-1">Full Name</div>
                      <div className="font-bold text-foreground text-sm lg:text-lg break-words">{mockVerificationDetail.userName}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 lg:gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground font-bold mb-0.5 lg:mb-1">Email Address</div>
                      <div className="font-bold text-foreground text-sm lg:text-base break-all">{mockVerificationDetail.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 lg:gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground font-bold mb-0.5 lg:mb-1">Phone Number</div>
                      <div className="font-bold text-foreground text-sm lg:text-base">{mockVerificationDetail.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 lg:gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground font-bold mb-0.5 lg:mb-1">ID Type</div>
                      <div className="font-bold text-foreground text-sm lg:text-base">{mockVerificationDetail.idType}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 lg:gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground font-bold mb-0.5 lg:mb-1">Submitted Date</div>
                      <div className="font-bold text-foreground text-sm lg:text-base">
                        {new Date(mockVerificationDetail.submittedDate).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 lg:gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground font-bold mb-0.5 lg:mb-1">Account Created</div>
                      <div className="font-bold text-foreground text-sm lg:text-base">
                        {new Date(mockVerificationDetail.accountCreated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {mockVerificationDetail.userNotes && (
                  <div className="sm:col-span-2 mt-1 lg:mt-2 p-3.5 lg:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">User Notes</div>
                    <p className="text-sm text-foreground leading-relaxed">{mockVerificationDetail.userNotes}</p>
                  </div>
                )}
              </div>

              {/* Submitted Documents */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
                <h2 className="text-lg lg:text-xl font-bold text-foreground mb-4 lg:mb-5">Submitted Documents</h2>
                <div className="space-y-4 lg:space-y-5">
                  {/* ID Front */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5 lg:mb-3">
                      <h3 className="font-bold text-foreground text-base lg:text-lg">ID Front</h3>
                      <button
                        onClick={() => handleImageClick(mockVerificationDetail.idFrontImage)}
                        className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 active:scale-95 transition-all"
                      >
                        <ZoomIn className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-foreground" />
                        <span className="text-xs lg:text-sm font-bold text-foreground">Enlarge</span>
                      </button>
                    </div>
                    <div className="rounded-lg lg:rounded-xl overflow-hidden border-2 border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 cursor-pointer hover:border-emerald-500 active:scale-[0.99] transition-all"
                      onClick={() => handleImageClick(mockVerificationDetail.idFrontImage)}
                    >
                      <img
                        src={mockVerificationDetail.idFrontImage}
                        alt="ID Front"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>

                  {/* ID Back */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5 lg:mb-3">
                      <h3 className="font-bold text-foreground text-base lg:text-lg">ID Back</h3>
                      <button
                        onClick={() => handleImageClick(mockVerificationDetail.idBackImage)}
                        className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 active:scale-95 transition-all"
                      >
                        <ZoomIn className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-foreground" />
                        <span className="text-xs lg:text-sm font-bold text-foreground">Enlarge</span>
                      </button>
                    </div>
                    <div className="rounded-lg lg:rounded-xl overflow-hidden border-2 border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 cursor-pointer hover:border-emerald-500 active:scale-[0.99] transition-all"
                      onClick={() => handleImageClick(mockVerificationDetail.idBackImage)}
                    >
                      <img
                        src={mockVerificationDetail.idBackImage}
                        alt="ID Back"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>

                  {/* Selfie */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5 lg:mb-3">
                      <h3 className="font-bold text-foreground text-base lg:text-lg">Selfie with ID</h3>
                      <button
                        onClick={() => handleImageClick(mockVerificationDetail.selfieImage)}
                        className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 active:scale-95 transition-all"
                      >
                        <ZoomIn className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-foreground" />
                        <span className="text-xs lg:text-sm font-bold text-foreground">Enlarge</span>
                      </button>
                    </div>
                    <div className="rounded-lg lg:rounded-xl overflow-hidden border-2 border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 cursor-pointer hover:border-emerald-500 active:scale-[0.99] transition-all"
                      onClick={() => handleImageClick(mockVerificationDetail.selfieImage)}
                    >
                      <img
                        src={mockVerificationDetail.selfieImage}
                        alt="Selfie with ID"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Actions & Notes (1/3) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-20 space-y-5 lg:space-y-6">
                {/* Action Buttons */}
                <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
                  <h3 className="text-lg lg:text-xl font-bold text-foreground mb-4 lg:mb-5">Actions</h3>
                  <div className="space-y-2.5 lg:space-y-3">
                    <button
                      onClick={() => setActiveModal("approve")}
                      className="w-full px-4 lg:px-5 py-3 lg:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg lg:rounded-xl font-bold text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                      Approve Request
                    </button>
                    <button
                      onClick={() => setActiveModal("reject")}
                      className="w-full px-4 lg:px-5 py-3 lg:py-3.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg lg:rounded-xl font-bold text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                      Reject Request
                    </button>
                    <button
                      onClick={() => setActiveModal("correction")}
                      className="w-full px-4 lg:px-5 py-3 lg:py-3.5 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg lg:rounded-xl font-bold text-sm text-foreground hover:border-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                      Request Correction
                    </button>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
                  <h3 className="text-lg lg:text-xl font-bold text-foreground mb-4">Admin Notes</h3>
                  <textarea
                    value={adminNotesText}
                    onChange={(e) => setAdminNotesText(e.target.value)}
                    placeholder="Add internal notes about this verification request..."
                    className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none resize-none text-sm"
                    rows={5}
                  />
                  <button className="w-full mt-3 px-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700 active:scale-[0.98] transition-all">
                    Save Notes
                  </button>
                </div>

                {/* Verification Guidelines */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg lg:rounded-xl p-5 lg:p-6 border-2 border-emerald-400/30 shadow-lg">
                  <h3 className="text-lg lg:text-xl font-bold text-foreground mb-4">Verification Guidelines</h3>
                  <ul className="space-y-2 text-xs lg:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <span>ID must be clear and readable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <span>Photo must match the ID</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <span>ID must not be expired</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <span>All information must be visible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <span>No alterations or tampering</span>
                    </li>
                  </ul>
                </div>

                {/* Verification History */}
                <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
                  <h3 className="text-lg lg:text-xl font-bold text-foreground mb-4">Verification History</h3>
                  <div className="space-y-2.5 lg:space-y-3">
                    {mockVerificationDetail.verificationHistory.map((entry, index) => (
                      <div key={index} className="flex items-start gap-2.5 lg:gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs lg:text-sm font-bold text-foreground">{entry.action}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize flex-shrink-0 ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {activeModal === "image" && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setActiveModal(null)}>
          <button
            onClick={() => setActiveModal(null)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img src={selectedImage} alt="Zoomed" className="max-w-full max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Approve Modal */}
      {activeModal === "approve" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl max-w-md w-full p-5 lg:p-6 shadow-2xl border-2 border-emerald-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl lg:text-2xl font-bold text-foreground">Approve Verification</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 active:scale-95 flex items-center justify-center transition-all flex-shrink-0"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground mb-5">
              Are you sure you want to approve this verification request for{" "}
              <span className="font-bold text-foreground">{mockVerificationDetail.userName}</span>?
            </p>
            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Admin Note (Optional)</label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg lg:rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2.5 lg:gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg lg:rounded-xl font-bold text-sm text-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg lg:rounded-xl font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {activeModal === "reject" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl max-w-md w-full p-5 lg:p-6 shadow-2xl border-2 border-rose-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl lg:text-2xl font-bold text-foreground">Reject Verification</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 active:scale-95 flex items-center justify-center transition-all flex-shrink-0"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground mb-5">
              Are you sure you want to reject this verification request for{" "}
              <span className="font-bold text-foreground">{mockVerificationDetail.userName}</span>?
            </p>
            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Reason for Rejection (Required)</label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg lg:rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all outline-none resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2.5 lg:gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg lg:rounded-xl font-bold text-sm text-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!actionNote}
                className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg lg:rounded-xl font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Correction Modal */}
      {activeModal === "correction" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl max-w-md w-full p-5 lg:p-6 shadow-2xl border-2 border-blue-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl lg:text-2xl font-bold text-foreground">Request Correction</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 active:scale-95 flex items-center justify-center transition-all flex-shrink-0"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground mb-5">
              Request <span className="font-bold text-foreground">{mockVerificationDetail.userName}</span> to resubmit
              documents with corrections.
            </p>
            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Correction Details (Required)</label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Specify what needs to be corrected..."
                className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg lg:rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2.5 lg:gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg lg:rounded-xl font-bold text-sm text-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestCorrection}
                disabled={!actionNote}
                className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg lg:rounded-xl font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
