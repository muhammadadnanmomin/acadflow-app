-- ================================================================
-- Confairo — Per-Author Certificates
-- Each author of a paper receives an individual certificate.
-- ================================================================

-- Drop the old certificates table (it had user_id, no author_id)
DROP TABLE IF EXISTS certificates;

CREATE TABLE certificates (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paper_id          UUID NOT NULL REFERENCES paper_submissions(id) ON DELETE CASCADE,
    author_id         UUID NOT NULL REFERENCES paper_authors(id) ON DELETE CASCADE,
    conference_id     UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    certificate_type  TEXT NOT NULL DEFAULT 'presentation',
    file_url          TEXT,
    verification_code TEXT UNIQUE,
    issued_at         TIMESTAMPTZ DEFAULT NOW()
);

-- One certificate per author per paper
CREATE UNIQUE INDEX idx_cert_paper_author
    ON certificates(paper_id, author_id);

-- Fast lookups by author
CREATE INDEX idx_cert_author
    ON certificates(author_id);

-- Fast lookups by conference
CREATE INDEX idx_cert_conference
    ON certificates(conference_id);

-- RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Org members can read certificates for their conferences
CREATE POLICY "Org members can view certificates"
    ON certificates
    FOR SELECT
    USING (
        conference_id IN (
            SELECT c.id FROM conferences c
            JOIN organization_members om ON om.organization_id = c.organizer_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Authors can view their own certificates (matched via paper_authors email)
CREATE POLICY "Authors can view own certificates"
    ON certificates
    FOR SELECT
    USING (
        author_id IN (
            SELECT pa.id FROM paper_authors pa
            JOIN profiles p ON lower(pa.email) = lower(p.email)
            WHERE p.id = auth.uid()
        )
    );

-- Service role can insert (API route uses supabaseAdmin)
CREATE POLICY "Service can insert certificates"
    ON certificates
    FOR INSERT
    WITH CHECK (true);
