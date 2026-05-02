"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

interface ReviewerAuthorsSectionProps {
  authors: any[];
  paper: any;
}

export default function ReviewerAuthorsSection({ authors, paper }: ReviewerAuthorsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Authors */}
      <Card className="overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Users className="h-4 w-4" />
            👤 Authors
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>

        {expanded && (
          <div className="px-5 py-4 border-t">
            {authors.length === 0 ? (
              <p className="text-sm text-gray-500">No author data available</p>
            ) : (
              <div className="space-y-2">
                {authors.map((a, i) => (
                  <div
                    key={i}
                    className={`border rounded-md p-3 ${a.is_primary ? "bg-blue-50 border-blue-200" : ""}`}
                  >
                    <p className="font-medium text-sm">
                      {a.author_order}. {a.name}
                      {a.is_primary && (
                        <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Primary</Badge>
                      )}
                    </p>
                    {a.affiliation && <p className="text-xs text-gray-500 mt-1">{a.affiliation}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Declarations */}
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
    </div>
  );
}

function Declaration({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`text-sm ${ok ? "text-green-600" : "text-red-600"}`}>
      {ok ? "✔" : "✖"} {text}
    </p>
  );
}
