import { useEffect, useMemo, useState, useCallback } from "react";
import FiltersToolbar from "@/components/tasks/FiltersToolbar";
import TimelineView from "@/components/tasks/TimelineView";
import TaskDetailSheet from "@/components/tasks/TaskDetailSheet";
import { fetchTasks } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DEFAULT_FILTERS = { team: "QA", statuses: [], search: "", dateFrom: "", dateTo: "" };

export default function Timeline() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const debounced = useDebounced(filters, 220);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks(debounced);
      setTasks(data);
    } catch (e) {
      toast.error("Failed to load timeline", { description: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col h-full" data-testid="timeline-page">
      <FiltersToolbar filters={filters} setFilters={setFilters} />
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading timeline…
        </div>
      ) : (
        <TimelineView
          tasks={tasks}
          onSelect={(t) => {
            setSelected(t);
            setSheetOpen(true);
          }}
        />
      )}
      <TaskDetailSheet task={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

function useDebounced(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return useMemo(() => v, [v]);
}
