
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import LogoutButton from "../../LogoutButton";
import VerificationHistoryTable from "../components/VerificationHistoryTable";

export const dynamic = "force-dynamic";

export default async function AdminVerificationHistoryPage() {
  // Confirm the current session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check the actual database role, not a client-supplied role.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // This server-only client is used after the admin check.
  const admin = createAdminClient();

  const { data: businesses, error } = await admin
    .from("businesses")
    .select(
      "id, business_name, entrepreneur_id, verification_status, verification_notes, verified_at, verified_by, created_at"
    )
    .in("verification_status", ["verified", "rejected"])
    .order("verified_at", { ascending: false });

  if (error) {
    console.error("Could not load verification history:", error.message);
  }

  const rows = businesses ?? [];

  const profileIds = [
    ...new Set(
      rows.flatMap((business) =>
        [business.entrepreneur_id, business.verified_by].filter(
          (id): id is string => Boolean(id)
        )
      )
    ),
  ];

  const { data: people, error: peopleError } =
    profileIds.length > 0
      ? await admin.from("profiles").select("id, full_name").in("id", profileIds)
      : { data: [], error: null };

  if (peopleError) {
    console.error("Could not load reviewer names:", peopleError.message);
  }

  const nameById = new Map(
    (people ?? []).map((person) => [
      person.id,
      person.full_name || "Unknown user",
    ])
  );

  const records = rows.map((business) => ({
    id: business.id,
    business_name: business.business_name || "Unnamed business",
    entrepreneur_id: business.entrepreneur_id,
    owner_name:
      nameById.get(business.entrepreneur_id) || "Unknown owner",
    verification_status: business.verification_status as
      | "verified"
      | "rejected",
    verification_notes: business.verification_notes,
    verified_at: business.verified_at,
    created_at: business.created_at,
    reviewer_name: business.verified_by
      ? nameById.get(business.verified_by) || "Unknown reviewer"
      : "Not recorded",
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              StallUp Administration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Verification History
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Admin Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Business decisions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Review previously approved and rejected businesses, decision
            dates, reviewer details, and recorded notes.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            Verification history could not be loaded. Check the server logs
            and your Supabase business table.
          </div>
        ) : (
          <VerificationHistoryTable records={records} />
        )}
      </div>
    </main>
  );
}