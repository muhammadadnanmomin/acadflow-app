export function getPaperWorkflowState(paper: any) {
  // FINAL DECISION
  if (paper.status === "accepted" || paper.status === "rejected") {
    return "reviewed";
  }

  // REVIEW COMPLETED → waiting for organizer decision
  if (paper.reviewed_at) {
    return "awaiting_decision";
  }

  // REVIEWER ASSIGNED
  if (paper.reviewer_id) {
    return "under_review";
  }

  // DEFAULT
  return "submitted";
}