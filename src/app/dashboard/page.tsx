
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Profile error:", error);
    redirect("/login");
  }

  if (profile.role === "admin") {
    redirect("/dashboard/admin");
  }

  if (profile.role === "funder") {
    redirect("/dashboard/funder");
  }

  if (profile.role === "entrepreneur") {
    redirect("/dashboard/entrepreneur");
  }

  console.error("Unknown user role:", profile.role);
  redirect("/login");
}