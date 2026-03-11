import { useEffect, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import { supabase } from "../lib/supabase";
import { useAuthGuard } from "../hooks/useAuthGuard";

type Employee = {
  id: string;
  email: string;
};

export default function Communication() {
  useAuthGuard();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("recognition");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    const { data } = await supabase
      .from("profiles")
      .select("id,email");

    if (data) setEmployees(data);
  }

  function toggleEmployee(id: string) {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((e) => e !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  }

  async function sendMessage() {
    if (!message || selectedEmployees.length === 0) {
      alert("Please select at least one employee and enter a message.");
      return;
    }

    setLoading(true);

    const messages = selectedEmployees.map((empId) => ({
      recipient_id: empId,
      message: message,
      type: type,
    }));

    const { error } = await supabase
      .from("messages")
      .insert(messages);

    if (!error) {
      setMessage("");
      setSelectedEmployees([]);
      alert("Message sent successfully!");
    }

    setLoading(false);
  }

  return (
    <ManagerLayout>
      <div className="p-8 max-w-3xl">

        <h1 className="text-2xl font-semibold mb-6">
          Communication
        </h1>

        <div className="bg-white border rounded-lg p-6 space-y-6">

          {/* Select employees */}
          <div>
            <label className="text-sm font-medium">
              Select Employees
            </label>

            <div className="mt-2 border rounded p-3 max-h-40 overflow-y-auto space-y-2">

              {employees.map((emp) => (
                <label
                  key={emp.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                  />
                  {emp.email}
                </label>
              ))}

            </div>
          </div>

          {/* Message type */}
          <div>
            <label className="text-sm font-medium">
              Message Type
            </label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded p-2 mt-1"
            >
              <option value="recognition">Recognition</option>
              <option value="announcement">Announcement</option>
              <option value="message">Direct Message</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium">
              Message
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded p-3 mt-1 h-28"
              placeholder="Write your message..."
            />
          </div>

          {/* Send */}
          <div className="flex justify-end">

            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>

          </div>

        </div>

      </div>
    </ManagerLayout>
  );
}