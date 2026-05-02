"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, FileText } from "lucide-react";

interface ReviewerPaperFilesProps {
  paper: any;
}

export default function ReviewerPaperFiles({ paper }: ReviewerPaperFilesProps) {
  return (
    <Card className="p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FileText className="h-4 w-4" /> 📎 Paper Files
      </h2>

      <div className="flex flex-wrap gap-2">
        {paper.file_url && (
          <>
            <Button size="sm" variant="outline" asChild>
              <a href={paper.file_url} target="_blank">
                <Eye className="h-3.5 w-3.5 mr-1" /> View Paper
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={paper.file_url} download>
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </a>
            </Button>
          </>
        )}
        {paper.camera_ready_url && (
          <Button size="sm" variant="outline" asChild>
            <a href={paper.camera_ready_url} target="_blank">
              <Download className="h-3.5 w-3.5 mr-1" /> Camera Ready
            </a>
          </Button>
        )}
      </div>

      {paper.revision_number > 1 && (
        <p className="text-xs text-gray-400">Currently viewing revision v{paper.revision_number}</p>
      )}
    </Card>
  );
}
