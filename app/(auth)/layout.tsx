import Link from "next/link";
import { Zap } from "lucide-react";

import { APP_NAME } from "@/utils/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <Link href="/" className="flex items-center gap-2">
        <Zap className="size-7 text-primary" />
        <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
      </Link>
      {children}
    </div>
  );
}
