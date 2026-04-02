import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { VerificationGate } from "@/components/verification-gate";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import AuctionsPage from "@/pages/auctions-page";
import InventoryPage from "@/pages/inventory-page";
import MarketplacePage from "@/pages/marketplace-page";
import BookingsPage from "@/pages/bookings-page";
import AdminUsersPage from "@/pages/admin-users-page";
import AdminReportsPage from "@/pages/admin-reports-page";
import AdminOfferAuditPage from "@/pages/admin-offer-audit-page";
import AdminEscrowPage from "@/pages/admin-escrow-page";
import BrokerGroupPage from "@/pages/broker-group-page";
import HotelCheckinPage from "@/pages/hotel-checkin-page";
import HotelProfilePage from "@/pages/hotel-profile-page";
import AgentCompliancePage from "@/pages/agent-compliance-page";
import AdminVerificationPage from "@/pages/admin-verification-page";
import TransactionsPage from "@/pages/transactions-page";
import WalletPage from "@/pages/wallet-page";
import AdminDisputesPage from "@/pages/admin-disputes-page";
import StorefrontPage from "@/pages/storefront-page";
import PublicStorefrontPage from "@/pages/public-storefront-page";
import BookingStatusPage from "@/pages/booking-status-page";
import EscrowPolicyPage from "@/pages/escrow-policy-page";
import NotFound from "@/pages/not-found";

function ImpersonationBanner() {
  const { user, endImpersonation, isImpersonating } = useAuth();
  const { t } = useTranslation();

  if (!isImpersonating || !user) return null;

  return (
    <div
      className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between gap-2 shrink-0"
      style={{ zIndex: 9999 }}
      data-testid="banner-impersonation"
    >
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span className="font-semibold text-sm truncate">
          {t("impersonation.banner")}: {user.businessName} ({user.role})
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 bg-white/20 border-black/30"
        onClick={() => endImpersonation()}
        data-testid="button-end-impersonation"
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        {t("impersonation.returnToAdmin")}
      </Button>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full flex-col">
        <ImpersonationBanner />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex items-center justify-between gap-2 p-3 border-b shrink-0 sticky top-0 z-50 bg-background">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-1">
                <CurrencyToggle />
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 stone-texture bg-background">
              <Component />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/auctions">{() => <ProtectedRoute component={() => <VerificationGate><AuctionsPage /></VerificationGate>} />}</Route>
      <Route path="/inventory">{() => <ProtectedRoute component={InventoryPage} />}</Route>
      <Route path="/marketplace">{() => <ProtectedRoute component={() => <VerificationGate><MarketplacePage /></VerificationGate>} />}</Route>
      <Route path="/bookings">{() => <ProtectedRoute component={() => <VerificationGate><BookingsPage /></VerificationGate>} />}</Route>
      <Route path="/broker/group">{() => <ProtectedRoute component={BrokerGroupPage} />}</Route>
      <Route path="/admin/users">{() => <ProtectedRoute component={AdminUsersPage} />}</Route>
      <Route path="/admin/reports">{() => <ProtectedRoute component={AdminReportsPage} />}</Route>
      <Route path="/admin/offer-audit">{() => <ProtectedRoute component={AdminOfferAuditPage} />}</Route>
      <Route path="/admin/escrow">{() => <ProtectedRoute component={AdminEscrowPage} />}</Route>
      <Route path="/hotel/profile">{() => <ProtectedRoute component={HotelProfilePage} />}</Route>
      <Route path="/hotel/checkin">{() => <ProtectedRoute component={HotelCheckinPage} />}</Route>
      <Route path="/agent/compliance">{() => <ProtectedRoute component={AgentCompliancePage} />}</Route>
      <Route path="/admin/verification">{() => <ProtectedRoute component={AdminVerificationPage} />}</Route>
      <Route path="/transactions">{() => <ProtectedRoute component={() => <VerificationGate><TransactionsPage /></VerificationGate>} />}</Route>
      <Route path="/wallet">{() => <ProtectedRoute component={() => <VerificationGate><WalletPage /></VerificationGate>} />}</Route>
      <Route path="/admin/disputes">{() => <ProtectedRoute component={AdminDisputesPage} />}</Route>
      <Route path="/escrow-policy">{() => <ProtectedRoute component={EscrowPolicyPage} />}</Route>
      <Route path="/agent/storefront">{() => <ProtectedRoute component={() => <VerificationGate><StorefrontPage /></VerificationGate>} />}</Route>
      <Route path="/s/:slug" component={PublicStorefrontPage} />
      <Route path="/booking-status" component={BookingStatusPage} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route>{() => <ProtectedRoute component={Dashboard} />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
