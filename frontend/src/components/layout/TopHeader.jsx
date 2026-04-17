import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchStats } from "@/lib/api";
import { Loader2 } from "lucide-react";

const ROUTE_TITLES = {
  "/dashboard": { title: "Dashboard", sub: "Overview of all PERT tasks" },
  "/tasks": { title: "Tasks", sub: "Synced from Oracle PERT planning" },
  "/timeline": { title: "Timeline", sub: "Due-date ordered roadmap" },
};

export default function TopHeader() {
  const location = useLocation();
  const meta = ROUTE_TITLES[location.pathname] || ROUTE_TITLES["/tasks"];
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchStats()
      .then((s) => mounted && setStats(s))
      .catch(() => mounted && setStats(null));
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  return (
    <header
      className="h-14 border-b border-white/[0.08] flex items-center justify-between px-6 bg-[#050505] shrink-0"
      data-testid="top-header"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[15px] font-semibold text-white tracking-tight">
            {meta.title}
          </h1>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-zinc-400 text-xs">{meta.sub}</span>
        </div>
      </div>

      <div className="flex items-center gap-5 text-xs" data-testid="header-stats">
        {stats ? (
          <>
            <Stat label="Overdue" value={stats.overdue} color="#F87171" testid="stat-overdue" />
            <Stat label="In Progress" value={stats.in_progress} color="#FBBF24" testid="stat-in_progress" />
            <Stat label="Completed" value={stats.completed} color="#34D399" testid="stat-completed" />
            <div className="keycap" title="Total tasks">{stats.total}</div>
          </>
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
        )}
      </div>
    </header>
  );
}

function Stat({ label, value, color, testid }) {
  return (
    <div className="flex items-center gap-1.5" data-testid={testid}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span className="font-mono text-zinc-100">{value}</span>
      <span className="text-zinc-500">{label}</span>
    </div>
  );
}
