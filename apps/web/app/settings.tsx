import ManagerLayout from "./layouts/ManagerLayout";
import DarkPage from "./components/DarkPage";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function Settings() {
  useAuthGuard();
  return (
    <ManagerLayout>
      <DarkPage
        title="System Settings"
        subtitle="Configure application preferences."
      >

        <div className="space-y-4">

          <div className="flex justify-between bg-auth-input border border-auth-border px-4 py-3">
            <span>Email Notifications</span>
            <input type="checkbox" />
          </div>

          <div className="flex justify-between bg-auth-input border border-auth-border px-4 py-3">
            <span>Maintenance Mode</span>
            <input type="checkbox" />
          </div>

        </div>

      </DarkPage>
    </ManagerLayout>
  );
}