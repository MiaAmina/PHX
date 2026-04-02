import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Gavel, Users, ArrowRight, Loader2, Search } from "lucide-react";
import { PHXLogo } from "@/components/phx-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicCurrencyToggle } from "@/components/currency-toggle";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!role) {
          toast({ title: t("auth.pleaseSelectRole"), variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        await register({ email, password, role, businessName });
      }
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message || t("auth.somethingWentWrong"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { value: "HOTEL", labelKey: "auth.hotel", icon: Building2, descKey: "auth.hotelTagline", ctaKey: "auth.hotelCta" },
    { value: "BROKER", labelKey: "auth.broker", icon: Gavel, descKey: "auth.brokerTagline", ctaKey: "auth.brokerCta" },
    { value: "AGENT", labelKey: "auth.agent", icon: Users, descKey: "auth.agentTagline", ctaKey: "auth.agentCta" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#1C2530] bg-[radial-gradient(circle_at_center,_rgba(106,137,167,0.05)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle_at_center,_rgba(106,137,167,0.12)_0%,_transparent_70%)]">
      <div className="absolute top-4 end-4 z-50 flex items-center gap-2">
        <PublicCurrencyToggle />
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 bg-[#edf3f8] dark:bg-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(106,137,167,0.08)_0%,_transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(106,137,167,0.15)_0%,_transparent_60%)]" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <PHXLogo size={44} />
            <span className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-[#e8e4dc] dark:drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]">PHX Exchange</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 tracking-wide mb-8">
            {t("auth.platformTitle")}
          </p>

          <div className="space-y-3">
            {roles.map((r) => {
              const isSelected = !isLogin && role === r.value;
              return (
                <div
                  key={r.value}
                  className={`rounded-xl border transition-all duration-200 p-4 flex items-center gap-4 ${
                    isSelected
                      ? "bg-gold/10 dark:bg-white/10 border-gold/50 ring-1 ring-gold/30 shadow-lg shadow-gold/10"
                      : "bg-white/70 dark:bg-white/[0.04] border-gray-200 dark:border-[#6A89A7]/20 hover:border-gray-300 dark:hover:border-[#6A89A7]/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:bg-white dark:hover:bg-white/[0.06]"
                  }`}
                  data-testid={`role-card-${r.value.toLowerCase()}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isSelected ? "bg-gold/20" : "bg-gold/5 dark:bg-[#6A89A7]/10"}`}>
                    <r.icon className={`w-4 h-4 ${isSelected ? "!text-gold" : "!text-gold/70"}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isSelected ? "text-gold" : "text-gray-800 dark:text-zinc-100"}`}>{t(r.labelKey)}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t(r.descKey)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setRole(r.value); }}
                    className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-gold text-[#1C2530] shadow-md shadow-gold/20"
                        : "border border-gray-300 dark:border-[#6A89A7]/25 text-gray-600 dark:text-zinc-300 hover:border-gold/50 hover:text-gold hover:bg-gold/5"
                    }`}
                    data-testid={`button-cta-${r.value.toLowerCase()}`}
                  >
                    {t(r.ctaKey)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-gray-200/20 dark:from-zinc-800/20 via-transparent to-transparent pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-2xl bg-white/90 dark:bg-[#223040]/80 backdrop-blur-xl border border-gray-200 dark:border-[#6A89A7]/20 shadow-2xl p-8" data-testid="card-auth">
            <div className="flex flex-col items-center mb-6">
              <div className="mb-4">
                <PHXLogo size={56} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100" data-testid="text-auth-title">
                {isLogin ? t("auth.welcomeTitle") : t("auth.createAccount")}
              </h2>
              {isLogin && (
                <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{t("auth.signInSubtitle")}</p>
              )}
            </div>

            <div className="lg:hidden flex items-center justify-center gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-[#6A89A7]/20">
              <PHXLogo size={20} glow={false} />
              <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400 tracking-wide uppercase">PHX Exchange</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-zinc-300 text-sm">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.placeholder.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-50 dark:bg-[#3A5068]/50 border-gray-300 dark:border-[#6A89A7]/30 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-400 focus:border-gold focus:ring-gold/20"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-zinc-300 text-sm">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.placeholder.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-gray-50 dark:bg-[#3A5068]/50 border-gray-300 dark:border-[#6A89A7]/30 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-400 focus:border-gold focus:ring-gold/20"
                  data-testid="input-password"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-gray-700 dark:text-zinc-300 text-sm">{t("auth.businessName")}</Label>
                    <Input
                      id="businessName"
                      placeholder={t("auth.placeholder.businessName")}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-[#3A5068]/50 border-gray-300 dark:border-[#6A89A7]/30 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-400 focus:border-gold focus:ring-gold/20"
                      data-testid="input-business-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-zinc-300 text-sm">{t("auth.role")}</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="bg-gray-50 dark:bg-[#3A5068]/50 border-gray-300 dark:border-[#6A89A7]/30 text-gray-900 dark:text-zinc-100" data-testid="select-role">
                        <SelectValue placeholder={t("auth.selectRole")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOTEL" data-testid="option-hotel">{t("auth.hotel")}</SelectItem>
                        <SelectItem value="BROKER" data-testid="option-broker">{t("auth.broker")}</SelectItem>
                        <SelectItem value="AGENT" data-testid="option-agent">{t("auth.agent")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-gold text-gold-foreground font-bold border-gold gold-glow"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? t("auth.signIn") : t("auth.createAccount")}
                    <ArrowRight className="w-4 h-4 ms-2" strokeWidth={1.5} />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail("");
                  setPassword("");
                  setBusinessName("");
                  setRole("");
                }}
                data-testid="button-toggle-auth"
              >
                {isLogin ? t("auth.dontHaveAccount") : t("auth.alreadyHaveAccount")}
              </button>
              <a
                href="/booking-status"
                className="flex items-center justify-center gap-1.5 text-sm text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors mt-3"
                data-testid="link-booking-status"
              >
                <Search className="w-3.5 h-3.5" />
                {t("auth.checkBookingStatus")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
