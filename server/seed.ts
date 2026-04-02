import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { users, storefronts, pilgrimBookings } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existingAdmin = await storage.getUserByEmail("admin@phxcore.com");
  if (existingAdmin) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  const adminPassword = await hashPassword("admin123");
  const hotelPassword = await hashPassword("hotel123");
  const brokerPassword = await hashPassword("broker123");
  const agentPassword = await hashPassword("agent123");

  const admin = await storage.createUser({
    email: "admin@phxcore.com",
    password: adminPassword,
    role: "ADMIN",
    businessName: "PHX Administration",
  });

  const hotel1 = await storage.createUser({
    email: "almadinah@hotel.com",
    password: hotelPassword,
    role: "HOTEL",
    businessName: "Al Madinah Grand Hotel",
  });

  const hotel2 = await storage.createUser({
    email: "haramview@hotel.com",
    password: hotelPassword,
    role: "HOTEL",
    businessName: "Haram View Suites",
  });

  const broker1 = await storage.createUser({
    email: "summit@broker.com",
    password: brokerPassword,
    role: "BROKER",
    businessName: "Summit Travel Group",
  });

  const broker2 = await storage.createUser({
    email: "crescent@broker.com",
    password: brokerPassword,
    role: "BROKER",
    businessName: "Crescent Hajj Services",
  });

  const agent1 = await storage.createUser({
    email: "alnoor@agent.com",
    password: agentPassword,
    role: "AGENT",
    businessName: "Al Noor Travel Agency",
  });

  const agent2 = await storage.createUser({
    email: "safar@agent.com",
    password: agentPassword,
    role: "AGENT",
    businessName: "Safar Pilgrim Services",
  });

  const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const futureDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const futureDate3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const auction1 = await storage.createAuction(hotel1.id, {
    roomType: "Quad",
    distance: 150,
    quantity: 20,
    floorPrice: "120.00",
    endTime: futureDate1 as any,
  });

  const auction2 = await storage.createAuction(hotel1.id, {
    roomType: "Double",
    distance: 300,
    quantity: 15,
    floorPrice: "200.00",
    endTime: futureDate2 as any,
  });

  const auction3 = await storage.createAuction(hotel2.id, {
    roomType: "Triple",
    distance: 100,
    quantity: 10,
    floorPrice: "180.00",
    endTime: futureDate3 as any,
  });

  const auction4 = await storage.createAuction(hotel2.id, {
    roomType: "Suite",
    distance: 50,
    quantity: 5,
    floorPrice: "450.00",
    endTime: pastDate as any,
  });

  await storage.createBid(broker1.id, { auctionId: auction1.id, amount: "125.00" });
  await storage.createBid(broker2.id, { auctionId: auction1.id, amount: "130.00" });
  await storage.createBid(broker1.id, { auctionId: auction1.id, amount: "140.00" });

  await storage.createBid(broker1.id, { auctionId: auction2.id, amount: "210.00" });
  await storage.createBid(broker2.id, { auctionId: auction2.id, amount: "220.00" });

  await storage.createBid(broker2.id, { auctionId: auction3.id, amount: "190.00" });
  await storage.createBid(broker1.id, { auctionId: auction3.id, amount: "200.00" });

  await storage.createBid(broker1.id, { auctionId: auction4.id, amount: "500.00" });

  const wonBlock1 = await storage.createWonBlock({
    auctionId: auction4.id,
    brokerId: broker1.id,
    winningPrice: "500.00",
    markupType: "FIXED",
    markupAmount: "50.00",
    markupPercentage: "0",
    availableQuantity: 5,
    isListed: true,
  });

  const booking1 = await storage.createBooking(agent1.id, {
    blockId: wonBlock1.id,
    totalPrice: "550.00",
  });

  await storage.createPilgrim({
    bookingId: booking1.id,
    fullName: "Ahmad Abdullah Al-Rashid",
    passportNo: "SA4821930",
    gender: "Male",
  });

  await storage.createPilgrim({
    bookingId: booking1.id,
    fullName: "Fatimah Hassan Al-Rashid",
    passportNo: "SA4821931",
    gender: "Female",
  });

  await storage.createEscrowForBooking(
    booking1.id, agent1.id, broker1.id, hotel2.id,
    "550.00"
  );

  await storage.updateHotelProfile(hotel1.id, { imageUrl: "/assets/hotel-makkah-grand.png", latitude: "21.4225", longitude: "39.8262", distanceFromHaram: 150 });
  await storage.updateHotelProfile(hotel2.id, { imageUrl: "/assets/hotel-medina-star.png", latitude: "21.4235", longitude: "39.8270", distanceFromHaram: 50 });

  await storage.updateUserVerification(agent1.id, true);
  await storage.updateUserVerification(agent2.id, true);
  await storage.updateUserVerification(broker1.id, true);
  await storage.updateUserVerification(hotel1.id, true);
  await storage.updateUserVerification(hotel2.id, true);

  const sf1 = await storage.createStorefront({
    agentId: agent1.id,
    slug: "al-noor-travel",
    agencyName: "Al Noor Travel Agency",
    agencyDescription: "Trusted Hajj & Umrah travel services since 2015. We provide comfortable accommodations near Al-Haram with full visa and transport support.",
    markupPercent: "12.00",
  });

  await storage.createStorefront({
    agentId: agent2.id,
    slug: "safar-pilgrim",
    agencyName: "Safar Pilgrim Services",
    agencyDescription: "Premium pilgrim accommodation packages with dedicated group support.",
    markupPercent: "8.00",
  });

  const wonBlock2 = await storage.createWonBlock({
    auctionId: auction4.id,
    brokerId: broker1.id,
    winningPrice: "450.00",
    markupType: "PERCENTAGE",
    markupAmount: "0",
    markupPercentage: "10",
    availableQuantity: 8,
    isListed: true,
    visibility: "PUBLIC",
  });

  await db.insert(pilgrimBookings).values([
    {
      storefrontId: sf1.id,
      blockId: wonBlock1.id,
      agentId: agent1.id,
      bookingRef: "PHX-2026-00001",
      fullName: "Mohammed Ibrahim Al-Qasimi",
      citizenship: "SAU",
      passportNumber: "SA9283710",
      dob: "1985-03-15",
      passportExpiry: "2028-06-20",
      nusukId: "1029384756",
      roomCount: 2,
      basePricePerRoom: "550.00",
      markupAmount: "132.00",
      finalPricePaid: "1232.00",
      vatAmount: "184.80",
      totalWithVat: "1416.80",
      visaNumber: "V-2026-88201",
      visaStatus: "ISSUED",
      nusukSynced: true,
      nusukSyncedAt: new Date(),
    },
    {
      bookingRef: "PHX-2026-00002",
      storefrontId: sf1.id,
      blockId: wonBlock1.id,
      agentId: agent1.id,
      fullName: "Aisha Binti Rahman",
      citizenship: "MYS",
      passportNumber: "MY7382901",
      dob: "1990-11-22",
      passportExpiry: "2029-01-15",
      nusukId: "5647382910",
      roomCount: 1,
      basePricePerRoom: "550.00",
      markupAmount: "66.00",
      finalPricePaid: "616.00",
      vatAmount: "92.40",
      totalWithVat: "708.40",
      visaNumber: "V-2026-88202",
      visaStatus: "ISSUED",
      nusukSynced: true,
      nusukSyncedAt: new Date(),
    },
    {
      bookingRef: "PHX-2026-00003",
      storefrontId: sf1.id,
      blockId: wonBlock2.id,
      agentId: agent1.id,
      fullName: "Yusuf Ali Khan",
      citizenship: "PAK",
      passportNumber: "PK1928374",
      dob: "1978-07-08",
      passportExpiry: "2027-09-30",
      nusukId: "7483920156",
      roomCount: 1,
      basePricePerRoom: "495.00",
      markupAmount: "59.40",
      finalPricePaid: "554.40",
      vatAmount: "83.16",
      totalWithVat: "637.56",
      visaStatus: "PENDING",
    },
    {
      bookingRef: "PHX-2026-00004",
      storefrontId: sf1.id,
      blockId: wonBlock2.id,
      agentId: agent1.id,
      fullName: "Halimah Osman Jama",
      citizenship: "SOM",
      passportNumber: "SO3847291",
      dob: "1992-04-18",
      passportExpiry: "2028-03-12",
      nusukId: "2938475610",
      roomCount: 3,
      basePricePerRoom: "495.00",
      markupAmount: "178.20",
      finalPricePaid: "1663.20",
      vatAmount: "249.48",
      totalWithVat: "1912.68",
      visaStatus: "PENDING",
    },
    {
      bookingRef: "PHX-2026-00005",
      storefrontId: sf1.id,
      blockId: wonBlock1.id,
      agentId: agent1.id,
      fullName: "Abdulrahman Saleh Nasser",
      citizenship: "EGY",
      passportNumber: "EG5829103",
      dob: "1965-12-01",
      passportExpiry: "2027-05-14",
      nusukId: "8192034756",
      roomCount: 1,
      basePricePerRoom: "550.00",
      markupAmount: "66.00",
      finalPricePaid: "616.00",
      vatAmount: "92.40",
      totalWithVat: "708.40",
      visaNumber: "V-2026-88205",
      visaStatus: "ISSUED",
      nusukSynced: true,
      nusukSyncedAt: new Date(),
    },
    {
      bookingRef: "PHX-2026-00006",
      storefrontId: sf1.id,
      blockId: wonBlock1.id,
      agentId: agent1.id,
      fullName: "Müller Böhm-Straße",
      citizenship: "DEU",
      passportNumber: "DE8374019",
      dob: "1988-02-14",
      passportExpiry: "2026-08-15",
      nusukId: "6019283745",
      roomCount: 1,
      basePricePerRoom: "550.00",
      markupAmount: "66.00",
      finalPricePaid: "616.00",
      vatAmount: "92.40",
      totalWithVat: "708.40",
      visaStatus: "PENDING",
    },
    {
      bookingRef: "PHX-2026-00007",
      storefrontId: sf1.id,
      blockId: wonBlock2.id,
      agentId: agent1.id,
      fullName: "José María García-López",
      citizenship: "ESP",
      passportNumber: "ES9201837",
      dob: "1975-09-03",
      passportExpiry: "2028-11-20",
      nusukId: "3847201956",
      roomCount: 2,
      basePricePerRoom: "495.00",
      markupAmount: "118.80",
      finalPricePaid: "1108.80",
      vatAmount: "166.32",
      totalWithVat: "1275.12",
      visaStatus: "PENDING",
    },
    {
      bookingRef: "PHX-2026-00008",
      storefrontId: sf1.id,
      blockId: wonBlock2.id,
      agentId: agent1.id,
      fullName: "Ahmad Hassan Al-Rashidi",
      citizenship: "KWT",
      passportNumber: "KW5501823",
      dob: "1990-06-22",
      passportExpiry: "2029-03-15",
      nusukId: "7712039485",
      roomCount: 1,
      basePricePerRoom: "495.00",
      markupAmount: "59.40",
      finalPricePaid: "554.40",
      vatAmount: "83.16",
      totalWithVat: "637.56",
      visaStatus: "PENDING",
      groupLeaderName: "Sheikh Omar Al-Farouq",
      groupLeaderPhone: "+965 9988 7766",
      groupLeaderEmail: "omar.alfarouq@hajjgroup.kw",
    },
    {
      bookingRef: "PHX-2026-00009",
      storefrontId: sf1.id,
      blockId: wonBlock2.id,
      agentId: agent1.id,
      fullName: "Fatima Zahra Binti Yusuf",
      citizenship: "MYS",
      passportNumber: "MY8834271",
      dob: "1985-11-08",
      passportExpiry: "2028-07-30",
      nusukId: "4458012379",
      roomCount: 1,
      basePricePerRoom: "495.00",
      markupAmount: "59.40",
      finalPricePaid: "554.40",
      vatAmount: "83.16",
      totalWithVat: "637.56",
      visaStatus: "PENDING",
      groupLeaderName: "Sheikh Omar Al-Farouq",
      groupLeaderPhone: "+965 9988 7766",
      groupLeaderEmail: "omar.alfarouq@hajjgroup.kw",
    },
  ]);

  console.log("Database seeded successfully!");
  console.log("Demo accounts:");
  console.log("  Admin: admin@phxcore.com / admin123");
  console.log("  Hotel: almadinah@hotel.com / hotel123");
  console.log("  Broker: summit@broker.com / broker123");
  console.log("  Agent: alnoor@agent.com / agent123 (has storefront at /s/al-noor-travel)");
  console.log("  Agent: safar@agent.com / agent123 (has storefront at /s/safar-pilgrim)");
}
