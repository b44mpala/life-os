<script lang="ts">
  import { onMount } from 'svelte';

  type Log = {
    id: number;
    entity_type: string;
    entity_id: number;
    previous_end: string;
    new_end: string;
    event_type: string;
    reason: string | null;
    created_at: string;
  };

  export let data: {
    logs: Log[];
  };

  onMount(() => {
    document.documentElement.style.setProperty(
      '--accent-active',
      'var(--accent-logs)'
    );
  });
</script>

<header class="page-header">
  <h1>logs</h1>
</header>

{#if data.logs.length === 0}
  <div class="empty">
    no timeline logs yet.
  </div>
{:else}
  <div class="timeline">
    {#each data.logs as log (log.id)}
      <div class="log-entry">

        <div class="accent-bar"></div>

        <div class="log-content">
          <div class="log-top">
            <div class="event">
              {log.entity_type} • {log.event_type}
            </div>
            <div class="date">
              {log.created_at}
            </div>
          </div>

          <div class="log-body">
            <div>
              <span class="label">previous end</span>
              {log.previous_end}
            </div>

            <div>
              <span class="label">new end</span>
              {log.new_end}
            </div>

            {#if log.reason}
              <div>
                <span class="label">reason</span>
                {log.reason}
              </div>
            {/if}
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

.timeline {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 900px;
}

.log-entry {
  display: flex;
  border-radius: 6px;

  background: rgba(255,255,255,0.34);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);

  border: 1px solid rgba(255,255,255,0.4);

  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
}

.accent-bar {
  width: 6px;
  background: var(--accent-logs);
}

.log-content {
  flex: 1;
  padding: 18px 20px;
}

.log-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.event {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.2px;
}

.date {
  font-size: 12px;
  color: var(--text-muted);
}

.log-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin-right: 6px;
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