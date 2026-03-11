/* ================================================================
   AcadFlow — Receipt PDF Generator
   Uses jsPDF to generate and auto-download a payment receipt.
   ================================================================ */

import { jsPDF } from "jspdf";

export interface ReceiptData {
    /** Razorpay payment ID */
    paymentId: string;
    /** Razorpay order ID */
    orderId: string;
    /** Amount paid in INR (number, e.g. 1999) */
    amount: number;
    /** What was purchased */
    description: string;
    /** Conference name (if applicable) */
    conferenceName?: string;
    /** Organizer / payer name */
    payerName: string;
    /** Payer email */
    payerEmail?: string;
    /** Payment date (ISO string or Date) */
    paidAt?: string | Date;
}

/**
 * Generate a receipt PDF and trigger browser download.
 * Works entirely client-side — no server round-trip.
 */
export function generateReceipt(data: ReceiptData): void {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const paidDate = data.paidAt
        ? new Date(data.paidAt)
        : new Date();

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
    doc.text("PAYMENT RECEIPT", pageWidth - margin, 18, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${formattedDate}`, pageWidth - margin, 26, {
        align: "right",
    });
    doc.text(`Time: ${formattedTime}`, pageWidth - margin, 32, {
        align: "right",
    });

    y = 52;

    /* ---------------------------------------------------------------- */
    /*  Receipt details                                                  */
    /* ---------------------------------------------------------------- */
    doc.setTextColor(55, 65, 81); // gray-700

    const drawRow = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 50, y);
        y += 8;
    };

    drawRow("Payment ID", data.paymentId);
    drawRow("Order ID", data.orderId);

    y += 2;

    /* ---------------------------------------------------------------- */
    /*  Divider                                                          */
    /* ---------------------------------------------------------------- */
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    /* ---------------------------------------------------------------- */
    /*  Bill To                                                          */
    /* ---------------------------------------------------------------- */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text("Bill To", margin, y);
    y += 8;

    doc.setTextColor(55, 65, 81);
    drawRow("Name", data.payerName);
    if (data.payerEmail) {
        drawRow("Email", data.payerEmail);
    }

    y += 4;

    /* ---------------------------------------------------------------- */
    /*  Item table                                                       */
    /* ---------------------------------------------------------------- */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text("Payment Details", margin, y);
    y += 8;

    // Table header
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(margin, y - 4, contentWidth, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text("Description", margin + 4, y + 2);
    doc.text("Amount", pageWidth - margin - 4, y + 2, { align: "right" });
    y += 12;

    // Table row
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let itemDesc = data.description;
    if (data.conferenceName) {
        itemDesc += `\n${data.conferenceName}`;
    }

    const lines = doc.splitTextToSize(itemDesc, contentWidth - 60);
    doc.text(lines, margin + 4, y);

    doc.setFont("helvetica", "bold");
    doc.text(
        `Rs.${data.amount.toLocaleString("en-IN")}`,
        pageWidth - margin - 4,
        y,
        { align: "right" }
    );

    y += lines.length * 6 + 6;

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Total — split label / amount inside a properly sized box
    const totalBoxW = 80;
    const totalBoxH = 16;
    const totalBoxX = pageWidth - margin - totalBoxW;
    const totalBoxY = y - 6;
    const totalPad = 8; // internal horizontal padding
    const totalTextY = totalBoxY + totalBoxH / 2 + 2; // vertically centered

    doc.setFillColor(79, 70, 229); // indigo-600
    doc.roundedRect(totalBoxX, totalBoxY, totalBoxW, totalBoxH, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    // "Total" label — left-aligned inside box
    doc.text("Total", totalBoxX + totalPad, totalTextY);

    // Amount — right-aligned inside box with padding
    doc.text(
        `Rs.${data.amount.toLocaleString("en-IN")}`,
        totalBoxX + totalBoxW - totalPad,
        totalTextY,
        { align: "right" }
    );

    y += 20;

    /* ---------------------------------------------------------------- */
    /*  Status badge                                                     */
    /* ---------------------------------------------------------------- */
    doc.setFillColor(220, 252, 231); // green-100
    doc.roundedRect(margin, y - 4, 50, 12, 3, 3, "F");
    doc.setTextColor(22, 163, 74); // green-600
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PAID", margin + 12, y + 3);

    y += 24;

    /* ---------------------------------------------------------------- */
    /*  Footer                                                           */
    /* ---------------------------------------------------------------- */
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
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
    /*  Save / download                                                  */
    /* ---------------------------------------------------------------- */
    doc.save(`AcadFlow_Receipt_${data.paymentId}.pdf`);
}
