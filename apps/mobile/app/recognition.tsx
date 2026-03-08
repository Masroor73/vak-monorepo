"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Recognition = {
  id: string;
  message: string;
  badge_icon: string;
};

export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecognitions();
  }, []);

  async function fetchRecognitions() {
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user?.id) return;

    const { data, error } = await supabase
      .from("recognitions")
      .select("*")
      .eq("receiver_id", user.user.id);

    if (error) {
      console.log(error);
      return;
    }

    setRecognitions(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* HEADER */}
      <div className="bg-[#0b1f44] text-white p-6 text-xl font-semibold">
        Recognition
      </div>

      <div className="p-6">

        <div className="text-sm text-blue-500 font-semibold mb-4">
          • RECEIVED RECOGNITION
        </div>

        {recognitions.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h3 className="text-lg font-semibold">No recognition yet</h3>
            <p className="text-gray-500 mt-2">
              When coworkers appreciate your work, it will appear here.
            </p>
          </div>
        )}

        {recognitions.map((rec) => (
          <div
            key={rec.id}
            className="bg-white rounded-xl shadow-md p-6 mb-4"
          >
            <p className="text-gray-800">{rec.message}</p>
            <p className="text-sm text-gray-500 mt-2">
              Badge: {rec.badge_icon}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}