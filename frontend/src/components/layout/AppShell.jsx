import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

export default function AppShell() {
  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-background text-foreground"
      data-testid="app-shell"
    >
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopHeader />
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
