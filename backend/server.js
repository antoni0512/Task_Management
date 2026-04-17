require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    credentials: true,
}));

// ---------- Mock data ----------
const TEAMS = ["QA", "Development", "UAT", "DevOps", "Product", "Design"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const ASSIGNEES = [
    ["Anaya Sharma", "anaya.sharma@corp.io"],
    ["Miguel Alvarez", "miguel.alvarez@corp.io"],
    ["Priya Nair", "priya.nair@corp.io"],
    ["Jonas Weber", "jonas.weber@corp.io"],
    ["Lin Chen", "lin.chen@corp.io"],
    ["Ravi Kapoor", "ravi.kapoor@corp.io"],
    ["Sara El-Amin", "sara.elamin@corp.io"],
    ["Tom Becker", "tom.becker@corp.io"],
];

const TASK_TEMPLATES = [
    ["Regression suite for payment gateway", "QA", ["regression", "payments"]],
    ["Smoke tests on release branch v4.2.1", "QA", ["smoke", "release"]],
    ["Automate login flow with Playwright", "QA", ["automation", "auth"]],
    ["Performance benchmark on search API", "QA", ["performance"]],
    ["Accessibility audit — WCAG 2.1 AA", "QA", ["a11y", "audit"]],
    ["Cross-browser testing — Safari 17", "QA", ["cross-browser"]],
    ["Security penetration test — user module", "QA", ["security"]],
    ["Validate invoice PDF generation", "QA", ["validation", "pdf"]],
    ["API contract tests with Pact", "QA", ["contract", "api"]],
    ["Load test checkout — 10k concurrent", "QA", ["load", "performance"]],
    ["Refactor authentication middleware", "Development", ["refactor", "auth"]],
    ["Implement dark mode preference sync", "Development", ["feature", "ui"]],
    ["Fix race condition in order queue", "Development", ["bug", "backend"]],
    ["Migrate legacy SOAP endpoint to REST", "Development", ["migration"]],
    ["Optimize N+1 query in orders list", "Development", ["performance", "db"]],
    ["Add webhook retry with backoff", "Development", ["feature"]],
    ["Client sign-off on billing module", "UAT", ["sign-off"]],
    ["UAT for bulk import feature", "UAT", ["uat"]],
    ["User workshop — new dashboard", "UAT", ["workshop"]],
    ["Deploy staging cluster v4.2.0", "DevOps", ["deploy"]],
    ["Rotate production TLS certificates", "DevOps", ["security"]],
    ["Kubernetes upgrade to 1.29", "DevOps", ["infra"]],
    ["Setup Grafana SLO dashboards", "DevOps", ["monitoring"]],
    ["Draft Q2 product roadmap", "Product", ["planning"]],
    ["Stakeholder review — onboarding", "Product", ["review"]],
    ["Competitor analysis Q1 report", "Product", ["research"]],
    ["Redesign empty state illustrations", "Design", ["design"]],
    ["Design system token audit", "Design", ["design-system"]],
    ["Figma cleanup — deprecated components", "Design", ["cleanup"]],
    ["Mobile onboarding flow v2", "Design", ["mobile"]],
    ["Regression on forgot-password flow", "QA", ["regression", "auth"]],
    ["Validate email templates on Outlook", "QA", ["validation", "email"]],
    ["Fix memory leak in session worker", "Development", ["bug", "critical"]],
    ["Add rate-limiting to public API", "Development", ["feature", "api"]],
    ["UAT feedback triage — release 4.2", "UAT", ["triage"]],
];

// Simple Seeded Random purely to match predictable Python behavior for UI testing
let seed = 42;
function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
function randomInt(min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
}
function choice(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

function _seeded_tasks() {
    seed = 42; // reset seed on generation
    const now = new Date();
    const tasks = [];

    // start at index 101 to match python behaviour
    for (let i = 0; i < TASK_TEMPLATES.length; i++) {
        const [title, team, tags] = TASK_TEMPLATES[i];
        const [name, email] = choice(ASSIGNEES);
        const priority = choice(PRIORITIES);

        const offset_days = randomInt(-14, 30);
        const due = new Date(now.getTime() + offset_days * 24 * 60 * 60 * 1000);

        const created_days = randomInt(3, 45);
        const created = new Date(now.getTime() - created_days * 24 * 60 * 60 * 1000);

        const updated_days = randomInt(0, 5);
        const updated = new Date(created.getTime() + updated_days * 24 * 60 * 60 * 1000);

        const r = random();
        let status, progress;
        if (r < 0.28) {
            status = "completed";
            progress = 100;
        } else if (r < 0.65) {
            status = "in_progress";
            progress = randomInt(20, 85);
        } else if (r < 0.80) {
            status = "not_started";
            progress = 0;
        } else {
            status = "in_progress";
            progress = randomInt(10, 60);
        }

        if (status !== "completed" && due < now) {
            status = "overdue";
        }

        tasks.push({
            pert_id: `PERT-${i + 101}`,
            title,
            description: `This task tracks work related to '${title}'. Synced from the upstream Oracle PERT planning table. Ownership: ${team} team.`,
            team,
            status,
            priority,
            assignee: name,
            assignee_email: email,
            due_date: due.toISOString(),
            created_at: created.toISOString(),
            updated_at: updated.toISOString(),
            tags,
            progress,
        });
    }
    return tasks;
}

const TASKS_CACHE = _seeded_tasks();

function _recompute_overdue(tasksList) {
    const now = new Date();
    return tasksList.map(t => {
        const copy = { ...t };
        if (copy.status !== "completed") {
            try {
                const due = new Date(copy.due_date);
                if (due < now) {
                    copy.status = "overdue";
                }
            } catch (e) {
                // ignore invalid dates
            }
        }
        return copy;
    });
}

// ---------- Routes ----------
const apiRouter = express.Router();

apiRouter.get("/", (req, res) => {
    res.json({ service: "PERT Task Manager", status: "ok" });
});

apiRouter.get("/teams", (req, res) => {
    res.json(TEAMS);
});

apiRouter.get("/tasks", (req, res) => {
    const { team, status, search, date_from, date_to } = req.query;
    let tasks = _recompute_overdue(TASKS_CACHE);

    if (team && team.toLowerCase() !== "all") {
        tasks = tasks.filter(t => t.team.toLowerCase() === team.toLowerCase());
    }

    if (status && status.toLowerCase() !== "all") {
        const wanted = status.split(",").map(s => s.trim().toLowerCase()).filter(s => s);
        tasks = tasks.filter(t => wanted.includes(t.status.toLowerCase()));
    }

    if (search) {
        const q = search.toLowerCase();
        tasks = tasks.filter(t =>
            t.pert_id.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q) ||
            t.assignee.toLowerCase().includes(q)
        );
    }

    if (date_from) {
        const df = new Date(date_from);
        if (!isNaN(df)) {
            tasks = tasks.filter(t => new Date(t.due_date) >= df);
        }
    }

    if (date_to) {
        const dt = new Date(date_to);
        if (!isNaN(dt)) {
            tasks = tasks.filter(t => new Date(t.due_date) <= dt);
        }
    }

    tasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    res.json(tasks);
});

apiRouter.get("/tasks/:pert_id", (req, res) => {
    const pert_id = req.params.pert_id;
    const tasks = _recompute_overdue(TASKS_CACHE);
    const task = tasks.find(t => t.pert_id.toLowerCase() === pert_id.toLowerCase());

    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ detail: "Task not found" });
    }
});

apiRouter.get("/stats", (req, res) => {
    const tasks = _recompute_overdue(TASKS_CACHE);
    const by_team = {};

    let completed = 0;
    let in_progress = 0;
    let overdue = 0;
    let not_started = 0;

    for (const t of tasks) {
        by_team[t.team] = (by_team[t.team] || 0) + 1;
        if (t.status === "completed") completed++;
        else if (t.status === "in_progress") in_progress++;
        else if (t.status === "overdue") overdue++;
        else if (t.status === "not_started") not_started++;
    }

    res.json({
        total: tasks.length,
        completed,
        in_progress,
        overdue,
        not_started,
        by_team
    });
});

app.use("/api", apiRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
