import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useState, useEffect } from "react";
import {
  Package,
  DollarSign,
  BedDouble,
  MapPin,
  Settings2,
  Loader2,
  Percent,
  TrendingUp,
  Users,
  UsersRound,
  LayoutGrid,
  User,
  BadgeCheck,
  Globe,
  Lock,
  Send,
  Eye,
  Clock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

function RoomTypeIcon({ roomType, className }: { roomType: string; className?: string }) {
  const type = roomType?.toLowerCase() || "";
  if (type.includes("single")) return <User className={className} strokeWidth={1.5} />;
  if (type.includes("double")) return <Users className={className} strokeWidth={1.5} />;
  if (type.includes("triple")) return <UsersRound className={className} strokeWidth={1.5} />;
  if (type.includes("quad")) return <LayoutGrid className={className} strokeWidth={1.5} />;
  return <BedDouble className={className} strokeWidth={1.5} />;
}

function ReleaseCountdown({ deadline, blockId }: { deadline: string; blockId: string }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const end = new Date(deadline).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft(t("inventory.deadlineExpired"));
        setIsUrgent(true);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${hours}h ${mins}m`);
      }
      setIsUrgent(days < 2);
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [deadline, t]);

  return (
    <div className={`flex items-center gap-1.5 mt-1 ${isUrgent ? "text-amber-500" : "text-muted-foreground"}`}>
      {isUrgent ? (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
      ) : (
        <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
      )}
      <p className="text-xs font-medium" data-testid={`text-deadline-${blockId}`}>
        {t("inventory.releaseIn")} {timeLeft}
      </p>
    </div>
  );
}

const visibilityConfig: Record<string, { labelKey: string; icon: any; descKey: string }> = {
  PUBLIC: { labelKey: "inventory.visPublic", icon: Globe, descKey: "inventory.visPublicDesc" },
  PRIVATE: { labelKey: "inventory.visGroupOnly", icon: Lock, descKey: "inventory.visGroupDesc" },
  DIRECT: { labelKey: "inventory.visDirect", icon: Send, descKey: "inventory.visDirectDesc" },
};

export default function InventoryPage() {
  const { t } = useTranslation();
  const { data: blocks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });
  const [editBlock, setEditBlock] = useState<any>(null);
  const [offerBlock, setOfferBlock] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-inventory-title">{t("inventory.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("inventory.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !blocks || blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t("inventory.noInventory")}</h3>
            <p className="text-muted-foreground max-w-sm">
              {t("inventory.noInventoryDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block: any) => (
            <InventoryCard
              key={block.id}
              block={block}
              onEdit={() => setEditBlock(block)}
              onOffer={() => setOfferBlock(block)}
            />
          ))}
        </div>
      )}

      {editBlock && (
        <EditBlockDialog block={editBlock} onClose={() => setEditBlock(null)} />
      )}

      {offerBlock && (
        <DirectOfferDialog block={offerBlock} onClose={() => setOfferBlock(null)} />
      )}
    </div>
  );
}

function InventoryCard({ block, onEdit, onOffer }: { block: any; onEdit: () => void; onOffer: () => void }) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const toggleMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/inventory/${block.id}`, { isListed: !block.isListed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: block.isListed ? t("inventory.blockHidden") : t("inventory.blockListed") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: async (vis: string) => {
      const data: any = { visibility: vis };
      if (vis !== "DIRECT") data.assignedAgentId = null;
      if (vis === "PUBLIC" || vis === "PRIVATE") data.isListed = true;
      await apiRequest("PATCH", `/api/inventory/${block.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: t("inventory.visibilityUpdated") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const handleVisibilityChange = (vis: string) => {
    if (vis === "DIRECT") {
      onOffer();
    } else {
      visibilityMutation.mutate(vis);
    }
  };

  const agentPrice = parseFloat(block.agentPrice || "0");
  const markupLabel = block.markupType === "PERCENTAGE"
    ? `+${block.markupPercentage}%`
    : `+$${parseFloat(block.markupAmount || "0").toFixed(2)}`;

  const vis = visibilityConfig[block.visibility || "PUBLIC"];
  const VisIcon = vis?.icon || Globe;

  return (
    <Card className="glass-card text-inherit" data-testid={`card-block-${block.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5">
              <RoomTypeIcon roomType={block.auction?.roomType || "Room"} className="w-4 h-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-base">{block.auction?.roomType || "Room"} Block</CardTitle>
            </div>
            <CardDescription className="mt-1 flex items-center gap-1 tracking-tight">
              {block.auction?.hotel?.businessName || "Hotel"}
              {block.auction?.hotel?.isVerified && (
                <BadgeCheck className="w-4 h-4 !text-gold shrink-0" strokeWidth={2} data-testid={`icon-verified-${block.id}`} />
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={block.isListed ? "default" : "secondary"} data-testid={`badge-status-${block.id}`}>
              {block.isListed ? t("inventory.listed") : t("inventory.hidden")}
            </Badge>
            <Badge variant="outline" data-testid={`badge-visibility-${block.id}`}>
              <VisIcon className="w-3 h-3 me-1" />
              {vis ? t(vis.labelKey) : t("inventory.visPublic")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-muted-foreground">{t("inventory.wonAt")} <span className="font-mono tabular-nums">{formatPrice(block.winningPrice)}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <RoomTypeIcon roomType={block.auction?.roomType || "Room"} className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground" data-testid={`text-available-${block.id}`}>{block.availableQuantity}/{block.auction?.quantity || 0} rooms</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={`w-4 h-4 !text-gold shrink-0${Number(block.auction?.distance || 0) < 500 ? " animate-pulse" : ""}`} strokeWidth={1.5} />
            <span className="text-muted-foreground">{block.auction?.distance || 0}m</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-muted-foreground">{t("inventory.markup")}: {markupLabel}</span>
          </div>
        </div>

        <div className="rounded-md bg-muted p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("inventory.agentPrice")} (excl. VAT)</span>
            <span className="text-lg font-bold font-mono tabular-nums price-glow" data-testid={`text-agent-price-${block.id}`}>{formatPrice(agentPrice)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>VAT (15%): {formatPrice(block.vatPerRoom || "0")}</span>
            <span>incl. VAT: {formatPrice(block.priceWithVat || "0")}</span>
          </div>
          {block.ministryBrn && (
            <p className="text-xs text-green-500 mt-1">BRN: {block.ministryBrn}</p>
          )}
          {block.totalBooked > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{block.totalBooked} room(s) booked</p>
          )}
          {block.pendingOffers > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{block.pendingOffers} pending offer(s)</p>
          )}
          {block.releasedAt ? (
            <div className="flex items-center gap-1.5 mt-1">
              <RotateCcw className="w-3.5 h-3.5 text-destructive shrink-0" strokeWidth={1.5} />
              <p className="text-xs text-destructive font-medium" data-testid={`text-released-${block.id}`}>{t("inventory.released")}</p>
            </div>
          ) : block.releaseDeadline ? (
            <ReleaseCountdown deadline={block.releaseDeadline} blockId={block.id} />
          ) : null}
        </div>

        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch
                checked={block.isListed}
                onCheckedChange={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending || block.availableQuantity === 0 || !!block.releasedAt}
                data-testid={`switch-list-${block.id}`}
              />
              <Label className="text-sm cursor-pointer">
                {block.isListed ? t("inventory.published") : t("inventory.hidden")}
              </Label>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Select
                value={block.visibility || "PUBLIC"}
                onValueChange={handleVisibilityChange}
                disabled={visibilityMutation.isPending}
              >
                <SelectTrigger className="w-[130px]" data-testid={`select-visibility-${block.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Public
                    </span>
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Group Only
                    </span>
                  </SelectItem>
                  <SelectItem value="DIRECT">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Direct
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" onClick={onEdit} disabled={!!block.releasedAt} data-testid={`button-edit-${block.id}`}>
              <Settings2 className="w-3.5 h-3.5 me-1" />
              {t("inventory.markup")}
            </Button>
            {block.availableQuantity > 0 && !block.releasedAt && block.visibility === "DIRECT" && (
              <Button size="sm" variant="outline" onClick={onOffer} data-testid={`button-offer-${block.id}`}>
                <Send className="w-3.5 h-3.5 me-1" />
                {t("inventory.sendOffer")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditBlockDialog({ block, onClose }: { block: any; onClose: () => void }) {
  const { t } = useTranslation();
  const [markupType, setMarkupType] = useState<string>(block.markupType || "FIXED");
  const [markupAmount, setMarkupAmount] = useState(block.markupAmount || "0");
  const [markupPercentage, setMarkupPercentage] = useState(block.markupPercentage || "0");
  const { toast } = useToast();

  const winningPrice = parseFloat(block.winningPrice);
  const previewPrice = markupType === "PERCENTAGE"
    ? winningPrice + (winningPrice * parseFloat(markupPercentage || "0") / 100)
    : winningPrice + parseFloat(markupAmount || "0");

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/inventory/${block.id}`, {
        markupType,
        markupAmount: markupType === "FIXED" ? markupAmount : "0",
        markupPercentage: markupType === "PERCENTAGE" ? markupPercentage : "0",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: t("inventory.markupUpdated") });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("inventory.editMarkup")}</DialogTitle>
          <DialogDescription>
            Set your markup on the winning price of ${winningPrice.toFixed(2)} per room.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("inventory.markupType")}</Label>
            <Select value={markupType} onValueChange={setMarkupType}>
              <SelectTrigger data-testid="select-markup-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" /> {t("inventory.fixedAmount")}
                  </span>
                </SelectItem>
                <SelectItem value="PERCENTAGE">
                  <span className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5" /> {t("inventory.percentage")}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {markupType === "FIXED" ? (
            <div className="space-y-2">
              <Label>{t("inventory.markupAmount")}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={markupAmount}
                onChange={(e) => setMarkupAmount(e.target.value)}
                data-testid="input-markup-amount"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("inventory.markupPercentage")}</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={markupPercentage}
                onChange={(e) => setMarkupPercentage(e.target.value)}
                data-testid="input-markup-percentage"
              />
            </div>
          )}

          <div className="rounded-md bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("inventory.winningPrice")}</span>
              <span>${winningPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("inventory.markup")}</span>
              <span>
                {markupType === "PERCENTAGE"
                  ? `${markupPercentage}% (+$${(winningPrice * parseFloat(markupPercentage || "0") / 100).toFixed(2)})`
                  : `+$${parseFloat(markupAmount || "0").toFixed(2)}`
                }
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>{t("inventory.agentPrice")}</span>
              <span data-testid="text-preview-price">${previewPrice.toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" className="w-full bg-gold text-gold-foreground border-gold gold-glow" disabled={mutation.isPending} data-testid="button-save-markup">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("inventory.saveMarkup")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DirectOfferDialog({ block, onClose }: { block: any; onClose: () => void }) {
  const { t } = useTranslation();
  const [agentId, setAgentId] = useState("");
  const [pricePerRoom, setPricePerRoom] = useState(block.agentPrice || "0");
  const [roomCount, setRoomCount] = useState("1");
  const { toast } = useToast();

  const { data: groupAgents, isLoading: loadingGroup } = useQuery<any[]>({
    queryKey: ["/api/broker/group"],
  });

  const rooms = Math.max(1, Math.min(parseInt(roomCount || "1"), block.availableQuantity));
  const total = parseFloat(pricePerRoom || "0") * rooms;

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/direct-offers", {
        blockId: block.id,
        agentId,
        pricePerRoom,
        roomCount: rooms,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/direct-offers/broker"] });
      toast({ title: t("inventory.offerSent"), description: t("inventory.offerSentDesc") });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("inventory.sendDirectOffer")}</DialogTitle>
          <DialogDescription>
            {t("inventory.sendOfferDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("inventory.selectAgent")}</Label>
            {loadingGroup ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger data-testid="select-offer-agent">
                  <SelectValue placeholder={t("inventory.chooseAgent")} />
                </SelectTrigger>
                <SelectContent>
                  {(groupAgents || []).map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(!groupAgents || groupAgents.length === 0) && !loadingGroup && (
              <p className="text-xs text-muted-foreground">
                {t("inventory.noAgentsInGroup")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("inventory.pricePerRoom")}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={pricePerRoom}
              onChange={(e) => setPricePerRoom(e.target.value)}
              data-testid="input-offer-price"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("inventory.numberOfRooms")}</Label>
            <Input
              type="number"
              min="1"
              max={block.availableQuantity}
              value={roomCount}
              onChange={(e) => setRoomCount(e.target.value)}
              data-testid="input-offer-rooms"
            />
            <p className="text-xs text-muted-foreground">{block.availableQuantity} {t("inventory.available")}</p>
          </div>

          <div className="rounded-md bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Room Type</span>
              <span>{block.auction?.roomType || "Room"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("inventory.yourCost")}</span>
              <span className="font-mono tabular-nums">${block.winningPrice}/room</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("inventory.offerPrice")}</span>
              <span className="font-mono tabular-nums">${parseFloat(pricePerRoom || "0").toFixed(2)}/room</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>{t("inventory.totalOfferValue")}</span>
              <span className="font-mono tabular-nums" data-testid="text-offer-total">${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gold text-gold-foreground border-gold gold-glow"
            disabled={mutation.isPending || !agentId}
            data-testid="button-send-offer"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("inventory.sendOffer")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
