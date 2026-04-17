import { useEffect, useState } from "react";
import { Search, X, CalendarDays } from "lucide-react";
import { fetchTeams, STATUS_META } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUS_KEYS = ["in_progress", "overdue", "completed", "not_started"];

export default function FiltersToolbar({ filters, setFilters }) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetchTeams().then(setTeams).catch(() => setTeams([]));
  }, []);

  const toggleStatus = (key) => {
    const exists = filters.statuses.includes(key);
    setFilters({
      ...filters,
      statuses: exists ? filters.statuses.filter((s) => s !== key) : [...filters.statuses, key],
    });
  };

  const clearAll = () => {
    setFilters({ team: "QA", statuses: [], search: "", dateFrom: "", dateTo: "" });
  };

  const hasDate = filters.dateFrom || filters.dateTo;

  return (
    <div
      className="py-3 px-6 border-b border-white/[0.06] flex flex-wrap items-center gap-3 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-10 shrink-0"
      data-testid="filters-toolbar"
    >
      {/* Team selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">Team</span>
        <Select
          value={filters.team}
          onValueChange={(v) => setFilters({ ...filters, team: v })}
        >
          <SelectTrigger
            className="h-8 w-[140px] bg-transparent border-white/10 text-zinc-200 focus:ring-0 focus:ring-offset-0"
            data-testid="filter-team-trigger"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0F0F0F] border-white/10 text-zinc-200">
            <SelectItem value="all" data-testid="filter-team-all">All teams</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t} value={t} data-testid={`filter-team-${t}`}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-1.5" data-testid="status-chips-row">
        {STATUS_KEYS.map((k) => {
          const meta = STATUS_META[k];
          const active = filters.statuses.includes(k);
          return (
            <button
              key={k}
              onClick={() => toggleStatus(k)}
              data-testid={`filter-status-${k}`}
              className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors ${
                active
                  ? "text-black"
                  : "text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200"
              }`}
              style={
                active
                  ? { background: meta.text, borderColor: meta.text }
                  : {}
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: active ? "rgba(0,0,0,0.6)" : meta.text }}
              />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`h-8 px-2.5 bg-transparent border-white/10 text-xs ${
              hasDate ? "text-white border-white/20" : "text-zinc-400"
            } hover:bg-white/5 hover:text-zinc-100`}
            data-testid="filter-daterange-trigger"
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            {hasDate
              ? `${filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : "…"} → ${
                  filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : "…"
                }`
              : "Due range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-[#0F0F0F] border-white/10"
          align="start"
        >
          <Calendar
            mode="range"
            selected={{
              from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
              to: filters.dateTo ? new Date(filters.dateTo) : undefined,
            }}
            onSelect={(range) =>
              setFilters({
                ...filters,
                dateFrom: range?.from ? range.from.toISOString() : "",
                dateTo: range?.to ? range.to.toISOString() : "",
              })
            }
            className="p-3"
          />
          <div className="p-2 border-t border-white/10 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-zinc-400 hover:text-white"
              onClick={() => setFilters({ ...filters, dateFrom: "", dateTo: "" })}
              data-testid="filter-daterange-clear"
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Search */}
      <div className="relative flex-1 min-w-[220px] max-w-md ml-auto">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search by PERT-ID, title, assignee…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          data-testid="filter-search-input"
          className="h-8 pl-8 pr-8 bg-[#0F0F0F] border-white/10 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:ring-offset-0"
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ ...filters, search: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            data-testid="filter-search-clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-zinc-400 hover:text-white hover:bg-white/5"
        onClick={clearAll}
        data-testid="filter-clear-all"
      >
        Reset
      </Button>
    </div>
  );
}
