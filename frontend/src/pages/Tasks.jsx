import { useEffect, useMemo, useState, useCallback } from "react";
import FiltersToolbar from "@/components/tasks/FiltersToolbar";
import TaskList from "@/components/tasks/TaskList";
import TaskDetailSheet from "@/components/tasks/TaskDetailSheet";
import { fetchTasks } from "@/lib/api";
import { toast } from "sonner";

const DEFAULT_FILTERS = { team: "QA", statuses: [], search: "", dateFrom: "", dateTo: "" };

export default function Tasks() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const debounced = useDebounced(filters, 220);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`[TASKS] Fetching from ${fetchTasks.name} with filters:`, debounced);
      const data = await fetchTasks(debounced);
      console.log(`[TASKS] Received ${data.length} tasks`);
      setTasks(data);
    } catch (e) {
      console.error("[TASKS] Failed to load tasks:", e);
      toast.error("Failed to load tasks", { description: String(e?.message || e) });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const onSelect = (t) => {
    setSelected(t);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col h-full" data-testid="tasks-page">
      <FiltersToolbar filters={filters} setFilters={setFilters} />
      <TaskList tasks={tasks} loading={loading} onSelect={onSelect} />
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
