import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Sidebar from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen">
      <Suspense
        fallback={
          <aside className="flex w-64 flex-col border-r bg-white">
            <div className="px-4 pt-4 pb-2">
              <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex-1 px-3">
              <div className="mb-2 h-3 w-16 animate-pulse rounded bg-gray-100" />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="mb-2 animate-pulse rounded-lg bg-gray-100 px-3 py-3"
                >
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="mt-2 h-2.5 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </aside>
        }
      >
        <Sidebar user={{ email: user?.email ?? null }} />
      </Suspense>
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}
