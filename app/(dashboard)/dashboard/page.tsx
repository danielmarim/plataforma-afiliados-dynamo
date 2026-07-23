import type { Metadata } from "next";
import { ShoppingCart, Ticket, TrendingUp, Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

const stats = [
  { title: "Vendas no mês", value: "—", icon: ShoppingCart },
  { title: "Comissões pendentes", value: "—", icon: Wallet },
  { title: "Cupons ativos", value: "—", icon: Ticket },
  { title: "Taxa de comissão", value: "—", icon: TrendingUp },
] as const;

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {session?.user?.name ?? "afiliado"}!
        </h1>
        <p className="text-muted-foreground">
          Acompanhe suas vendas, cupons e comissões em um só lugar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                Dados disponíveis em breve
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura pronta para as regras de negócio</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          A base da plataforma está configurada: autenticação, banco de dados,
          modelos Prisma e integrações. Os módulos de vendas, cupons, comissões
          e relatórios serão implementados nas próximas etapas.
        </CardContent>
      </Card>
    </div>
  );
}
