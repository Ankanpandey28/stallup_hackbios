"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const businessTypes = [
  {
    label: "Street Food",
    value: "street_food",
  },
  {
    label: "Food Stall",
    value: "food_stall",
  },
  {
    label: "Food Truck",
    value: "food_truck",
  },
  {
    label: "Home Based",
    value: "home_based",
  },
  {
    label: "Cloud Kitchen",
    value: "cloud_kitchen",
  },
  {
    label: "Small Restaurant",
    value: "small_restaurant",
  },
  {
    label: "Catering",
    value: "catering",
  },
  {
    label: "Other",
    value: "other",
  },
];

const foodCategories = [
  "Street Food",
  "Beverages",
  "Snacks",
  "Bakery",
  "Fast Food",
  "Traditional Food",
  "Desserts",
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

export default function BusinessRegistrationPage() {
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
const [checkingBusiness, setCheckingBusiness] = useState(true);
const [activeBusinessName, setActiveBusinessName] = useState("");
const [accessCheckError, setAccessCheckError] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [foodCategory, setFoodCategory] = useState("");
 
const [identityFile, setIdentityFile] = useState<File | null>(null);
const [foodLicenseFile, setFoodLicenseFile] = useState<File | null>(null);
const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("Madhya Pradesh");
  const [country, setCountry] = useState("India");

  const [yearsOfExperience, setYearsOfExperience] =
    useState("");

  const [monthlyRevenue, setMonthlyRevenue] =
    useState("");

  const [monthlyExpenses, setMonthlyExpenses] =
    useState("");

  const [fundingRequired, setFundingRequired] =
    useState("");

  const [fundingPurpose, setFundingPurpose] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
useEffect(() => {
  let cancelled = false;

  async function checkExistingBusiness() {
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (!cancelled) {
          setAccessCheckError(
            "Your session has expired. Please log in again."
          );
        }
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      
if (
  profileError ||
  !profile ||
  !["entrepreneur", "vendor"].includes(
    String(profile.role ?? "").trim().toLowerCase()
  )
) {
  setError(
    "Only Vendor accounts can register a business."
  );
  setLoading(false);
  return;
}

      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id, business_name")
          .eq("entrepreneur_id", user.id)
          .is("archived_at", null)
          .maybeSingle();

      if (businessError) {
        console.error(
          "Failed to check existing business:",
          businessError
        );

        if (!cancelled) {
          setAccessCheckError(
            "Unable to check your existing business. Please refresh the page and try again."
          );
        }
        return;
      }

      if (!cancelled && business) {
        setActiveBusinessName(business.business_name);
      }
    } catch (error) {
      console.error("Business access check failed:", error);

      if (!cancelled) {
        setAccessCheckError(
          "Unable to verify your registration status. Please refresh the page."
        );
      }
    } finally {
      if (!cancelled) {
        setCheckingBusiness(false);
      }
    }
  }

  checkExistingBusiness();

  return () => {
    cancelled = true;
  };
}, []);
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Basic validation
    if (
      !businessName.trim() ||
      !businessType ||
      !foodCategory ||
      !city.trim() ||
      !state ||
      !yearsOfExperience ||
      !monthlyRevenue ||
      !monthlyExpenses ||
      !fundingRequired
    ) {
      setError(
        "Please complete all required fields before submitting."
      );
      return;
    }

    const experience = Number(yearsOfExperience);
    const revenue = Number(monthlyRevenue);
    const expenses = Number(monthlyExpenses);
    const funding = Number(fundingRequired);

    if (
      experience < 0 ||
      revenue < 0 ||
      expenses < 0 ||
      funding < 0
    ) {
      setError(
        "Financial values and experience cannot be negative."
      );
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // Get authenticated Vendor
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(
        "Your session has expired. Please log in again."
      );
      setLoading(false);
      return;
    }

    // Verify role before inserting
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    
if (
  profileError ||
  !profile ||
  !["entrepreneur", "vendor"].includes(
    String(profile.role ?? "").trim().toLowerCase()
  )
) {
  setError(
    "Only Vendor accounts can register a business."
  );

  setLoading(false);
  return;
}

    // Insert business
    const { error: insertError } = await supabase
      .from("businesses")
      .insert({
        Vendor_id: user.id,

        business_name: businessName.trim(),

        description: description.trim() || null,

        business_type: businessType,

        food_category: foodCategory,

        city: city.trim(),

        state,

        country: country.trim() || "India",

        years_of_experience: experience,

        monthly_revenue: revenue,

        monthly_expenses: expenses,

        funding_required: funding,

        funding_purpose: fundingPurpose.trim() || null,

        verification_status: "pending",

        is_active: true,
      });

    
    if (insertError) {
      console.error(
        "Business registration error:",
        insertError
      );

      if (insertError.code === "23505") {
        setError(
          "You already have an active business. Please return to your dashboard."
        );
      } else {
        setError(
          "Unable to register your business. Please try again."
        );
      }

      setLoading(false);
      return;
    }

    setSuccess(
      "Business registered successfully! Your profile has been submitted for verification."
    );

    // Clear form
    setBusinessName("");
    setDescription("");
    setBusinessType("");
    setFoodCategory("");
    setCity("");
    setState("Madhya Pradesh");
    setCountry("India");
    setYearsOfExperience("");
    setMonthlyRevenue("");
    setMonthlyExpenses("");
    setFundingRequired("");
    setFundingPurpose("");

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <Link
          href="/dashboard/entrepreneur"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Vendor Dashboard
        </Link>

        {/* Header */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-blue-600">
            STALLUP
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Register Your Business
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            Tell us about your business so StallUp can verify
            your profile, analyze your opportunity and connect
            you with relevant funders.
          </p>
        </div>

        
        {checkingBusiness ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              Checking your business registration...
            </p>
          </div>
        ) : accessCheckError ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-700">
              {accessCheckError}
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block font-semibold text-blue-600 underline"
            >
              Go to Login
            </Link>
          </div>
        ) : activeBusinessName ? (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              You already have a registered business
            </h2>
            <p className="mt-3 text-gray-600">
              Your active business is{" "}
              <strong>{activeBusinessName}</strong>.
              Each Vendor can have only one active
              business at a time.
            </p>
            <Link
              href="/dashboard/entrepreneur"
              className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >

          {/* Business Information */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Business Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Basic information about your food business.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* Business Name */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Business Name *
                </label>

                <input
                  type="text"
                  value={businessName}
                  onChange={(event) =>
                    setBusinessName(event.target.value)
                  }
                  placeholder="e.g. Riya's Bakery"
                  required
                  maxLength={150}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Business Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe your business, products and customers..."
                  rows={4}
                  maxLength={1000}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-gray-400">
                  {description.length}/1000
                </p>
              </div>

              {/* Business Type */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Business Type *
                </label>

                <select
                  value={businessType}
                  onChange={(event) =>
                    setBusinessType(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

              {/* Food Category */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Food Category *
                </label>

                <select
                  value={foodCategory}
                  onChange={(event) =>
                    setFoodCategory(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select food category
                  </option>

                  {foodCategories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </section>

          {/* Location */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Business Location
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Where is your business currently operating?
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  City *
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  placeholder="e.g. Indore"
                  required
                  maxLength={100}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  State *
                </label>

                <select
                  value={state}
                  onChange={(event) =>
                    setState(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {states.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Country
                </label>

                <input
                  type="text"
                  value={country}
                  onChange={(event) =>
                    setCountry(event.target.value)
                  }
                  maxLength={100}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>
          </section>

          {/* Financial Information */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Business Financials
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Provide your current financial information.
                These figures will be used for business analysis.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* Experience */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Years of Experience *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={yearsOfExperience}
                  onChange={(event) =>
                    setYearsOfExperience(event.target.value)
                  }
                  placeholder="e.g. 3"
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Revenue */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Monthly Revenue (₹) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monthlyRevenue}
                  onChange={(event) =>
                    setMonthlyRevenue(event.target.value)
                  }
                  placeholder="e.g. 80000"
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Expenses */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Monthly Expenses (₹) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monthlyExpenses}
                  onChange={(event) =>
                    setMonthlyExpenses(event.target.value)
                  }
                  placeholder="e.g. 50000"
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Funding */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Funding Required (₹) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={fundingRequired}
                  onChange={(event) =>
                    setFundingRequired(event.target.value)
                  }
                  placeholder="e.g. 200000"
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            {/* Funding purpose */}
            <div className="mt-5">
              <label className="text-sm font-semibold text-gray-700">
                Funding Purpose
              </label>

              <textarea
                value={fundingPurpose}
                onChange={(event) =>
                  setFundingPurpose(event.target.value)
                }
                placeholder="What will the funding be used for? e.g. equipment, inventory, expansion..."
                rows={4}
                maxLength={1000}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </section>

{/* Financial Information */}
<section className="rounded-2xl bg-white p-6 shadow-sm">
  {/* Keep all your existing financial fields here:
      Experience, Revenue, Expenses, Funding Required,
      and Funding Purpose. */}
</section>

{/* ADD THE DOCUMENT UPLOAD SECTION HERE */}
<section className="rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="text-xl font-bold text-gray-900">
    Verification Documents
  </h2>

  <p className="mt-2 text-sm text-gray-600">
    Upload your government ID proof. You can also upload
    your FSSAI certificate and supporting documents.
    Files must be PDF, JPEG, PNG or WebP, up to 10 MB each.
  </p>

  {/* Government ID */}
  <div className="mt-5">
    <label className="text-sm font-semibold text-gray-700">
      Government ID Proof *
    </label>

    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png,.webp"
      required
      onChange={(event) =>
        setIdentityFile(event.target.files?.[0] ?? null)
      }
      className="mt-2 block w-full rounded-xl border border-gray-300 p-3 text-sm"
    />
  </div>

  {/* FSSAI Certificate */}
  <div className="mt-5">
    <label className="text-sm font-semibold text-gray-700">
      FSSAI Certificate
    </label>

    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png,.webp"
      onChange={(event) =>
        setFoodLicenseFile(event.target.files?.[0] ?? null)
      }
      className="mt-2 block w-full rounded-xl border border-gray-300 p-3 text-sm"
    />
  </div>

  {/* Supporting Documents */}
  <div className="mt-5">
    <label className="text-sm font-semibold text-gray-700">
      Additional Supporting Documents
    </label>

    <input
      type="file"
      multiple
      accept=".pdf,.jpg,.jpeg,.png,.webp"
      onChange={(event) =>
        setSupportingFiles(Array.from(event.target.files ?? []))
      }
      className="mt-2 block w-full rounded-xl border border-gray-300 p-3 text-sm"
    />
  </div>
</section>

{/* Keep your existing "What happens after registration?" section here */}

          {/* Verification information */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

            <h2 className="font-bold text-blue-900">
              What happens after registration?
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">

              <div>
                <p className="font-semibold text-blue-900">
                  1. Submit
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  Your business information is securely
                  submitted to StallUp.
                </p>
              </div>

              <div>
                <p className="font-semibold text-blue-900">
                  2. Verify
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  Our verification workflow reviews your
                  submitted information.
                </p>
              </div>

              <div>
                <p className="font-semibold text-blue-900">
                  3. Match
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  Verified businesses can be matched with
                  relevant funders.
                </p>
              </div>

            </div>

          </section>

          {/* Messages */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">
                {success}
              </p>

              <Link
                href="/dashboard/Entrepreneur"
                className="mt-3 inline-block text-sm font-semibold text-green-700 underline"
              >
                Go to Vendor Dashboard →
              </Link>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/dashboard/Vendor"
              className="rounded-xl border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Registering Business..."
                : "Register Business"}
            </button>

          </div>

        </form>
        )}
      </div>
    </main>
  );
}