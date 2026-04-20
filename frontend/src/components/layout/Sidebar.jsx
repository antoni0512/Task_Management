import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListChecks, CalendarRange, Database, ChevronLeft, ChevronRight } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/tasks", label: "Tasks", icon: ListChecks, testid: "nav-tasks" },
  { to: "/timeline", label: "Timeline", icon: CalendarRange, testid: "nav-timeline" },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`flex-shrink-0 border-r border-border bg-background flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? "w-16" : "w-60"
        }`}
      data-testid="sidebar"
    >
      <div className="h-14 flex items-center px-4 border-b border-border justify-between">
        {isCollapsed ? (
          <div className="w-full flex justify-center">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition-colors"
              title="Expand Sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center flex-shrink-0">
                <Database className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-tight overflow-hidden">
                <span className="font-display text-sm font-semibold text-foreground tracking-tight truncate">
                  PERT Atlas
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                  Task Console
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 rounded-md hover:bg-muted flex-shrink-0 text-muted-foreground hover:text-foreground grid place-items-center transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-x-hidden">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            Workspace
          </div>
        )}
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              data-testid={item.testid}
              className={({ isActive }) =>
                `group flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 px-3"} py-2 rounded-md text-sm transition-colors ${isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span className="whitespace-nowrap truncate">{item.label}</span>}
            </NavLink>
          );
        })}

      </nav>
    </aside>
  );
}
