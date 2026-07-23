import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME } from "@/utils/constants";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="flex items-center gap-2">
        <Zap className="size-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      </div>
      <p className="max-w-md text-lg text-muted-foreground">
        {APP_DESCRIPTION}
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/login">
            Entrar
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/register">Quero ser afiliado</Link>
        </Button>
      </div>
    </main>
  );
}
