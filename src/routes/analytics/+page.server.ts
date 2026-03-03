import db from '$lib/server/db/database';

type TagAnalytics = {
  flourishing_tag: string;
  total_projects: number;
  avg_progress: number;
  overdue_count: number;
  early_completion_count: number;
  extension_count: number;
};

export const load = async () => {

  const tags = db.prepare(`
    SELECT DISTINCT flourishing_tag
    FROM projects
  `).all() as { flourishing_tag: string }[];

  const analytics: TagAnalytics[] = tags.map(tagRow => {

    const tag = tagRow.flourishing_tag;

    const totalProjects = db.prepare(`
      SELECT COUNT(*) as count
      FROM projects
      WHERE flourishing_tag=?
    `).get(tag) as { count: number };

    const avgProgress = db.prepare(`
      SELECT AVG(progress_cached) as avg
      FROM projects
      WHERE flourishing_tag=?
    `).get(tag) as { avg: number };

    const overdue = db.prepare(`
      SELECT COUNT(*) as count
      FROM projects
      WHERE flourishing_tag=?
      AND status='active'
      AND progress_cached < 100
      AND date(timeline_end) < date('now')
    `).get(tag) as { count: number };

    const earlyCompletion = db.prepare(`
      SELECT COUNT(*) as count
      FROM timeline_logs
      WHERE entity_type='project'
      AND event_type='early_completion'
      AND entity_id IN (
        SELECT id FROM projects WHERE flourishing_tag=?
      )
    `).get(tag) as { count: number };

    const extensions = db.prepare(`
      SELECT COUNT(*) as count
      FROM timeline_logs
      WHERE entity_type='project'
      AND event_type='extension'
      AND entity_id IN (
        SELECT id FROM projects WHERE flourishing_tag=?
      )
    `).get(tag) as { count: number };

    return {
      flourishing_tag: tag,
      total_projects: totalProjects.count || 0,
      avg_progress: avgProgress.avg || 0,
      overdue_count: overdue.count || 0,
      early_completion_count: earlyCompletion.count || 0,
      extension_count: extensions.count || 0
    };

  });

  return { analytics };
};