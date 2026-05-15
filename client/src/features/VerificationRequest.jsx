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
    if (existingRequest && !(existingRequest.status === 'rejected' || existingRequest.status === 'needs_correction')) {
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center p-6 pb-24">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl p-10 shadow-2xl border-2 border-gray-100 dark:border-neutral-800 text-center space-y-8">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-20 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/30 hover:scale-110 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Identity Verification</h1>
          </div>
          <p className="text-emerald-50 font-medium max-w-xl">
            Complete your profile verification to earn the blue checkmark badge and increase your community trust score.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-2xl border-2 border-gray-100 dark:border-neutral-800 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Verification Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Full Legal Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-800 transition-all outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">ID Type</label>
                <select
                  value={formData.id_type}
                  onChange={(e) => setFormData({...formData, id_type: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-800 transition-all outline-none font-medium appearance-none cursor-pointer"
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
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-800 transition-all outline-none font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground ml-1">Photo of Front ID</label>
                <div 
                  onClick={() => !isUploading && fileInputRefFront.current?.click()}
                  className={`relative h-48 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden ${
                    formData.id_front_url 
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5" 
                      : "border-gray-200 dark:border-neutral-700 hover:border-emerald-500 bg-gray-50 dark:bg-neutral-800/50"
                  }`}
                >
                  {formData.id_front_url ? (
                    <>
                            <img src={formData.id_front_url} alt="Front ID Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 z-20">
                              <button
                                type="button"
                                onClick={(ev) => { ev.stopPropagation(); fileInputRefFront.current?.click(); }}
                                className="bg-white/80 dark:bg-neutral-800/80 text-xs px-3 py-1 rounded-full shadow-sm"
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
                      <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-lg">
                        {isUploading === 'front' ? <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /> : <Upload className="w-6 h-6 text-emerald-600" />}
                      </div>
                      <p className="font-bold text-xs lg:text-sm text-foreground">Upload Front Side</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRefFront}
                    onChange={(e) => handleImageUpload(e, 'front')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground ml-1">Photo of Back ID</label>
                <div 
                  onClick={() => !isUploading && fileInputRefBack.current?.click()}
                  className={`relative h-48 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden ${
                    formData.id_back_url 
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5" 
                      : "border-gray-200 dark:border-neutral-700 hover:border-emerald-500 bg-gray-50 dark:bg-neutral-800/50"
                  }`}
                >
                  {formData.id_back_url ? (
                    <>
                          <img src={formData.id_back_url} alt="Back ID Preview" className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 z-20">
                            <button
                              type="button"
                              onClick={(ev) => { ev.stopPropagation(); fileInputRefBack.current?.click(); }}
                              className="bg-white/80 dark:bg-neutral-800/80 text-xs px-3 py-1 rounded-full shadow-sm"
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
                      <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-lg">
                        {isUploading === 'back' ? <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /> : <Upload className="w-6 h-6 text-emerald-600" />}
                      </div>
                      <p className="font-bold text-xs lg:text-sm text-foreground">Upload Back Side</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRefBack}
                    onChange={(e) => handleImageUpload(e, 'back')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border-2 border-amber-100 dark:border-amber-500/20 flex gap-4">
              <Info className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-200/80 font-medium">
                Your ID photos are encrypted and only used for verification purposes. Both front and back are required for complete verification.
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-3 sm:gap-4 mt-8">
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
              disabled={!!isUploading || !formData.id_front_url || !formData.id_back_url}
              icon={Shield}
            >
              Submit for Verification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


