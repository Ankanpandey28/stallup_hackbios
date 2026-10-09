
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
  businessName: string;
};

export default function VerificationActions({
  businessId,
  businessName,
}: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function decide(status: "verified" | "rejected") {
    const reason = notes.trim();

    if (status === "rejected" && !reason) {
      setMessage("Please enter a reason before rejecting.");
      return;
    }

    const confirmed = window.confirm(
      status === "verified"
        ? `Approve "${businessName}"?`
        : `Reject "${businessName}"?`
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/businesses/${businessId}/verification`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes: reason }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "The decision could not be saved.");
        return;
      }

      setMessage(
        status === "verified"
          ? "Business approved successfully."
          : "Business rejected successfully."
      );

      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <label
        htmlFor={`notes-${businessId}`}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Verification notes / rejection reason
      </label>

      <textarea
        id={`notes-${businessId}`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Record your review notes. A reason is required to reject."
        disabled={busy}
        className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => decide("verified")}
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving..." : "Approve business"}
        </button>

        <button
          type="button"
          onClick={() => decide("rejected")}
          disabled={busy}
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving..." : "Reject business"}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="mt-3 text-sm text-slate-700"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
}