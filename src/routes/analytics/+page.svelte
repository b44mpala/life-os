<script lang="ts">
  import { onMount } from 'svelte';

  export let data: any;

  onMount(() => {
    document.documentElement.style.setProperty(
      '--accent-active',
      'var(--accent-projects)'
    );
  });
</script>

<header class="page-header">
  <h1>analytics</h1>
</header>

{#if data.analytics.length === 0}
  <div class="empty">
    no data available.
  </div>
{:else}
  <div class="analytics-grid">
    {#each data.analytics as tag}
      <div class="tag-tile">

        <div class="tag-header">
          <h2>{tag.flourishing_tag}</h2>
        </div>

        <div class="metrics">

          <div class="metric">
            <div class="value">{tag.total_projects}</div>
            <div class="label">projects</div>
          </div>

          <div class="metric">
            <div class="value">
              {tag.avg_progress.toFixed(1)}%
            </div>
            <div class="label">avg progress</div>
          </div>

          <div class="metric">
            <div class="value">{tag.overdue_count}</div>
            <div class="label">overdue</div>
          </div>

          <div class="metric">
            <div class="value">{tag.early_completion_count}</div>
            <div class="label">early</div>
          </div>

          <div class="metric">
            <div class="value">{tag.extension_count}</div>
            <div class="label">extensions</div>
          </div>

        </div>

      </div>
    {/each}
  </div>
{/if}

<a class="back" href="/">← back</a>

<style>
.page-header {
  margin-bottom: 36px;
}

h1 {
  font-size: 38px;
  font-weight: 300;
  margin: 0;
  letter-spacing: -0.6px;
  text-transform: lowercase;
}

.analytics-grid {
  display: grid;
  gap: 24px;
  max-width: 1000px;
}

@media (min-width: 1000px) {
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 999px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

.tag-tile {
  border-radius: 6px;
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  background: rgba(255,255,255,0.36);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);

  border: 1px solid rgba(255,255,255,0.4);

  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}

.tag-header h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.2px;
  text-transform: lowercase;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.metric {
  display: flex;
  flex-direction: column;
}

.value {
  font-size: 20px;
  font-weight: 500;
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}

.empty {
  color: var(--text-muted);
  font-size: 15px;
}

.back {
  display: inline-block;
  margin-top: 36px;
  text-decoration: none;
  color: var(--text-muted);
}
</style>