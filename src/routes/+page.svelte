<script lang="ts">
  import { onMount } from 'svelte';
  import Tile from '$lib/ui/Tile.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  type Project = {
    id: number;
    title: string;
    flourishing_tag: string;
    progress_cached: number;
    state: string;
    notification?: string;
  };

  const { projects, isRestDay } = data;

  onMount(() => {
    document.documentElement.style.setProperty(
      '--accent-active',
      'var(--accent-projects)'
    );
  });

  function batteryString(progress: number) {
    const filled = Math.min(4, Math.ceil(progress / 25));
    const empty = 4 - filled;
    return `${"|".repeat(filled)}${" ".repeat(empty)} ] ${progress.toFixed(0)}%`;
  }
</script>

<header class="home-header">
  <h1>projects</h1>

  <form method="POST" action="?/toggleRestDay">
    <button type="submit" class="rest-toggle">
      {isRestDay ? "switch to work day" : "switch to rest day"}
    </button>
  </form>
</header>

{#if projects.length === 0}
  <div class="empty">
    no active projects.
  </div>
{:else}

  <div class="project-grid">
    {#each projects as project}
      <a href={`/project/${project.id}`} class="project-link">

        <Tile accent="var(--accent-projects)">

          <div class="battery">
            {batteryString(project.progress_cached)}
          </div>

          <h3>{project.title}</h3>

          <div class="meta">
            {project.flourishing_tag}
          </div>

        </Tile>

      </a>
    {/each}
  </div>

{/if}

<div class="home-links">
  <a href="/logs">logs</a>
  <a href="/analytics">analytics</a>
</div>

<style>
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.project-grid {
  display: grid;
  gap: 32px;
  max-width: 1200px;
}

@media (min-width: 900px) {
  .project-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.project-link {
  text-decoration: none;
  color: inherit;
}

/* ASCII Battery */
.battery {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  letter-spacing: 2px;
  margin-bottom: 14px;
}

.rest-toggle {
  background: transparent;
  border: 1px solid #e2e8f0;
}

.home-links {
  margin-top: 48px;
  display: flex;
  gap: 24px;
}

.empty {
  color: var(--text-muted);
}
</style>