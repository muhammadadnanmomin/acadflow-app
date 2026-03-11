/* ================================================================
   AcadFlow — Participant Payment Receipt Generator
   Creates a branded receipt PDF for conference fee payments
   with full fee breakdown (conference fee + processing fee).
   ================================================================ */

import { jsPDF } from "jspdf";
import { formatINR, PLATFORM_FEE_PERCENT, type FeeBreakdown } from "@/lib/payment/fees";

export interface ParticipantReceiptData {
    /** Razorpay payment ID */
    paymentId: string;
    /** Razorpay order ID */
    orderId: string;
    /** Conference name */
    conferenceName: string;
    /** Organization / organizer name */
    organizerName: string;
    /** Fee breakdown */
    conferenceFee: number;
    processingFee: number;
    total: number;
    /** Payment date (ISO string or Date) */
    paidAt?: string | Date;
}

/**
 * Generate a participant payment receipt PDF and trigger browser download.
 */
export function generatePaymentReceipt(data: ParticipantReceiptData): void {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const rightX = pageWidth - margin;
    let y = margin;

    const paidDate = data.paidAt ? new Date(data.paidAt) : new Date();
    const formattedDate = paidDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    const formattedTime = paidDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    /* ---------------------------------------------------------------- */
    /*  Header band                                                      */
    /* ---------------------------------------------------------------- */
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("AcadFlow", margin, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Academic Conference Management Platform", margin, 26);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT RECEIPT", rightX, 18, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${formattedDate}`, rightX, 26, { align: "right" });
    doc.text(`Time: ${formattedTime}`, rightX, 32, { align: "right" });

    y = 52;

    /* ---------------------------------------------------------------- */
    /*  Conference Details                                               */
    /* ---------------------------------------------------------------- */
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Conference Details", margin, y);
    y += 8;

    doc.setTextColor(55, 65, 81);
    const drawRow = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 50, y);
        y += 8;
    };

    drawRow("Conference", data.conferenceName);
    drawRow("Organized By", data.organizerName);

    y += 2;

    /* ---------------------------------------------------------------- */
    /*  Divider                                                          */
    /* ---------------------------------------------------------------- */
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y, rightX, y);
    y += 10;

    /* ---------------------------------------------------------------- */
    /*  Payment Details                                                  */
    /* ---------------------------------------------------------------- */
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Payment Details", margin, y);
    y += 8;

    doc.setTextColor(55, 65, 81);
    drawRow("Payment ID", data.paymentId);
    drawRow("Order ID", data.orderId);

    y += 2;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, rightX, y);
    y += 10;

    /* ---------------------------------------------------------------- */
    /*  Fee Breakdown Table                                              */
    /* ---------------------------------------------------------------- */
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Fee Breakdown", margin, y);
    y += 8;

    // Table header
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 4, rightX - margin, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text("Description", margin + 4, y + 2);
    doc.text("Amount", rightX - 4, y + 2, { align: "right" });
    y += 12;

    // Row helper
    const addFeeRow = (label: string, amount: number, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(10);
        doc.text(label, margin + 4, y);
        doc.text(`Rs. ${formatINR(amount)}`, rightX - 4, y, { align: "right" });
        y += 7;
    };

    addFeeRow("Conference Fee", data.conferenceFee);
    addFeeRow(`Platform Processing Fee (${PLATFORM_FEE_PERCENT}%)`, data.processingFee);

    y += 2;
    doc.setDrawColor(180);
    doc.line(margin, y, rightX, y);
    y += 8;

    /* ---------------------------------------------------------------- */
    /*  Total box                                                        */
    /* ---------------------------------------------------------------- */
    const totalBoxW = 80;
    const totalBoxH = 16;
    const totalBoxX = rightX - totalBoxW;
    const totalBoxY = y - 6;
    const totalPad = 8;
    const totalTextY = totalBoxY + totalBoxH / 2 + 2;

    doc.setFillColor(79, 70, 229);
    doc.roundedRect(totalBoxX, totalBoxY, totalBoxW, totalBoxH, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total Paid", totalBoxX + totalPad, totalTextY);
    doc.text(
        `Rs. ${formatINR(data.total)}`,
        totalBoxX + totalBoxW - totalPad,
        totalTextY,
        { align: "right" }
    );

    y += 18;

    /* ---------------------------------------------------------------- */
    /*  PAID badge                                                       */
    /* ---------------------------------------------------------------- */
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(margin, y - 4, 50, 12, 3, 3, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PAID", margin + 16, y + 3);

    y += 22;

    /* ---------------------------------------------------------------- */
    /*  Transparency Notice                                              */
    /* ---------------------------------------------------------------- */
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, rightX, y);
    y += 10;

    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Transparency Notice", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
        `Conference fee of Rs. ${formatINR(data.conferenceFee)} has been transferred to ${data.organizerName}.`,
        margin,
        y
    );
    y += 5;
    doc.text(
        `Platform processing fee of Rs. ${formatINR(data.processingFee)} is retained by AcadFlow.`,
        margin,
        y
    );
    y += 5;
    doc.text(
        "AcadFlow charges a small platform processing fee to support secure payment infrastructure and platform operations.",
        margin,
        y
    );

    y += 12;

    /* ---------------------------------------------------------------- */
    /*  Footer                                                           */
    /* ---------------------------------------------------------------- */
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, rightX, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
        "This is a computer-generated receipt and does not require a signature.",
        pageWidth / 2,
        y,
        { align: "center" }
    );
    y += 5;
    doc.text(
        "AcadFlow — Academic Conference Management Platform  •  acadflow.com",
        pageWidth / 2,
        y,
        { align: "center" }
    );
    y += 5;
    doc.text(
        "For support, contact acadflow.platform@gmail.com",
        pageWidth / 2,
        y,
        { align: "center" }
    );

    /* ---------------------------------------------------------------- */
    /*  Save                                                             */
    /* ---------------------------------------------------------------- */
    const safeId = data.paymentId.replace(/[^a-zA-Z0-9_-]/g, "_");
    doc.save(`AcadFlow_Receipt_${safeId}.pdf`);
}
