import { STATUS_META } from "@/lib/api";

export default function StatusChip({ status, size = "sm" }) {
  const meta = STATUS_META[status] || STATUS_META.not_started;
  const px = size === "xs" ? "px-1.5 py-0" : "px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${px} rounded-full text-[11px] font-medium border tracking-wide`}
      style={{ color: meta.text, backgroundColor: meta.bg, borderColor: meta.border }}
      data-testid={`status-chip-${status}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.text }} />
      {meta.label}
    </span>
  );
}
