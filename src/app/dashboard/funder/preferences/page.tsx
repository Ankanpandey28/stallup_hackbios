"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const cities = [
  "Indore",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Pune",
  "Khargone",
  "Other",
];

const states = [
  "Madhya Pradesh",
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Gujarat",
  "Rajasthan",
  "Other",
];

const categories = [
  "Street Food",
  "Beverages",
  "Snacks",
  "Bakery",
  "Fast Food",
  "Traditional Food",
  "Desserts",
  "Other",
];

const businessTypes = [
  { label: "Street Food", value: "street_food" },
  { label: "Food Stall", value: "food_stall" },
  { label: "Food Truck", value: "food_truck" },
  { label: "Home Based", value: "home_based" },
  { label: "Cloud Kitchen", value: "cloud_kitchen" },
  { label: "Small Restaurant", value: "small_restaurant" },
  { label: "Catering", value: "catering" },
  { label: "Other", value: "other" },
];

const riskLevels = ["Low", "Medium", "High"];

export default function FunderPreferencesPage() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [businessType, setBusinessType] = useState("");

  const [minInvestment, setMinInvestment] = useState("");
  const [maxInvestment, setMaxInvestment] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [riskLevel, setRiskLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPreferences() {
      const supabase = createClient();

      try {
        setLoading(true);
        setError("");

        // Get currently logged-in user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);

          if (mounted) {
            setError(authError.message);
          }

          return;
        }

        if (!user) {
          window.location.href = "/login";
          return;
        }

        console.log("Logged-in funder:", user.id);

        // Load existing preferences
        const { data, error: preferencesError } = await supabase
          .from("funder_preferences")
          .select("*")
          .eq("funder_id", user.id)
          .maybeSingle();

        if (preferencesError) {
          console.error(
            "Preferences error:",
            preferencesError
          );

          if (mounted) {
            setError(preferencesError.message);
          }

          return;
        }

        console.log("Existing preferences:", data);

        if (!mounted) return;

        // No preferences yet is completely valid.
        // The form will simply remain empty.
        if (data) {
          setCity(data.preferred_city || "");
          setState(data.preferred_state || "");

          if (
            Array.isArray(data.preferred_categories) &&
            data.preferred_categories.length > 0
          ) {
            setCategory(data.preferred_categories[0]);
          }

          if (
            Array.isArray(data.preferred_business_types) &&
            data.preferred_business_types.length > 0
          ) {
            setBusinessType(data.preferred_business_types[0]);
          }

          setMinInvestment(
            data.min_investment != null
              ? String(data.min_investment)
              : ""
          );

          setMaxInvestment(
            data.max_investment != null
              ? String(data.max_investment)
              : ""
          );

          setMinExperience(
            data.min_experience != null
              ? String(data.min_experience)
              : ""
          );

          setRiskLevel(
            data.preferred_risk_level || ""
          );
        }
      } catch (err) {
        console.error("Unexpected preferences error:", err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading preferences."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const supabase = createClient();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const min = Number(minInvestment);
      const max = Number(maxInvestment);
      const experience = Number(minExperience);

      if (
        minInvestment === "" ||
        maxInvestment === "" ||
        minExperience === ""
      ) {
        setError(
          "Please enter minimum investment, maximum investment, and minimum experience."
        );
        return;
      }

      if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        !Number.isFinite(experience)
      ) {
        setError("Please enter valid numeric values.");
        return;
      }

      if (min < 0 || max < 0 || experience < 0) {
        setError(
          "Investment and experience values cannot be negative."
        );
        return;
      }

      if (min > max) {
        setError(
          "Minimum investment cannot be greater than maximum investment."
        );
        return;
      }

      const { error: saveError } = await supabase
        .from("funder_preferences")
        .upsert(
          {
            funder_id: user.id,

            preferred_city: city || null,
            preferred_state: state || null,

            preferred_categories: category
              ? [category]
              : [],

            preferred_business_types: businessType
              ? [businessType]
              : [],

            min_investment: min,
            max_investment: max,

            min_experience: experience,

            preferred_risk_level: riskLevel || null,
          },
          {
            onConflict: "funder_id",
          }
        );

      if (saveError) {
        throw new Error(saveError.message);
      }

      setMessage(
        "Your investment preferences have been saved successfully."
      );
    } catch (err) {
      console.error("Save preferences error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-600">
            Loading your preferences...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">

        <div className="mb-6">
          <a
            href="/dashboard/funder"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Funder Dashboard
          </a>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">

          <div className="mb-8">
            <p className="text-sm font-medium text-blue-600">
              StallUp
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Investment Preferences
            </h1>

            <p className="mt-2 text-gray-600">
              Tell us what kind of businesses you are interested
              in funding.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* City */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Preferred City
              </label>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select city
                </option>

                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Preferred State
              </label>

              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select state
                </option>

                {states.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Preferred Food Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select category
                </option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Preferred Business Type
              </label>

              <select
                value={businessType}
                onChange={(e) =>
                  setBusinessType(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select business type
                </option>

                {businessTypes.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Investment */}
            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Minimum Investment (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={minInvestment}
                  onChange={(e) =>
                    setMinInvestment(e.target.value)
                  }
                  placeholder="e.g. 50000"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Maximum Investment (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={maxInvestment}
                  onChange={(e) =>
                    setMaxInvestment(e.target.value)
                  }
                  placeholder="e.g. 500000"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* Experience */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Minimum Business Experience (Years)
              </label>

              <input
                type="number"
                min="0"
                step="0.5"
                value={minExperience}
                onChange={(e) =>
                  setMinExperience(e.target.value)
                }
                placeholder="e.g. 2"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Risk */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Preferred Risk Level
              </label>

              <select
                value={riskLevel}
                onChange={(e) =>
                  setRiskLevel(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select risk level
                </option>

                {riskLevels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving Preferences..."
                : "Save Preferences"}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}