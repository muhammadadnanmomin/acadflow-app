"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const { profile, loading } = useProfile();

  const supabase = createClient()

  const [users, setUsers] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  /* Load all users */
  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (!error) setUsers(data || []);
  }

  useEffect(() => {
    if (profile?.role === "admin") {
      loadUsers();
    }
  }, [profile]);

  /* Update role */
  async function updateRole(
    userId: string,
    newRole: string
  ) {
    setSavingId(userId);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    setSavingId(null);

    if (error) {
      alert(error.message);
    } else {
      loadUsers();
    }
  }

  /* Block non-admin */
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="p-10 text-center text-red-600 font-medium">
        ❌ Access Denied
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          User Management
        </h1>

        <p className="text-gray-500 text-sm">
          Manage roles and permissions
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-left">

            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Action</th>
            </tr>

          </thead>

          <tbody>

            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">
                  {u.name || "-"}
                </td>

                <td className="p-3">
                  {u.email}
                </td>

                <td className="p-3 capitalize">
                  {u.role}
                </td>

                <td className="p-3">

                  <select
                    value={u.role}
                    disabled={savingId === u.id}
                    onChange={(e) =>
                      updateRole(u.id, e.target.value)
                    }
                    className="rounded border px-2 py-1 text-sm"
                  >
                    <option value="participant">
                      Participant
                    </option>

                    <option value="organizer">
                      Organizer
                    </option>

                    <option value="reviewer">
                      Reviewer
                    </option>

                    <option value="admin">
                      Admin
                    </option>

                  </select>

                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
