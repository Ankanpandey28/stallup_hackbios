
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DocumentStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "flagged";

type BusinessDocument = {
  id: string;
  business_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  verification_status: DocumentStatus;
  verification_notes: string | null;
  created_at: string;
  business_name: string;
};

const STATUSES: DocumentStatus[] = [
  "pending",
  "under_review",
  "verified",
  "rejected",
  "flagged",
];

const LABELS: Record<string, string> = {
  identity: "Identity Proof",
  business_registration: "Business Registration",
  address_proof: "Address Proof",
  financial_record: "Financial Record",
  food_license: "Food License (FSSAI)",
  other: "Other Document",
};

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

export default function AdminDocumentsPage() {
  const [supabase] = useState(() => createClient());
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please sign in with an administrator account.");
      }

      // RLS must restrict this query to administrators.
      const { data, error: queryError } = await supabase
        .from("business_documents")
        .select(
          "id, business_id, document_type, file_name, storage_path, verification_status, verification_notes, created_at"
        )
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      const rows = data ?? [];
      const businessIds = [
        ...new Set(rows.map((document) => document.business_id)),
      ];

      let businessNames: Record<string, string> = {};

      if (businessIds.length > 0) {
        const { data: businesses, error: businessesError } =
          await supabase
            .from("businesses")
            .select("id, business_name")
            .in("id", businessIds);

        if (businessesError) throw businessesError;

        businessNames = Object.fromEntries(
          (businesses ?? []).map((business) => [
            business.id,
            business.business_name,
          ])
        );
      }

      setDocuments(
        rows.map((document) => ({
          ...document,
          verification_status:
            document.verification_status as DocumentStatus,
          business_name:
            businessNames[document.business_id] ?? "Business unavailable",
        }))
      );
    } catch (err) {
      console.error("Admin document loading failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load documents. Check administrator access."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

async function reviewDocument(
  documentId: string,
  status: "pending" | "under_review" | "verified" | "rejected" | "flagged"
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("Please sign in again.");
    return;
  }
  console.log("Signed-in user ID:", user.id);

  const { data, error } = await supabase
    .from("business_documents")
    .update({
      verification_status: status,
      verification_notes: notes[documentId] ?? "",
      verified_by:
        status === "verified" || status === "rejected"
          ? user.id
          : null,
      verified_at:
        status === "verified" || status === "rejected"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", documentId)
    .select("id, verification_status")
    .maybeSingle();

if (error) {
  console.error("Document update failed:", error);
  alert(`Update failed: ${error.message}`);
  return;
}

if (!data) {
  console.error("No document was updated or returned.");
  alert(
    "No document was updated. Check your admin permissions and RLS policy."
  );
  return;
}

setDocuments((previous) =>
  previous.map((document) =>
    document.id === data.id
      ? {
          ...document,
          verification_status: data.verification_status,
        }
      : document
  )
);

alert(`Document status updated to ${data.verification_status}.`);
}




  async function viewDocument(document: BusinessDocument) {
    setError("");

    try {
      const { data, error: urlError } = await supabase.storage
        .from("business-documents")
        .createSignedUrl(document.storage_path, 60);

      if (urlError) throw urlError;

      // Open the private file through a temporary signed URL.
      window.location.assign(data.signedUrl);
    } catch (err) {
      console.error("Document preview failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open this file. Check Storage permissions."
      );
    }
  }

  const filteredDocuments =
    filter === "all"
      ? documents
      : documents.filter(
          (document) => document.verification_status === filter
        );

  const count = (status: DocumentStatus) =>
    documents.filter((document) => document.verification_status === status)
      .length;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <a
          href="/dashboard"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </a>

        <header className="mt-6">
          <p className="text-sm font-bold tracking-widest text-blue-600">
            STALLUP ADMIN
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Document Verification
          </h1>
          <p className="mt-2 text-gray-600">
            Review business documents and record verification decisions.
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="mt-6 whitespace-pre-wrap rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-700"
          >
            {message}
          </p>
        )}

        <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Documents", value: documents.length },
            { label: "Pending", value: count("pending") },
            { label: "Verified", value: count("verified") },
            { label: "Rejected", value: count("rejected") },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Submitted Documents
            </h2>

            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Filter documents by status"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {titleCase(status)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void loadDocuments()}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Loading documents...
            </p>
          ) : filteredDocuments.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No documents found for this filter.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              {filteredDocuments.map((document) => (
                <article
                  key={document.id}
                  className="rounded-xl border border-gray-200 p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div className="min-w-0">
                      <p className="break-all font-bold text-gray-900">
                        {document.file_name}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Business: {document.business_name}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Type: {LABELS[document.document_type] ?? titleCase(document.document_type)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Submitted:{" "}
                        {new Date(document.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span className="h-fit w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {titleCase(document.verification_status)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`notes-${document.id}`}
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Verification notes
                    </label>
                    <textarea
                      id={`notes-${document.id}`}
                      rows={2}
                      maxLength={1000}
                      value={
                        notes[document.id] ??
                        document.verification_notes ??
                        ""
                      }
                      onChange={(event) =>
                        setNotes((previous) => ({
                          ...previous,
                          [document.id]: event.target.value,
                        }))
                      }
                      placeholder="Add feedback or a rejection reason..."
                      disabled={busyId === document.id}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void viewDocument(document)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      View Document
                    </button>

                    <button
                      type="button"
                      disabled={busyId === document.id}
                      onClick={() =>
                        void reviewDocument(document.id, "under_review")
                      }
                      className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                    >
                      Mark Under Review
                    </button>

                    <button
                      type="button"
                      disabled={busyId === document.id}
                      onClick={() =>
                        void reviewDocument(document.id, "verified")
                      }
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      disabled={busyId === document.id}
                      onClick={() =>
                        void reviewDocument(document.id, "rejected")
                      }
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>

                    {busyId === document.id && (
                      <span className="self-center text-sm text-gray-500">
                        Saving...
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
