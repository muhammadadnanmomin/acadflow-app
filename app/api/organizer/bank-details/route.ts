import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin-level access (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Supabase client for auth verification (uses anon key)
const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Mask an account number: show only last 4 digits.
 * "1234567890" → "****7890"
 */
function maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return "●●●●" + accountNumber.slice(-4);
}

// ── Validation ──────────────────────────────────────────────────────

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function validateBankDetails(body: Record<string, any>): string | null {
    if (!body.account_holder_name?.trim()) return "Account holder name is required";
    if (!body.account_number?.trim()) return "Account number is required";
    if (!body.confirm_account_number?.trim()) return "Please confirm your account number";

    const accNum = body.account_number.trim();
    if (accNum.length < 9 || accNum.length > 18) return "Account number must be 9-18 digits";
    if (!/^\d+$/.test(accNum)) return "Account number must contain only digits";
    if (accNum !== body.confirm_account_number?.trim()) return "Account numbers do not match";

    const ifsc = body.ifsc_code?.trim().toUpperCase();
    if (!ifsc) return "IFSC code is required";
    if (!IFSC_REGEX.test(ifsc)) return "Invalid IFSC code format (e.g., SBIN0001234)";

    if (!body.bank_name?.trim()) return "Bank name is required";

    return null; // all valid
}

// ── GET — Fetch bank details (masked) ───────────────────────────────

export async function GET(req: Request) {
    try {
        // Verify auth from the Authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from("organizer_bank_accounts")
            .select("*")
            .eq("organizer_id", user.id)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ bank: null });
        }

        // Return masked account number — never expose full number via API
        return NextResponse.json({
            bank: {
                id: data.id,
                account_holder_name: data.account_holder_name,
                account_number_masked: maskAccountNumber(data.account_number),
                ifsc_code: data.ifsc_code,
                bank_name: data.bank_name,
                branch_name: data.branch_name,
                is_verified: data.is_verified,
                razorpay_account_id: data.razorpay_account_id,
                created_at: data.created_at,
                updated_at: data.updated_at,
            },
        });
    } catch (err) {
        console.error("Bank details GET error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// ── POST — Save or update bank details ──────────────────────────────

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Server-side validation
        const validationError = validateBankDetails(body);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        const bankData = {
            organizer_id: user.id,
            account_holder_name: body.account_holder_name.trim(),
            account_number: body.account_number.trim(),
            ifsc_code: body.ifsc_code.trim().toUpperCase(),
            bank_name: body.bank_name.trim(),
            branch_name: body.branch_name?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        // Upsert: insert or update on conflict (unique organizer_id)
        const { data, error } = await supabaseAdmin
            .from("organizer_bank_accounts")
            .upsert(bankData, { onConflict: "organizer_id" })
            .select("id")
            .single();

        if (error) {
            console.error("Bank details upsert error:", error);
            return NextResponse.json({ error: "Failed to save bank details" }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (err) {
        console.error("Bank details POST error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
