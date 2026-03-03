<script lang="ts">
  import { page } from '$app/stores';

  const sections = [
    { label: 'projects', href: '/' },
    { label: 'logs', href: '/logs' },
    { label: 'analytics', href: '/analytics' },
    { label: 'system', href: '/system' }
  ];
</script>

<div class="shell">
  <aside class="pivot">
    {#each sections as s}
      <a
        href={s.href}
        class:active={$page.url.pathname === s.href}
      >
        {s.label}
      </a>
    {/each}
  </aside>

  <main class="workspace">
    <slot />
  </main>
</div>

<style>
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
}

/* LEFT NAV */
.pivot {
  width: 220px;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  flex-shrink: 0;
}

.pivot a {
  font-size: 30px;
  font-weight: 300;
  text-decoration: none;
  color: var(--text-muted);
  text-transform: lowercase;
  cursor: pointer;
}

.pivot a.active {
  color: var(--accent-active, var(--accent-projects));
}

/* MAIN WORK AREA */
.workspace {
  flex: 1;
  padding: 60px 60px;
  position: relative;
}

/* Prevent accidental overlay issues */
.shell,
.pivot,
.workspace {
  pointer-events: auto;
}

/* Mobile */
@media (max-width: 900px) {
  .shell {
    flex-direction: column;
  }

  .pivot {
    width: 100%;
    flex-direction: row;
    padding: 20px 24px;
    gap: 20px;
  }

  .pivot a {
    font-size: 18px;
  }

  .workspace {
    padding: 40px 24px;
  }
}
</style>