<script lang="ts">
  let { rows = 5 }: { rows?: number } = $props();
</script>
<ul class="divide-y divide-hairline">
  {#each Array(rows) as _, i (i)}
    <li class="flex items-center gap-3 px-4 py-3">
      <div class="h-10 w-10 shrink-0 rounded-full bg-zinc-200 animate-shimmer"></div>
      <div class="flex-1 space-y-2">
        <div class="h-3 w-28 rounded bg-zinc-200 animate-shimmer"></div>
        <div class="h-2.5 w-16 rounded bg-zinc-100 animate-shimmer"></div>
      </div>
      <div class="h-5 w-5 rounded-full bg-zinc-200 animate-shimmer"></div>
    </li>
  {/each}
</ul>
