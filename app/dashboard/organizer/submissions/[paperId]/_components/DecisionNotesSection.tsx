"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

/* ─── Props ─── */
interface DecisionNotesSectionProps {
  paper: any;
  note: string;
  onNoteChange: (value: string) => void;
  isFinalDecision: boolean;
}

/* ─── Component ─── */
export default function DecisionNotesSection({
  paper,
  note,
  onNoteChange,
  isFinalDecision,
}: DecisionNotesSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
        🧾 Organizer Decision
      </h2>

      {/* Decision Notes */}
      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Decision Notes</h3>
        <p className="text-xs text-gray-400">Internal notes for your reference — separate from reviewer comments.</p>

        {isFinalDecision ? (
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note || "No decision notes added."}</p>
          </div>
        ) : (
          <>
            <Textarea
              value={note}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="Add final decision notes..."
              rows={4}
            />

            {/* Quick note templates */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Accept with minor revisions",
                "Accept for poster presentation",
                "Revise and resubmit",
                "Reject – out of scope",
                "Reject – quality concerns",
              ].map(tpl => (
                <button
                  key={tpl}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                  onClick={() => onNoteChange(note ? `${note}\n${tpl}` : tpl)}
                >
                  {tpl}
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Author Declarations */}
      <Card className="p-5 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Author Declarations
        </h3>
        <div className="space-y-1">
          <Declaration ok={paper.declaration_original} text="Original work" />
          <Declaration ok={paper.declaration_no_plagiarism} text="No plagiarism" />
          <Declaration ok={paper.declaration_author_approval} text="Author approvals" />
        </div>
      </Card>

      {/* Paper Details & Payment — only if metadata exists */}
      {(paper.presentation_type || paper.publication_type || paper.presentation_fee > 0) && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Paper Details & Payment
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {paper.presentation_type && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Presentation</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{paper.presentation_type}</p>
              </div>
            )}
            {paper.publication_type && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Publication</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{paper.publication_type}</p>
              </div>
            )}
            {paper.presentation_fee > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Fee</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">₹{Number(paper.presentation_fee).toLocaleString("en-IN")}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Payment</p>
              <div className="mt-0.5">
                {paper.presentation_fee_paid ? (
                  <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>
                ) : paper.status === "accepted" && paper.presentation_fee > 0 ? (
                  <Badge className="bg-red-100 text-red-700">Unpaid</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500">N/A</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Declaration sub-component ─── */
function Declaration({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`text-sm ${ok ? "text-green-600" : "text-red-600"}`}>
      {ok ? "✔" : "✖"} {text}
    </p>
  );
}
