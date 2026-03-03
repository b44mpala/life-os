<script lang="ts">
  import { onMount } from 'svelte';
  import Tile from '$lib/ui/Tile.svelte';
  import StateStrip from '$lib/ui/StateStrip.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  type Project = {
    id: number;
    title: string;
    flourishing_tag: string;
    timeline_start: string;
    timeline_end: string;
    status: string;
    progress_cached: number;
  };

  type Rock = {
    id: number;
    project_id: number;
    title: string;
    timeline_start: string;
    timeline_end: string;
    progress_cached: number;
  };

  type Task = {
    id: number;
    rock_id: number;
    title: string;
    completed: number;
  };

  type LinkedProject = {
    id: number;
    title: string;
    progress_cached: number;
    link_type: string;
  };

  const project = data.project as Project;
  const rocks = data.rocks as Rock[];
  const tasks = data.tasks as Task[];
  const linkedProjects = data.linkedProjects as LinkedProject[];
  const allProjects = data.allProjects as { id: number; title: string }[];

  const linkedIds = new Set(linkedProjects.map(lp => lp.id));

  onMount(() => {
    document.documentElement.style.setProperty(
      '--accent-active',
      'var(--accent-rocks)'
    );
  });
</script>

{#if !project}
  <h2>project not found.</h2>
{:else}

<header class="project-header">
  <h1>{project.title}</h1>

  <div class="meta-grid">

    <!-- PROGRESS TALLY -->
    <div class="progress-block">
      <div class="label">progress</div>

      <div class="tally">
        {#each [0, 1] as group}
          <div class="tally-group">
            {#each Array(5) as _, i}
              {#if group * 5 + i < Math.round(project.progress_cached / 10)}
                {#if i === 4}
                  <span class="mark cross">/</span>
                {:else}
                  <span class="mark">|</span>
                {/if}
              {:else}
                <span class="mark empty">|</span>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <div>
      <div class="label">status</div>
      <div>
        {#if data.state === 'overdue'}
          overdue
        {:else if data.state === 'due_soon'}
          due soon
        {:else if data.state === 'completed_early'}
          completed early
        {:else}
          on track
        {/if}
      </div>
    </div>

    <div>
      <div class="label">days left</div>
      <div>{data.daysLeft ?? 0}</div>
    </div>

  </div>
</header>

{#if data.isBlocked}
  <StateStrip type="error">
    this project is blocked by an incomplete dependency.
  </StateStrip>
{/if}

{#if data.autoExtended}
  <StateStrip type="success">
    project auto-extended to accommodate rock timeline.
  </StateStrip>
{/if}

<!-- ================= ROCKS ================= -->

<section class="section">

  <div class="section-header">
    <h2>rocks</h2>

    <form method="POST" action="?/addRock" class="inline-form">
      <input name="title" placeholder="rock title" required />
      <input type="date" name="timeline_start" required />
      <input type="date" name="timeline_end" required />
      <button type="submit">add rock</button>
    </form>
  </div>

  <div class="rock-grid">
    {#each rocks as rock}
      <div class="rock-block">

        <Tile accent="var(--accent-rocks)">
          <div class="meta">
            {rock.progress_cached.toFixed(1)}%
          </div>
          <h3>{rock.title}</h3>
        </Tile>

        <div class="rock-actions">
          <form method="POST" action="?/deleteRock">
            <input type="hidden" name="rock_id" value={rock.id} />
            <button class="danger" type="submit">delete</button>
          </form>

          <details>
            <summary>edit</summary>
            <form method="POST" action="?/editRock" class="edit-form">
              <input type="hidden" name="rock_id" value={rock.id} />
              <input name="title" value={rock.title} required />
              <input type="date" name="timeline_start" value={rock.timeline_start} required />
              <input type="date" name="timeline_end" value={rock.timeline_end} required />
              <input name="extension_reason" placeholder="reason (optional)" />
              <button type="submit">save</button>
            </form>
          </details>
        </div>

        <div class="tasks">
          <form method="POST" action="?/addTask" class="task-form">
            <input type="hidden" name="rock_id" value={rock.id} />
            <input name="title" placeholder="task title" required />
            <button type="submit">add</button>
          </form>

          {#each tasks.filter(t => t.rock_id === rock.id) as task}
            <div class="task-row">
              <form method="POST" action="?/toggleTask">
                <input type="hidden" name="task_id" value={task.id} />
                <button class="toggle" type="submit">
                  {task.completed ? "✔" : "○"}
                </button>
              </form>
              <span class:done={task.completed}>{task.title}</span>
            </div>
          {/each}
        </div>

      </div>
    {/each}
  </div>
</section>

<!-- ================= LINKED PROJECTS ================= -->

<section class="section">
  <h2>linked projects</h2>

  {#if linkedProjects.length === 0}
    <div class="empty">no linked projects.</div>
  {:else}
    {#each linkedProjects as lp}
      <div class="linked-row">
        <div>
          <strong>{lp.title}</strong>
          <div>{lp.progress_cached.toFixed(1)}%</div>
        </div>

        <form method="POST" action="?/unlinkProject">
          <input type="hidden" name="linked_project_id" value={lp.id} />
          <button type="submit">unlink</button>
        </form>
      </div>
    {/each}
  {/if}

  <form method="POST" action="?/linkProject" class="link-form">
    <select name="linked_project_id" required>
      <option value="">select project</option>
      {#each allProjects as p}
        {#if !linkedIds.has(p.id)}
          <option value={p.id}>{p.title}</option>
        {/if}
      {/each}
    </select>

    <select name="link_type">
      <option value="related">related</option>
      <option value="dependency">dependency</option>
    </select>

    <button type="submit">link</button>
  </form>
</section>

<a class="back" href="/">← back</a>

{/if}

<style>
.project-header {
  margin-bottom: 48px;
}

.meta-grid {
  display: flex;
  gap: 48px;
  margin-top: 24px;
}

/* ===== TALLY SYSTEM ===== */

.progress-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tally {
  display: flex;
  gap: 28px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px;
  letter-spacing: 4px;
}

.tally-group {
  display: flex;
}

.mark {
  font-weight: 600;
  color: var(--accent-rocks);
}

.mark.cross {
  font-weight: 700;
}

.mark.empty {
  color: #cbd5e1;
}

/* ===== STRUCTURE ===== */

.section {
  margin-bottom: 56px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.inline-form,
.task-form,
.link-form,
.edit-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.rock-grid {
  display: grid;
  gap: 36px;
  max-width: 1000px;
}

@media (min-width: 900px) {
  .rock-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.rock-block {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle {
  background: transparent;
}

.done {
  text-decoration: line-through;
  color: var(--text-muted);
}

.linked-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.back {
  display: inline-block;
  margin-top: 40px;
}
</style>