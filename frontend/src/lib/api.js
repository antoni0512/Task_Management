import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, timeout: 15000 });

export async function fetchTeams() {
  const { data } = await client.get("/teams");
  return data;
}

export async function fetchTasks(filters = {}) {
  const params = {};
  if (filters.team && filters.team !== "all") params.team = filters.team;
  if (filters.statuses && filters.statuses.length) params.status = filters.statuses.join(",");
  if (filters.search) params.search = filters.search;
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;
  const { data } = await client.get("/tasks", { params });
  return data;
}

export async function fetchTask(pertId) {
  const { data } = await client.get(`/tasks/${pertId}`);
  return data;
}

export async function fetchStats() {
  const { data } = await client.get("/stats");
  return data;
}

export const STATUS_META = {
  completed: { label: "Completed", text: "#34D399", bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.25)" },
  in_progress: { label: "In Progress", text: "#FBBF24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)" },
  overdue: { label: "Overdue", text: "#F87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  not_started: { label: "Not Started", text: "#A1A1AA", bg: "rgba(161,161,170,0.08)", border: "rgba(161,161,170,0.22)" },
};

export const PRIORITY_META = {
  urgent: { label: "Urgent", text: "#F87171" },
  high: { label: "High", text: "#FBBF24" },
  medium: { label: "Medium", text: "#A1A1AA" },
  low: { label: "Low", text: "#71717A" },
};

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

export function daysFromNow(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.round((d - now) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
}
