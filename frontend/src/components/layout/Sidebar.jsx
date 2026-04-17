import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListChecks, CalendarRange, Database, Github } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/tasks", label: "Tasks", icon: ListChecks, testid: "nav-tasks" },
  { to: "/timeline", label: "Timeline", icon: CalendarRange, testid: "nav-timeline" },
];

export default function Sidebar() {
  return (
    <aside
      className="w-60 flex-shrink-0 border-r border-white/[0.08] bg-[#0A0A0A] flex flex-col"
      data-testid="sidebar"
    >
      <div className="h-14 flex items-center px-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-white text-black grid place-items-center">
            <Database className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-semibold text-white tracking-tight">
              PERT Atlas
            </span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              Task Console
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-zinc-500">
          Workspace
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testid}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-white/[0.06] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] uppercase tracking-widest text-zinc-500">
          Source
        </div>
        <div
          className="px-3 py-1.5 text-sm text-zinc-500 flex items-center gap-2"
          data-testid="source-oracle"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Oracle · PERT Planning
        </div>
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Github className="h-3.5 w-3.5" />
          <span>v1.0.0 · desktop</span>
        </div>
      </div>
    </aside>
  );
}
