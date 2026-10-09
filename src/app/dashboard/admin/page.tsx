
import LogoutButton from "../LogoutButton";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerificationActions from "./components/VerificationActions";
export const dynamic = "force-dynamic";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

const [
  { count: totalCount },
  { count: approvedCount },
  { count: rejectedCount },
  { count: pendingCount },
] = await Promise.all([
  supabase
    .from("businesses")
    .select("id", { count: "exact", head: true }),

  supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "verified"),

  supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "rejected"),

  supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .in("verification_status", ["pending", "under_review"]),
]);

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(
      "id, entrepreneur_id, business_name, description, business_type, food_category, city, state, country, verification_status, created_at, monthly_revenue, monthly_expenses, funding_required, funding_purpose"
    )
    .in("verification_status", ["pending", "under_review"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Admin business query failed:", error.message);
  }

  const businessList = businesses ?? [];
  const ownerIds = [...new Set(businessList.map((b) => b.entrepreneur_id))];

  let owners: { id: string; full_name: string | null }[] = [];

  if (ownerIds.length > 0) {
    const { data: ownerProfiles, error: ownersError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);

    if (ownersError) {
      console.error("Owner profile query failed:", ownersError.message);
    } else {
      owners = ownerProfiles ?? [];
    }
  }

  const ownerName = (id: string) =>
    owners.find((owner) => owner.id === id)?.full_name ?? "Unknown owner";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              StallUp Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">Business Verification</h1>
            <p className="mt-2 text-slate-600">
              Welcome, {profile.full_name ?? "Admin"}. Review submitted businesses.
            </p>
          </div>

          <div className="flex gap-3">
  <a
    href="/dashboard"
    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
  >
    Dashboard
  </a>

  <LogoutButton />
</div>
        </header>


<section className="mb-8">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-slate-900">
        Verification Overview
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Track submissions and business verification decisions.
      </p>
    </div>

    <a
      href="/dashboard/admin/history"
      className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      View Verification History
    </a>
  </div>

  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">Total businesses</p>
      <p className="mt-2 text-3xl font-bold">{totalCount ?? 0}</p>
    </div>

    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <p className="text-sm text-emerald-700">Approved</p>
      <p className="mt-2 text-3xl font-bold text-emerald-900">
        {approvedCount ?? 0}
      </p>
    </div>

    <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <p className="text-sm text-red-700">Rejected</p>
      <p className="mt-2 text-3xl font-bold text-red-900">
        {rejectedCount ?? 0}
      </p>
    </div>

    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-sm text-amber-700">Awaiting review</p>
      <p className="mt-2 text-3xl font-bold text-amber-900">
        {pendingCount ?? 0}
      </p>
    </div>
  </div>
</section>


        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load business applications. Check your Supabase policies
            and server logs.
          </div>
        )}

        {businessList.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold">No applications awaiting review</h2>
            <p className="mt-2 text-slate-600">
              New businesses with pending verification will appear here.
            </p>
          </section>
        ) : (
          <section className="space-y-5">
            {businessList.map((business) => (
              <article
                key={business.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{business.business_name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Owner: {ownerName(business.entrepreneur_id)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {[business.city, business.state, business.country]
                        .filter(Boolean)
                        .join(", ") || "Location not provided"}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                    {business.verification_status.replace("_", " ")}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-slate-700">
                  {business.description || "No description provided."}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Business type
                    </p>
                    <p className="mt-1 font-medium">
                      {business.business_type || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Food category
                    </p>
                    <p className="mt-1 font-medium">
                      {business.food_category || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Funding required
                    </p>
                    <p className="mt-1 font-medium">
                      {business.funding_required == null
                        ? "Not specified"
                        : `₹${Number(business.funding_required).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Monthly revenue
                    </p>
                    <p className="mt-1 font-medium">
                      {business.monthly_revenue == null
                        ? "Not provided"
                        : `₹${Number(business.monthly_revenue).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Monthly expenses
                    </p>
                    <p className="mt-1 font-medium">
                      {business.monthly_expenses == null
                        ? "Not provided"
                        : `₹${Number(business.monthly_expenses).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Submitted
                    </p>
                    <p className="mt-1 font-medium">
                      {new Date(business.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                {business.funding_purpose && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Funding purpose
                    </p>
                    <p className="mt-1 text-slate-700">{business.funding_purpose}</p>
                  </div>
                )}

                <p className="mt-4 break-all text-xs text-slate-400">
                  Application ID: {business.id}
                </p>
                <VerificationActions
  businessId={business.id}
  businessName={business.business_name}
/>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
