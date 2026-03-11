"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { generateReceipt, type ReceiptData } from "@/lib/billing/generateReceipt";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface PaymentSuccessModalProps {
    open: boolean;
    onClose: () => void;
    /** Data required for receipt generation */
    receipt: ReceiptData;
    /** Label for the continue button (default: "Continue") */
    continueLabel?: string;
    /** Called when user clicks Continue */
    onContinue?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PaymentSuccessModal({
    open,
    onClose,
    receipt,
    continueLabel = "Continue to Dashboard",
    onContinue,
}: PaymentSuccessModalProps) {
    const [copied, setCopied] = useState(false);

    function handleDownloadReceipt() {
        generateReceipt(receipt);
    }

    function handleCopyPaymentId() {
        navigator.clipboard.writeText(receipt.paymentId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleContinue() {
        onClose();
        onContinue?.();
    }

    const formattedAmount = `₹${receipt.amount.toLocaleString("en-IN")}`;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-center">
                    {/* Success icon */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-3">
                        <CheckCircle2 className="h-9 w-9 text-green-600" />
                    </div>

                    <DialogTitle className="text-xl text-center">
                        Payment Successful!
                    </DialogTitle>
                    <DialogDescription className="text-center pt-1">
                        Your payment of <strong className="text-gray-900">{formattedAmount}</strong> has
                        been verified and confirmed.
                    </DialogDescription>
                </DialogHeader>

                {/* Payment details card */}
                <div className="rounded-lg border bg-gray-50/50 p-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Description</span>
                        <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">
                            {receipt.description}
                        </span>
                    </div>

                    {receipt.conferenceName && (
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Conference</span>
                            <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">
                                {receipt.conferenceName}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-semibold text-green-700">
                            {formattedAmount}
                        </span>
                    </div>

                    <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Payment ID</span>
                            <div className="flex items-center gap-1.5">
                                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
                                    {receipt.paymentId.length > 24
                                        ? `${receipt.paymentId.slice(0, 24)}…`
                                        : receipt.paymentId}
                                </code>
                                <button
                                    onClick={handleCopyPaymentId}
                                    className="p-1 rounded hover:bg-gray-200 transition"
                                    title="Copy Payment ID"
                                >
                                    {copied ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={handleDownloadReceipt}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download Receipt
                    </Button>

                    <Button
                        onClick={handleContinue}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    >
                        {continueLabel}
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
