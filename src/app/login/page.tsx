"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";
type UserRole = "Vendor" | "funder";

export default function LoginPage() {
const [mode, setMode] = useState<AuthMode>("signin");

// Shared fields
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

// Signup fields
const [fullName, setFullName] = useState("");
const [role, setRole] = useState<UserRole>("Vendor");

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

function switchMode(nextMode: AuthMode) {
setMode(nextMode);
setMessage("");
setError("");
}

async function handleLogin(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
setLoading(true);
setError("");
setMessage("");

try {
const supabase = createClient();
const { data, error: loginError } =
  await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

if (loginError) {
  setError(loginError.message);
  return;
}

if (!data.user) {
  setError("Sign-in succeeded, but no user was returned. Please try again.");
  return;
}

// Check that the signed-in user has a profile.
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", data.user.id)
  .maybeSingle();

if (profileError) {
  console.error("Profile lookup failed:", profileError);
  setError(
    "You signed in, but we couldn't load your profile. Please check the server logs."
  );
  return;
}

if (!profile) {
  console.error("No profile found for authenticated user:", data.user.id);
  setError(
    "Your account is authenticated, but your StallUp profile is missing. The profile setup needs to be fixed."
  );
  return;
}

// The dashboard will route the user according to their profile role.
window.location.replace("/dashboard");


} catch (err) {
console.error("Sign-in error:", err);
setError("Something went wrong while signing in. Please try again.");
} finally {
setLoading(false);
}
}


async function handleSignup(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
setLoading(true);
setError("");
setMessage("");


try {
  const supabase = createClient();

  const { error: signupError } = await supabase.auth.signUp({
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

  setMessage(
    "Account created. Please check your email to confirm your account."
  );
} catch {
  setError("Something went wrong while creating your account.");
} finally {
  setLoading(false);
}


}

return ( <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-10"> <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8"> <div className="mb-7 text-center"> <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
STALLUP </p>


      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {mode === "signin" ? "Welcome back" : "Join StallUp"}
      </h1>

      <p className="mt-2 text-sm text-gray-600">
        {mode === "signin"
          ? "Sign in to manage your business and connections."
          : "Create an account to get started with StallUp."}
      </p>
    </div>

    {/* Sign In / Create Account tabs */}
    <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
      <button
        type="button"
        onClick={() => switchMode("signin")}
        className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
          mode === "signin"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        Sign In
      </button>

      <button
        type="button"
        onClick={() => switchMode("signup")}
        className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
          mode === "signup"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        Create Account
      </button>
    </div>

    {mode === "signin" ? (
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email address
          </label>

          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <a
              href="/forgot-password"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </a>
          </div>

          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    ) : (
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label
            htmlFor="signup-name"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Full name
          </label>

          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email address
          </label>

          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Create password
          </label>

          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <p className="mb-2 block text-sm font-medium text-gray-700">
            I am registering as
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("Vendor")}
              aria-pressed={role === "Vendor"}
              className={`rounded-lg border px-4 py-3 font-medium transition ${
                role === "Vendor"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Vendor
            </button>

            <button
              type="button"
              onClick={() => setRole("funder")}
              aria-pressed={role === "funder"}
              className={`rounded-lg border px-4 py-3 font-medium transition ${
                role === "funder"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Funder
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    )}

    {message && (
      <p
        role="status"
        className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
      >
        {message}
      </p>
    )}

    {error && (
      <p
        role="alert"
        className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
      >
        {error}
      </p>
    )}

    <p className="mt-6 text-center text-sm text-gray-600">
      {mode === "signin"
        ? "New to StallUp? "
        : "Already have an account? "}

      <button
        type="button"
        onClick={() =>
          switchMode(mode === "signin" ? "signup" : "signin")
        }
        className="font-semibold text-gray-900 underline underline-offset-4 hover:text-blue-600"
      >
        {mode === "signin" ? "Create an account" : "Sign in instead"}
      </button>
    </p>
  </div>
</main>


);
}
