<script lang="ts">
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let accent: string = 'var(--accent-projects)';
</script>

<div class={`tile ${size}`} style={`--tile-accent:${accent}`}>
  <slot />
</div>

<style>
.tile {
  position: relative;
  border-radius: 6px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;

  background: rgba(255, 255, 255, 0.34);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);

  border: 1px solid rgba(255, 255, 255, 0.4);

  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);

  transition: transform 120ms ease;
}

.tile:active {
  transform: scale(0.992);
}

h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.2px;
}

.meta {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}
</style>