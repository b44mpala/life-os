import db from '$lib/server/db/database';
import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';

/* =========================================================
   SETTINGS
========================================================= */

function isStrictMode(): boolean {
  const setting = db.prepare(
    `SELECT value FROM settings WHERE key='dependency_mode'`
  ).get() as { value: string } | undefined;

  return setting?.value === 'strict';
}

/* =========================================================
   DEPENDENCY CHECK
========================================================= */

function isBlocked(projectId: number): boolean {
  const blocking = db.prepare(`
    SELECT p.progress_cached
    FROM project_links pl
    JOIN projects p ON p.id = pl.linked_project_id
    WHERE pl.project_id=? AND pl.link_type='dependency'
  `).all(projectId) as { progress_cached: number }[];

  return blocking.some(p => p.progress_cached < 100);
}

/* =========================================================
   CYCLE DETECTION
========================================================= */

function createsCycle(source: number, target: number): boolean {

  const visited = new Set<number>();

  function dfs(current: number): boolean {
    if (current === source) return true;
    if (visited.has(current)) return false;

    visited.add(current);

    const children = db.prepare(
      `SELECT linked_project_id FROM project_links WHERE project_id=?`
    ).all(current) as { linked_project_id: number }[];

    return children.some(c => dfs(c.linked_project_id));
  }

  return dfs(target);
}

/* =========================================================
   RECOMPUTE ENGINE
========================================================= */

function recomputeProject(projectId: number) {

  const rocks = db.prepare(
    `SELECT id FROM rocks WHERE project_id=?`
  ).all(projectId) as { id: number }[];

  let total = 0;

  for (const r of rocks) {

    const tasks = db.prepare(
      `SELECT completed FROM tasks WHERE rock_id=?`
    ).all(r.id) as { completed: number }[];

    let percent = 0;

    if (tasks.length > 0) {
      const done = tasks.filter(t => t.completed === 1).length;
      percent = (done / tasks.length) * 100;
    }

    db.prepare(
      `UPDATE rocks SET progress_cached=? WHERE id=?`
    ).run(percent, r.id);

    total += percent;
  }

  const projectPercent =
    rocks.length > 0 ? total / rocks.length : 0;

  db.prepare(
    `UPDATE projects SET progress_cached=? WHERE id=?`
  ).run(projectPercent, projectId);
}

/* =========================================================
   LOAD
========================================================= */

export const load = async ({ params }) => {

  const projectId = Number(params.id);

  const project = db.prepare(
    `SELECT * FROM projects WHERE id=?`
  ).get(projectId);

  if (!project) {
    return {
      project: null,
      rocks: [],
      tasks: [],
      linkedProjects: [],
      allProjects: [],
      isBlocked: false,
      daysLeft: 0,
      completedRocks: 0,
      totalRocks: 0
    };
  }

  const rocks = db.prepare(
    `SELECT * FROM rocks WHERE project_id=?`
  ).all(projectId);

  const tasks = db.prepare(
    `SELECT * FROM tasks WHERE rock_id IN (SELECT id FROM rocks WHERE project_id=?)`
  ).all(projectId);

  const linkedProjects = db.prepare(`
    SELECT p.id, p.title, p.progress_cached, pl.link_type
    FROM project_links pl
    JOIN projects p ON p.id = pl.linked_project_id
    WHERE pl.project_id=?
  `).all(projectId);

  const allProjects = db.prepare(
    `SELECT id, title FROM projects WHERE id != ?`
  ).all(projectId);

  const today = new Date();
  const end = new Date(project.timeline_end);

  const daysLeft = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const completedRocks =
    rocks.filter(r => r.progress_cached === 100).length;

  return {
    project,
    rocks,
    tasks,
    linkedProjects,
    allProjects,
    isBlocked: isBlocked(projectId),
    daysLeft,
    completedRocks,
    totalRocks: rocks.length
  };
};

/* =========================================================
   ACTIONS
========================================================= */

export const actions: Actions = {

  /* ---------- ADD ROCK ---------- */

  addRock: async ({ request, params }) => {

    const projectId = Number(params.id);

    if (isStrictMode() && isBlocked(projectId))
      return fail(400, { error: 'Blocked by dependency' });

    const form = await request.formData();

    const title = form.get('title') as string;
    const start = form.get('timeline_start') as string;
    const end = form.get('timeline_end') as string;

    db.transaction(() => {

      db.prepare(`
        INSERT INTO rocks (project_id,title,timeline_start,timeline_end)
        VALUES (?, ?, ?, ?)
      `).run(projectId, title, start, end);

      recomputeProject(projectId);

    })();

    throw redirect(303, `/project/${projectId}`);
  },

  /* ---------- DELETE ROCK (FIXED + SAFE) ---------- */

  deleteRock: async ({ request, params }) => {

    const projectId = Number(params.id);

    if (isStrictMode() && isBlocked(projectId))
      return fail(400, { error: 'Blocked by dependency' });

    const form = await request.formData();
    const rockId = Number(form.get('rock_id'));

    if (!rockId)
      return fail(400, { error: 'Invalid rock ID' });

    db.transaction(() => {

      const rock = db.prepare(
        `SELECT id FROM rocks WHERE id=? AND project_id=?`
      ).get(rockId, projectId);

      if (!rock)
        throw new Error('Rock does not belong to this project');

      db.prepare(
        `DELETE FROM rocks WHERE id=?`
      ).run(rockId);

      recomputeProject(projectId);

    })();

    throw redirect(303, `/project/${projectId}`);
  },

  /* ---------- EDIT ROCK ---------- */

  editRock: async ({ request, params }) => {

    const projectId = Number(params.id);

    if (isStrictMode() && isBlocked(projectId))
      return fail(400, { error: 'Blocked by dependency' });

    const form = await request.formData();

    const rockId = Number(form.get('rock_id'));
    const title = form.get('title') as string;
    const start = form.get('timeline_start') as string;
    const end = form.get('timeline_end') as string;
    const reason = form.get('extension_reason') as string;

    const existing = db.prepare(
      `SELECT timeline_end FROM rocks WHERE id=?`
    ).get(rockId) as { timeline_end: string };

    db.transaction(() => {

      db.prepare(`
        UPDATE rocks
        SET title=?, timeline_start=?, timeline_end=?
        WHERE id=?
      `).run(title, start, end, rockId);

      if (existing.timeline_end !== end) {
        db.prepare(`
          INSERT INTO timeline_logs
          (entity_type, entity_id, previous_end, new_end, event_type, reason)
          VALUES ('rock', ?, ?, ?, 'extension', ?)
        `).run(rockId, existing.timeline_end, end, reason || null);
      }

      recomputeProject(projectId);

    })();

    throw redirect(303, `/project/${projectId}`);
  },

  /* ---------- ADD TASK ---------- */

  addTask: async ({ request, params }) => {

    const projectId = Number(params.id);

    if (isStrictMode() && isBlocked(projectId))
      return fail(400, { error: 'Blocked by dependency' });

    const form = await request.formData();

    const rockId = Number(form.get('rock_id'));
    const title = form.get('title') as string;

    db.transaction(() => {

      db.prepare(
        `INSERT INTO tasks (rock_id,title) VALUES (?,?)`
      ).run(rockId, title);

      recomputeProject(projectId);

    })();

    throw redirect(303, `/project/${projectId}`);
  },

  /* ---------- TOGGLE TASK ---------- */

  toggleTask: async ({ request, params }) => {

    const projectId = Number(params.id);

    if (isStrictMode() && isBlocked(projectId))
      return fail(400, { error: 'Blocked by dependency' });

    const taskId = Number((await request.formData()).get('task_id'));

    db.transaction(() => {

      const task = db.prepare(
        `SELECT completed FROM tasks WHERE id=?`
      ).get(taskId) as { completed: number };

      const newValue = task.completed === 1 ? 0 : 1;

      db.prepare(
        `UPDATE tasks SET completed=? WHERE id=?`
      ).run(newValue, taskId);

      recomputeProject(projectId);

    })();

    throw redirect(303, `/project/${projectId}`);
  },

  /* ---------- LINK PROJECT ---------- */

  linkProject: async ({ request, params }) => {

    const projectId = Number(params.id);
    const form = await request.formData();

    const linkedId = Number(form.get('linked_project_id'));
    const type = form.get('link_type') as string;

    if (createsCycle(projectId, linkedId))
      return fail(400, { error: 'Circular dependency detected' });

    db.prepare(`
      INSERT OR IGNORE INTO project_links
      (project_id, linked_project_id, link_type)
      VALUES (?, ?, ?)
    `).run(projectId, linkedId, type);

    throw redirect(303, `/project/${projectId}`);
  },

  /* ---------- UNLINK PROJECT ---------- */

  unlinkProject: async ({ request, params }) => {

    const projectId = Number(params.id);
    const linkedId = Number((await request.formData()).get('linked_project_id'));

    db.prepare(`
      DELETE FROM project_links
      WHERE project_id=? AND linked_project_id=?
    `).run(projectId, linkedId);

    throw redirect(303, `/project/${projectId}`);
  }

};