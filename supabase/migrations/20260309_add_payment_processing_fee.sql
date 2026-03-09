-- Add payment_processing_fee column to paper_submissions.
-- Old columns (payment_gateway_fee, payment_gst) are kept for
-- backward compatibility with existing payment records.

ALTER TABLE paper_submissions
  ADD COLUMN IF NOT EXISTS payment_processing_fee NUMERIC(10,2);
