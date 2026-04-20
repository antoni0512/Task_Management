import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileCode2,
  Trash2,
  Download,
  ExternalLink,
  HardDrive,
  Calendar,
  User,
  Tag,
  Flag,
} from "lucide-react";
import { formatDate, PRIORITY_META } from "@/lib/api";
import StatusChip from "./StatusChip";
import {
  listAttachments,
  saveAttachments,
  readAttachmentUrl,
  deleteAttachment,
  humanSize,
  IS_ELECTRON,
} from "@/lib/storage";

export default function TaskDetailSheet({ task, open, onOpenChange }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const refresh = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const items = await listAttachments(task.pert_id);
      setFiles(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && task) refresh();
    else if (!open) setFiles([]);
    // eslint-disable-next-line
  }, [open, task?.pert_id]);

  const handleUpload = async (list) => {
    if (!task || !list || !list.length) return;
    try {
      await saveAttachments(task.pert_id, list);
      await refresh();
      toast.success(`${list.length} file${list.length > 1 ? "s" : ""} saved locally`, {
        description: IS_ELECTRON ? "Stored in app user-data folder." : "Stored in IndexedDB (web preview).",
      });
    } catch (e) {
      toast.error("Failed to save attachments", { description: String(e?.message || e) });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAttachment(task.pert_id, id);
      await refresh();
      toast.success("Attachment removed");
    } catch (e) {
      toast.error("Failed to delete", { description: String(e?.message || e) });
    }
  };

  const handlePreview = async (f) => {
    const url = await readAttachmentUrl(task.pert_id, f.id);
    if (!url) return toast.error("Could not open file");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (f) => {
    const url = await readAttachmentUrl(task.pert_id, f.id);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[520px] sm:max-w-[520px] bg-background border-l border-border text-foreground p-0 flex flex-col"
        data-testid="task-detail-sheet"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[11px] text-foreground bg-muted px-1.5 py-0.5 rounded border border-border"
              data-testid="detail-pert-id"
            >
              {task.pert_id}
            </span>
            <StatusChip status={task.status} />
            <span
              className="ml-auto text-[10px] uppercase tracking-widest font-medium"
              style={{ color: PRIORITY_META[task.priority]?.text }}
            >
              {PRIORITY_META[task.priority]?.label} priority
            </span>
          </div>
          <SheetTitle className="font-display text-lg text-foreground leading-snug tracking-tight">
            {task.title}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground leading-relaxed">
            {task.description}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-0 border-b border-border">
            <MetaCell icon={User} label="Assignee" value={task.assignee} sub={task.assignee_email} />
            <MetaCell icon={Tag} label="Team" value={task.team} />
            <MetaCell icon={Calendar} label="Due" value={formatDate(task.due_date)} />
            <MetaCell icon={Flag} label="Updated" value={formatDate(task.updated_at)} />
          </div>

          {task.tags?.length ? (
            <div className="px-6 py-3 border-b border-border flex items-center gap-1.5 flex-wrap">
              {task.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}

          {/* Attachments */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display text-sm text-foreground font-medium">Local attachments</h3>
                <p className="text-[11px] text-muted-foreground">
                  Testcases, screenshots and docs for{" "}
                  <span className="font-mono text-foreground">{task.pert_id}</span> — stored{" "}
                  {IS_ELECTRON ? "on this desktop" : "in browser IndexedDB"}.
                </p>
              </div>
              <div
                className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest"
                data-testid="storage-mode"
              >
                <HardDrive className="h-3 w-3" />
                {IS_ELECTRON ? "Disk" : "IDB"}
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={`border border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-all text-center cursor-pointer ${
                dragging
                  ? "border-border bg-muted"
                  : "border-border hover:border-border hover:bg-muted"
              }`}
              data-testid="attachment-dropzone"
            >
              <Upload className="h-5 w-5 text-muted-foreground mb-2" strokeWidth={1.5} />
              <div className="text-sm text-foreground">
                Drag &amp; drop files or <span className="underline decoration-dotted">browse</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Screenshots · PDFs · test scripts · anything (up to 50 MB each)
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                data-testid="attachment-input"
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Files ({files.length})
                </span>
                {loading && <span className="text-[10px] text-muted-foreground">loading…</span>}
              </div>

              {files.length === 0 ? (
                <div className="text-xs text-muted-foreground py-6 text-center border border-border rounded-md">
                  No files attached yet.
                </div>
              ) : (
                <ul className="space-y-1" data-testid="attachment-list">
                  {files.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted group border border-transparent hover:border-border"
                      data-testid={`attachment-item-${f.id}`}
                    >
                      <FileIcon type={f.type} name={f.name} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{f.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {humanSize(f.size)} · {new Date(f.mtime).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconBtn
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(f);
                          }}
                          testid={`attachment-open-${f.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </IconBtn>
                        <IconBtn
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(f);
                          }}
                          testid={`attachment-download-${f.id}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </IconBtn>
                        <IconBtn
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(f.id);
                          }}
                          testid={`attachment-delete-${f.id}`}
                          destructive
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconBtn>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-muted" />
        <div className="p-4 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            PERT title is editable upstream in Oracle — attachments persist by ID
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-transparent border-border text-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onOpenChange(false)}
            data-testid="detail-close"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetaCell({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-4 border-r border-b border-border last:border-r-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm text-foreground">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function IconBtn({ children, onClick, destructive, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
        destructive
          ? "text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function FileIcon({ type = "", name = "" }) {
  const t = (type || "").toLowerCase();
  const n = name.toLowerCase();
  let Icon = FileText;
  let color = "#A1A1AA";
  if (t.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(n)) {
    Icon = ImageIcon;
    color = "#60A5FA";
  } else if (/\.(zip|tar|gz|rar|7z)$/.test(n)) {
    Icon = FileArchive;
    color = "#FBBF24";
  } else if (/\.(js|ts|py|java|rb|go|json|xml|yaml|yml|sh|sql)$/.test(n)) {
    Icon = FileCode2;
    color = "#34D399";
  }
  return (
    <div
      className="h-8 w-8 rounded border border-border bg-muted grid place-items-center"
      style={{ color }}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
    </div>
  );
}
