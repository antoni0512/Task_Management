import { useMemo } from "react";
import { formatDate, daysFromNow, STATUS_META } from "@/lib/api";
import StatusChip from "./StatusChip";

/**
 * Simple Linear-style timeline: groups tasks by week buckets relative to today.
 */
export default function TimelineView({ tasks, onSelect }) {
  const buckets = useMemo(() => {
    const groups = {
      "Past due": [],
      "This week": [],
      "Next week": [],
      Upcoming: [],
      "No date": [],
    };
    for (const t of tasks) {
      const diff = daysFromNow(t.due_date);
      if (diff == null) groups["No date"].push(t);
      else if (diff < 0) groups["Past due"].push(t);
      else if (diff <= 7) groups["This week"].push(t);
      else if (diff <= 14) groups["Next week"].push(t);
      else groups["Upcoming"].push(t);
    }
    return groups;
  }, [tasks]);

  const entries = Object.entries(buckets).filter(([, v]) => v.length > 0);

  if (!entries.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No tasks to plot on the timeline.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8" data-testid="timeline-view">
      {entries.map(([label, items]) => (
        <section key={label} data-testid={`timeline-bucket-${label.toLowerCase().replace(/\s+/g, "-")}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
            <div className="flex-1 h-px bg-muted" />
            <span className="font-mono text-[10px] text-muted-foreground">{items.length}</span>
          </div>
          <div className="relative pl-5 border-l border-border space-y-2">
            {items.map((t) => {
              const diff = daysFromNow(t.due_date);
              const meta = STATUS_META[t.status];
              return (
                <button
                  key={t.pert_id}
                  onClick={() => onSelect(t)}
                  data-testid={`timeline-task-${t.pert_id}`}
                  className="relative w-full text-left flex items-center gap-3 p-3 rounded-md border border-border bg-muted hover:bg-muted hover:border-border transition-colors"
                >
                  <span
                    className="absolute -left-[25px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ring-4 ring-[#050505]"
                    style={{ background: meta.text }}
                  />
                  <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border flex-shrink-0">
                    {t.pert_id}
                  </span>
                  <span className="text-sm text-foreground flex-1 truncate">{t.title}</span>
                  <StatusChip status={t.status} size="xs" />
                  <span
                    className={`text-xs font-mono ${
                      diff < 0 ? "text-rose-300" : "text-muted-foreground"
                    }`}
                  >
                    {formatDate(t.due_date)}
                    {diff != null && (
                      <span className="text-muted-foreground ml-1.5">
                        ({diff >= 0 ? `in ${diff}d` : `${-diff}d ago`})
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
