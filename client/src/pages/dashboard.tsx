import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gavel,
  Package,
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowUpRight,
  Building2,
  Store,
  AlertCircle,
} from "lucide-react";

const iconColors: Record<string, { gradient: string; shadow: string; ring: string }> = {
  bookings: { gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/25", ring: "ring-blue-500/10" },
  pilgrims: { gradient: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/25", ring: "ring-emerald-500/10" },
  rooms: { gradient: "from-amber-500 to-amber-600", shadow: "shadow-amber-500/25", ring: "ring-amber-500/10" },
  money: { gradient: "from-violet-500 to-violet-600", shadow: "shadow-violet-500/25", ring: "ring-violet-500/10" },
  auctions: { gradient: "from-rose-500 to-rose-600", shadow: "shadow-rose-500/25", ring: "ring-rose-500/10" },
  bids: { gradient: "from-cyan-500 to-cyan-600", shadow: "shadow-cyan-500/25", ring: "ring-cyan-500/10" },
  inventory: { gradient: "from-orange-500 to-orange-600", shadow: "shadow-orange-500/25", ring: "ring-orange-500/10" },
  users: { gradient: "from-teal-500 to-teal-600", shadow: "shadow-teal-500/25", ring: "ring-teal-500/10" },
};

function StatCard({ title, value, icon: Icon, description, trend, color = "bookings", href }: {
  title: string; value: string | number; icon: any; description?: string; trend?: string; color?: string; href?: string;
}) {
  const [, navigate] = useLocation();
  const c = iconColors[color] || iconColors.bookings;
  return (
    <Card
      className={`relative overflow-hidden group hover:shadow-md transition-all duration-200 ${href ? "cursor-pointer hover:border-[#D4AF37]/40 hover:shadow-[#D4AF37]/5" : ""}`}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={href ? () => navigate(href) : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg ${c.shadow} ring-3 ${c.ring}`}>
          <Icon className="h-4 w-4 text-white drop-shadow-sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tabular-nums">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-emerald-500 font-medium">{trend}</span>
              </div>
            )}
          </div>
          {href && (
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (!user) return null;

  const greeting = getGreeting(t);

  const roleLabel = user.role === "HOTEL" ? t("auth.hotel")
    : user.role === "BROKER" ? t("auth.broker")
    : user.role === "AGENT" ? t("auth.agent")
    : t("common.admin");

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#dce6f0] to-[#c8d8e8] dark:from-[#1C2530] dark:to-[#2A3A4A] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#8B7320] dark:bg-gold/20 dark:text-gold">{roleLabel}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white" data-testid="text-dashboard-title">
            {greeting}, {user.businessName}
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonStats />
      ) : user.role === "HOTEL" ? (
        <HotelStats stats={stats} />
      ) : user.role === "BROKER" ? (
        <BrokerStats stats={stats} />
      ) : user.role === "AGENT" ? (
        <AgentStats stats={stats} />
      ) : (
        <AdminStats stats={stats} />
      )}

      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.recentActivity")}</CardTitle>
            <CardDescription>{t("dashboard.latestActions")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                  <span className="text-foreground">{item.message}</span>
                  <span className="text-xs text-muted-foreground ms-auto shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HotelStats({ stats }: { stats: any }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title={t("dashboard.activeListings")} value={stats?.activeAuctions ?? 0} icon={Gavel} description={t("dashboard.currentlyLive")} color="auctions" href="/auctions" />
      <StatCard title={t("dashboard.totalListings")} value={stats?.totalAuctions ?? 0} icon={Clock} description={t("dashboard.allTime")} color="bids" href="/auctions" />
      <StatCard title={t("dashboard.totalBidsReceived")} value={stats?.totalBids ?? 0} icon={TrendingUp} description={t("dashboard.acrossAllListings")} color="rooms" href="/auctions" />
      <StatCard title={t("dashboard.revenue")} value={`$${stats?.revenue ?? "0"}`} icon={DollarSign} description={t("dashboard.fromWholesaleDeals")} color="money" />
    </div>
  );
}

function BrokerStats({ stats }: { stats: any }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title={t("dashboard.activeBids")} value={stats?.activeBids ?? 0} icon={Gavel} description={t("dashboard.onLiveAuctions")} color="auctions" href="/auctions" />
      <StatCard title={t("dashboard.wonBlocks")} value={stats?.wonBlocks ?? 0} icon={Package} description={t("dashboard.inYourInventory")} color="inventory" href="/inventory" />
      <StatCard title={t("dashboard.listedBlocks")} value={stats?.listedBlocks ?? 0} icon={Store} description={t("dashboard.visibleToAgents")} color="rooms" href="/inventory" />
      <StatCard title={t("dashboard.totalBookings")} value={stats?.totalBookings ?? 0} icon={BookOpen} description={t("dashboard.fromAgents")} color="bookings" href="/inventory" />
    </div>
  );
}

function AgentStats({ stats }: { stats: any }) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const pendingSyncCount = stats?.pendingSyncCount ?? 0;
  return (
    <div className="space-y-4">
      {pendingSyncCount > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"
          data-testid="alert-pending-nusuk-sync"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {pendingSyncCount} {pendingSyncCount === 1 ? "pilgrim" : "pilgrims"} pending Nusuk submission
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ready for ministry sync and visa processing.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0"
            onClick={() => navigate("/agent/storefront")}
            data-testid="button-go-to-nusuk-dashboard"
          >
            <ArrowUpRight className="w-3.5 h-3.5 me-1" />
            Nusuk Dashboard
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t("dashboard.myBookings")} value={stats?.totalBookings ?? 0} icon={BookOpen} description={t("dashboard.activeReservations")} color="bookings" href="/bookings" />
        <StatCard title={t("dashboard.totalPilgrims")} value={stats?.totalPilgrims ?? 0} icon={Users} description={t("dashboard.registeredTravelers")} color="pilgrims" href="/bookings" />
        <StatCard title={t("dashboard.availableRooms")} value={stats?.availableRooms ?? 0} icon={Store} description={t("dashboard.inMarketplace")} color="rooms" href="/marketplace" />
        <StatCard title={t("dashboard.totalSpent")} value={`$${stats?.totalSpent ?? "0"}`} icon={DollarSign} description={t("dashboard.onBookings")} color="money" href="/bookings" />
      </div>
    </div>
  );
}

function AdminStats({ stats }: { stats: any }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title={t("dashboard.totalUsers")} value={stats?.totalUsers ?? 0} icon={Users} description={t("dashboard.allRegisteredUsers")} color="users" href="/admin/users" />
      <StatCard title={t("dashboard.activeAuctions")} value={stats?.activeAuctions ?? 0} icon={Gavel} description={t("dashboard.currentlyLive")} color="auctions" href="/auctions" />
      <StatCard title={t("dashboard.totalBookings")} value={stats?.totalBookings ?? 0} icon={BookOpen} description={t("dashboard.allBookings")} color="bookings" href="/admin/reports" />
      <StatCard title={t("dashboard.platformRevenue")} value={`$${stats?.revenue ?? "0"}`} icon={DollarSign} description={t("dashboard.totalVolume")} color="money" href="/admin/escrow" />
    </div>
  );
}

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("dashboard.goodMorning");
  if (h < 17) return t("dashboard.goodAfternoon");
  return t("dashboard.goodEvening");
}
