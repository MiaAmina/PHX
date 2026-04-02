import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Gavel,
  Package,
  Users,
  ClipboardList,
  LogOut,
  BarChart3,
  Store,
  BookOpen,
  Send,
  Shield,
  QrCode,
  Building2,
  FileCheck,
  ClipboardCheck,
  Receipt,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { PHXLogo } from "@/components/phx-logo";

const menuByRole: Record<string, Array<{ titleKey: string; url: string; icon: any }>> = {
  HOTEL: [
    { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
    { titleKey: "nav.complianceProfile", url: "/agent/compliance", icon: FileCheck },
    { titleKey: "nav.wholesaleListings", url: "/auctions", icon: Gavel },
    { titleKey: "nav.hotelProfile", url: "/hotel/profile", icon: Building2 },
    { titleKey: "nav.guestCheckin", url: "/hotel/checkin", icon: QrCode },
    { titleKey: "nav.wallet", url: "/wallet", icon: Wallet },
    { titleKey: "nav.transactions", url: "/transactions", icon: Receipt },
    { titleKey: "nav.escrowPolicy", url: "/escrow-policy", icon: Shield },
  ],
  BROKER: [
    { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
    { titleKey: "nav.complianceProfile", url: "/agent/compliance", icon: FileCheck },
    { titleKey: "nav.liveAuctions", url: "/auctions", icon: Gavel },
    { titleKey: "nav.myInventory", url: "/inventory", icon: Package },
    { titleKey: "nav.myGroup", url: "/broker/group", icon: Users },
    { titleKey: "nav.wallet", url: "/wallet", icon: Wallet },
    { titleKey: "nav.transactions", url: "/transactions", icon: Receipt },
    { titleKey: "nav.escrowPolicy", url: "/escrow-policy", icon: Shield },
  ],
  AGENT: [
    { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
    { titleKey: "nav.complianceProfile", url: "/agent/compliance", icon: FileCheck },
    { titleKey: "nav.availableRooms", url: "/marketplace", icon: Store },
    { titleKey: "nav.myBookings", url: "/bookings", icon: BookOpen },
    { titleKey: "nav.storefront", url: "/agent/storefront", icon: Building2 },
    { titleKey: "nav.wallet", url: "/wallet", icon: Wallet },
    { titleKey: "nav.transactions", url: "/transactions", icon: Receipt },
    { titleKey: "nav.escrowPolicy", url: "/escrow-policy", icon: Shield },
  ],
  ADMIN: [
    { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
    { titleKey: "nav.allAuctions", url: "/auctions", icon: Gavel },
    { titleKey: "nav.users", url: "/admin/users", icon: Users },
    { titleKey: "nav.reports", url: "/admin/reports", icon: BarChart3 },
    { titleKey: "nav.offerAudit", url: "/admin/offer-audit", icon: Send },
    { titleKey: "nav.escrowLedger", url: "/admin/escrow", icon: Shield },
    { titleKey: "nav.disputes", url: "/admin/disputes", icon: AlertTriangle },
    { titleKey: "nav.transactions", url: "/transactions", icon: Receipt },
    { titleKey: "nav.verificationQueue", url: "/admin/verification", icon: ClipboardCheck },
  ],
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { t, dir } = useTranslation();

  if (!user) return null;

  const items = menuByRole[user.role] || [];
  const initials = user.businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar side={dir === "rtl" ? "right" : "left"}>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <PHXLogo size={36} />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight truncate">PHX Exchange</span>
            <span className="text-xs text-muted-foreground truncate">{user.role} {t("nav.portal")}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.businessName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
