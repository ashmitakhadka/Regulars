import { useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faPhone,
  faEnvelope,
  faLocationDot,
  faPen,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";

import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { Button, Card, Input } from "../../components/ui";

const initialForm = {
  businessName: "",
  phone: "",
  email: "",
  address: "",
};

const Field = ({ label, icon, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-[#23140C]">
      {label}
    </span>

    <div className="relative">
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#23140C]/40"
        />
      )}
      {children}
    </div>
  </label>
);

export const Settings = () => {
  const [form, setForm] = useState(initialForm);
  const [savedForm, setSavedForm] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const update = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const handleCancel = () => {
    setForm(savedForm);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: Connect merchant profile update API.
      toast.error("Profile update API is not connected yet.");
    } catch (err) {
      console.error("Failed to update business profile:", err);
      toast.error(
        err.response?.data?.message || "Unable to update business profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full !pl-10";

  const details = [
    {
      label: "Business name",
      value: form.businessName,
    },
    {
      label: "Phone number",
      value: form.phone,
    },
    {
      label: "Business email",
      value: form.email,
    },
    {
      label: "Business address",
      value: form.address,
    },
  ];

  return (
    <div className="flex min-h-screen bg-white md:flex-row">
      <MerchantSidebar />

      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#23140C] sm:text-3xl">
              Settings
            </h1>

            <p className="mt-2 text-sm text-[#23140C]/60">
              Manage your business profile and account preferences.
            </p>
          </header>

          {/* Business Information */}
          <Card padding="p-5 sm:p-7" className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA]">
                  <FontAwesomeIcon
                    icon={faStore}
                    className="text-lg text-[#A51D27]"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-[#23140C]">
                    Business Information
                  </h2>
                  <p className="mt-0.5 text-xs text-[#23140C]/55">
                    Manage your business details.
                  </p>
                </div>
              </div>

              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <FontAwesomeIcon icon={faPen} className="mr-2" />
                  Edit details
                </Button>
              )}
            </div>

            {/* Edit Form / Business Details */}
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-t border-[#23140C]/10 pt-5">
                  <Field label="Business name" icon={faStore}>
                    <Input
                      type="text"
                      value={form.businessName}
                      onChange={update("businessName")}
                      required
                      placeholder="Enter your business name"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Phone number" icon={faPhone}>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={update("phone")}
                      required
                      placeholder="Enter phone number"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Business email" icon={faEnvelope}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      required
                      placeholder="Enter business email"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Business address" icon={faLocationDot}>
                  <Input
                    type="text"
                    value={form.address}
                    onChange={update("address")}
                    required
                    placeholder="Enter business address"
                    className={inputClass}
                  />
                </Field>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 border-t border-[#23140C]/10 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="border-t border-[#23140C]/10 pt-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {details.map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-medium text-[#23140C]/50">
                        {item.label}
                      </p>

                      <p className="mt-1 break-words text-sm font-medium text-[#23140C]">
                        {item.value || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
