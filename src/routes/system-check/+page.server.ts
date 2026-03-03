import db from '$lib/server/db/database';

/* =========================================================
   PURE CALCULATION — no DB mutation
========================================================= */

function calculateProjectProgress(projectId: number) {

  const rocks = db.prepare(
    `SELECT id FROM rocks WHERE project_id=?`
  ).all(projectId) as { id: number }[];

  let total = 0;

  for (const r of rocks) {

    const tasks = db.prepare(
      `SELECT completed FROM tasks WHERE rock_id=?`
    ).all(r.id) as { completed: number }[];

    let rockPercent = 0;

    if (tasks.length > 0) {
      const done = tasks.filter(t => t.completed === 1).length;
      rockPercent = (done / tasks.length) * 100;
    }

    total += rockPercent;
  }

  return rocks.length > 0 ? total / rocks.length : 0;
}

/* =========================================================
   CYCLE DETECTION
========================================================= */

function detectCycle(): boolean {

  const visited = new Set<number>();
  const stack = new Set<number>();

  function dfs(node: number): boolean {

    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    const children = db.prepare(
      `SELECT linked_project_id FROM project_links WHERE project_id=?`
    ).all(node) as { linked_project_id: number }[];

    for (const child of children) {
      if (dfs(child.linked_project_id)) return true;
    }

    stack.delete(node);
    return false;
  }

  const projects = db.prepare(
    `SELECT id FROM projects`
  ).all() as { id: number }[];

  return projects.some(p => dfs(p.id));
}

/* =========================================================
   SYSTEM CHECK
========================================================= */

export const load = async () => {

  const report = {
    progressMismatch: [] as any[],
    timelineViolations: [] as any[],
    circularDependencies: false,
    dependencyProgressInvalid: [] as any[],
    overflow: [] as any[],
    orphanRocks: [] as any[],
    orphanTasks: [] as any[]
  };

  /* --------------------------
     1️⃣ Progress Integrity
  -------------------------- */

  const projects = db.prepare(
    `SELECT id, progress_cached FROM projects`
  ).all() as { id: number; progress_cached: number }[];

  for (const p of projects) {

    const actual = calculateProjectProgress(p.id);

    if (Math.abs(actual - p.progress_cached) > 0.01) {
      report.progressMismatch.push({
        projectId: p.id,
        cached: p.progress_cached,
        actual
      });
    }

    if (p.progress_cached > 100 || p.progress_cached < 0) {
      report.overflow.push({
        projectId: p.id,
        progress: p.progress_cached
      });
    }
  }

  /* --------------------------
     2️⃣ Timeline Integrity
  -------------------------- */

  const rocks = db.prepare(`
    SELECT r.id,
           r.timeline_start,
           r.timeline_end,
           p.timeline_start as project_start,
           p.timeline_end as project_end
    FROM rocks r
    JOIN projects p ON p.id = r.project_id
  `).all() as any[];

  for (const r of rocks) {
    if (
      r.timeline_start < r.project_start ||
      r.timeline_end > r.project_end
    ) {
      report.timelineViolations.push({
        rockId: r.id
      });
    }
  }

  /* --------------------------
     3️⃣ Circular Dependencies
  -------------------------- */

  report.circularDependencies = detectCycle();

  /* --------------------------
     4️⃣ Dependency Validity
  -------------------------- */

  const dependencies = db.prepare(`
    SELECT pl.project_id,
           pl.linked_project_id,
           p.progress_cached
    FROM project_links pl
    JOIN projects p ON p.id = pl.linked_project_id
    WHERE pl.link_type='dependency'
  `).all() as any[];

  for (const d of dependencies) {
    if (d.progress_cached < 0 || d.progress_cached > 100) {
      report.dependencyProgressInvalid.push(d);
    }
  }

  /* --------------------------
     5️⃣ Orphan Rocks
  -------------------------- */

  const orphanRocks = db.prepare(`
    SELECT r.id
    FROM rocks r
    LEFT JOIN projects p ON p.id = r.project_id
    WHERE p.id IS NULL
  `).all();

  report.orphanRocks = orphanRocks;

  /* --------------------------
     6️⃣ Orphan Tasks
  -------------------------- */

  const orphanTasks = db.prepare(`
    SELECT t.id
    FROM tasks t
    LEFT JOIN rocks r ON r.id = t.rock_id
    WHERE r.id IS NULL
  `).all();

  report.orphanTasks = orphanTasks;

  /* --------------------------
     FINAL HEALTH STATUS
  -------------------------- */

  const healthy =
    report.progressMismatch.length === 0 &&
    report.timelineViolations.length === 0 &&
    !report.circularDependencies &&
    report.dependencyProgressInvalid.length === 0 &&
    report.overflow.length === 0 &&
    report.orphanRocks.length === 0 &&
    report.orphanTasks.length === 0;

  return {
    healthy,
    report
  };
};