from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="PERT Task Manager API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class Task(BaseModel):
    pert_id: str
    title: str
    description: str
    team: str
    status: str  # completed | in_progress | overdue | not_started
    priority: str  # low | medium | high | urgent
    assignee: str
    assignee_email: str
    due_date: str  # ISO
    created_at: str
    updated_at: str
    tags: List[str] = []
    progress: int = 0


class StatsResponse(BaseModel):
    total: int
    completed: int
    in_progress: int
    overdue: int
    not_started: int
    by_team: dict


# ---------- Mock data (simulates data fetched from Oracle) ----------
TEAMS = ["QA", "Development", "UAT", "DevOps", "Product", "Design"]
PRIORITIES = ["low", "medium", "high", "urgent"]
ASSIGNEES = [
    ("Anaya Sharma", "anaya.sharma@corp.io"),
    ("Miguel Alvarez", "miguel.alvarez@corp.io"),
    ("Priya Nair", "priya.nair@corp.io"),
    ("Jonas Weber", "jonas.weber@corp.io"),
    ("Lin Chen", "lin.chen@corp.io"),
    ("Ravi Kapoor", "ravi.kapoor@corp.io"),
    ("Sara El-Amin", "sara.elamin@corp.io"),
    ("Tom Becker", "tom.becker@corp.io"),
]

TASK_TEMPLATES = [
    ("Regression suite for payment gateway", "QA", ["regression", "payments"]),
    ("Smoke tests on release branch v4.2.1", "QA", ["smoke", "release"]),
    ("Automate login flow with Playwright", "QA", ["automation", "auth"]),
    ("Performance benchmark on search API", "QA", ["performance"]),
    ("Accessibility audit — WCAG 2.1 AA", "QA", ["a11y", "audit"]),
    ("Cross-browser testing — Safari 17", "QA", ["cross-browser"]),
    ("Security penetration test — user module", "QA", ["security"]),
    ("Validate invoice PDF generation", "QA", ["validation", "pdf"]),
    ("API contract tests with Pact", "QA", ["contract", "api"]),
    ("Load test checkout — 10k concurrent", "QA", ["load", "performance"]),
    ("Refactor authentication middleware", "Development", ["refactor", "auth"]),
    ("Implement dark mode preference sync", "Development", ["feature", "ui"]),
    ("Fix race condition in order queue", "Development", ["bug", "backend"]),
    ("Migrate legacy SOAP endpoint to REST", "Development", ["migration"]),
    ("Optimize N+1 query in orders list", "Development", ["performance", "db"]),
    ("Add webhook retry with backoff", "Development", ["feature"]),
    ("Client sign-off on billing module", "UAT", ["sign-off"]),
    ("UAT for bulk import feature", "UAT", ["uat"]),
    ("User workshop — new dashboard", "UAT", ["workshop"]),
    ("Deploy staging cluster v4.2.0", "DevOps", ["deploy"]),
    ("Rotate production TLS certificates", "DevOps", ["security"]),
    ("Kubernetes upgrade to 1.29", "DevOps", ["infra"]),
    ("Setup Grafana SLO dashboards", "DevOps", ["monitoring"]),
    ("Draft Q2 product roadmap", "Product", ["planning"]),
    ("Stakeholder review — onboarding", "Product", ["review"]),
    ("Competitor analysis Q1 report", "Product", ["research"]),
    ("Redesign empty state illustrations", "Design", ["design"]),
    ("Design system token audit", "Design", ["design-system"]),
    ("Figma cleanup — deprecated components", "Design", ["cleanup"]),
    ("Mobile onboarding flow v2", "Design", ["mobile"]),
    ("Regression on forgot-password flow", "QA", ["regression", "auth"]),
    ("Validate email templates on Outlook", "QA", ["validation", "email"]),
    ("Fix memory leak in session worker", "Development", ["bug", "critical"]),
    ("Add rate-limiting to public API", "Development", ["feature", "api"]),
    ("UAT feedback triage — release 4.2", "UAT", ["triage"]),
]


def _seeded_tasks() -> List[dict]:
    random.seed(42)
    now = datetime.now(timezone.utc)
    tasks: List[dict] = []
    for idx, (title, team, tags) in enumerate(TASK_TEMPLATES, start=101):
        name, email = random.choice(ASSIGNEES)
        priority = random.choice(PRIORITIES)
        # spread due dates: some past (overdue), some future, some near
        offset_days = random.randint(-14, 30)
        due = now + timedelta(days=offset_days)
        created = now - timedelta(days=random.randint(3, 45))
        updated = created + timedelta(days=random.randint(0, 5))

        # decide status
        r = random.random()
        if r < 0.28:
            status = "completed"
            progress = 100
        elif r < 0.65:
            status = "in_progress"
            progress = random.randint(20, 85)
        elif r < 0.80:
            status = "not_started"
            progress = 0
        else:
            status = "in_progress"
            progress = random.randint(10, 60)

        # overdue derivation: if not completed and due < now
        if status != "completed" and due < now:
            status = "overdue"

        tasks.append({
            "pert_id": f"PERT-{idx}",
            "title": title,
            "description": f"This task tracks work related to '{title}'. Synced from the upstream Oracle PERT planning table. Ownership: {team} team.",
            "team": team,
            "status": status,
            "priority": priority,
            "assignee": name,
            "assignee_email": email,
            "due_date": due.isoformat(),
            "created_at": created.isoformat(),
            "updated_at": updated.isoformat(),
            "tags": tags,
            "progress": progress,
        })
    return tasks


TASKS_CACHE: List[dict] = _seeded_tasks()


def _recompute_overdue(tasks: List[dict]) -> List[dict]:
    now = datetime.now(timezone.utc)
    out = []
    for t in tasks:
        copy = dict(t)
        if copy["status"] != "completed":
            try:
                due = datetime.fromisoformat(copy["due_date"])
                if due < now:
                    copy["status"] = "overdue"
            except Exception:
                pass
        out.append(copy)
    return out


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"service": "PERT Task Manager", "status": "ok"}


@api_router.get("/teams", response_model=List[str])
async def list_teams():
    return TEAMS


@api_router.get("/tasks", response_model=List[Task])
async def list_tasks(
    team: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    tasks = _recompute_overdue(TASKS_CACHE)

    if team and team.lower() != "all":
        tasks = [t for t in tasks if t["team"].lower() == team.lower()]
    if status and status.lower() != "all":
        wanted = [s.strip().lower() for s in status.split(",") if s.strip()]
        tasks = [t for t in tasks if t["status"].lower() in wanted]
    if search:
        q = search.lower()
        tasks = [
            t for t in tasks
            if q in t["pert_id"].lower()
            or q in t["title"].lower()
            or q in t["assignee"].lower()
        ]
    if date_from:
        try:
            df = datetime.fromisoformat(date_from)
            tasks = [t for t in tasks if datetime.fromisoformat(t["due_date"]) >= df]
        except Exception:
            pass
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            tasks = [t for t in tasks if datetime.fromisoformat(t["due_date"]) <= dt]
        except Exception:
            pass

    tasks.sort(key=lambda t: t["due_date"])
    return tasks


@api_router.get("/tasks/{pert_id}", response_model=Task)
async def get_task(pert_id: str):
    tasks = _recompute_overdue(TASKS_CACHE)
    for t in tasks:
        if t["pert_id"].lower() == pert_id.lower():
            return t
    raise HTTPException(status_code=404, detail="Task not found")


@api_router.get("/stats", response_model=StatsResponse)
async def stats():
    tasks = _recompute_overdue(TASKS_CACHE)
    by_team: dict = {}
    for t in tasks:
        by_team[t["team"]] = by_team.get(t["team"], 0) + 1
    return StatsResponse(
        total=len(tasks),
        completed=sum(1 for t in tasks if t["status"] == "completed"),
        in_progress=sum(1 for t in tasks if t["status"] == "in_progress"),
        overdue=sum(1 for t in tasks if t["status"] == "overdue"),
        not_started=sum(1 for t in tasks if t["status"] == "not_started"),
        by_team=by_team,
    )


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
