import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Auction, Bid } from "@shared/schema";
import {
  Plus,
  Clock,
  MapPin,
  BedDouble,
  DollarSign,
  Gavel,
  Loader2,
  Timer,
  ArrowUp,
  Radio,
  ClipboardList,
  Users,
  UsersRound,
  LayoutGrid,
  User,
  BadgeCheck,
} from "lucide-react";
import { format, isPast } from "date-fns";

function RoomTypeIcon({ roomType, className }: { roomType: string; className?: string }) {
  const type = roomType?.toLowerCase() || "";
  if (type.includes("single")) return <User className={className} strokeWidth={1.5} />;
  if (type.includes("double")) return <Users className={className} strokeWidth={1.5} />;
  if (type.includes("triple")) return <UsersRound className={className} strokeWidth={1.5} />;
  if (type.includes("quad")) return <LayoutGrid className={className} strokeWidth={1.5} />;
  return <BedDouble className={className} strokeWidth={1.5} />;
}

function CountdownTimer({ endTime, onExpired }: { endTime: string; onExpired?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    function update() {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(t("auctions.ended"));
        setIsUrgent(false);
        onExpired?.();
        return false;
      }

      setIsUrgent(diff <= 60000);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (n: number) => n.toString().padStart(2, "0");

      if (days > 0) {
        setTimeLeft(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else if (hours > 0) {
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeft(`${pad(minutes)}:${pad(seconds)}`);
      }
      return true;
    }

    if (!update()) return;

    const interval = setInterval(() => {
      if (!update()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpired]);

  return (
    <span
      className={`font-mono tabular-nums ${isUrgent ? "!text-destructive font-bold animate-pulse" : "!text-gold font-bold"}`}
      data-testid="text-countdown"
    >
      {timeLeft}
    </span>
  );
}

function AuctionStatusBadge({ status, endTime }: { status: string; endTime: string }) {
  const { t } = useTranslation();
  const isExpired = isPast(new Date(endTime));
  const isLive = status === "ACTIVE" && !isExpired;

  if (isLive) {
    return (
      <Badge data-testid="badge-auction-status" className="gap-1">
        <Radio className="w-3 h-3 animate-pulse" />
        {t("auctions.live")}
      </Badge>
    );
  }

  const displayStatus = status === "ACTIVE" && isExpired ? "ENDED" : status;
  if (displayStatus === "EXPIRED") {
    return <Badge variant="destructive" className="bg-orange-500/20 text-orange-400 border-orange-500/30" data-testid="badge-auction-status">EXPIRED</Badge>;
  }
  const variant = displayStatus === "ENDED" ? "secondary" : "destructive";
  return <Badge variant={variant} data-testid="badge-auction-status">{displayStatus}</Badge>;
}

function AuctionCard({ auction, userRole, onBid, onClose, onRoomingList }: {
  auction: Auction & { bids?: Bid[]; hotel?: { businessName: string; isVerified?: boolean }; bidCount?: number; highestBid?: string };
  userRole: string;
  onBid?: (auctionId: string) => void;
  onClose?: (auctionId: string) => void;
  onRoomingList?: (auctionId: string) => void;
}) {
  const { t } = useTranslation();
  const isActive = auction.status === "ACTIVE" && !isPast(new Date(auction.endTime));
  const isEnded = auction.status === "ENDED" || auction.status === "EXPIRED" || (auction.status === "ACTIVE" && isPast(new Date(auction.endTime)));

  return (
    <Card className="glass-card hover-elevate text-inherit" data-testid={`card-auction-${auction.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5">
              <RoomTypeIcon roomType={auction.roomType} className="w-4 h-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-base">{auction.roomType} {t("auctions.room")}</CardTitle>
            </div>
            <CardDescription className="mt-1 flex items-center gap-1 tracking-tight">
              {auction.hotel?.businessName || "Hotel"}
              {auction.hotel?.isVerified && (
                <BadgeCheck className="w-4 h-4 !text-gold shrink-0" strokeWidth={2} data-testid={`icon-verified-${auction.id}`} />
              )}
            </CardDescription>
          </div>
          <AuctionStatusBadge status={auction.status} endTime={auction.endTime as unknown as string} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={`w-4 h-4 !text-gold shrink-0${Number(auction.distance) < 500 ? " animate-pulse" : ""}`} strokeWidth={1.5} />
            <span className="text-muted-foreground">{auction.distance}m {t("auctions.toHaram")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <RoomTypeIcon roomType={auction.roomType} className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{auction.quantity} {t("auctions.rooms")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-muted-foreground">{t("auctions.floor")}: <span className="font-mono tabular-nums">${auction.floorPrice}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Timer className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            {isActive ? (
              <CountdownTimer endTime={auction.endTime as unknown as string} />
            ) : (
              <span className="text-muted-foreground">{t("auctions.ended")}</span>
            )}
          </div>
        </div>

        {(auction.bidCount !== undefined || auction.highestBid) && (
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Gavel className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-muted-foreground">{auction.bidCount ?? 0} {t("auctions.bids")}</span>
            </div>
            {auction.highestBid && (
              <div className="flex items-center gap-1 text-sm font-medium !text-gold price-glow" data-testid={`text-highest-bid-${auction.id}`}>
                <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="font-mono tabular-nums">${auction.highestBid}</span>
              </div>
            )}
          </div>
        )}

        {userRole === "BROKER" && isActive && onBid && (
          <Button
            className="w-full bg-gold text-gold-foreground border-gold gold-glow"
            onClick={() => onBid(auction.id)}
            data-testid={`button-bid-${auction.id}`}
          >
            <Gavel className="w-4 h-4 me-2" />
            {t("auctions.placeBid")}
          </Button>
        )}

        {userRole === "HOTEL" && auction.status === "ACTIVE" && onClose && (
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => onClose(auction.id)}
            data-testid={`button-close-${auction.id}`}
          >
            <Clock className="w-4 h-4 me-2" />
            {t("auctions.closeListing")}
          </Button>
        )}

        {userRole === "HOTEL" && isEnded && onRoomingList && (
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => onRoomingList(auction.id)}
              data-testid={`button-rooming-list-${auction.id}`}
            >
              <ClipboardList className="w-4 h-4 me-2" />
              {t("auctions.viewRoomingList")}
            </Button>
            <BrnInput auctionId={auction.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BrnInput({ auctionId }: { auctionId: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [brn, setBrn] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: blockData } = useQuery<any>({
    queryKey: ["/api/hotel/auction", auctionId, "block"],
    queryFn: async () => {
      const res = await fetch(`/api/hotel/auction/${auctionId}/block`, { credentials: "include" });
      return res.json();
    },
  });

  const blockId = blockData?.blockId;
  const existingBrn = blockData?.ministryBrn;

  const handleSaveBrn = async () => {
    if (!blockId || !brn.trim()) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/hotel/blocks/${blockId}/brn`, { brn: brn.trim() });
      toast({ title: "BRN Updated", description: "Ministry BRN has been assigned to this block." });
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/auction", auctionId, "block"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!blockId) return null;

  if (existingBrn) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-500" data-testid={`brn-assigned-${auctionId}`}>
        <Badge variant="outline" className="text-green-500 border-green-500">BRN: {existingBrn}</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" data-testid={`brn-input-${auctionId}`}>
      <Input
        placeholder="Ministry BRN Code"
        value={brn}
        onChange={(e) => setBrn(e.target.value)}
        className="text-sm h-8"
        data-testid={`input-brn-${auctionId}`}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={handleSaveBrn}
        disabled={saving || !brn.trim()}
        data-testid={`button-save-brn-${auctionId}`}
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Set BRN"}
      </Button>
    </div>
  );
}

function CreateAuctionDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [roomType, setRoomType] = useState("");
  const [distance, setDistance] = useState("");
  const [quantity, setQuantity] = useState("");
  const [floorPrice, setFloorPrice] = useState("");
  const defaultEndTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  };
  const [endTime, setEndTime] = useState(defaultEndTime());
  const { toast } = useToast();
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/auctions", data);
    },
    onSuccess: () => {
      toast({ title: t("auctions.listingCreated") });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setOpen(false);
      setRoomType("");
      setDistance("");
      setQuantity("");
      setFloorPrice("");
      setEndTime(defaultEndTime());
      onCreated();
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endTime) {
      toast({ title: t("common.error"), description: t("auctions.selectEndTime"), variant: "destructive" });
      return;
    }
    const parsedDate = new Date(endTime);
    if (isNaN(parsedDate.getTime())) {
      toast({ title: t("common.error"), description: t("auctions.invalidDateTime"), variant: "destructive" });
      return;
    }
    mutation.mutate({
      roomType,
      distance: parseInt(distance),
      quantity: parseInt(quantity),
      floorPrice,
      endTime: parsedDate.toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gold text-gold-foreground border-gold gold-glow" data-testid="button-create-auction">
          <Plus className="w-4 h-4 me-2" />
          {t("auctions.newListing")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("auctions.createWholesaleListing")}</DialogTitle>
          <DialogDescription>{t("auctions.listBlockDesc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("auctions.roomType")}</Label>
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger data-testid="select-room-type">
                <SelectValue placeholder={t("auctions.selectType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Quad">{t("auctions.roomQuad")}</SelectItem>
                <SelectItem value="Triple">{t("auctions.roomTriple")}</SelectItem>
                <SelectItem value="Double">{t("auctions.roomDouble")}</SelectItem>
                <SelectItem value="Single">{t("auctions.roomSingle")}</SelectItem>
                <SelectItem value="Suite">{t("auctions.roomSuite")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("auctions.distanceToHaram")}</Label>
              <Input
                type="number"
                placeholder="e.g. 200"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                required
                data-testid="input-distance"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auctions.numberOfRooms")}</Label>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                data-testid="input-quantity"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("auctions.floorPrice")}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 150.00"
                value={floorPrice}
                onChange={(e) => setFloorPrice(e.target.value)}
                required
                data-testid="input-floor-price"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auctions.listingEndTime")}</Label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                data-testid="input-end-time"
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-gold text-gold-foreground border-gold gold-glow" disabled={mutation.isPending} data-testid="button-submit-auction">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auctions.createListing")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BidDialog({ auctionId, floorPrice, highestBid, onClose }: {
  auctionId: string; floorPrice: string; highestBid?: string; onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: async (data: { auctionId: string; amount: string }) => {
      await apiRequest("POST", "/api/bids", data);
    },
    onSuccess: () => {
      toast({ title: t("auctions.bidPlaced") });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const minBid = highestBid ? parseFloat(highestBid) + 1 : parseFloat(floorPrice);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("auctions.placeYourBid")}</DialogTitle>
          <DialogDescription>
            {t("auctions.minimumBid")}: ${minBid.toFixed(2)}
            {highestBid && ` (${t("auctions.currentHighest")}: $${highestBid})`}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ auctionId, amount });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>{t("auctions.yourBidAmount")}</Label>
            <Input
              type="number"
              step="0.01"
              min={minBid}
              placeholder={`Min $${minBid.toFixed(2)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              data-testid="input-bid-amount"
            />
          </div>
          <Button type="submit" className="w-full bg-gold text-gold-foreground border-gold gold-glow" disabled={mutation.isPending} data-testid="button-submit-bid">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auctions.confirmBid")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoomingListDialog({ auctionId, onClose }: { auctionId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/hotel/rooming-list", auctionId],
    queryFn: async () => {
      const res = await fetch(`/api/hotel/rooming-list/${auctionId}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
  });

  const totalPilgrims = data?.entries?.reduce((sum: number, e: any) => sum + e.pilgrims.length, 0) || 0;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-rooming-list-title">{t("auctions.roomingList")}</DialogTitle>
          <DialogDescription>
            {data ? `${data.auction.roomType} - ${data.auction.quantity} ${t("auctions.rooms")} | ${totalPilgrims} ${t("auctions.pilgrimsRegistered")}` : t("auctions.loading")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !data?.entries || data.entries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("auctions.noPilgrims")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.entries.map((entry: any) => (
              <div key={entry.bookingId} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm font-medium">
                    {t("auctions.agent")}: {entry.agentName}
                  </div>
                  <Badge variant="secondary">{entry.roomCount} {t("auctions.roomsLabel")}</Badge>
                </div>
                {entry.pilgrims.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>{t("auctions.fullName")}</TableHead>
                          <TableHead>{t("auctions.passportNo")}</TableHead>
                          <TableHead>{t("auctions.nationality")}</TableHead>
                          <TableHead>{t("auctions.gender")}</TableHead>
                          <TableHead>{t("auctions.visaNumber")}</TableHead>
                          <TableHead>{t("auctions.vaccinated")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.pilgrims.map((p: any, i: number) => (
                          <TableRow key={i} data-testid={`row-pilgrim-${entry.bookingId}-${i}`}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium">{p.fullName}</TableCell>
                            <TableCell>{p.passportNo}</TableCell>
                            <TableCell>{p.nationality || "—"}</TableCell>
                            <TableCell>{p.gender}</TableCell>
                            <TableCell>{p.visaNumber || "—"}</TableCell>
                            <TableCell>{p.vaccinationStatus || "No"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("auctions.noPilgrims")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AuctionsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [biddingAuction, setBiddingAuction] = useState<{ id: string; floorPrice: string; highestBid?: string } | null>(null);
  const [roomingListAuction, setRoomingListAuction] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: auctions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/auctions"],
    refetchInterval: 30000,
  });

  const handleWSMessage = useCallback((msg: any) => {
    if (msg.type === "bid_placed" || msg.type === "auction_extended" || msg.type === "auction_ended" || msg.type === "auction_settled") {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    }

    if (msg.type === "bid_placed") {
      toast({ title: t("auctions.newBidPlaced"), description: `$${msg.amount} ${t("auctions.onAuction")}` });
    }

    if (msg.type === "auction_extended") {
      toast({ title: t("auctions.auctionExtended"), description: t("auctions.antiSniping") });
    }

    if (msg.type === "auction_ended") {
      toast({ title: t("auctions.auctionEnded"), description: t("auctions.auctionClosed") });
    }
  }, [toast, t]);

  useWebSocket(handleWSMessage);

  const closeMutation = useMutation({
    mutationFn: async (auctionId: string) => {
      await apiRequest("POST", `/api/auctions/${auctionId}/close`);
    },
    onSuccess: () => {
      toast({ title: t("auctions.listingClosed") });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-auctions-title">
            {user.role === "HOTEL" ? t("auctions.wholesaleListings") : user.role === "ADMIN" ? t("auctions.allAuctions") : t("auctions.liveAuctions")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user.role === "HOTEL"
              ? t("auctions.manageInventory")
              : user.role === "BROKER"
                ? t("auctions.browseAndBid")
                : t("auctions.overviewAllAuctions")}
          </p>
        </div>
        {user.role === "HOTEL" && <CreateAuctionDialog onCreated={() => {}} />}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !auctions || auctions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Gavel className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{user.role === "HOTEL" ? t("auctions.noListings") : t("auctions.noAuctions")}</h3>
            <p className="text-muted-foreground max-w-sm">
              {user.role === "HOTEL"
                ? t("auctions.noListingsDesc")
                : t("auctions.noAuctionsDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction: any) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              userRole={user.role}
              onBid={(id) =>
                setBiddingAuction({
                  id,
                  floorPrice: auction.floorPrice,
                  highestBid: auction.highestBid,
                })
              }
              onClose={(id) => closeMutation.mutate(id)}
              onRoomingList={(id) => setRoomingListAuction(id)}
            />
          ))}
        </div>
      )}

      {biddingAuction && (
        <BidDialog
          auctionId={biddingAuction.id}
          floorPrice={biddingAuction.floorPrice}
          highestBid={biddingAuction.highestBid}
          onClose={() => setBiddingAuction(null)}
        />
      )}

      {roomingListAuction && (
        <RoomingListDialog
          auctionId={roomingListAuction}
          onClose={() => setRoomingListAuction(null)}
        />
      )}
    </div>
  );
}
