import FundingProposalDecision from "../components/FundingProposalDecision";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import FundingProposalForm from "../components/FundingProposalForm";
import ProgressUpdateForm from "../components/ProgressUpdateForm";
type PageProps = {
  params: Promise<{
    connectionId: string;
  }>;
};

export default async function ConnectedWorkspace({
  params,
}: PageProps) {
  const { connectionId } = await params;

  const supabase = await createClient();

  // --------------------------------------------------
  // 1. Get logged-in user
  // --------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // --------------------------------------------------
  // 2. Load connection
  // --------------------------------------------------
  const { data: connection, error: connectionError } =
    await supabase
      .from("connection_requests")
      .select(`
        id,
        funder_id,
        business_id,
        status,
        funder_message,
        entrepreneur_response,
        requested_at,
        responded_at
      `)
      .eq("id", connectionId)
      .single();

  if (connectionError || !connection) {
    notFound();
  }

  // --------------------------------------------------
  // 3. Only accepted connections can access workspace
  // --------------------------------------------------
  if (connection.status !== "accepted") {
    redirect("/dashboard");
  }

  // --------------------------------------------------
  // 4. Determine user's role in this connection
  // --------------------------------------------------
  const isFunder = connection.funder_id === user.id;
  console.log("CURRENT USER ID:", user.id);
  console.log("FUNDER ID:", connection.funder_id);
  console.log("IS FUNDER:", isFunder);
  // --------------------------------------------------
  // 5. Load business
  // --------------------------------------------------
  const { data: business, error: businessError } =
    await supabase
      .from("businesses")
      .select(`
        id,
        entrepreneur_id,
        business_name,
        description,
        business_type,
        food_category,
        city,
        state,
        country,
        years_of_experience,
        monthly_revenue,
        monthly_expenses,
        funding_required,
        funding_purpose,
        verification_status
      `)
      .eq("id", connection.business_id)
      .single();

  if (businessError || !business) {
    notFound();
  }

  // --------------------------------------------------
  // 6. Make sure user is actually part of the connection
  // --------------------------------------------------
  const isEntrepreneur = business.entrepreneur_id === user.id;

  if (!isFunder && !isEntrepreneur) {
    redirect("/dashboard");
  }

  // --------------------------------------------------
  // 7. Load financial analysis
  // --------------------------------------------------
  // --------------------------------------------------
// 7. Load financial analysis
// --------------------------------------------------
const { data: analysis } = await supabase
  .from("business_analysis")
  .select(`
    id,
    monthly_revenue,
    monthly_expenses,
    monthly_profit,
    profit_margin,
    funding_required,
    break_even_months,
    financial_health_score,
    ai_summary,
    ai_recommendations,
    calculated_at
  `)
  .eq("business_id", business.id)
  .maybeSingle();

  // --------------------------------------------------
  // 8. Load existing proposal
  // --------------------------------------------------
  const { data: proposal } = await supabase
    .from("funding_proposals")
    .select(`
      id,
      connection_request_id,
      funder_id,
      business_id,
      investment_amount,
      funding_type,
      proposed_terms,
      message,
      status,
      entrepreneur_response,
      proposed_at,
      responded_at
    `)
    .eq("connection_request_id", connection.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

// --------------------------------------------------
// 9. Load funding progress updates
// --------------------------------------------------
const { data: progressUpdates } = await supabase
  .from("progress_updates")
  .select(`
    id,
    reporting_month,
    revenue,
    expenses,
    profit,
    customer_count,
    notes,
    created_at,
    reported_by
  `)
  .eq("connection_request_id", connection.id)
  .order("reporting_month", { ascending: false });
  // --------------------------------------------------
// 10. Calculate risk indicators
// --------------------------------------------------
let overallRisk = "low";
let profitabilityRisk = "low";
let expenseRisk = "low";
let revenueRisk = "low";
let fundingRisk = "low";
let riskSummary =
  "Financial risk indicators are not available yet.";

if (analysis) {
  const revenue = Number(
    analysis.monthly_revenue ?? 0
  );

  const expenses = Number(
    analysis.monthly_expenses ?? 0
  );

  const profit = Number(
    analysis.monthly_profit ?? 0
  );

  const profitMargin = Number(
    analysis.profit_margin ?? 0
  );

  const breakEvenMonths =
    analysis.break_even_months !== null
      ? Number(analysis.break_even_months)
      : null;

  const financialHealthScore = Number(
    analysis.financial_health_score ?? 0
  );

  // Profitability Risk
  if (profit <= 0) {
    profitabilityRisk = "high";
  } else if (profitMargin < 10) {
    profitabilityRisk = "medium";
  }

  // Expense Risk
  if (revenue > 0) {
    const expenseRatio =
      (expenses / revenue) * 100;

    if (expenseRatio >= 90) {
      expenseRisk = "high";
    } else if (expenseRatio >= 75) {
      expenseRisk = "medium";
    }
  }

  // Revenue Performance Risk
  if (revenue <= 0) {
    revenueRisk = "high";
  } else if (profitMargin < 10) {
    revenueRisk = "medium";
  }

  // Funding Risk
  if (breakEvenMonths !== null) {
    if (breakEvenMonths > 24) {
      fundingRisk = "high";
    } else if (breakEvenMonths > 12) {
      fundingRisk = "medium";
    }
  }

  // Overall Risk
  const risks = [
    profitabilityRisk,
    expenseRisk,
    revenueRisk,
    fundingRisk,
  ];

  if (risks.includes("high")) {
    overallRisk = "high";
  } else if (risks.includes("medium")) {
    overallRisk = "medium";
  }

  if (financialHealthScore < 40) {
    overallRisk = "high";
  } else if (
    financialHealthScore < 70 &&
    overallRisk === "low"
  ) {
    overallRisk = "medium";
  }

  // Risk Summary
  if (overallRisk === "low") {
    riskSummary =
      "The business currently demonstrates healthy financial performance with positive profitability and manageable operating risk.";
  } else if (overallRisk === "medium") {
    riskSummary =
      "The business shows some financial risk indicators that should be monitored, particularly around profitability, expenses, or funding recovery.";
  } else {
    riskSummary =
      "The business currently shows significant financial risk indicators. Profitability, expenses, and funding recovery should be reviewed carefully before additional investment.";
  }
}
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-emerald-600">
            🤝 Connected
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {business.business_name}
          </h1>

          <p className="mt-1 text-slate-600">
            {business.city}
            {business.state ? `, ${business.state}` : ""}
          </p>
        </div>

        {/* Connection status */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Connection
          </h2>

          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              ✓ Accepted
            </span>

            <span className="text-sm text-slate-500">
              {new Date(connection.responded_at ?? connection.requested_at)
                .toLocaleDateString()}
            </span>
          </div>
        </section>

        {/* Business overview */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Business Overview
          </h2>

          {business.description && (
            <p className="mt-3 leading-7 text-slate-600">
              {business.description}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Business Type"
              value={business.business_type}
            />

            <InfoCard
              label="Food Category"
              value={business.food_category}
            />

            <InfoCard
              label="Experience"
              value={`${business.years_of_experience} years`}
            />

            <InfoCard
              label="Funding Required"
              value={formatCurrency(
                business.funding_required ?? 0
              )}
            />
          </div>

          {business.funding_purpose && (
            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">
                Funding Purpose
              </p>

              <p className="mt-1 text-slate-900">
                {business.funding_purpose}
              </p>
            </div>
          )}
        </section>

       {/* Financial Analysis */}
<section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Financial Analysis
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Financial performance based on the latest business data.
      </p>
    </div>

    {analysis?.calculated_at && (
      <p className="text-xs text-slate-400">
        Updated{" "}
        {new Date(
          analysis.calculated_at
        ).toLocaleDateString("en-IN")}
      </p>
    )}
  </div>

  {!analysis ? (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <p className="font-medium text-slate-700">
        Financial analysis is not available yet.
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Add a business progress update to generate financial insights.
      </p>
    </div>
  ) : (
    <>
      {/* Main Financial Metrics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          label="Monthly Revenue"
          value={formatCurrency(analysis.monthly_revenue)}
        />

        <FinancialCard
          label="Monthly Expenses"
          value={formatCurrency(analysis.monthly_expenses)}
        />

        <FinancialCard
          label="Monthly Profit"
          value={formatCurrency(analysis.monthly_profit)}
        />

        <FinancialCard
          label="Profit Margin"
          value={`${Number(
            analysis.profit_margin
          ).toFixed(1)}%`}
        />
      </div>

      {/* Financial Health */}
      <div className="mt-6 rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Financial Health
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {Number(
                analysis.financial_health_score
              ).toFixed(0)}
              <span className="text-lg text-slate-400">
                /100
              </span>
            </p>
          </div>

          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Healthy
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  Number(
                    analysis.financial_health_score
                  )
                )
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Funding & Break-even */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoCard
          label="Funding Required"
          value={formatCurrency(
            analysis.funding_required
          )}
        />

        <InfoCard
          label="Estimated Break-even"
          value={
            analysis.break_even_months !== null
              ? `${Number(
                  analysis.break_even_months
                ).toFixed(1)} months`
              : "Not available"
          }
        />
      </div>

      {/* Financial Summary */}
      {analysis.ai_summary && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Financial Summary
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {analysis.ai_summary}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {Array.isArray(analysis.ai_recommendations) &&
        analysis.ai_recommendations.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">
              Recommendations
            </p>

            <div className="mt-3 space-y-3">
              {analysis.ai_recommendations.map(
                (recommendation: string, index: number) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <span className="font-semibold text-blue-600">
                      {index + 1}.
                    </span>

                    <p className="text-sm leading-6 text-slate-600">
                      {recommendation}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </>
  )}
</section>

        {/* Risk Indicators */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Risk Indicators
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Risk assessment based on the latest financial performance.
              </p>
            </div>

            <RiskBadge risk={overallRisk} />
          </div>

          {!analysis ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="font-medium text-slate-700">
                Risk assessment is not available yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add financial performance data to generate risk indicators.
              </p>
            </div>
          ) : (
            <>
              {/* Risk Indicators */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <RiskCard
                  label="Profitability Risk"
                  risk={profitabilityRisk}
                />

                <RiskCard
                  label="Expense Risk"
                  risk={expenseRisk}
                />

                <RiskCard
                  label="Revenue Performance Risk"
                  risk={revenueRisk}
                />

                <RiskCard
                  label="Funding Risk"
                  risk={fundingRisk}
                />
              </div>

              {/* Risk Assessment */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Risk Assessment
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {riskSummary}
                </p>
              </div>
            </>
          )}
        </section>
        {/* Funding Journey */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Funding Journey
          </h2>

          <div className="mt-6 space-y-5">
            <JourneyStep
              label="Connection Accepted"
              status="completed"
            />

            <JourneyStep
              label="Funding Proposal"
              status={proposal ? "completed" : "current"}
            />

            <JourneyStep
              label="Proposal Decision"
              status={
                proposal?.status === "accepted" ||
                proposal?.status === "rejected"
                  ? "completed"
                  : "upcoming"
              }
            />

            <JourneyStep
              label="Funding Progress"
              status={
                proposal?.status === "accepted"
                  ? "current"
                  : "upcoming"
              }
            />
          </div>
        </section>

        {/* Funding section */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Funding
          </h2>

          {!proposal ? (
            <div className="mt-5">
              <p className="text-slate-600">
                {isFunder
                  ? "You haven't sent a funding proposal yet."
                  : "No funding proposal has been received yet."}
              </p>

              {isFunder && (
  <FundingProposalForm
    connectionRequestId={connection.id}
    funderId={connection.funder_id}
    businessId={business.id}
    fundingRequired={business.funding_required}
  />
)}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Funding Proposal
                </h3>

                <ProposalStatus status={proposal.status} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Amount"
                  value={formatCurrency(
                    proposal.investment_amount
                  )}
                />

                <InfoCard
                  label="Funding Type"
                  value={proposal.funding_type}
                />
              </div>

              {proposal.proposed_terms && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-slate-500">
                    Proposed Terms
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-slate-700">
                    {proposal.proposed_terms}
                  </p>
                </div>
              )}

              {proposal.message && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-slate-500">
                    Message
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-slate-700">
                    {proposal.message}
                  </p>
                </div>
              )}

              {isEntrepreneur && proposal.status === "pending" && (
  <FundingProposalDecision proposalId={proposal.id} />
)}
            </div>
          )}
                </section>

        {/* Funding Progress */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Funding Progress
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Track monthly business performance and keep your funding
            partner updated.
          </p>

          {isEntrepreneur && proposal?.status === "accepted" && (
            <ProgressUpdateForm
              businessId={business.id}
              connectionRequestId={connection.id}
            />
          )}

          <div className="mt-8">
            {progressUpdates && progressUpdates.length > 0 ? (
              <div className="space-y-4">
                {progressUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {new Date(
                            `${update.reporting_month}T00:00:00`
                          ).toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>

                        <p className="text-sm text-slate-500">
                          Business performance update
                        </p>
                      </div>

                      {update.customer_count !== null && (
                        <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm">
                          <span className="font-semibold text-slate-900">
                            {update.customer_count}
                          </span>{" "}
                          customers
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-slate-500">
                          Revenue
                        </p>

                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {update.revenue !== null
                            ? `₹${Number(update.revenue).toLocaleString("en-IN")}`
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Expenses
                        </p>

                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {update.expenses !== null
                            ? `₹${Number(update.expenses).toLocaleString("en-IN")}`
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Profit
                        </p>

                        <p className="mt-1 text-lg font-semibold text-emerald-600">
                          {update.profit !== null
                            ? `₹${Number(update.profit).toLocaleString("en-IN")}`
                            : "—"}
                        </p>
                      </div>
                    </div>

                   {update.notes && (
  <div className="mt-5 rounded-xl bg-slate-50 p-4">
    <p className="text-sm font-medium text-slate-500">
      Notes
    </p>

    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
      {update.notes}
    </p>
  </div>
)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <p className="font-medium text-slate-700">
                  No progress updates yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Monthly business performance updates will appear here.
                </p>
              </div>
            )}
          </div>


        </section>
      </div>
    </main>
  );
}

/* --------------------------------------------------
   Components
-------------------------------------------------- */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function FinancialCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function JourneyStep({
  label,
  status,
}: {
  label: string;
  status: "completed" | "current" | "upcoming";
}) {
  const icon =
    status === "completed"
      ? "✓"
      : status === "current"
      ? "●"
      : "○";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
          status === "completed"
            ? "bg-emerald-100 text-emerald-700"
            : status === "current"
            ? "bg-blue-100 text-blue-700"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {icon}
      </div>

      <span
        className={
          status === "upcoming"
            ? "text-slate-400"
            : "font-medium text-slate-900"
        }
      >
        {label}
      </span>
    </div>
  );
}

function ProposalStatus({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "accepted"
      ? "bg-emerald-100 text-emerald-700"
      : normalized === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${styles}`}
    >
      {status}
    </span>
  );
}
function RiskBadge({
  risk,
}: {
  risk: string;
}) {
  const normalized = risk.toLowerCase();

  const styles =
    normalized === "low"
      ? "bg-emerald-100 text-emerald-700"
      : normalized === "medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  const label =
    normalized === "low"
      ? "LOW"
      : normalized === "medium"
      ? "MEDIUM"
      : "HIGH";

  const icon =
    normalized === "low"
      ? "🟢"
      : normalized === "medium"
      ? "🟡"
      : "🔴";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${styles}`}
    >
      {icon} {label}
    </span>
  );
}

function RiskCard({
  label,
  risk,
}: {
  label: string;
  risk: string;
}) {
  const normalized = risk.toLowerCase();

  const styles =
    normalized === "low"
      ? "border-emerald-200 bg-emerald-50"
      : normalized === "medium"
      ? "border-amber-200 bg-amber-50"
      : "border-red-200 bg-red-50";

  const textStyles =
    normalized === "low"
      ? "text-emerald-700"
      : normalized === "medium"
      ? "text-amber-700"
      : "text-red-700";

  const icon =
    normalized === "low"
      ? "🟢"
      : normalized === "medium"
      ? "🟡"
      : "🔴";

  const labelText =
    normalized === "low"
      ? "LOW"
      : normalized === "medium"
      ? "MEDIUM"
      : "HIGH";

  return (
    <div
      className={`rounded-xl border p-4 ${styles}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">
          {label}
        </p>

        <span
          className={`text-sm font-bold ${textStyles}`}
        >
          {icon} {labelText}
        </span>
      </div>
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
