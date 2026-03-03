<script lang="ts">
  export let data: {
    healthy: boolean;
    report: any;
  };
</script>

<h1>System Integrity Check</h1>

{#if data.healthy}
  <h2 style="color:green;">System Healthy ✓</h2>
{:else}
  <h2 style="color:red;">Issues Detected ⚠</h2>
{/if}

<hr />

<pre>{JSON.stringify(data.report, null, 2)}</pre>

<br />
<a href="/">Back</a>