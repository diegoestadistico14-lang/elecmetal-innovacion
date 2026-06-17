import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchMe } from "@/lib/api";
import ProfileCard from "@/components/dashboard/profile-card";
import WelcomeState from "@/components/dashboard/welcome-state";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!session) redirect("/login");

  let fullName = user?.email ?? "Usuario";
  let role = "postulante";

  try {
    const profile = await fetchMe(session.access_token);
    fullName = profile.full_name;
    role = profile.role;
  } catch {
    // Backend no disponible — mostrar datos básicos de Supabase
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <ProfileCard fullName={fullName} role={role} />

      <WelcomeState hasSessions={false} />

      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-sm text-gray-400">
          El área de chat estará disponible en la próxima versión.
        </p>
      </div>
    </div>
  );
}
