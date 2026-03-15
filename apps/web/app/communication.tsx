import { useEffect, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type Recognition = {
  id: string;
  message: string;
  badge_icon: string;
  receiver_id: string;
  created_at: string;
};

type Notification = {
  id: string;
  message: string;
  target: string;
  created_at: string;
};

export default function Communication() {

  const { profile } = useAuth();

  const [activeTab,setActiveTab] = useState("announcements");

  const [employees,setEmployees] = useState<Profile[]>([]);
  const [recognitions,setRecognitions] = useState<Recognition[]>([]);
  const [announcements,setAnnouncements] = useState<Notification[]>([]);

  const [selectedEmployee,setSelectedEmployee] = useState("");
  const [badge,setBadge] = useState("");
  const [message,setMessage] = useState("");

  const [announcementMessage,setAnnouncementMessage] = useState("");
  const [target,setTarget] = useState("ALL");

  useEffect(()=>{
    loadEmployees();
    loadRecognitions();
    loadAnnouncements();
  },[]);

  async function loadEmployees(){

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .order("full_name",{ascending:true});

    setEmployees(data || []);
  }

  async function loadRecognitions(){

    const {data} = await supabase
      .from("recognitions")
      .select("*")
      .order("created_at",{ascending:false});

    setRecognitions(data || []);
  }

  async function loadAnnouncements(){

    const {data} = await supabase
      .from("notifications")
      .select("*")
      .order("created_at",{ascending:false});

    setAnnouncements(data || []);
  }

  async function sendRecognition(){

    if(!selectedEmployee || !badge || !message) return;

    await supabase
      .from("recognitions")
      .insert({
        sender_id: profile?.id,
        receiver_id: selectedEmployee,
        badge_icon: badge,
        message: message
      });

    setSelectedEmployee("");
    setBadge("");
    setMessage("");

    loadRecognitions();
  }

  async function sendAnnouncement(){

    if(!announcementMessage) return;

    await supabase
      .from("notifications")
      .insert({
        message:announcementMessage,
        target:target
      });

    setAnnouncementMessage("");
    loadAnnouncements();
  }

  return(
    <ManagerLayout>

      <div className="space-y-6">

        <h1 className="text-2xl font-bold">Communication</h1>

        {/* TABS */}

        <div className="flex gap-4 border-b pb-2">

          <button
            onClick={()=>setActiveTab("announcements")}
            className={`px-3 py-1 ${activeTab==="announcements" ? "font-bold border-b-2 border-black":""}`}
          >
            Announcements
          </button>

          <button
            onClick={()=>setActiveTab("recognition")}
            className={`px-3 py-1 ${activeTab==="recognition" ? "font-bold border-b-2 border-black":""}`}
          >
            Recognition
          </button>

        </div>

        {/* ANNOUNCEMENTS TAB */}

        {activeTab==="announcements" && (

          <div className="space-y-4">

            <textarea
              placeholder="Write announcement..."
              value={announcementMessage}
              onChange={(e)=>setAnnouncementMessage(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            {/* RADIO BUTTONS */}

            <div className="flex gap-4 text-sm">

              <label>
                <input
                  type="radio"
                  value="ALL"
                  checked={target==="ALL"}
                  onChange={()=>setTarget("ALL")}
                /> All Employees
              </label>

              <label>
                <input
                  type="radio"
                  value="MANAGER"
                  checked={target==="MANAGER"}
                  onChange={()=>setTarget("MANAGER")}
                /> Managers Only
              </label>

              <label>
                <input
                  type="radio"
                  value="SPECIFIC"
                  checked={target==="SPECIFIC"}
                  onChange={()=>setTarget("SPECIFIC")}
                /> Specific
              </label>

            </div>

            <button
              onClick={sendAnnouncement}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Send Announcement
            </button>

            {announcements.map(a=>(
              <div key={a.id} className="border rounded-lg p-4">
                📢 {a.message}
              </div>
            ))}

          </div>

        )}

        {/* RECOGNITION TAB */}

        {activeTab==="recognition" && (

          <div className="space-y-4">

            <select
              value={selectedEmployee}
              onChange={(e)=>setSelectedEmployee(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">Select Employee</option>
              {employees.map(e=>(
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>

            {/* EMOJI PICKER */}

            <div className="flex gap-3 text-xl">
              {["⭐","🏆","💪","🎯","🤝","🌟"].map((e)=>(
                <button
                  key={e}
                  onClick={()=>setBadge(e)}
                  className={`border p-2 rounded ${badge===e?"bg-blue-200":""}`}
                >
                  {e}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Write recognition message..."
              value={message}
              onChange={(e)=>setMessage(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <button
              onClick={sendRecognition}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              Send Recognition
            </button>

            {recognitions.map(r=>(
              <div key={r.id} className="border rounded-lg p-4">
                ⭐ {r.message}
              </div>
            ))}

          </div>

        )}

      </div>

    </ManagerLayout>
  );
}
