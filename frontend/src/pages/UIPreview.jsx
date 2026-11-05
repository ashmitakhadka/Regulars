import { useState } from "react";
import {
  Button,
  Logo,
  Card,
  Input,
  Tag,
  Spinner,
  EmptyState,
  ErrorState,
} from "../components/ui";
import { faWallet } from "@fortawesome/free-solid-svg-icons";

export const UIPreview = () => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-white text-ink p-6 sm:p-10 max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-900">
          UI Component Showcase
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Reusable UI library conforming to Regulars design system and theme tokens.
        </p>
      </div>

      {/* 1. Logos */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-brand-900 border-b border-blush-200 pb-2">
          1. Logo (with Flame Icon)
        </h2>
        <div className="flex flex-wrap items-center gap-8 py-2">
          <div>
            <p className="text-xs text-ink-soft mb-1">Small (sm)</p>
            <Logo size="sm" to="/ui-preview" />
          </div>
          <div>
            <p className="text-xs text-ink-soft mb-1">Medium (md - default)</p>
            <Logo size="md" to="/ui-preview" />
          </div>
          <div>
            <p className="text-xs text-ink-soft mb-1">Large (lg)</p>
            <Logo size="lg" to="/ui-preview" />
          </div>
        </div>

        <div className="rounded-xl bg-[#23140c] p-6 inline-block">
          <p className="text-xs text-white/70 mb-2">Light on dark background</p>
          <Logo size="md" light to="/ui-preview" />
        </div>
      </section>

      {/* 2. Buttons */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-brand-900 border-b border-blush-200 pb-2">
          2. Buttons
        </h2>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
            Variants
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Red</Button>
            <Button variant="secondary">Secondary Blush</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost Link</Button>
          </div>
        </div>

        <div className="rounded-xl bg-[#23140c] p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Dark / Hero Background Variants
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="onDark">Solid On-Dark</Button>
            <Button variant="onDarkOutline">Outline On-Dark</Button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
            Sizes
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small (sm)</Button>
            <Button size="md">Medium (md)</Button>
            <Button size="lg">Large (lg)</Button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
            States
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              loading={isLoading}
              onClick={() => setIsLoading(!isLoading)}
            >
              {isLoading ? "Saving..." : "Click to toggle loading"}
            </Button>
            <Button disabled>Disabled Button</Button>
          </div>
        </div>
      </section>

      {/* 3. Cards */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-brand-900 border-b border-blush-200 pb-2">
          3. Cards (No border, soft shadow, rounded-xl)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="font-display text-lg font-bold text-brand-900">
              Standard Card
            </h3>
            <p className="text-sm text-ink-soft mt-1 leading-relaxed">
              White background, clean rounded-xl edges, and soft shadow with zero borders.
            </p>
          </Card>
          <Card onClick={() => alert("Card clicked!")}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-brand-900">
                Interactive Card
              </h3>
              <Tag variant="green">Click me</Tag>
            </div>
            <p className="text-sm text-ink-soft mt-1">
              Elevates slightly on hover with smooth transition.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. Inputs */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-brand-900 border-b border-blush-200 pb-2">
          4. Form Inputs
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Customer Name"
            placeholder="e.g. John Doe"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            hint="Enter your full legal name"
          />
          <Input
            label="Email with Error"
            type="email"
            defaultValue="invalid-email"
            error="Please enter a valid email address."
          />
          <Input
            label="Disabled Field"
            defaultValue="RG-DEM789"
            disabled
            hint="Customer code cannot be changed"
          />
        </div>
      </section>

      {/* 5. Tags */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-brand-900 border-b border-blush-200 pb-2">
          5. Tags & Badges
        </h2>
        <div className="flex flex-wrap gap-3">
          <Tag variant="green">Active Card</Tag>
          <Tag variant="amber">1 Stamp Left</Tag>
          <Tag variant="red">Expired Voucher</Tag>
          <Tag variant="cream">Neutral Tag</Tag>
        </div>
      </section>

      {/* 6. Spinners */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-brand-900 border-b border-blush-200 pb-2">
          6. Spinners
        </h2>
        <div className="flex items-center gap-6">
          <Spinner size="sm" className="text-brand-800" />
          <Spinner size="md" className="text-brand-800" />
          <Spinner size="lg" className="text-brand-800" />
        </div>
      </section>

      {/* 7. Empty & Error States */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-brand-900 border-b border-blush-200 pb-2">
          7. Empty & Error States
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card padding="p-2">
            <EmptyState
              icon={faWallet}
              title="No stamp cards yet"
              description="Scan a QR code at any participating business to start your first card."
              action={
                <Button variant="secondary" size="sm">
                  Find Businesses
                </Button>
              }
            />
          </Card>
          <Card padding="p-2">
            <ErrorState
              title="Could not load vouchers"
              message="Network timeout while connecting to the loyalty server."
              onRetry={() => alert("Retrying...")}
            />
          </Card>
        </div>
      </section>
    </div>
  );
};

export default UIPreview;

