import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { storage } from "../storage";
import { config } from "../config";
import { Logger } from "../logger";

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  sellerName: string;
  sellerVat: string;
  sellerCr: string;
  buyerName: string;
  buyerVat: string;
  buyerCr: string;
  hotelName: string;
  ministryBrn: string | null;
  roomType: string;
  roomCount: number;
  pricePerRoom: string;
  subtotal: string;
  vatRate: string;
  vatAmount: string;
  totalWithVat: string;
  totalWithVatSAR: string;
  subtotalSAR: string;
  vatAmountSAR: string;
  currency: string;
  status: string;
  qrCodeDataUrl: string;
}

export class ZatcaBillingService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  buildTlvQrCode(sellerName: string, vatNumber: string, timestamp: string, totalWithVat: string, vatAmount: string): string {
    const fields = [
      { tag: 1, value: sellerName },
      { tag: 2, value: vatNumber },
      { tag: 3, value: timestamp },
      { tag: 4, value: totalWithVat },
      { tag: 5, value: vatAmount },
    ];
    const buffers: Buffer[] = [];
    for (const field of fields) {
      const valueBytes = Buffer.from(field.value, "utf-8");
      const tlv = Buffer.alloc(2 + valueBytes.length);
      tlv.writeUInt8(field.tag, 0);
      tlv.writeUInt8(valueBytes.length, 1);
      valueBytes.copy(tlv, 2);
      buffers.push(tlv);
    }
    return Buffer.concat(buffers).toString("base64");
  }

  async generateInvoiceData(bookingId: string, userId: string): Promise<InvoiceData> {
    const startTime = Date.now();

    const user = await storage.getUser(userId);
    if (!user) throw new Error("Unauthorized");

    const allBookings = await storage.getBookingsByAgent(user.role === "AGENT" ? user.id : "");
    let booking: any = null;
    if (user.role === "AGENT") {
      booking = allBookings.find((b: any) => b.id === bookingId);
    } else if (user.role === "ADMIN") {
      booking = await storage.getBookingWithFullDetails(bookingId, "");
    }
    if (!booking) throw new Error("Booking not found");

    const block = await storage.getWonBlock(booking.blockId);
    const auction = block ? await storage.getAuction(block.auctionId) : null;
    const hotel = auction ? await storage.getUser(auction.hotelId) : null;
    const agent = await storage.getUser(booking.agentId);

    const invoiceNum = booking.invoiceNumber || 0;
    const year = new Date(booking.createdAt).getFullYear();
    const formattedInvoice = `PHX-${year}-${String(invoiceNum).padStart(4, "0")}`;

    const sellerName = hotel?.businessName || "Hotel";
    const sellerVat = hotel?.vatNumber || "N/A";
    const sellerCr = hotel?.crNumber || "N/A";
    const buyerName = agent?.businessName || "Agent";
    const buyerVat = agent?.vatNumber || "N/A";
    const buyerCr = agent?.crNumber || "N/A";
    const timestamp = new Date(booking.createdAt).toISOString();
    const invoiceTotal = booking.totalWithVat || booking.totalPrice;
    const vatTotal = booking.vatAmount || "0.00";

    const tlvBase64 = this.buildTlvQrCode(sellerName, sellerVat, timestamp, String(invoiceTotal), String(vatTotal));

    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(tlvBase64, { width: 200 });
    } catch (qrErr) {
      await this.logger.error("ZatcaBillingService", "qr_generation_failed", "QR code generation failed", {
        entityId: bookingId, error: String(qrErr),
      });
    }

    const duration = Date.now() - startTime;
    await this.logger.info("ZatcaBillingService", "invoice_data_generated", `Invoice data generated for ${formattedInvoice}`, {
      entityId: bookingId, invoiceNumber: formattedInvoice,
    }, duration);

    return {
      invoiceNumber: formattedInvoice,
      date: booking.createdAt,
      sellerName,
      sellerVat,
      sellerCr,
      buyerName,
      buyerVat,
      buyerCr,
      hotelName: sellerName,
      ministryBrn: block?.ministryBrn || null,
      roomType: auction?.roomType || "Room",
      roomCount: booking.roomCount,
      pricePerRoom: (parseFloat(booking.totalPrice) / booking.roomCount).toFixed(2),
      subtotal: booking.totalPrice,
      vatRate: "15%",
      vatAmount: vatTotal,
      totalWithVat: invoiceTotal,
      totalWithVatSAR: invoiceTotal,
      subtotalSAR: booking.totalPrice,
      vatAmountSAR: vatTotal,
      currency: "SAR",
      status: booking.status,
      qrCodeDataUrl,
    };
  }

  async generateInvoicePdf(bookingId: string, userId: string): Promise<Buffer> {
    const startTime = Date.now();
    const invoiceData = await this.generateInvoiceData(bookingId, userId);

    const { sellerName, sellerVat, sellerCr, buyerName, buyerVat, buyerCr } = invoiceData;
    const timestamp = new Date(invoiceData.date).toISOString();
    const tlvBase64 = this.buildTlvQrCode(sellerName, sellerVat, timestamp, String(invoiceData.totalWithVat), String(invoiceData.vatAmount));

    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(tlvBase64, { width: 150, margin: 1 });
    } catch (qrErr) {
      await this.logger.error("ZatcaBillingService", "qr_pdf_generation_failed", "QR code generation failed for PDF", {
        entityId: bookingId, error: String(qrErr),
      });
    }

    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    doc.setFillColor(28, 37, 48);
    doc.rect(0, 0, pw, 45, "F");

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PHX EXCHANGE", 15, 20);

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("The Liquidity Layer for Hajj & Umrah", 15, 28);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ZATCA TAX INVOICE", 15, 40);

    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(`Invoice: ${invoiceData.invoiceNumber}`, pw - 15, 20, { align: "right" });
    doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pw - 15, 28, { align: "right" });

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", pw - 50, 31, 35, 35);
    }

    let y = 58;

    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, (pw - 35) / 2, 45, "F");
    doc.rect(15 + (pw - 35) / 2 + 5, y, (pw - 35) / 2, 45, "F");

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SELLER (HOTEL)", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.text(sellerName, 20, y + 17);
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`VAT: ${sellerVat}`, 20, y + 24);
    doc.text(`CR: ${sellerCr}`, 20, y + 31);
    if (invoiceData.ministryBrn) doc.text(`BRN: ${invoiceData.ministryBrn}`, 20, y + 38);

    const col2X = 15 + (pw - 35) / 2 + 10;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BUYER (AGENT)", col2X, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.text(buyerName, col2X, y + 17);
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`VAT: ${buyerVat}`, col2X, y + 24);
    doc.text(`CR: ${buyerCr}`, col2X, y + 31);

    y += 55;

    doc.setDrawColor(28, 37, 48);
    doc.setLineWidth(0.3);

    doc.setFillColor(28, 37, 48);
    doc.rect(15, y, pw - 30, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const colX = [20, 80, 105, 135, 165];
    doc.text("Description", colX[0], y + 7);
    doc.text("Qty", colX[1], y + 7);
    doc.text("Unit Price", colX[2], y + 7);
    doc.text("VAT (15%)", colX[3], y + 7);
    doc.text("Total", colX[4], y + 7);

    y += 12;
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${invoiceData.roomType} Room — Hajj/Umrah`, colX[0], y + 7);
    doc.text(String(invoiceData.roomCount), colX[1], y + 7);
    doc.text(`SAR ${invoiceData.pricePerRoom}`, colX[2], y + 7);
    doc.text(`SAR ${invoiceData.vatAmount}`, colX[3], y + 7);
    doc.setFont("helvetica", "bold");
    doc.text(`SAR ${invoiceData.totalWithVat}`, colX[4], y + 7);

    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 12, pw - 15, y + 12);

    y += 22;

    const summaryX = pw - 80;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Subtotal (excl. VAT):", summaryX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(`SAR ${invoiceData.subtotal}`, pw - 15, y, { align: "right" });

    y += 8;
    doc.setTextColor(80, 80, 80);
    doc.text("VAT (15%):", summaryX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(`SAR ${invoiceData.vatAmount}`, pw - 15, y, { align: "right" });

    y += 2;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.line(summaryX, y + 3, pw - 15, y + 3);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(28, 37, 48);
    doc.text("TOTAL (incl. VAT):", summaryX, y);
    doc.setTextColor(212, 175, 55);
    doc.text(`SAR ${invoiceData.totalWithVat}`, pw - 15, y, { align: "right" });

    y += 20;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, y, pw - 15, y);

    y += 10;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("This is a ZATCA-compliant simplified tax invoice generated by PHX Exchange.", 15, y);
    doc.text("VAT is calculated at 15% in accordance with Saudi Arabian tax regulations.", 15, y + 6);
    doc.text(`QR Code contains TLV-encoded data (Base64): Seller Name, VAT Number, Timestamp, Total Amount, VAT Amount.`, 15, y + 12);
    doc.text(`Generated: ${new Date().toISOString()}`, 15, y + 18);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    const duration = Date.now() - startTime;
    await this.logger.audit("ZatcaBillingService", "invoice_pdf_generated", `PDF invoice generated: ${invoiceData.invoiceNumber}`, {
      entityId: bookingId, invoiceNumber: invoiceData.invoiceNumber,
    }, duration);

    return pdfBuffer;
  }

  async submitInvoice(invoiceData: InvoiceData): Promise<{ submitted: boolean; referenceId?: string }> {
    if (config.zatca.simulationMode) {
      await this.logger.info("ZatcaBillingService", "invoice_submit_simulation", "ZATCA invoice submission simulated", {
        invoiceNumber: invoiceData.invoiceNumber,
      });
      return { submitted: true, referenceId: `SIM-${invoiceData.invoiceNumber}` };
    }

    const url = `${config.zatca.apiUrl}/api/v1/invoices/report`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.zatca.apiKey}`,
        },
        body: JSON.stringify(invoiceData),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        await this.logger.error("ZatcaBillingService", "invoice_submit_failed", `ZATCA API returned ${response.status}`, {
          invoiceNumber: invoiceData.invoiceNumber, statusCode: response.status, errorBody,
        });
        throw new Error(`ZATCA API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      await this.logger.audit("ZatcaBillingService", "invoice_submitted", `Invoice submitted to ZATCA: ${invoiceData.invoiceNumber}`, {
        invoiceNumber: invoiceData.invoiceNumber, referenceId: data.referenceId,
      });

      return { submitted: true, referenceId: data.referenceId };
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("ZATCA API call timed out");
      }
      throw err;
    }
  }
}
