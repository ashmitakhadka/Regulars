import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Input, Spinner, ErrorState, CopyButton, Alert } from "../../components/ui";
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
    // Clear notifications on edits
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
          Manage your account information and view your member code.
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
        <>
          {/* Top Card: Avatar, Name, Member Since */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-800 text-white flex items-center justify-center text-xl sm:text-2xl font-extrabold shrink-0 select-none shadow-sm"
                aria-hidden="true"
              >
                {initialLetter}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-900 truncate">
                  {profile?.name || "Customer"}
                </h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
                  Member since {formatPlainDate(profile?.member_since)}
                </p>
              </div>
            </div>
          </Card>

          {/* Customer ID Card */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block">
                  Customer ID
                </span>
                <div className="inline-block rounded-xl bg-blush-100/70 border border-blush-200/80 px-4 py-2 font-mono text-xl sm:text-2xl font-bold tracking-wider text-brand-900 select-all">
                  {profile?.customer_code || "—"}
                </div>
              </div>
              <div className="sm:self-center">
                <CopyButton
                  text={profile?.customer_code}
                  label="Copy ID"
                  size="md"
                />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft mt-3">
              Show this ID to a shop if they need to find your account.
            </p>
          </Card>

          {/* Edit Profile Form Card */}
          <Card className="p-5 sm:p-6">
            <h3 className="font-display text-lg font-bold text-brand-900 mb-4">
              Account Details
            </h3>

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

            <form onSubmit={handleSave} noValidate className="space-y-4">
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

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSaving}
                  disabled={!isChanged || isSaving}
                  className="w-full sm:w-auto"
                >
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Log Out Section */}
          <Card className="p-5 sm:p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-brand-900 text-sm sm:text-base">
                Sign out of account
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                End your active customer session on this device.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-brand-800 border-brand-200 hover:bg-blush-50"
            >
              Log Out
            </Button>
          </Card>
        </>
      )}
    </div>
  );
};

export default Profile;
