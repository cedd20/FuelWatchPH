import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, User, Camera, Save, Loader2, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { toast } from "sonner";
import { api as apiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";

export function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    avatar_url: "",
  });

  const [existingRequest, setExistingRequest] = useState(undefined);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiClient.get("/me/profile");
        if (data) {
          setFormData({
            username: data.username || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
          });
        }
      } catch (error) {
        setFormData({
          username: user?.username || user?.email?.split("@")[0] || "",
          bio: user?.bio || "",
          avatar_url: user?.avatar_url || "",
        });
      } finally {
        setIsFetching(false);
      }
    }
    if (user) fetchProfile();
  }, [user]);

  // Fetch existing verification request status for displaying Pending/Resubmit states
  useEffect(() => {
    async function checkExistingRequest() {
      try {
        const requests = await apiClient.get("/me/verifications");
        if (requests && requests.length > 0) {
          setExistingRequest(requests[0]);
        } else {
          setExistingRequest(null);
        }
      } catch (e) {
        console.error('Failed to check verification requests', e);
        setExistingRequest(null);
      } finally {
        setIsCheckingRequest(false);
      }
    }

    if (user) checkExistingRequest();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedProfile = await apiClient.put("/me/profile", formData);
      if (setUser) {
        setUser(prev => ({
          ...prev,
          ...updatedProfile,
          name: updatedProfile.username || prev.name,
          initials: (updatedProfile.username || prev.name || "U").substring(0, 1).toUpperCase(),
        }));
      }
      toast.success("Profile updated successfully!");
      navigate("/app/profile");
    } catch (error) {
      toast.error(error.body?.detail || error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB.");
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Image uploaded! Don't forget to save changes.");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#050A09] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-emerald-500/60 font-bold animate-pulse text-sm">Loading profile...</p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-[#050A09] border border-emerald-500/10 rounded-2xl p-5 text-sm font-bold text-white placeholder:text-gray-700 focus:border-emerald-500/50 focus:outline-none transition-all";

  return (
    <div className="min-h-screen bg-[#050A09] text-white pb-28">
      {/* Header */}
      <div className="relative pt-14 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-[#0C1A17] rounded-full border border-emerald-500/10 hover:bg-emerald-500 transition-all shadow-2xl group"
            >
              <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Edit Profile</h1>
              <p className="text-gray-600 font-bold text-xs uppercase tracking-widest mt-1">Update your public info</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-14 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Avatar Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0C1A17] rounded-[3rem] p-10 border border-emerald-500/10 shadow-2xl flex flex-col items-center"
          >
            <div className="relative group mb-4">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-2xl shadow-emerald-500/20">
                <div className="w-full h-full rounded-[2.2rem] bg-[#050A09] flex items-center justify-center overflow-hidden border border-white/10">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-black text-emerald-500">
                      {(formData.username || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl border-4 border-[#050A09] hover:scale-110 transition-transform disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              Tap the camera to update photo
            </p>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0C1A17] rounded-[3rem] p-8 border border-emerald-500/10 shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="font-black">Basic Information</h2>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Username / Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Your name or username"
                  className={`${inputClass} pl-12`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us a bit about yourself..."
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Verification Row */}
            <div className="pt-4 border-t border-emerald-500/5">
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Identity Verification</label>
              <div className="flex items-center justify-between p-5 bg-[#050A09] rounded-2xl border border-emerald-500/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-black text-sm">Verification Status</div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      {user?.is_verified ? "Verified Member" : "Not Yet Verified"}
                    </div>
                  </div>
                </div>
                {user?.is_verified ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} />
                    Verified
                  </div>
                ) : (
                  // Show verification status based on existing request
                  (function(){
                    if (typeof existingRequest === 'undefined' || existingRequest === null) {
                      return (
                        <button
                          type="button"
                          onClick={() => navigate("/app/verify-identity")}
                          className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl font-black text-[10px] text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                        >
                          Get Verified
                        </button>
                      );
                    }

                    const status = existingRequest?.status;
                    if (status === 'pending') {
                      return (
                        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending</div>
                      );
                    }

                    if (status === 'needs_correction') {
                      return (
                        <button
                          type="button"
                          onClick={() => navigate("/app/verify-identity")}
                          className="px-5 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl font-black text-[10px] text-amber-400 uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                        >
                          Edit Submission
                        </button>
                      );
                    }

                    if (status === 'rejected') {
                      return (
                        <button
                          type="button"
                          onClick={() => navigate("/app/verify-identity")}
                          className="px-5 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl font-black text-[10px] text-rose-400 uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                        >
                          Resubmit
                        </button>
                      );
                    }

                    // default fallback
                    return (
                      <button
                        type="button"
                        onClick={() => navigate("/app/verify-identity")}
                        className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl font-black text-[10px] text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                      >
                        Get Verified
                      </button>
                    );
                  })()
                )}
              </div>
            </div>
          </motion.div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-5 bg-[#0C1A17] border border-emerald-500/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:border-emerald-500/30 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
