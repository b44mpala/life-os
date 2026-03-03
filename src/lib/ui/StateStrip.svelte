<script lang="ts">
  export let type: 'error' | 'success' | 'warning' = 'error';
</script>

<div class={`strip ${type}`}>
  <slot />
</div>

<style>
.strip {
  padding: 14px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  border-left: 4px solid;
  background: white;
}

.strip.error { border-color: #d64545; }
.strip.success { border-color: #2f9e44; }
.strip.warning { border-color: #e67700; }
</style>