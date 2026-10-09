"use client";
import NotificationBell from "../components/NotificationBell";
import LogoutButton from "../LogoutButton";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateMatchScore,
  FunderPreferences,
  Business,
} from "@/lib/matching/funderMatching";

type MatchedBusiness = Business & {
  match_score: number;
  match_reasons: string[];
};

export default function FunderDashboardPage() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);

  const [matchedBusinesses, setMatchedBusinesses] = useState<
    MatchedBusiness[]
  >([]);

  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [shortlistingId, setShortlistingId] = useState<string | null>(null);

  // Connection request state
  const [connectionRequests, setConnectionRequests] = useState<string[]>([]);
  const [connectionRequestId, setConnectionRequestId] = useState<
    string | null
  >(null);

  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      // Get profile
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

      if (
        profileError ||
        !profileData ||
        profileData.role !== "funder"
      ) {
        window.location.href = "/dashboard";
        return;
      }

      setProfile(profileData);

      // Get preferences
      const { data: preferencesData, error: preferencesError } =
        await supabase
          .from("funder_preferences")
          .select("*")
          .eq("funder_id", user.id)
          .maybeSingle();

      if (preferencesError) {
        throw new Error(preferencesError.message);
      }

      setPreferences(preferencesData);

      // Get verified + active businesses
      const { data: businesses, error: businessesError } =
        await supabase
          .from("businesses")
          .select("*")
          .eq("verification_status", "verified")
          .eq("is_active", true);

      if (businessesError) {
        throw new Error(businessesError.message);
      }

      // Calculate matches
      if (preferencesData && businesses) {
        const funderPreferences: FunderPreferences = {
          preferred_city: preferencesData.preferred_city,
          preferred_state: preferencesData.preferred_state,
          preferred_categories:
            preferencesData.preferred_categories || [],
          preferred_business_types:
            preferencesData.preferred_business_types || [],
          min_investment:
            preferencesData.min_investment,
          max_investment:
            preferencesData.max_investment,
          min_experience:
            preferencesData.min_experience,
        };

        const matches = businesses
          .map((business) =>
            calculateMatchScore(
              funderPreferences,
              business as Business
            )
          )
          .filter(
            (business) => business.match_score > 0
          )
          .sort(
            (a, b) =>
              b.match_score - a.match_score
          );

        setMatchedBusinesses(matches);
      }

      // Get existing shortlists
      const { data: shortlists, error: shortlistError } =
        await supabase
          .from("shortlists")
          .select("business_id")
          .eq("funder_id", user.id);

      if (shortlistError) {
        throw new Error(shortlistError.message);
      }

      setShortlistedIds(
        (shortlists || []).map(
          (item) => item.business_id
        )
      );

      // Get existing connection requests
      const {
        data: existingConnections,
        error: connectionsError,
      } = await supabase
        .from("connection_requests")
        .select("business_id, status")
        .eq("funder_id", user.id);

      if (connectionsError) {
        console.error(
          "Connection requests error:",
          connectionsError
        );
      } else {
        const activeConnections =
          existingConnections
            ?.filter(
              (request) =>
                request.status === "pending" ||
                request.status === "accepted"
            )
            .map(
              (request) => request.business_id
            ) ?? [];

        setConnectionRequests(activeConnections);
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  // Toggle shortlist
  async function toggleShortlist(
    businessId: string
  ) {
    if (!user) return;

    try {
      setShortlistingId(businessId);

      const isShortlisted =
        shortlistedIds.includes(businessId);

      if (isShortlisted) {
        // Remove from shortlist
        const { error } = await supabase
          .from("shortlists")
          .delete()
          .eq("funder_id", user.id)
          .eq("business_id", businessId);

        if (error) {
          throw new Error(error.message);
        }

        setShortlistedIds((current) =>
          current.filter(
            (id) => id !== businessId
          )
        );
      } else {
        // Add to shortlist
        const { error } = await supabase
          .from("shortlists")
          .insert({
            funder_id: user.id,
            business_id: businessId,
          });

        if (error) {
          throw new Error(error.message);
        }

        setShortlistedIds((current) => [
          ...current,
          businessId,
        ]);
      }
    } catch (err: any) {
      console.error(err);

      alert(
        err?.message ||
          "Unable to update shortlist."
      );
    } finally {
      setShortlistingId(null);
    }
  }

  // Send connection request

  async function sendConnectionRequest(
  businessId: string
) {
  if (!user) return;

  setConnectionRequestId(businessId);

  try {
    const response = await fetch(
      "/api/connection-requests",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Connection request error:",
        result.error
      );

      alert(
        result.error ||
          "Unable to send connection request."
      );

      return;
    }

    // Update UI immediately
    setConnectionRequests((current) => [
      ...current,
      businessId,
    ]);
  } catch (error) {
    console.error(
      "Unexpected connection request error:",
      error
    );

    alert(
      "Something went wrong. Please try again."
    );
  } finally {
    setConnectionRequestId(null);
  }
}
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-gray-600">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-bold text-red-800">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
<div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">
      StallUp
    </h1>

    <p className="mt-3 text-2xl font-semibold text-gray-900">
      Welcome, {profile?.full_name} 👋
    </p>

    <p className="mt-1 text-gray-600">
      Your funder dashboard
    </p>
  </div>

  <div className="flex items-center gap-3">
  <NotificationBell />
  <LogoutButton />
</div>
</div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Preferences */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Preferences
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {preferences
                ? "Configured"
                : "Not configured"}
            </p>

            {preferences && (
              <p className="mt-2 text-sm text-gray-600">
                {preferences.preferred_city} •{" "}
                {preferences.preferred_state}
              </p>
            )}

            <a
              href="/dashboard/funder/preferences"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Edit Preferences →



            </a>
          </div>

          {/* Matches */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Recommended Matches
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {matchedBusinesses.length}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Businesses matching your preferences
            </p>
          </div>

          {/* Shortlisted */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Shortlisted
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {shortlistedIds.length}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Businesses you saved
            </p>
          </div>
        </div>

        {/* Preferences */}
        {preferences && (
          <section className="mt-10 rounded-2xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Your Investment Preferences
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              These preferences are used to find suitable
              businesses for you.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-3">

              <div>
                <p className="text-sm text-gray-500">
                  Location
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {preferences.preferred_city}
                </p>

                <p className="text-sm text-gray-600">
                  {preferences.preferred_state}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Food Category
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {preferences.preferred_categories?.join(
                    ", "
                  ) || "Any"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Business Type
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {preferences.preferred_business_types?.join(
                    ", "
                  ) || "Any"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Investment Range
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  ₹
                  {Number(
                    preferences.min_investment || 0
                  ).toLocaleString("en-IN")}{" "}
                  – ₹
                  {Number(
                    preferences.max_investment || 0
                  ).toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Minimum Experience
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {preferences.min_experience} years
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Risk Level
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {preferences.risk_level ||
                    "Not specified"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Recommended Businesses */}
        <section className="mt-10">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recommended Businesses
            </h2>

            <p className="mt-1 text-gray-600">
              Businesses ranked according to your
              investment preferences.
            </p>
          </div>

          {matchedBusinesses.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900">
                No matches yet
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Try adjusting your investment preferences
                to discover more businesses.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">

              {matchedBusinesses.map((business) => {
                const isShortlisted =
                  shortlistedIds.includes(
                    business.id
                  );

                const isProcessing =
                  shortlistingId === business.id;

                const hasConnectionRequest =
                  connectionRequests.includes(
                    business.id
                  );

                const isSendingConnection =
                  connectionRequestId ===
                  business.id;

                return (
                  <div
                    key={business.id}
                    className="rounded-2xl border bg-white p-6 shadow-sm"
                  >

                    {/* Business Header */}
                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {business.business_name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {business.food_category} •{" "}
                          {business.city},{" "}
                          {business.state}
                        </p>
                      </div>

                      <div className="rounded-xl bg-green-50 px-4 py-2 text-center">
                        <p className="text-2xl font-bold text-green-700">
                          {business.match_score}%
                        </p>

                        <p className="text-xs text-green-600">
                          Match
                        </p>
                      </div>

                    </div>

                    {/* Description */}
                    {business.description && (
                      <p className="mt-4 text-sm leading-6 text-gray-600">
                        {business.description}
                      </p>
                    )}

                    {/* Business Details */}
                    <div className="mt-5 grid grid-cols-2 gap-4">

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">
                          Funding Required
                        </p>

                        <p className="mt-1 font-bold text-gray-900">
                          ₹
                          {Number(
                            business.funding_required || 0
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">
                          Experience
                        </p>

                        <p className="mt-1 font-bold text-gray-900">
                          {business.years_of_experience} years
                        </p>
                      </div>

                    </div>

                    {/* Match Reasons */}
                    {business.match_reasons.length > 0 && (
                      <div className="mt-5">

                        <p className="text-sm font-semibold text-gray-900">
                          Why this matches
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">

                          {business.match_reasons.map(
                            (reason) => (
                              <span
                                key={reason}
                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                              >
                                ✓ {reason}
                              </span>
                            )
                          )}

                        </div>
                      </div>
                    )}

                    {/* Shortlist Button */}
                    <button
                      onClick={() =>
                        toggleShortlist(business.id)
                      }
                      disabled={isProcessing}
                      className={`mt-6 w-full rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                        isShortlisted
                          ? "border-yellow-500 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                      } ${
                        isProcessing
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }`}
                    >
                      {isProcessing
                        ? "Updating..."
                        : isShortlisted
                        ? "⭐ Shortlisted — Remove"
                        : "☆ Shortlist Business"}
                    </button>

                    {/* Connection Request Button */}
                    <button
                      onClick={() =>
                        sendConnectionRequest(
                          business.id
                        )
                      }
                      disabled={
                        hasConnectionRequest ||
                        isSendingConnection
                      }
                      className={`mt-3 w-full rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                        hasConnectionRequest
                          ? "border-green-500 bg-green-100 text-green-800"
                          : "border-purple-600 bg-purple-600 text-white hover:bg-purple-700"
                      } ${
                        isSendingConnection
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }`}
                    >
                      {isSendingConnection
                        ? "Sending..."
                        : hasConnectionRequest
                        ? "✓ Connection Request Sent"
                        : "🤝 Send Connection Request"}
                    </button>

                  </div>
                );
              })}

            </div>
          )}
        </section>

      </div>
    </main>
  );
}
