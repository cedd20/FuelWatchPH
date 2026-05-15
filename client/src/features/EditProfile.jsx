import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, User, Mail, Camera, Save, Loader2, Info, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/shared/components/Button";
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
        console.error("Failed to fetch profile:", error);
        // Fallback to auth user metadata if API fails
        setFormData({
          username: user?.username || user?.email?.split('@')[0] || "",
          bio: user?.bio || "",
          avatar_url: user?.avatar_url || "",
        });
      } finally {
        setIsFetching(false);
      }
    }

    if (user) {
      fetchProfile();
    }
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
      
      // Update local auth context
      if (setUser) {
        setUser(prev => ({
          ...prev,
          ...updatedProfile,
          name: updatedProfile.username || prev.name,
          initials: (updatedProfile.username || prev.name || 'U').substring(0, 1).toUpperCase()
        }));
      }
      
      toast.success("Profile updated successfully!");
      navigate("/app/profile");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.body?.detail || error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Image uploaded! Don't forget to save changes.");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };


  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading profile...</p>
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
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Edit Profile</h1>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Profile Picture Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-2xl border-2 border-gray-100 dark:border-neutral-800 flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-neutral-800 dark:to-neutral-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-neutral-800 shadow-xl">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl lg:text-6xl font-bold text-emerald-600 dark:text-emerald-500">
                    {(formData.username || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-2 right-2 w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-neutral-900 hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground font-medium">Click the camera to change photo</p>
          </div>

          {/* Basic Info Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-2xl border-2 border-gray-100 dark:border-neutral-800 space-y-6">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Your Full Name"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-800 transition-all outline-none font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell us a bit about yourself..."
                rows={4}
                className="w-full p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-800 transition-all outline-none font-medium resize-none"
              />
            </div>

            {/* Verification Section */}
            <div className="pt-4 border-t-2 border-gray-100 dark:border-neutral-800 space-y-4">
              <label className="text-sm font-bold text-muted-foreground ml-1">Identity Verification</label>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border-2 border-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-neutral-800">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm lg:text-base">Status</div>
                    <div className="text-xs lg:text-sm text-muted-foreground font-medium">
                      {user?.is_verified ? "Verified Member" : "Not Verified"}
                    </div>
                  </div>
                </div>
                {user?.is_verified ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" strokeWidth={3} />
                    Verified
                  </div>
                ) : (
                  // Show verification status based on existing request
                  (function(){
                    if (typeof existingRequest === 'undefined') return (
                      <button 
                        type="button" 
                        onClick={() => navigate("/app/verify-identity")}
                        className="px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-xs lg:text-sm text-foreground hover:border-emerald-500 transition-all shadow-sm"
                      >
                        Get Verified
                      </button>
                    );

                    if (existingRequest === null) {
                      return (
                        <button 
                          type="button" 
                          onClick={() => navigate("/app/verify-identity")}
                          className="px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-xs lg:text-sm text-foreground hover:border-emerald-500 transition-all shadow-sm"
                        >
                          Get Verified
                        </button>
                      );
                    }

                    const status = existingRequest?.status;
                    if (status === 'pending') {
                      return (
                        <div className="px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 text-xs font-bold text-yellow-700">Pending</div>
                      );
                    }

                    if (status === 'needs_correction') {
                      return (
                        <button 
                          type="button" 
                          onClick={() => navigate("/app/verify-identity")}
                          className="px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-amber-500 rounded-xl font-bold text-xs lg:text-sm text-foreground hover:border-amber-600 transition-all shadow-sm"
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
                          className="px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-rose-500 rounded-xl font-bold text-xs lg:text-sm text-foreground hover:border-rose-600 transition-all shadow-sm"
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
                        className="px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-xs lg:text-sm text-foreground hover:border-emerald-500 transition-all shadow-sm"
                      >
                        Get Verified
                      </button>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              fullWidth 
              size="lg"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              fullWidth 
              size="lg" 
              loading={isLoading}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
