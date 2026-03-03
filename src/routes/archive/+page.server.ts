import db from '$lib/server/db/database';

export const load = async () => {
  const projects = db.prepare(
    "SELECT * FROM projects WHERE status='archived'"
  ).all();

  return { projects };
};
