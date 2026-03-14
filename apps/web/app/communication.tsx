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

type Announcement = {
  id: string;
  message: string;
  target: string;
  created_at: string;
};

export default function Communication() {

  const { profile } = useAuth();

  const [employees,setEmployees] = useState<Profile[]>([]);
  const [recognitions,setRecognitions] = useState<Recognition[]>([]);
  const [announcements,setAnnouncements] = useState<Announcement[]>([]);

  const [openRecognition,setOpenRecognition] = useState(false);

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

   const { data, error } = await supabase
   .from("profiles")
   .select("id, full_name, email, role")
   .order("full_name", { ascending: true });

    if(error){
      console.error(error);
      return;
    }

    setEmployees(data || []);
  }

  async function loadRecognitions(){

    const {data,error} = await supabase
      .from("recognitions")
      .select("*")
      .order("created_at",{ascending:false});

    if(error){
      console.error(error);
      return;
    }

    setRecognitions(data || []);
  }

  async function loadAnnouncements(){

    const {data,error} = await supabase
      .from("announcements")
      .select("*")
      .order("created_at",{ascending:false});

    if(error){
      console.error(error);
      return;
    }

    setAnnouncements(data || []);
  }

  async function sendRecognition(){

    if(!selectedEmployee || !badge || !message){
      alert("Please fill all fields");
      return;
    }

    const {error} = await supabase
      .from("recognitions")
      .insert({
        sender_id: profile?.id,
        receiver_id: selectedEmployee,
        badge_icon: badge,
        message: message
      });

    if(error){
      console.error(error);
      return;
    }

    setOpenRecognition(false);
    setSelectedEmployee("");
    setBadge("");
    setMessage("");

    loadRecognitions();
  }

  async function sendAnnouncement(){

    if(!announcementMessage) return;

    const {error} = await supabase
      .from("announcements")
      .insert({
        message: announcementMessage,
        target: target
      });

    if(error){
      console.error(error);
      return;
    }

    setAnnouncementMessage("");
    loadAnnouncements();
  }

  return(
    <ManagerLayout>

      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold">Communication</h1>
            <p className="text-gray-500 text-sm">
              Announcements and team recognition
            </p>
          </div>

          <button
            onClick={()=>setOpenRecognition(true)}
            className="bg-black text-white px-5 py-2 rounded-lg"
          >
            Send Recognition
          </button>

        </div>

        {/* ANNOUNCEMENTS */}

        <div className="bg-white border rounded-lg p-5 space-y-3">

          <h3 className="font-semibold">Send Announcement</h3>

          <textarea
            placeholder="Write announcement..."
            value={announcementMessage}
            onChange={(e)=>setAnnouncementMessage(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <div className="flex gap-3">

            <select
              value={target}
              onChange={(e)=>setTarget(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="ALL">All Staff</option>
              <option value="MANAGER">Managers</option>
              <option value="EMPLOYEE">Employees</option>
            </select>

            <button
              onClick={sendAnnouncement}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Send Announcement
            </button>

          </div>

        </div>

        {/* ACTIVITY FEED */}

        <div className="space-y-4">

          {announcements.map(a=>(
            <div key={a.id} className="bg-white border rounded-lg p-4">
              <div className="font-semibold">📢 Announcement</div>
              <div className="text-gray-600 text-sm mt-1">{a.message}</div>
            </div>
          ))}

          {recognitions.map(r=>(
            <div key={r.id} className="bg-white border rounded-lg p-4">
              <div className="font-semibold">⭐ Recognition</div>
              <div className="text-sm text-gray-700 mt-1">{r.message}</div>
            </div>
          ))}

        </div>

      </div>

      {/* RECOGNITION MODAL */}

      {openRecognition && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl p-6 w-[520px] space-y-4">

            <h2 className="text-lg font-semibold">
              Send Recognition
            </h2>

           <select
           value={selectedEmployee}

           onChange={(e) => setSelectedEmployee(e.target.value)}
           className="w-full border rounded-lg px-3 py-2 text-sm"
           >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name || emp.email} — {emp.email}
                </option>
              ))}
              </select>

            {/* BADGE SELECTION */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {name:"Star Performer",icon:"⭐"},
                {name:"Team Player",icon:"🏆"},
                {name:"Above & Beyond",icon:"🔥"},
                {name:"Detail Focused",icon:"🎯"},
                {name:"Great Teamwork",icon:"🤝"},
                {name:"Customer Champ",icon:"🌟"}
              ].map((b)=>{
                return(
                <button
                key={b.name}
                onClick={()=>setBadge(b.name)}
                className={`border rounded-lg p-3 text-sm flex flex-col items-center ${
                  badge===b.name ? "bg-blue-100 border-blue-500":""
                  }`}
                  >
                    <div className="text-xl">{b.icon}</div>
                    <div>{b.name}</div>
                    </button>
                    )
                    })}
                    </div>

            <textarea
              placeholder="Write recognition message..."
              value={message}
              onChange={(e)=>setMessage(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <div className="flex justify-end gap-3">

              <button
                onClick={()=>setOpenRecognition(false)}
                className="border px-4 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={sendRecognition}
                className="bg-black text-white px-4 py-2 rounded-lg"
              >
                Send Recognition
              </button>

            </div>

          </div>

        </div>

      )}

    </ManagerLayout>
  );
}