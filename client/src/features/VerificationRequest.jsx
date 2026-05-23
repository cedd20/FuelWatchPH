import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Shield, Upload, CheckCircle, Loader2, Camera, User, CreditCard, Info } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { useAuth } from "@/app/providers/AuthContext";
import { toast } from "sonner";
import { api as apiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";

export function VerificationRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRefFront = useRef(null);
  const fileInputRefBack = useRef(null);

  const [formData, setFormData] = useState({
    full_name: "",
    id_type: "Driver's License",
    id_number: "",
    id_front_url: "",
    id_back_url: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const canResubmit = !existingRequest || existingRequest.status === "rejected" || existingRequest.status === "needs_correction";
  const statusToneMap = {
    approved: {
      label: "Verified",
      container: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100",
      meta: "text-emerald-700 dark:text-emerald-200/80",
      message: "Your identity has already been verified. You can return to your profile to view your badge.",
    },
    pending: {
      label: "Under Review",
      container: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100",
      meta: "text-sky-700 dark:text-sky-200/80",
      message: "Your verification request is already in review. We will update your profile once the review is complete.",
    },
    needs_correction: {
      label: "Needs Correction",
      container: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100",
      meta: "text-amber-700 dark:text-amber-200/80",
      message: "Your previous submission needs corrections. Update the details below and upload clearer ID photos.",
    },
    rejected: {
      label: "Resubmission Needed",
      container: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100",
      meta: "text-rose-700 dark:text-rose-200/80",
      message: "Your previous verification request was rejected. Review the details below and submit a new request.",
    },
  };
  const statusTone = existingRequest ? (statusToneMap[existingRequest.status] || statusToneMap.pending) : null;

  useEffect(() => {
    async function checkExistingRequest() {
      try {
        const requests = await apiClient.get("/me/verifications");
        if (requests && requests.length > 0) {
          // Get the most recent request
          const latest = requests[0];
          setExistingRequest(latest);

          // Normalize existing URLs to signed preview URLs when possible
          const getSignedPreview = async (url) => {
            try {
              if (!url) return url;
              // If URL already looks like a storage URL, try to extract the file path after the bucket
              const marker = '/verification-ids/';
              const idx = url.indexOf(marker);
              if (idx !== -1) {
                const filePath = url.substring(idx + marker.length);
                const { data, error } = await supabase.storage.from('verification-ids').createSignedUrl(filePath, 60 * 60);
                if (!error && data) return data?.signedURL || data?.signedUrl || url;
              }
              // Fallback to returning the provided URL
              return url;
            } catch (e) {
              return url;
            }
          };

          const fill = async () => {
            const front = await getSignedPreview(latest.id_front_url);
            const back = await getSignedPreview(latest.id_back_url);

            if (latest.status === "needs_correction" || latest.status === "rejected") {
              setFormData({
                full_name: latest.full_name,
                id_type: latest.id_type,
                id_number: latest.id_number,
                id_front_url: front,
                id_back_url: back,
              });
            } else {
              // still set preview URLs so user can see their uploaded images, but keep fields readonly
              setFormData((prev) => ({ ...prev, id_front_url: front, id_back_url: back }));
            }
          };

          await fill();
        }
      } catch (error) {
        console.error("Failed to check existing requests:", error);
      } finally {
        setIsCheckingRequest(false);
      }
    }
    checkExistingRequest();
  }, []);

  const idTypes = [
    "Driver's License",
    "Passport",
    "UMID",
    "PhilID (National ID)",
    "PRC ID",
    "Postal ID",
    "Voter's ID",
  ];

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    setIsUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/id_${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-ids')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      // Create a signed URL for preview (valid for 1 hour)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('verification-ids')
        .createSignedUrl(fileName, 60 * 60);

      const previewUrl = signedData?.signedURL || signedData?.signedUrl || null;

      // Fallback to public URL if needed
      let finalUrl = previewUrl;
      if (!finalUrl) {
        const { data: { publicUrl } } = supabase.storage.from('verification-ids').getPublicUrl(fileName);
        finalUrl = publicUrl;
      }

      setFormData(prev => ({ ...prev, [`id_${type}_url`]: finalUrl }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} side uploaded!`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(`Failed to upload ${type} side. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_front_url || !formData.id_back_url) {
      toast.error("Please upload both front and back photos of your ID.");
      return;
    }

    // Prevent submitting if there is an existing pending/approved request
    if (!canResubmit) {
      toast.error('You already have a verification request in progress. You can submit again only if it was rejected or needs correction.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/me/verify", formData);
      setIsSubmitted(true);
      toast.success("Verification request submitted!");
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(error.body?.detail || "Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6 pb-24">
        <div className="app-panel-strong max-w-md w-full rounded-3xl border-2 border-gray-100 p-10 text-center shadow-2xl space-y-8 dark:border-neutral-800">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-white dark:border-neutral-800 shadow-lg">
              <CheckCircle className="w-12 h-12 text-emerald-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Request Received</h2>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Your identity verification request has been submitted successfully. Our team will review your ID and update your status shortly.
            </p>
          </div>
          <Button fullWidth size="lg" onClick={() => navigate("/app/profile")} className="shadow-lg shadow-emerald-500/20">
            Back to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen pb-12">
      <div className="relative overflow-hidden px-4 pb-20 pt-12 lg:px-8">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-teal-500/8 blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="app-panel flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/10 shadow-lg transition-transform hover:scale-105 hover:bg-emerald-500 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Trust Upgrade</p>
                  <h1 className="text-2xl font-black tracking-tight text-foreground lg:text-3xl">Identity Verification</h1>
                </div>
              </div>
              <p className="max-w-2xl text-sm font-medium text-muted-foreground lg:text-base">
                Confirm your identity to unlock your verified member badge and strengthen your reputation with the FuelWatch PH community.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="app-panel rounded-[2rem] border border-emerald-500/10 p-6 shadow-2xl lg:p-8">
              {statusTone && (
                <div className={`mb-6 rounded-3xl border px-5 py-4 ${statusTone.container}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/10">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-80">
                        Verification Status
                      </div>
                      <div className="mt-1 text-lg font-black">{statusTone.label}</div>
                      <p className={`mt-1 text-sm font-medium ${statusTone.meta}`}>{statusTone.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/10">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Verification Details</h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">Provide the same information shown on your government-issued ID.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Full Legal Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Enter your full name"
                    className="app-input w-full rounded-2xl border border-emerald-500/10 py-4 pl-12 pr-4 font-medium transition-all outline-none focus:border-emerald-500"
                    disabled={isCheckingRequest || !canResubmit}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">ID Type</label>
                <select
                  value={formData.id_type}
                  onChange={(e) => setFormData({...formData, id_type: e.target.value})}
                  className="app-input w-full appearance-none rounded-2xl border border-emerald-500/10 px-4 py-4 font-medium transition-all outline-none cursor-pointer focus:border-emerald-500"
                  disabled={isCheckingRequest || !canResubmit}
                  required
                >
                  {idTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">ID Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                    placeholder="Enter ID number"
                    className="app-input w-full rounded-2xl border border-emerald-500/10 py-4 pl-12 pr-4 font-medium transition-all outline-none focus:border-emerald-500"
                    disabled={isCheckingRequest || !canResubmit}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground ml-1">Photo of Front ID</label>
                <div 
                  onClick={() => !isUploading && canResubmit && !isCheckingRequest && fileInputRefFront.current?.click()}
                  className={`relative flex h-52 cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed transition-all ${
                    formData.id_front_url 
                      ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-500/5" 
                      : "app-elevated border-gray-200 hover:border-emerald-500 dark:border-neutral-700"
                  } ${!canResubmit || isCheckingRequest ? "cursor-not-allowed opacity-75" : ""}`}
                >
                  {formData.id_front_url ? (
                    <>
                            <img src={formData.id_front_url} alt="Front ID Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 z-20">
                              <button
                                type="button"
                              onClick={(ev) => { ev.stopPropagation(); if (canResubmit && !isCheckingRequest) fileInputRefFront.current?.click(); }}
                              className="app-panel-muted rounded-full px-3 py-1 text-xs shadow-sm"
                              disabled={!canResubmit || isCheckingRequest}
                            >
                              Change
                            </button>
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                    </>
                  ) : (
                    <>
                      <div className="app-panel-muted flex h-12 w-12 items-center justify-center rounded-full shadow-lg">
                        {isUploading === 'front' ? <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /> : <Upload className="w-6 h-6 text-emerald-600" />}
                      </div>
                      <p className="font-bold text-xs lg:text-sm text-foreground">Upload Front Side</p>
                      <p className="text-[11px] font-medium text-muted-foreground">Clear and readable, no glare</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRefFront}
                    onChange={(e) => handleImageUpload(e, 'front')}
                    accept="image/*"
                    disabled={isCheckingRequest || !canResubmit}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground ml-1">Photo of Back ID</label>
                <div 
                  onClick={() => !isUploading && canResubmit && !isCheckingRequest && fileInputRefBack.current?.click()}
                  className={`relative flex h-52 cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed transition-all ${
                    formData.id_back_url 
                      ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-500/5" 
                      : "app-elevated border-gray-200 hover:border-emerald-500 dark:border-neutral-700"
                  } ${!canResubmit || isCheckingRequest ? "cursor-not-allowed opacity-75" : ""}`}
                >
                  {formData.id_back_url ? (
                    <>
                          <img src={formData.id_back_url} alt="Back ID Preview" className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 z-20">
                            <button
                              type="button"
                              onClick={(ev) => { ev.stopPropagation(); if (canResubmit && !isCheckingRequest) fileInputRefBack.current?.click(); }}
                              className="app-panel-muted rounded-full px-3 py-1 text-xs shadow-sm"
                              disabled={!canResubmit || isCheckingRequest}
                            >
                              Change
                            </button>
                          </div>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                    </>
                  ) : (
                    <>
                      <div className="app-panel-muted flex h-12 w-12 items-center justify-center rounded-full shadow-lg">
                        {isUploading === 'back' ? <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /> : <Upload className="w-6 h-6 text-emerald-600" />}
                      </div>
                      <p className="font-bold text-xs lg:text-sm text-foreground">Upload Back Side</p>
                      <p className="text-[11px] font-medium text-muted-foreground">Make sure the full card is visible</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRefBack}
                    onChange={(e) => handleImageUpload(e, 'back')}
                    accept="image/*"
                    disabled={isCheckingRequest || !canResubmit}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4 rounded-2xl border-2 border-amber-100 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
              <Info className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-200/80 font-medium">
                Your ID photos are encrypted and only used for verification purposes. Both front and back are required for complete verification.
              </div>
            </div>
            </div>

            <aside className="space-y-6">
              <div className="app-panel rounded-[2rem] border border-emerald-500/10 p-6 shadow-2xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Verification Benefits</div>
                    <div className="mt-1 text-lg font-black text-foreground">Build Community Trust</div>
                  </div>
                </div>
                <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                  <li className="rounded-xl border border-emerald-500/8 bg-emerald-500/5 px-4 py-3">
                    Earn the verified member badge on your profile.
                  </li>
                  <li className="rounded-xl border border-emerald-500/8 bg-emerald-500/5 px-4 py-3">
                    Improve confidence in your future station reports.
                  </li>
                  <li className="rounded-xl border border-emerald-500/8 bg-emerald-500/5 px-4 py-3">
                    Help other users trust the updates you submit.
                  </li>
                </ul>
              </div>

              <div className="app-panel rounded-[2rem] border border-emerald-500/10 p-6 shadow-2xl">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">Submission Checklist</div>
                <div className="mt-3 text-sm font-medium text-muted-foreground">
                  {isCheckingRequest
                    ? "Checking your latest verification status..."
                    : canResubmit
                      ? "Complete both uploads before sending your request."
                      : "Your current verification request is already locked for review."}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="app-elevated rounded-2xl border border-emerald-500/8 p-4 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Front ID</div>
                    <div className="mt-2 text-xl font-black text-foreground">{formData.id_front_url ? "Ready" : "Needed"}</div>
                  </div>
                  <div className="app-elevated rounded-2xl border border-emerald-500/8 p-4 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Back ID</div>
                    <div className="mt-2 text-xl font-black text-foreground">{formData.id_back_url ? "Ready" : "Needed"}</div>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    fullWidth 
                    size="md"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    fullWidth 
                    size="md" 
                    loading={isLoading}
                    disabled={isCheckingRequest || !canResubmit || !!isUploading || !formData.id_front_url || !formData.id_back_url}
                    icon={Shield}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </div>
    </div>
  );
}
