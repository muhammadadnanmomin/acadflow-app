"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

export default function ResetPasswordPage() {
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error" | "info";
    } | null>(null);

    /* Handle recovery token */
    useEffect(() => {
        async function handleRecovery() {
            const hash = window.location.hash;

            if (!hash) return;

            const params = new URLSearchParams(hash.substring(1));

            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");

            if (!accessToken || !refreshToken) {
                setError("Invalid reset link");
                return;
            }

            await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        }

        handleRecovery();
    }, []);

    /* Update password */
    async function handleReset(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);

            setToast({
                message: error.message,
                type: "error",
            });

        } else {
            setToast({
                message: "Password updated successfully!",
                type: "success",
            });

            setTimeout(() => {
                router.push("/login");
            }, 1500);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
            suppressHydrationWarning
        >

            <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-lg">

                {/* Title */}
                <h1 className="mb-6 text-center text-2xl font-bold">
                    Reset Password
                </h1>

                {/* Error */}
                {error && (
                    <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleReset} className="space-y-4">

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            New Password
                        </label>

                        <Input
                            type="password"
                            placeholder="Enter new password"
                            value={password}
                            required
                            suppressHydrationWarning
                            onChange={(e) => setPassword(e.target.value)}
                        />

                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </Button>

                </form>

            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

        </div>
    );
}
