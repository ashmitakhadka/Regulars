import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { Button, Card, Input } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { merchantSettingService } from "../../services/merchantSettingService";

const EMPTY_SECURITY = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const validateSecurity = ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const errors = {};
  if (!currentPassword) errors.currentPassword = "Enter your current password.";
  if (newPassword.length < 8) errors.newPassword = "Use at least 8 characters.";
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
};

/* ---------- Building blocks ---------- */

const Field = ({ label, children }) => (
  <label className="block text-left">
    <span className="mb-1.5 block text-sm font-medium text-[#23140C]">
      {label}
    </span>
    {children}
  </label>
);

// Label on the left, value on the right; stacks on mobile.
const Rows = ({ items }) => (
  <dl className="space-y-4">
    {items.map(({ label, value }) => (
      <div key={label} className="sm:grid sm:grid-cols-[140px_1fr] sm:gap-4">
        <dt className="text-sm text-[#23140C]/55">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-[#23140C] sm:mt-0">
          {value || <span className="text-[#23140C]/40">Not provided</span>}
        </dd>
      </div>
    ))}
  </dl>
);

const Section = ({
  title,
  description,
  editLabel = "Edit",
  isEditing,
  isLocked,
  isSaving,
  onEdit,
  onCancel,
  onSubmit,
  rows,
  children,
}) => (
  <Card padding="p-4 sm:p-6" className="mb-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-[#23140C]">{title}</h2>
        <p className="mt-0.5 text-sm text-[#23140C]/55">{description}</p>
      </div>

      {!isEditing && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={onEdit}
          disabled={isLocked}
          className="w-24 shrink-0"
        >
          {editLabel}
        </Button>
      )}
    </div>

    <div className="mt-4">
      {isEditing ? (
        <form onSubmit={onSubmit} className="max-w-md space-y-4" noValidate>
          {children}

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSaving}
              disabled={isSaving}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Rows items={rows} />
      )}
    </div>
  </Card>
);

/* ---------- Page ---------- */

export const Settings = () => {
  const { user, merchant, applySession } = useAuth();

  const [activeSection, setActiveSection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const defaultBusiness = useMemo(
    () => ({
      businessName: merchant?.business_name || merchant?.businessName || "",
      phone: merchant?.phone || "",
      email: merchant?.email || user?.email || "",
      address: merchant?.address || "",
    }),
    [merchant, user],
  );

  const defaultPersonal = useMemo(
    () => ({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    }),
    [user],
  );

  const [savedBusinessOverride, setSavedBusinessOverride] = useState(null);
  const [savedPersonalOverride, setSavedPersonalOverride] = useState(null);
  const savedBusiness = savedBusinessOverride || defaultBusiness;
  const savedPersonal = savedPersonalOverride || defaultPersonal;

  const [businessForm, setBusinessForm] = useState(defaultBusiness);
  const [personalForm, setPersonalForm] = useState(defaultPersonal);
  const [securityForm, setSecurityForm] = useState(EMPTY_SECURITY);
  const [securityErrors, setSecurityErrors] = useState({});

  const setter = (setForm) => (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const updateBusiness = setter(setBusinessForm);
  const updatePersonal = setter(setPersonalForm);

  const updateSecurity = (key) => (e) => {
    setSecurityForm((prev) => ({ ...prev, [key]: e.target.value }));
    setSecurityErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const resetSecurity = () => {
    setSecurityForm(EMPTY_SECURITY);
    setSecurityErrors({});
  };

  const close = () => setActiveSection(null);

  const save = async ({ request, onSuccess, successMessage, errorMessage }) => {
    setIsSaving(true);
    try {
      const response = await request();

      if (response?.user && response?.merchant && applySession) {
        applySession({ user: response.user, merchant: response.merchant });
      }

      onSuccess?.();
      close();
      toast.success(response?.message || successMessage);
    } catch (err) {
      console.error(errorMessage, err);
      toast.error(err.response?.data?.message || errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusiness = (e) => {
    e.preventDefault();
    save({
      request: () =>
        merchantSettingService.updateBusinessProfile({
          business_name: businessForm.businessName,
          phone: businessForm.phone,
          address: businessForm.address,
        }),
      onSuccess: () => setSavedBusinessOverride(businessForm),
      successMessage: "Business information updated.",
      errorMessage: "Unable to update business information.",
    });
  };

  const handleSavePersonal = (e) => {
    e.preventDefault();
    save({
      request: () =>
        merchantSettingService.updatePersonalAccount({
          name: personalForm.name,
          email: personalForm.email,
          personal_phone: personalForm.phone,
        }),
      onSuccess: () => setSavedPersonalOverride(personalForm),
      successMessage: "Personal account updated.",
      errorMessage: "Unable to update personal account.",
    });
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();

    const errors = validateSecurity(securityForm);
    setSecurityErrors(errors);
    if (Object.keys(errors).length > 0) return;

    save({
      request: () =>
        merchantSettingService.updatePassword({
          current_password: securityForm.currentPassword,
          password: securityForm.newPassword,
          password_confirmation: securityForm.confirmPassword,
        }),
      onSuccess: () => setSecurityForm(EMPTY_SECURITY),
      successMessage: "Password updated.",
      errorMessage: "Unable to update password.",
    });
  };

  const sectionProps = (name, { onEdit, onCancel }) => ({
    isEditing: activeSection === name,
    isLocked: activeSection !== null && activeSection !== name,
    isSaving,
    onEdit: () => {
      onEdit();
      setActiveSection(name);
    },
    onCancel: () => {
      onCancel();
      close();
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="min-w-0 flex-1 p-5 pb-12 sm:p-8 sm:pb-12">
        <div className="max-w-4xl">
          <h1 className="mb-8 text-2xl font-bold tracking-tight text-[#23140C] sm:text-3xl">
            Settings
          </h1>

          <Section
            title="Business"
            description="Your public business details."
            {...sectionProps("business", {
              onEdit: () => setBusinessForm(savedBusiness),
              onCancel: () => setBusinessForm(savedBusiness),
            })}
            onSubmit={handleSaveBusiness}
            rows={[
              { label: "Name", value: savedBusiness.businessName },
              { label: "Phone", value: savedBusiness.phone },
              { label: "Email", value: savedBusiness.email },
              { label: "Address", value: savedBusiness.address },
            ]}
          >
            <Field label="Business name">
              <Input
                type="text"
                value={businessForm.businessName}
                onChange={updateBusiness("businessName")}
                required
                className="w-full"
                disabled={isSaving}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={businessForm.phone}
                onChange={updateBusiness("phone")}
                className="w-full"
                disabled={isSaving}
              />
            </Field>
            <Field label="Address">
              <Input
                type="text"
                value={businessForm.address}
                onChange={updateBusiness("address")}
                className="w-full"
                disabled={isSaving}
              />
            </Field>
          </Section>

          <Section
            title="Account"
            description="Your name and login email."
            {...sectionProps("personal", {
              onEdit: () => setPersonalForm(savedPersonal),
              onCancel: () => setPersonalForm(savedPersonal),
            })}
            onSubmit={handleSavePersonal}
            rows={[
              { label: "Name", value: savedPersonal.name },
              { label: "Email", value: savedPersonal.email },
              { label: "Phone", value: savedPersonal.phone },
            ]}
          >
            <Field label="Full name">
              <Input
                type="text"
                value={personalForm.name}
                onChange={updatePersonal("name")}
                required
                className="w-full"
                disabled={isSaving}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={personalForm.email}
                onChange={updatePersonal("email")}
                required
                className="w-full"
                disabled={isSaving}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={personalForm.phone}
                onChange={updatePersonal("phone")}
                className="w-full"
                disabled={isSaving}
              />
            </Field>
          </Section>

          <Section
            title="Password"
            description="Use at least 8 characters."
            editLabel="Change"
            {...sectionProps("security", {
              onEdit: resetSecurity,
              onCancel: resetSecurity,
            })}
            onSubmit={handleSaveSecurity}
            rows={[{ label: "Password", value: "••••••••••••" }]}
          >
            <Field label="Current password">
              <Input
                type="password"
                value={securityForm.currentPassword}
                onChange={updateSecurity("currentPassword")}
                error={securityErrors.currentPassword}
                className="w-full"
                disabled={isSaving}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password">
              <Input
                type="password"
                value={securityForm.newPassword}
                onChange={updateSecurity("newPassword")}
                error={securityErrors.newPassword}
                className="w-full"
                disabled={isSaving}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                value={securityForm.confirmPassword}
                onChange={updateSecurity("confirmPassword")}
                error={securityErrors.confirmPassword}
                className="w-full"
                disabled={isSaving}
                autoComplete="new-password"
              />
            </Field>
          </Section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
