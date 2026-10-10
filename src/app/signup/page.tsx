"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
const router = useRouter();

const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [role, setRole] = useState<"vendor" | "funder">("vendor");

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

async function handleSignup(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setLoading(true);
setMessage("");
setError("");

try {
  const supabase = createClient();

  const { data, error: signupError } =
    await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          full_name: fullName.trim(),
          role,
        },
      },
    });

  if (signupError) {
    setError(signupError.message);
    return;
  }

  // Supabase may require email confirmation before a session exists.
  if (!data.session) {
    setMessage(
      "Account created successfully. Please confirm your email using the link we sent you. You can then sign in."
    );
    return;
  }

  // A session exists, so the user can proceed to the dashboard.
  router.replace("/dashboard");
  router.refresh();
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Something went wrong while creating your account."
  );
} finally {
  setLoading(false);
}


}

return ( <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4"> <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"> <h1 className="text-3xl font-bold">
Create your StallUp account </h1>

    <p className="mt-2 text-gray-600">
      Join StallUp as a Vendor or Funder.
    </p>

    <form onSubmit={handleSignup} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Full name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-lg border px-3 py-2"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-lg border px-3 py-2"
          placeholder="At least 6 characters"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          I am registering as
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("vendor")}
            className={`rounded-lg border px-4 py-2 ${
              role === "vendor"
                ? "border-black bg-black text-white"
                : "bg-white"
            }`}
          >
            Vendor
          </button>

          <button
            type="button"
            onClick={() => setRole("funder")}
            className={`rounded-lg border px-4 py-2 ${
              role === "funder"
                ? "border-black bg-black text-white"
                : "bg-white"
            }`}
          >
            Funder
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>

    {message && (
      <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
        {message}
      </p>
    )}

    {error && (
      <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {error}
      </p>
    )}

    <p className="mt-4 text-center text-sm text-gray-600">
      Already have an account?{" "}
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="font-semibold text-blue-600 hover:underline"
      >
        Sign in
      </button>
    </p>
  </div>
</main>


);
}
