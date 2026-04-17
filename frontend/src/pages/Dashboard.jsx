import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStats, fetchTasks, STATUS_META } from "@/lib/api";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import StatusChip from "@/components/tasks/StatusChip";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [qaTasks, setQaTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchStats(), fetchTasks({ team: "QA" })])
      .then(([s, t]) => {
        if (!mounted) return;
        setStats(s);
        setQaTasks(t.slice(0, 6));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading dashboard…
      </div>
    );
  }

  const cards = [
    { key: "overdue", label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "#F87171" },
    { key: "in_progress", label: "In progress", value: stats.in_progress, icon: Clock3, color: "#FBBF24" },
    { key: "completed", label: "Completed", value: stats.completed, icon: CheckCircle2, color: "#34D399" },
    { key: "total", label: "Total tasks", value: stats.total, icon: TrendingUp, color: "#EDEDED" },
  ];

  return (
    <div className="flex-1 overflow-y-auto" data-testid="dashboard-page">
      <div className="px-6 py-6 space-y-8">
        {/* hero */}
        <section className="relative border border-white/[0.06] rounded-lg p-8 overflow-hidden grid-bg">
          <div className="relative z-10 max-w-2xl">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
              PERT ATLAS · ORACLE SYNC
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-white font-semibold tracking-tight">
              {stats.overdue > 0
                ? `${stats.overdue} task${stats.overdue > 1 ? "s are" : " is"} past due`
                : "All tasks are on track"}
            </h2>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Streaming from the upstream Oracle PERT planning table. Attachments
              (testcases, screenshots, docs) stay local — keyed by PERT ID — even when the
              upstream title changes.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => navigate("/tasks")}
                className="h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                data-testid="hero-cta-tasks"
              >
                Open task queue
              </button>
              <button
                onClick={() => navigate("/timeline")}
                className="h-9 px-4 rounded-md border border-white/10 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                data-testid="hero-cta-timeline"
              >
                View timeline
              </button>
            </div>
          </div>
        </section>

        {/* stat cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="dashboard-stats">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.key}
                className="border border-white/[0.06] rounded-md p-4 bg-[#0B0B0B]"
                data-testid={`dashboard-card-${c.key}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                    {c.label}
                  </span>
                  <Icon className="h-3.5 w-3.5" style={{ color: c.color }} strokeWidth={1.75} />
                </div>
                <div className="mt-3 font-display text-3xl text-white tracking-tight">
                  {c.value}
                </div>
              </div>
            );
          })}
        </section>

        {/* team distribution */}
        <section className="border border-white/[0.06] rounded-md bg-[#0B0B0B]">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-display text-sm text-white">Tasks by team</h3>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              pulled from Oracle
            </span>
          </div>
          <div className="p-4 space-y-2">
            {Object.entries(stats.by_team)
              .sort((a, b) => b[1] - a[1])
              .map(([team, count]) => {
                const pct = (count / stats.total) * 100;
                return (
                  <div key={team} className="flex items-center gap-3" data-testid={`team-bar-${team}`}>
                    <div className="w-28 text-xs text-zinc-400">{team}</div>
                    <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-8 text-right font-mono text-xs text-zinc-300">{count}</div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* recent QA */}
        <section className="border border-white/[0.06] rounded-md bg-[#0B0B0B]">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-display text-sm text-white">Upcoming · QA</h3>
            <button
              onClick={() => navigate("/tasks")}
              className="text-[11px] text-zinc-400 hover:text-white"
              data-testid="dashboard-qa-more"
            >
              Open queue →
            </button>
          </div>
          <ul className="divide-y divide-white/[0.04]">
            {qaTasks.map((t) => (
              <li
                key={t.pert_id}
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.03] cursor-pointer"
                onClick={() => navigate("/tasks")}
                data-testid={`dashboard-qa-${t.pert_id}`}
              >
                <span className="font-mono text-[11px] text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  {t.pert_id}
                </span>
                <span className="text-sm text-zinc-100 flex-1 truncate">{t.title}</span>
                <StatusChip status={t.status} size="xs" />
                <span className="text-xs text-zinc-500">{t.assignee}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
