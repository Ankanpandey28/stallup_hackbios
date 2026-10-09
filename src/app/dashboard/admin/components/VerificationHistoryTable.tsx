
"use client";

import { useMemo, useState } from "react";

type HistoryRecord = {
  id: string;
  business_name: string;
  entrepreneur_id: string;
  owner_name: string;
  verification_status: "verified" | "rejected";
  verification_notes: string | null;
  verified_at: string | null;
  created_at: string | null;
  reviewer_name: string;
};

type Props = {
  records: HistoryRecord[];
};

export default function VerificationHistoryTable({ records }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = records.filter((record) => {
      const matchesSearch =
        !term ||
        record.business_name.toLowerCase().includes(term) ||
        record.owner_name.toLowerCase().includes(term) ||
        record.reviewer_name.toLowerCase().includes(term);

      const matchesStatus =
        status === "all" || record.verification_status === status;

      return matchesSearch && matchesStatus;
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.verified_at ?? a.created_at ?? 0).getTime();
      const dateB = new Date(b.verified_at ?? b.created_at ?? 0).getTime();

      return sort === "oldest" ? dateA - dateB : dateB - dateA;
    });
  }, [records, search, status, sort]);

  function formatDate(value: string | null) {
    if (!value) return "Not recorded";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not recorded";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">All decisions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {records.length}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Approved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {records.filter((r) => r.verification_status === "verified").length}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-900">
            {records.filter((r) => r.verification_status === "rejected").length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_170px]">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search business, owner, or reviewer..."
          aria-label="Search verification history"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by decision"
          className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
        >
          <option value="all">All decisions</option>
          <option value="verified">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Sort verification history"
          className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <p className="text-sm text-slate-500" aria-live="polite">
        Showing {filteredRecords.length} of {records.length} decisions
      </p>

      {filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-800">
            No verification records found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Try another search term or change the status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <article
              key={record.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {record.business_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Owner: {record.owner_name}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    record.verification_status === "verified"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {record.verification_status === "verified"
                    ? "Approved"
                    : "Rejected"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Decision date</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {formatDate(record.verified_at)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Reviewed by</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {record.reviewer_name}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Review notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {record.verification_notes || "No notes were recorded."}
                </p>
              </div>

              <p className="mt-3 break-all text-xs text-slate-400">
                Business ID: {record.id}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}