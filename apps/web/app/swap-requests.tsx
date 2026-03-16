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
  shifts?: {
    date: string;
    start_time: string;
    end_time: string;
  };
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
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "DENIED" | "ALL">("ALL");

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("swap_requests_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_swaps",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
  setLoading(true);

  const { data: swaps } = await supabase
    .from("shift_swaps")
    .select(`
      *,
      shifts (
        start_time,
        end_time
      )
    `)
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

  const filteredRequests =
    filter === "ALL"
      ? requests
      : requests.filter((r) => r.status === filter);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const deniedCount = requests.filter((r) => r.status === "DENIED").length;

  return (
    <ManagerLayout>
      <div className="p-8 max-w-4xl">

        <h1 className="text-2xl font-semibold mb-6">
          Swap Requests
        </h1>

        <div className="flex gap-4 mb-6 text-sm">

          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded ${filter==="ALL" ? "bg-black text-white" : "border"}`}
          >
            All ({requests.length})
          </button>

          <button
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1 rounded ${filter==="PENDING" ? "bg-black text-white" : "border"}`}
          >
            Pending ({pendingCount})
          </button>

          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-3 py-1 rounded ${filter==="APPROVED" ? "bg-black text-white" : "border"}`}
          >
            Approved ({approvedCount})
          </button>

          <button
            onClick={() => setFilter("DENIED")}
            className={`px-3 py-1 rounded ${filter==="DENIED" ? "bg-black text-white" : "border"}`}
          >
            Denied ({deniedCount})
          </button>

        </div>

        {loading ? (
          <p>Loading swap requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p>No swap requests found.</p>
        ) : (
          <div className="space-y-4">

            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-start border rounded-lg p-5 bg-white"
              >

                <div className="max-w-[70%]">

                  <p className="font-semibold text-sm">
                    {getUserName(req.requester_id)} has requested to swap shift with{" "}
                    {getUserName(req.recipient_id)}
                  </p>

                  {req.shifts && (
                    <p className="text-xs text-gray-500 mt-1">
  Shift:{" "}
  {new Date(req.shifts.start_time).toLocaleString("en-CA", {
    timeZone: "America/Edmonton",
    month: "short",
    day: "numeric",
    year: "numeric",
  })}{" "}
  •{" "}
  {new Date(req.shifts.start_time).toLocaleTimeString("en-CA", {
    timeZone: "America/Edmonton",
    hour: "numeric",
    minute: "2-digit",
  })}{" "}
  –{" "}
  {new Date(req.shifts.end_time).toLocaleTimeString("en-CA", {
    timeZone: "America/Edmonton",
    hour: "numeric",
    minute: "2-digit",
  })}{" "}
  MST
</p>
                  )}

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