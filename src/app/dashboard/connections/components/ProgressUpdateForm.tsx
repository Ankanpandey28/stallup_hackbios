"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProgressUpdateFormProps = {
  businessId: string;
  connectionRequestId: string;
};

export default function ProgressUpdateForm({
  businessId,
  connectionRequestId,
}: ProgressUpdateFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [reportingMonth, setReportingMonth] = useState("");
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [profit, setProfit] = useState("");
  const [customerCount, setCustomerCount] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      if (!reportingMonth) {
        throw new Error("Please select a reporting month.");
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id, Vendor_id")
        .eq("id", businessId)
        .single();

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (business.Vendor_id !== user.id) {
        throw new Error(
          "You are not authorized to add progress updates."
        );
      }

      const { data: connection, error: connectionError } =
        await supabase
          .from("connection_requests")
          .select("id, business_id, status")
          .eq("id", connectionRequestId)
          .single();

      if (connectionError) {
        throw new Error(connectionError.message);
      }

      if (
        connection.business_id !== businessId ||
        connection.status !== "accepted"
      ) {
        throw new Error(
          "This is not an active accepted connection."
        );
      }

      const revenueValue =
        revenue.trim() === "" ? null : Number(revenue);

      const expensesValue =
        expenses.trim() === "" ? null : Number(expenses);

      const profitValue =
        profit.trim() === "" ? null : Number(profit);

      const customerCountValue =
        customerCount.trim() === ""
          ? null
          : Number(customerCount);

      if (
        revenueValue !== null &&
        (!Number.isFinite(revenueValue) || revenueValue < 0)
      ) {
        throw new Error("Revenue must be a valid positive number.");
      }

      if (
        expensesValue !== null &&
        (!Number.isFinite(expensesValue) || expensesValue < 0)
      ) {
        throw new Error(
          "Expenses must be a valid positive number."
        );
      }

      if (
        profitValue !== null &&
        !Number.isFinite(profitValue)
      ) {
        throw new Error("Profit must be a valid number.");
      }

      if (
        customerCountValue !== null &&
        (!Number.isInteger(customerCountValue) ||
          customerCountValue < 0)
      ) {
        throw new Error(
          "Customer count must be a valid whole number."
        );
      }

        const { error: insertError } = await supabase
  .from("progress_updates")
  .insert({
    business_id: businessId,
    connection_request_id: connectionRequestId,
    reported_by: user.id,
    reporting_month: reportingMonth,
    revenue: revenueValue,
    expenses: expensesValue,
    profit: profitValue,
    customer_count: customerCountValue,
    notes: notes.trim() || null,
  });

if (insertError) {
  throw new Error(insertError.message);
}

// Recalculate financial analysis
const analysisResponse = await fetch("/api/financial-analysis", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    businessId,
  }),
});

if (!analysisResponse.ok) {
  const analysisData = await analysisResponse.json();

  throw new Error(
    analysisData.error ||
      "Progress was saved, but financial analysis could not be updated."
  );
}

setReportingMonth("");
setRevenue("");
setExpenses("");
setProfit("");
setCustomerCount("");
setNotes("");

setSuccess(
  "Progress update added and financial analysis updated successfully."
);

router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while adding the progress update."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        Add Progress Update
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Share your latest business performance with your funder.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
       <div>
  <label className="text-sm font-medium text-slate-700">
    Reporting Month
  </label>

  <input
    type="date"
    value={reportingMonth}
    onChange={(e) => {
      const selectedDate = e.target.value;

      if (!selectedDate) {
        setReportingMonth("");
        return;
      }

      const [year, month] = selectedDate.split("-");
      setReportingMonth(`${year}-${month}-01`);
    }}
    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
    required
  />

  <p className="mt-1 text-xs text-slate-500">
    Select any date in the month you want to report.
  </p>
</div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Customer Count
          </label>

          <input
            type="number"
            min="0"
            value={customerCount}
            onChange={(e) => setCustomerCount(e.target.value)}
            placeholder="e.g. 250"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Revenue
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            placeholder="₹"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Expenses
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            placeholder="₹"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Profit
          </label>

          <input
            type="number"
            step="0.01"
            value={profit}
            onChange={(e) => setProfit(e.target.value)}
            placeholder="₹"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">
          Notes
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Describe your business progress, purchases, expansion, challenges, etc."
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Adding Update..." : "Add Progress Update"}
        </button>
      </div>
    </form>
  );
}
