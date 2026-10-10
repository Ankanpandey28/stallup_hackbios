"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FundingProposalDecisionProps = {
  proposalId: string;
};

export default function FundingProposalDecision({
  proposalId,
}: FundingProposalDecisionProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState<"accepted" | "rejected" | null>(
    null
  );
  const [error, setError] = useState("");

  async function handleDecision(
    decision: "accepted" | "rejected"
  ) {
    setError("");
    setLoading(decision);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to respond to a proposal.");
      }

      const { data: proposal, error: proposalError } = await supabase
        .from("funding_proposals")
        .select("id, business_id, status")
        .eq("id", proposalId)
        .single();

      if (proposalError) {
        throw new Error(proposalError.message);
      }

      if (proposal.status !== "pending") {
        throw new Error("This funding proposal has already been decided.");
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id, Vendor_id")
        .eq("id", proposal.business_id)
        .single();

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (business.Vendor_id !== user.id) {
        throw new Error(
          "You are not authorized to respond to this proposal."
        );
      }

      const response =
        decision === "accepted"
          ? "Proposal accepted."
          : "Proposal rejected.";

      const { error: updateError } = await supabase
        .from("funding_proposals")
        .update({
          status: decision,
          Vendor_response: response,
          responded_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while responding to the proposal."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => handleDecision("rejected")}
          disabled={loading !== null}
          className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "rejected"
            ? "Rejecting..."
            : "Reject Proposal"}
        </button>

        <button
          type="button"
          onClick={() => handleDecision("accepted")}
          disabled={loading !== null}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "accepted"
            ? "Accepting..."
            : "Accept Proposal"}
        </button>
      </div>
    </div>
  );
}