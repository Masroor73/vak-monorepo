import { useEffect, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import { supabase } from "../lib/supabase";
import { useAuthGuard } from "../hooks/useAuthGuard";

type SwapRequest = {
  id: string;
  requester_id: string;
  recipient_id: string | null;
  shift_id: string;
  reason: string;
  status: "PENDING" | "MANAGER_REVIEW" | "APPROVED" | "DENIED";
};

type Profile = {
  id: string;
  email: string;
};

export default function SwapRequests() {
  useAuthGuard();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: swaps } = await supabase
      .from("shift_swaps")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: users } = await supabase
      .from("profiles")
      .select("id,email");

    if (swaps) setRequests(swaps);
    if (users) setProfiles(users);

    setLoading(false);
  }

  function getUserName(id: string | null) {
    if (!id) return "Any Team Member";
    const user = profiles.find((p) => p.id === id);
    return user ? user.email.split("@")[0] : "Unknown";
  }

  async function approveSwap(id: string) {
    await supabase
      .from("shift_swaps")
      .update({ status: "APPROVED" })
      .eq("id", id);

    loadData();
  }

  async function denySwap(id: string) {
    await supabase
      .from("shift_swaps")
      .update({ status: "DENIED" })
      .eq("id", id);

    loadData();
  }

  return (
    <ManagerLayout>
      <div className="p-8 max-w-4xl">

        <h1 className="text-2xl font-semibold mb-6">
          Swap Requests
        </h1>

        {loading ? (
          <p>Loading swap requests...</p>
        ) : requests.length === 0 ? (
          <p>No swap requests found.</p>
        ) : (
          <div className="space-y-4">

            {requests.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-start border rounded-lg p-5 bg-white"
              >

                {/* LEFT SIDE */}
                <div className="max-w-[70%]">

                  <p className="font-semibold text-sm">
                    {getUserName(req.requester_id)} has requested to swap shift with{" "}
                    {getUserName(req.recipient_id)}
                  </p>

                  <p className="text-gray-500 text-xs mt-1">
                    Reason: {req.reason || "No description provided"}
                  </p>

                  <p className="text-xs mt-2">
                    Status:{" "}
                    <span className="font-semibold">
                      {req.status}
                    </span>
                  </p>

                </div>

                {/* RIGHT SIDE */}
                <div className="flex gap-2">

                  {req.status !== "APPROVED" && (
                    <button
                      onClick={() => approveSwap(req.id)}
                      className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                    >
                      Accept
                    </button>
                  )}

                  {req.status !== "DENIED" && (
                    <button
                      onClick={() => denySwap(req.id)}
                      className="border border-red-500 text-red-500 text-xs px-3 py-1 rounded hover:bg-red-50"
                    >
                      Decline
                    </button>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </ManagerLayout>
  );
}