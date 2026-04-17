import { useEffect, useState } from "react";
import TaskRow from "./TaskRow";
import { listAttachments } from "@/lib/storage";
import { Loader2, InboxIcon } from "lucide-react";

export default function TaskList({ tasks, loading, onSelect }) {
  const [attachCounts, setAttachCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const out = {};
      await Promise.all(
        tasks.map(async (t) => {
          try {
            const items = await listAttachments(t.pert_id);
            out[t.pert_id] = items.length;
          } catch {
            out[t.pert_id] = 0;
          }
        })
      );
      if (!cancelled) setAttachCounts(out);
    }
    if (tasks.length) run();
    else setAttachCounts({});
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading tasks…
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-zinc-500 relative"
        data-testid="tasks-empty-state"
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1762280040702-dbe2f4869712?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGRhcmslMjBnZW9tZXRyaWMlMjBtZXNofGVufDB8fHx8MTc3NjQyMzc0M3ww&ixlib=rb-4.1.0&q=85)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <InboxIcon className="h-8 w-8 mb-3 text-zinc-600" strokeWidth={1.25} />
        <div className="font-display text-sm text-zinc-300">No tasks match your filters</div>
        <div className="text-xs text-zinc-600 mt-1">Try clearing the status chips or date range.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-2" data-testid="task-list">
      {/* column headers */}
      <div className="task-row-grid py-2 px-3 -mx-3 text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/[0.04]">
        <div>PERT ID</div>
        <div>Title</div>
        <div className="task-row-hide-md">Team</div>
        <div>Assignee</div>
        <div>Status</div>
        <div>Due</div>
        <div className="text-right task-row-hide-md">Priority</div>
      </div>
      {tasks.map((t) => (
        <TaskRow
          key={t.pert_id}
          task={t}
          onClick={() => onSelect(t)}
          attachmentsCount={attachCounts[t.pert_id] || 0}
        />
      ))}
    </div>
  );
}
