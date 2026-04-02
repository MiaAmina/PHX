import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { HotelDetailCard } from "@/components/hotel-detail-card";
import hotelPlaceholderImg from "@assets/hotel-placeholder.png";
import {
  Store,
  BedDouble,
  MapPin,
  DollarSign,
  BookOpen,
  Loader2,
  Building2,
  Users,
  UsersRound,
  LayoutGrid,
  User,
  BadgeCheck,
  Send,
  Check,
  X,
  Inbox,
  Footprints,
} from "lucide-react";

function RoomTypeIcon({ roomType, className }: { roomType: string; className?: string }) {
  const type = roomType?.toLowerCase() || "";
  if (type.includes("single")) return <User className={className} strokeWidth={1.5} />;
  if (type.includes("double")) return <Users className={className} strokeWidth={1.5} />;
  if (type.includes("triple")) return <UsersRound className={className} strokeWidth={1.5} />;
  if (type.includes("quad")) return <LayoutGrid className={className} strokeWidth={1.5} />;
  return <BedDouble className={className} strokeWidth={1.5} />;
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const { data: listings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/marketplace"],
  });
  const { data: offers, isLoading: offersLoading } = useQuery<any[]>({
    queryKey: ["/api/direct-offers/agent"],
  });
  const [bookingBlock, setBookingBlock] = useState<any>(null);
  const [detailHotel, setDetailHotel] = useState<{ hotelId: string; listing: any } | null>(null);

  const pendingOffers = (offers || []).filter((o: any) => o.status === "PENDING");
  const pastOffers = (offers || []).filter((o: any) => o.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-marketplace-title">{t("marketplace.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("marketplace.subtitle")}
        </p>
      </div>

      {pendingOffers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 !text-gold" />
            <h2 className="text-lg font-semibold">{t("marketplace.directOffers")}</h2>
            <Badge variant="default" data-testid="badge-pending-offers">{pendingOffers.length} {t("marketplace.pending")}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingOffers.map((offer: any) => (
              <DirectOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !listings || listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Store className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t("marketplace.noRooms")}</h3>
            <p className="text-muted-foreground max-w-sm">
              {t("marketplace.noRoomsDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pendingOffers.length > 0 && (
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{t("marketplace.marketplace")}</h2>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing: any) => (
              <MarketplaceCard
                key={listing.id}
                listing={listing}
                onBook={() => setBookingBlock(listing)}
                onViewHotel={() => listing.hotelId && setDetailHotel({ hotelId: listing.hotelId, listing })}
              />
            ))}
          </div>
        </>
      )}

      {pastOffers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("marketplace.pastOffers")}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pastOffers.map((offer: any) => (
              <DirectOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>
      )}

      {bookingBlock && (
        <BookingDialog block={bookingBlock} onClose={() => setBookingBlock(null)} />
      )}

      {detailHotel && (
        <HotelDetailCard
          hotelId={detailHotel.hotelId}
          open={!!detailHotel}
          onClose={() => setDetailHotel(null)}
          listing={detailHotel.listing}
        />
      )}
    </div>
  );
}

function DirectOfferCard({ offer }: { offer: any }) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const isPending = offer.status === "PENDING";

  const acceptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/direct-offers/${offer.id}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct-offers/agent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: t("marketplace.offerAccepted"), description: t("marketplace.bookingCreated") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/direct-offers/${offer.id}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct-offers/agent"] });
      toast({ title: t("marketplace.offerDeclined") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card className="glass-card text-inherit" data-testid={`card-offer-${offer.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5">
              <Send className="w-4 h-4 !text-gold shrink-0" />
              <CardTitle className="text-base">{t("marketplace.directOffer")}</CardTitle>
            </div>
            <CardDescription className="mt-1 tracking-tight">
              {t("marketplace.from")} {offer.brokerName}
            </CardDescription>
          </div>
          <Badge
            variant={isPending ? "default" : offer.status === "ACCEPTED" ? "default" : "secondary"}
            data-testid={`badge-offer-status-${offer.id}`}
          >
            {offer.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {offer.auction && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <RoomTypeIcon roomType={offer.auction.roomType} className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{offer.auction.roomType}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <span className="text-muted-foreground">{offer.auction.distance}m {t("auctions.toHaram")}</span>
            </div>
            {offer.auction.hotel && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <span className="text-muted-foreground">{offer.auction.hotel.businessName}</span>
              </div>
            )}
          </div>
        )}

        <div className="rounded-md bg-muted p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("marketplace.pricePerRoom")}</span>
            <span className="font-mono tabular-nums font-semibold">{formatPrice(offer.pricePerRoom)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("marketplace.rooms")}</span>
            <span>{offer.roomCount}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t pt-1.5">
            <span>{t("marketplace.total")}</span>
            <span className="font-mono tabular-nums price-glow" data-testid={`text-offer-total-${offer.id}`}>{formatPrice(offer.totalPrice)}</span>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              className="flex-1 bg-gold text-gold-foreground border-gold gold-glow"
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending || declineMutation.isPending}
              data-testid={`button-accept-offer-${offer.id}`}
            >
              {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 me-1" /> {t("marketplace.accept")}</>}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => declineMutation.mutate()}
              disabled={acceptMutation.isPending || declineMutation.isPending}
              data-testid={`button-decline-offer-${offer.id}`}
            >
              {declineMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 me-1" /> {t("marketplace.decline")}</>}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MarketplaceCard({ listing, onBook, onViewHotel }: { listing: any; onBook: () => void; onViewHotel: () => void }) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  return (
    <Card className="glass-card hover-elevate text-inherit" data-testid={`card-listing-${listing.id}`}>
      <div
        className="relative w-full h-32 bg-muted cursor-pointer"
        onClick={onViewHotel}
        data-testid={`img-listing-hotel-${listing.id}`}
      >
        <img
          src={listing.hotelImageUrl || hotelPlaceholderImg}
          alt={listing.hotelName}
          className="w-full h-32 object-cover rounded-t-lg"
          onError={(e) => { (e.target as HTMLImageElement).src = hotelPlaceholderImg; }}
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5">
              <RoomTypeIcon roomType={listing.roomType} className="w-4 h-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-base">{listing.roomType} Block</CardTitle>
            </div>
            <CardDescription
              className="mt-1 flex items-center gap-1 tracking-tight cursor-pointer hover:underline"
              onClick={onViewHotel}
              data-testid={`link-hotel-detail-${listing.id}`}
            >
              <Building2 className="w-3 h-3" strokeWidth={1.5} />
              {listing.hotelName}
              {listing.hotelVerified && (
                <BadgeCheck className="w-4 h-4 !text-gold shrink-0" strokeWidth={2} data-testid={`icon-verified-${listing.id}`} />
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" data-testid={`badge-rooms-${listing.id}`}>
              {listing.availableQuantity} {t("marketplace.rooms")}
            </Badge>
            {listing.hotelDistanceFromHaram && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-walking-${listing.id}`}>
                <Footprints className="w-3 h-3 me-1" />
                {listing.hotelDistanceFromHaram}m
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className={`w-4 h-4 !text-gold shrink-0${Number(listing.distance) < 500 ? " animate-pulse" : ""}`} strokeWidth={1.5} />
          <span className="text-muted-foreground">{listing.distance}m {t("auctions.toHaram")}</span>
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex items-end justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("marketplace.pricePerRoom")} (excl. VAT)</p>
              <p className="text-lg font-bold font-mono tabular-nums price-glow" data-testid={`text-price-${listing.id}`}>{formatPrice(listing.pricePerRoom)}</p>
            </div>
            <Button size="sm" className="bg-gold text-gold-foreground border-gold gold-glow shrink-0" onClick={onBook} data-testid={`button-book-${listing.id}`}>
              <BookOpen className="w-4 h-4 me-1.5" />
              {t("marketplace.bookNow")}
            </Button>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>VAT (15%): {formatPrice(listing.vatPerRoom)}</span>
            <span>incl. VAT: {formatPrice(listing.priceWithVat)}</span>
          </div>
          {!listing.hasBrn && (
            <p className="text-xs text-amber-500">BRN not yet assigned</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDialog({ block, onClose }: { block: any; onClose: () => void }) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [roomCount, setRoomCount] = useState("1");
  const { toast } = useToast();
  const pricePerRoom = parseFloat(block.pricePerRoom);
  const rooms = Math.max(1, Math.min(parseInt(roomCount || "1"), block.availableQuantity));
  const total = pricePerRoom * rooms;
  const vatTotal = total * 0.15;
  const totalWithVat = total + vatTotal;

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/bookings", {
        blockId: block.id,
        roomCount: rooms,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: t("marketplace.bookingConfirmed"), description: `${rooms} room(s) booked successfully.` });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: t("marketplace.bookingFailed"), description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("marketplace.bookRooms")}</DialogTitle>
          <DialogDescription>
            {block.roomType} - {block.distance}m {t("auctions.toHaram")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("marketplace.numberOfRooms")}</Label>
            <Input
              type="number"
              min="1"
              max={block.availableQuantity}
              value={roomCount}
              onChange={(e) => setRoomCount(e.target.value)}
              data-testid="input-room-count"
            />
            <p className="text-xs text-muted-foreground">
              {block.availableQuantity} {t("marketplace.roomsAvailable")}
            </p>
          </div>

          <div className="rounded-md bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("marketplace.roomType")}</span>
              <span className="font-medium">{block.roomType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("marketplace.hotel")}</span>
              <span className="font-medium">{block.hotelName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("marketplace.pricePerRoom")}</span>
              <span className="font-medium">{formatPrice(pricePerRoom)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("marketplace.rooms")}</span>
              <span className="font-medium">{rooms}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-1.5">
              <span className="text-muted-foreground">Subtotal (excl. VAT)</span>
              <span className="font-medium font-mono tabular-nums">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT (15%)</span>
              <span className="font-medium font-mono tabular-nums">{formatPrice(vatTotal)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">{t("marketplace.total")} (incl. VAT)</span>
            <span className="text-xl font-bold font-mono tabular-nums price-glow" data-testid="text-booking-total">{formatPrice(totalWithVat)}</span>
          </div>

          <Button type="submit" className="w-full bg-gold text-gold-foreground border-gold gold-glow" disabled={mutation.isPending} data-testid="button-confirm-booking">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Book ${rooms} Room(s)`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
