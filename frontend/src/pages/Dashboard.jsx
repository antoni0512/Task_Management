import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStats, fetchTasks } from "@/lib/api";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import StatusChip from "@/components/tasks/StatusChip";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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
        setQaTasks(t.slice(0, 5));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading dashboard analytics…
      </div>
    );
  }

  const cards = [
    { key: "overdue", label: "Overdue Tasks", value: stats.overdue, icon: AlertTriangle, color: "#EF4444" },
    { key: "in_progress", label: "Work In Progress", value: stats.in_progress, icon: Clock3, color: "#F59E0B" },
    { key: "completed", label: "Successfully Completed", value: stats.completed, icon: CheckCircle2, color: "#10B981" },
    { key: "total", label: "Total Synced Tasks", value: stats.total, icon: TrendingUp, color: "#64748B" },
  ];

  const STATUS_COLORS = {
    Overdue: "#EF4444",
    "In Progress": "#F59E0B",
    Completed: "#10B981",
  };

  const pieData = [
    { name: "Overdue", value: stats.overdue },
    { name: "In Progress", value: stats.in_progress },
    { name: "Completed", value: stats.completed },
  ].filter((d) => d.value > 0);

  const teamData = Object.entries(stats.by_team)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="h-full overflow-y-auto bg-muted/20" data-testid="dashboard-page">
      <div className="px-6 py-8 md:px-10 space-y-8 max-w-[1400px] mx-auto">
        {/* stat KPI cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.key}
                className="border border-border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow cursor-default"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.label}
                  </span>
                  <div className="p-2.5 rounded-xl bg-muted/60">
                    <Icon className="h-4 w-4" style={{ color: c.color }} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="font-display text-4xl font-bold text-foreground tracking-tight">
                  {c.value}
                </div>
              </div>
            );
          })}
        </section>

        {/* interactive charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown Pie Chart */}
          <section className="border border-border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/20">
              <h3 className="font-display text-sm font-semibold text-foreground">Task Status Distribution</h3>
              <p className="text-xs text-muted-foreground mt-1">Breakdown of all active synced tickets</p>
            </div>
            <div className="p-6 flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={85}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Team Distribution Bar Chart */}
          <section className="border border-border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/20">
              <h3 className="font-display text-sm font-semibold text-foreground">Resource Allocation</h3>
              <p className="text-xs text-muted-foreground mt-1">Active tasks assigned per functional team</p>
            </div>
            <div className="p-6 flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#0b6645"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* recent QA items for priority tracking */}
        <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden mb-10">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/20">
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">Priority QA Validation Pipeline</h3>
              <p className="text-xs text-muted-foreground mt-1">Items recently pushed to the quality assurance queue.</p>
            </div>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-md"
            >
              View Queue
            </button>
          </div>
          <ul className="divide-y divide-border">
            {qaTasks.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-muted-foreground">
                No items currently require QA validation.
              </li>
            ) : (
              qaTasks.map((t) => (
                <li
                  key={t.pert_id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate("/tasks")}
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col flex-1 truncate">
                    <span className="text-sm font-semibold text-foreground truncate">{t.title}</span>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">{t.pert_id}</span>
                      <span>•</span>
                      <span>Assigned to {t.assignee}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusChip status={t.status} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

      </div>
    </div>
  );
}
