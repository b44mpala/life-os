import db from '$lib/server/db/database';
import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';

type Project = {
  id: number;
  title: string;
  flourishing_tag: string;
  timeline_start: string;
  timeline_end: string;
  status: string;
  progress_cached: number;
};

/* =========================
   TIME CONTEXT WEIGHTING
========================= */

function getTimeContextWeight(tag: string, isRestDay: boolean) {
  const hour = new Date().getHours();
  let weight = 0;

  if (isRestDay) {
    if (tag === 'relationships') weight += 3;
    if (tag === 'happiness') weight += 2;
  } else {
    if (tag === 'purpose') weight += 3;
  }

  if (hour >= 5 && hour < 11 && tag === 'health') weight += 2;
  if (hour >= 12 && hour < 18 && tag === 'purpose') weight += 2;
  if ((hour >= 18 || hour < 5) && tag === 'relationships') weight += 2;

  return weight;
}

/* =========================
   STATE MACHINE (Derived)
========================= */

function classifyState(project: Project) {
  const today = new Date();
  const end = new Date(project.timeline_end);

  if (project.progress_cached === 100 && today < end)
    return 'completed_early';

  if (today > end && project.progress_cached < 100)
    return 'overdue';

  const daysLeft =
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (daysLeft <= 2 && daysLeft >= 0)
    return 'due_soon';

  return 'on_track';
}

function getSoftNotification(state: string) {
  switch (state) {
    case 'overdue': return '⚠ Overdue';
    case 'due_soon': return '⏳ Due Soon';
    case 'completed_early': return '🌿 Completed Early';
    default: return null;
  }
}

/* =========================
   LOAD
========================= */

export const load = async () => {

  const restSetting = db.prepare(
    "SELECT value FROM settings WHERE key='is_rest_day'"
  ).get() as { value: string } | undefined;

  const isRestDay = restSetting?.value === 'true';

  const projects = db.prepare(
    "SELECT * FROM projects WHERE status='active'"
  ).all() as Project[];

  const processed = projects
    .map(p => {
      const weight = getTimeContextWeight(p.flourishing_tag, isRestDay);
      const state = classifyState(p);

      return {
        ...p,
        state,
        notification: getSoftNotification(state),
        sortScore: p.progress_cached + weight * 10
      };
    })
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, 3);

  return { projects: processed, isRestDay };
};

/* =========================
   ACTIONS
========================= */

export const actions: Actions = {

  createProject: async ({ request }) => {

    const form = await request.formData();

    const title = form.get('title') as string;
    const tag = form.get('flourishing_tag') as string;
    const start = form.get('timeline_start') as string;
    const end = form.get('timeline_end') as string;

    if (!title || !tag || !start || !end)
      return fail(400, { error: 'Missing fields' });

    if (new Date(end).getTime() <= new Date(start).getTime())
      return fail(400, { error: 'Invalid timeline' });

    db.prepare(`
      INSERT INTO projects
      (title, flourishing_tag, timeline_start, timeline_end)
      VALUES (?, ?, ?, ?)
    `).run(title, tag, start, end);

    throw redirect(303, '/');
  },

  archiveProject: async ({ request }) => {
    const id = Number((await request.formData()).get('project_id'));
    db.prepare("UPDATE projects SET status='archived' WHERE id=?")
      .run(id);
    throw redirect(303, '/');
  },

  toggleRestDay: async () => {
    const current = db.prepare(
      "SELECT value FROM settings WHERE key='is_rest_day'"
    ).get() as { value: string } | undefined;

    const newValue = current?.value === 'true' ? 'false' : 'true';

    db.prepare(`
      INSERT INTO settings (key,value)
      VALUES ('is_rest_day',?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).run(newValue);

    throw redirect(303, '/');
  }
};