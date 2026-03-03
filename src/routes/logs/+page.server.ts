import db from '$lib/server/db/database';

export const load = async () => {
  const logs = db.prepare(`
    SELECT *
    FROM timeline_logs
    ORDER BY created_at DESC
  `).all();

  return { logs };
};