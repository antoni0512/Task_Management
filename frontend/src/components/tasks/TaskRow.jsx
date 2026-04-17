import { formatDate, daysFromNow, PRIORITY_META } from "@/lib/api";
import StatusChip from "./StatusChip";
import { AlertCircle, Clock, Paperclip } from "lucide-react";

export default function TaskRow({ task, onClick, attachmentsCount = 0 }) {
  const diff = daysFromNow(task.due_date);
  const isPastOverdue = task.status === "overdue";

  return (
    <button
      onClick={onClick}
      data-testid={`task-row-${task.pert_id}`}
      className="task-row-grid w-full py-2.5 px-3 -mx-3 rounded-md text-left hover:bg-white/[0.035] transition-colors border-b border-white/[0.04]"
    >
      {/* PERT ID */}
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-[11px] text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]"
          data-testid={`pert-id-${task.pert_id}`}
        >
          {task.pert_id}
        </span>
      </div>

      {/* Title + tags */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-100 truncate">{task.title}</span>
          {attachmentsCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] text-zinc-500"
              data-testid={`attach-count-${task.pert_id}`}
            >
              <Paperclip className="h-3 w-3" />
              {attachmentsCount}
            </span>
          )}
        </div>
        {task.tags?.length ? (
          <div className="flex items-center gap-1 mt-0.5">
            {task.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] font-mono text-zinc-500"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Team */}
      <div className="text-xs text-zinc-400 task-row-hide-md">{task.team}</div>

      {/* Assignee */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-5 w-5 rounded-full bg-white/10 text-[10px] text-zinc-200 grid place-items-center flex-shrink-0">
          {initials(task.assignee)}
        </div>
        <span className="text-xs text-zinc-400 truncate">{task.assignee}</span>
      </div>

      {/* Status */}
      <StatusChip status={task.status} />

      {/* Due */}
      <div className="text-xs flex items-center gap-1.5">
        {isPastOverdue ? (
          <AlertCircle className="h-3 w-3 text-rose-400" />
        ) : (
          <Clock className="h-3 w-3 text-zinc-500" />
        )}
        <span className={isPastOverdue ? "text-rose-300" : "text-zinc-400"}>
          {formatDate(task.due_date)}
        </span>
      </div>

      {/* Priority dot */}
      <div className="flex items-center justify-end task-row-hide-md">
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: PRIORITY_META[task.priority]?.text }}
          data-testid={`priority-${task.pert_id}`}
        >
          {PRIORITY_META[task.priority]?.label}
        </span>
      </div>
    </button>
  );
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
