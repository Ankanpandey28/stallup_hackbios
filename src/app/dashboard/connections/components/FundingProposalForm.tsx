"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FundingProposalFormProps = {
  connectionRequestId: string;
  funderId: string;
  businessId: string;
  fundingRequired: number | null;
};

export default function FundingProposalForm({
  connectionRequestId,
  funderId,
  businessId,
  fundingRequired,
}: FundingProposalFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [investmentAmount, setInvestmentAmount] = useState(
    fundingRequired ? String(fundingRequired) : ""
  );
  const [fundingType, setFundingType] = useState("investment");
  const [proposedTerms, setProposedTerms] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const amount = Number(investmentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid investment amount.");
      return;
    }

    if (!fundingType) {
      setError("Please select a funding type.");
      return;
    }

    setLoading(true);

    try {
      // Verify the current authenticated user.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to send a proposal.");
      }

      if (user.id !== funderId) {
        throw new Error(
          "You are not authorized to send a proposal for this connection."
        );
      }

      // Verify that the connection is still accepted.
      const { data: connection, error: connectionError } = await supabase
        .from("connection_requests")
        .select("id, funder_id, business_id, status")
        .eq("id", connectionRequestId)
        .single();

      if (connectionError) {
        throw new Error(connectionError.message);
      }

      if (
        connection.funder_id !== user.id ||
        connection.business_id !== businessId ||
        connection.status !== "accepted"
      ) {
        throw new Error(
          "Funding proposals can only be sent for accepted connections."
        );
      }

      // Prevent another pending proposal for this connection.
      const { data: existingProposal, error: existingError } = await supabase
        .from("funding_proposals")
        .select("id, status")
        .eq("connection_request_id", connectionRequestId)
        .eq("status", "pending")
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (existingProposal) {
        throw new Error(
          "There is already a pending funding proposal for this connection."
        );
      }

      const { error: insertError } = await supabase
        .from("funding_proposals")
        .insert({
          connection_request_id: connectionRequestId,
          funder_id: funderId,
          business_id: businessId,
          investment_amount: amount,
          funding_type: fundingType,
          proposed_terms: proposedTerms.trim() || null,
          message: message.trim() || null,
          status: "pending",
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess("Funding proposal sent successfully.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while sending the proposal."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div>
        <label
          htmlFor="investmentAmount"
          className="block text-sm font-medium text-slate-700"
        >
          Investment Amount
        </label>

        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            ₹
          </span>

          <input
            id="investmentAmount"
            type="number"
            min="1"
            step="1"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            placeholder="100000"
            required
            className="w-full rounded-xl border border-slate-300 py-3 pl-8 pr-4 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {fundingRequired !== null && (
          <p className="mt-2 text-xs text-slate-500">
            Business funding requirement: ₹
            {Number(fundingRequired).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="fundingType"
          className="block text-sm font-medium text-slate-700"
        >
          Funding Type
        </label>

        <select
  id="fundingType"
  value={fundingType}
  onChange={(e) => setFundingType(e.target.value)}
  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
>
  <option value="investment">Investment</option>
  <option value="loan">Loan</option>
  <option value="other">Other</option>
</select>
      </div>

      <div>
        <label
          htmlFor="proposedTerms"
          className="block text-sm font-medium text-slate-700"
        >
          Proposed Terms
        </label>

        <textarea
          id="proposedTerms"
          value={proposedTerms}
          onChange={(e) => setProposedTerms(e.target.value)}
          placeholder="Example: Investment in exchange for an agreed ownership percentage."
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-slate-700"
        >
          Message
        </label>

        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message to the entrepreneur..."
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Funding Proposal"}
        </button>
      </div>
    </form>
  );
}