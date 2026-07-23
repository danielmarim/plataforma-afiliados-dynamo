import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { auth } from "@/lib/auth";
import { APP_NAME } from "@/utils/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Zap className="size-5 text-primary" />
          <Link href="/dashboard" className="font-bold tracking-tight">
            {APP_NAME}
          </Link>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b px-4">
          <UserNav />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
