import { useEffect, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import DarkPage from "./components/DarkPage";
import { supabase } from "../lib/supabase";

type Shift = {
  id: string;
  employee_name: string;
  role: string;
  start_time: string;
};

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    fetchShifts();
  }, []);

  async function fetchShifts() {
    const { data, error } = await supabase
      .from("shifts")
      .select("*");

    if (!error) setShifts(data || []);
  }

  return (
    <ManagerLayout>
      <DarkPage title="Shift Management">

        <table className="w-full text-sm">
          <thead className="border-b border-gray-800 text-gray-400">
            <tr>
              <th className="text-left py-3">Employee</th>
              <th className="text-left py-3">Role</th>
              <th className="text-left py-3">Start Time</th>
            </tr>
          </thead>

          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id} className="border-b border-gray-800">
                <td className="py-3">{shift.employee_name}</td>
                <td>{shift.role}</td>
                <td>{shift.start_time}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </DarkPage>
    </ManagerLayout>
  );
}