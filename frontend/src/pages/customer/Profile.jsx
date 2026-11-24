import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { Card, Button, Input, Spinner, ErrorState, Alert } from "../../components/ui";
import { useCustomerAuth } from "../../auth/CustomerAuthContext";
import profileService from "../../services/customer/profileService";
import {
  customerProfileSchema,
  normalizeNepaliPhone,
} from "../../lib/customerAuthSchema";
import { formatPlainDate } from "../../lib/formatVisitDate";

export const Profile = () => {
  const { logout, updateCustomer } = useCustomerAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Fetch customer profile on mount
  const fetchProfile = async (signal) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await profileService.getProfile(signal);
      if (res?.data) {
        setProfile(res.data);
        setFormData({
          name: res.data.name || "",
          phone: res.data.phone || "",
        });
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      if (err.response?.status === 401) {
        navigate("/login?redirect=%2Fprofile", { replace: true });
        return;
      }
      setLoadError(
        err.response?.data?.message ||
          "Could not load your profile. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  // Compute cleaned values for dirty check & submission
  const cleanedName = useMemo(
    () => formData.name.trim().replace(/\s+/g, " "),
    [formData.name]
  );
  const normalizedPhone = useMemo(
    () => normalizeNepaliPhone(formData.phone),
    [formData.phone]
  );

  const isChanged = useMemo(() => {
    if (!profile) return false;
    const currentName = (profile.name || "").trim().replace(/\s+/g, " ");
    const currentPhone = normalizeNepaliPhone(profile.phone || "");
    return cleanedName !== currentName || normalizedPhone !== currentPhone;
  }, [profile, cleanedName, normalizedPhone]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (successMessage) setSuccessMessage("");
    if (generalError) setGeneralError("");
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setSuccessMessage("");
    setGeneralError("");
    setFormErrors({});
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormErrors({});
    setGeneralError("");
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isChanged || isSaving) return;

    setGeneralError("");
    setSuccessMessage("");
    setFormErrors({});

    // Client Zod validation
    const validationResult = customerProfileSchema.safeParse({
      name: cleanedName,
      phone: formData.phone,
    });

    if (!validationResult.success) {
      const fieldErrors = {};
      let firstErrorField = null;

      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
          if (!firstErrorField) firstErrorField = field;
        }
      });

      setFormErrors(fieldErrors);
      if (firstErrorField === "name") nameInputRef.current?.focus();
      else if (firstErrorField === "phone") phoneInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const res = await profileService.updateProfile({
        name: cleanedName,
        phone: normalizedPhone,
      });

      if (res?.data) {
        setProfile(res.data);
        setFormData({
          name: res.data.name || "",
          phone: res.data.phone || "",
        });
        updateCustomer(res.data);
        setSuccessMessage("Profile updated");
        setIsEditing(false);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login?redirect=%2Fprofile", { replace: true });
        return;
      }

      if (err.response?.status === 422) {
        const serverErrors = err.response.data?.errors || {};
        const mappedErrors = {};
        let firstErrorField = null;

        if (serverErrors.name && serverErrors.name.length > 0) {
          mappedErrors.name = serverErrors.name[0];
          firstErrorField = firstErrorField || "name";
        }
        if (serverErrors.phone && serverErrors.phone.length > 0) {
          mappedErrors.phone = serverErrors.phone[0];
          firstErrorField = firstErrorField || "phone";
        }

        setFormErrors(mappedErrors);
        if (firstErrorField === "name") nameInputRef.current?.focus();
        else if (firstErrorField === "phone") phoneInputRef.current?.focus();

        if (err.response.data?.message && !mappedErrors.name && !mappedErrors.phone) {
          setGeneralError(err.response.data.message);
        }
        return;
      }

      if (err.response?.status === 429) {
        setGeneralError("Too many attempts, try again in a minute");
        return;
      }

      setGeneralError(
        err.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initialLetter = (profile?.name || "Customer").trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl sm:text-[28px] font-bold text-brand-900">
          Customer Profile
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Your customer identification and account details.
        </p>
      </div>

      {isLoading ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="text-sm text-ink-soft mt-4">Loading profile...</p>
          </div>
        </Card>
      ) : loadError ? (
        <Card className="p-6">
          <ErrorState
            title="Failed to load profile"
            message={loadError}
            onRetry={() => fetchProfile()}
          />
        </Card>
      ) : (
        <Card>
          {/* Header Row: Avatar, Name/Email and Customer ID */}
          <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between py-2 border-b border-blush-100 pb-6 mb-6 gap-4">
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div
                className="w-12 h-12 rounded-full bg-brand-800 text-white flex items-center justify-center text-lg font-extrabold shrink-0 select-none shadow-sm"
                aria-hidden="true"
              >
                {initialLetter}
              </div>
              <div className="text-left">
                <h2 className="font-display text-xl font-bold text-brand-900 leading-tight">
                  {profile?.name || "Customer"}
                </h2>
                <p className="text-xs text-ink-soft">{profile?.email || ""}</p>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 text-center sm:text-right">
              <span className="text-xs text-ink-soft uppercase tracking-wider block mb-1">
                Customer ID
              </span>
              <span className="inline-block rounded-lg bg-blush-100 px-3 py-1 font-mono text-base font-extrabold text-brand-900 select-all">
                {profile?.customer_code || "—"}
              </span>
            </div>
          </div>

          {/* Feedback alerts */}
          {successMessage && (
            <Alert variant="success" className="mb-4">
              {successMessage}
            </Alert>
          )}

          {generalError && (
            <Alert variant="error" className="mb-4">
              {generalError}
            </Alert>
          )}

          {/* Middle Section: View Mode vs Edit Mode */}
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Account Details
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="h-7 px-2.5 text-[11px] text-brand-900 border-brand-200 hover:bg-blush-50"
                >
                  <FontAwesomeIcon icon={faPen} className="text-[9px] mr-1" />
                  Edit
                </Button>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between py-2.5 border-b border-blush-50">
                  <span className="text-ink-soft">Full Name</span>
                  <span className="font-semibold text-ink">{profile?.name || "—"}</span>
                </div>

                <div className="flex justify-between py-2.5 border-b border-blush-50">
                  <span className="text-ink-soft">Phone Number</span>
                  <span className="font-semibold text-ink">{profile?.phone || "—"}</span>
                </div>

                <div className="flex justify-between py-2.5 border-b border-blush-50">
                  <span className="text-ink-soft">Email Address</span>
                  <span className="font-semibold text-ink">{profile?.email || "—"}</span>
                </div>

                <div className="flex justify-between py-2.5 border-b border-blush-50">
                  <span className="text-ink-soft">Member Since</span>
                  <span className="font-semibold text-ink">
                    {formatPlainDate(profile?.member_since) || "—"}
                  </span>
                </div>

                <div className="flex justify-between py-2.5 border-b border-blush-50">
                  <span className="text-ink-soft">Account Type</span>
                  <span className="font-semibold text-ink capitalize">Customer</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} noValidate className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Edit Details
                </h3>
              </div>

              <Input
                ref={nameInputRef}
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                error={formErrors.name}
                required
                autoComplete="name"
                maxLength={100}
                placeholder="Your full name"
              />

              <Input
                ref={phoneInputRef}
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                error={formErrors.phone}
                required
                autoComplete="tel"
                placeholder="98XXXXXXXX"
                hint="Nepal mobile number (10 digits starting with 96, 97, or 98)"
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={profile?.email || ""}
                disabled
                hint="Email cannot be changed"
              />

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSaving}
                  disabled={!isChanged || isSaving}
                >
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Sign Out Footer */}
          <div className="mt-8 pt-4 border-t border-blush-50 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleLogout}
              size="sm"
              className="text-ink-soft hover:text-brand-900"
            >
              Sign out
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Profile;
