
"use client";

import { useState } from "react";

type ConnectionRequest = {
  id: string;
  funder_id: string;
  business_id: string;
  status: string;
  funder_message: string | null;
  business_name: string;
  funder_name: string;
};

type Props = {
  requests: ConnectionRequest[];
};

export default function ConnectionRequests({
  requests,
}: Props) {
  const [requestList, setRequestList] =
    useState<ConnectionRequest[]>(requests);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  async function respondToRequest(
    requestId: string,
    status: "accepted" | "rejected"
  ) {
    setProcessingId(requestId);

    try {
      const result = await fetch(
        "/api/connection-requests/respond",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            status,
          }),
        }
      );

      const data = await result.json();

      if (!result.ok) {
        throw new Error(
          data.error ||
            "Unable to respond to the connection request."
        );
      }

      setRequestList((current) =>
        current.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status,
              }
            : request
        )
      );
    } catch (error: unknown) {
      console.error(
        "Connection request response error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to respond to the connection request."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingRequests = requestList.filter(
    (request) => request.status === "pending"
  );

  const respondedRequests = requestList.filter(
    (request) => request.status !== "pending"
  );

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Connection Requests
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Review funders who are interested in connecting
          with your business.
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
            <span className="text-2xl">🤝</span>
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No pending connection requests
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            When a funder wants to connect with your
            business, their request will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {pendingRequests.map((request) => {
            const isProcessing =
              processingId === request.id;

            return (
              <div
                key={request.id}
                className="rounded-2xl border border-purple-200 bg-purple-50 p-5"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        🤝 {request.funder_name}
                      </h3>

                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                        Pending
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      wants to connect regarding
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {request.business_name}
                    </p>

                    {request.funder_message && (
                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="text-xs font-semibold text-gray-500">
                          Message from funder
                        </p>

                        <p className="mt-2 text-sm leading-6 text-gray-700">
                          {request.funder_message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex min-w-[180px] flex-col gap-3">
                    <button
                      onClick={() =>
                        respondToRequest(
                          request.id,
                          "accepted"
                        )
                      }
                      disabled={isProcessing}
                      className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing
                        ? "Processing..."
                        : "✓ Accept"}
                    </button>

                    <button
                      onClick={() =>
                        respondToRequest(
                          request.id,
                          "rejected"
                        )
                      }
                      disabled={isProcessing}
                      className="rounded-xl border-2 border-red-500 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing
                        ? "Processing..."
                        : "✕ Reject"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Previously Responded Requests */}
      {respondedRequests.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-900">
            Previous Requests
          </h3>

          <div className="mt-3 space-y-3">
            {respondedRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {request.funder_name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {request.business_name}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    request.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {request.status === "accepted"
                    ? "✓ Accepted"
                    : "✕ Rejected"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
