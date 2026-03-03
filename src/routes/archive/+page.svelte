<script>
  export let data;
</script>

<h1>Archived Projects</h1>

{#each data.projects as project}
  <div>
    <h2>{project.title}</h2>
    <p>{Math.round(project.progress_cached)}%</p>
  </div>
{/each}

<a href="/">Back</a>
