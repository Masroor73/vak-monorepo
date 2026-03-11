import ManagerLayout from "./layouts/ManagerLayout";
import DarkPage from "./components/DarkPage";

const tasks = [
  { name: "Clean Storage Area", status: "Completed" },
  { name: "Check Equipment", status: "Pending" },
  { name: "Inventory Audit", status: "In Progress" },
];

export default function Tasks() {
  return (
    <ManagerLayout>
      <DarkPage
        title="Tasks & Waste"
        subtitle="Monitor operational tasks and waste reports."
      >

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.name}
              className="flex justify-between bg-auth-input border border-auth-border px-4 py-3"
            >
              <span>{task.name}</span>
              <span className="text-auth-textSecondary">{task.status}</span>
            </div>
          ))}
        </div>

      </DarkPage>
    </ManagerLayout>
  );
}