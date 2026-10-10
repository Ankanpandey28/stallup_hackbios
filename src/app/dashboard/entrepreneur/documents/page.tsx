
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type BusinessDocument = {
  id: string;
  document_type: string;
  file_name: string;
  verification_status: string;
  storage_path: string;
  created_at: string;
};

const DOCUMENT_TYPES = [
  { value: "identity", label: "Identity Proof" },
  { value: "business_registration", label: "Business Registration" },
  { value: "address_proof", label: "Address Proof" },
  { value: "financial_record", label: "Financial Record" },
  { value: "food_license", label: "Food License (FSSAI)" },
  { value: "other", label: "Other Document" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export default function VendorDocumentsPage() {
  const [supabase] = useState(() => createClient());

  const [businessId, setBusinessId] = useState("");
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [documentType, setDocumentType] = useState(
    "business_registration"
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
        setBusinessId("");
        setDocuments([]);
        setError("Please sign in to manage your documents.");
        return;
      }

      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("entrepreneur_id", user.id)
          .is("archived_at", null)
          .maybeSingle();

      if (businessError) throw businessError;

      if (!business) {
        setBusinessId("");
        setDocuments([]);
        setError(
          "Register your business before uploading documents."
        );
        return;
      }

      setBusinessId(business.id);

      const { data, error: documentsError } = await supabase
        .from("business_documents")
        .select(
          "id, document_type, file_name, verification_status, storage_path, created_at"
        )
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (documentsError) throw documentsError;

      setDocuments((data ?? []) as BusinessDocument[]);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your documents."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // Save the form before any asynchronous operations.
    const form = event.currentTarget;

    setError("");
    setMessage("");

    if (!file) {
      setError("Please choose a document to upload.");
      return;
    }

    if (!businessId) {
      setError(
        "No active business was found. Please register your business first."
      );
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The maximum file size is 10 MB.");
      return;
    }

    setUploading(true);

    let uploadedPath = "";

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const safeName = file.name
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-120);

      uploadedPath =
        `${user.id}/${businessId}/${crypto.randomUUID()}-${safeName}`;

      // Upload the file to the private Supabase Storage bucket.
      const { error: uploadError } = await supabase.storage
        .from("business-documents")
        .upload(uploadedPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save document metadata in the existing database table.
      const { error: insertError } = await supabase
        .from("business_documents")
        .insert({
          business_id: businessId,
          document_type: documentType,
          file_name: file.name,
          storage_path: uploadedPath,
          verification_status: "pending",
          verified_by: null,
          verified_at: null,
          verification_notes: null,
        });

      if (insertError) {
        // Remove the uploaded file if saving its metadata fails.
        const { error: cleanupError } = await supabase.storage
          .from("business-documents")
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "Uploaded-file cleanup failed:",
            cleanupError
          );
        }

        throw insertError;
      }

      setFile(null);
      setDocumentType("business_registration");
      form.reset();

      setMessage(
        "Document uploaded successfully and is awaiting review."
      );

      await loadDocuments();
    } catch (err) {
      console.error("Document upload failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  function formatStatus(status: string) {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/entrepreneur"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Vendor Dashboard
        </Link>

        <header className="mt-6">
          <p className="text-sm font-bold tracking-widest text-blue-600">
            STALLUP
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Business Documents
          </h1>

          <p className="mt-2 text-gray-600">
            Upload the documents needed to verify your business.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Upload a document
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Accepted formats: PDF, JPG, and PNG. Maximum size: 10 MB.
          </p>

          <form
            onSubmit={handleUpload}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="documentType"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Document type
              </label>

              <select
                id="documentType"
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value)
                }
                disabled={uploading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="documentFile"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Choose file
              </label>

              <input
                id="documentFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
                disabled={uploading}
                required
                className="block w-full rounded-xl border border-gray-300 p-3 text-sm"
              />

              {file && (
                <p className="mt-2 break-all text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={uploading || loading || !businessId}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            My Uploaded Documents
          </h2>

          {loading ? (
            <p className="mt-5 text-gray-600">
              Loading documents...
            </p>
          ) : documents.length === 0 ? (
            <p className="mt-5 text-gray-600">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-gray-100">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="break-all font-semibold text-gray-900">
                      {document.file_name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatStatus(document.document_type)} ·{" "}
                      {new Date(
                        document.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {formatStatus(document.verification_status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}