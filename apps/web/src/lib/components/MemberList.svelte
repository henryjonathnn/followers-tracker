<script lang="ts">
  import type { EventDTO } from '$lib/types';
  import MemberRow from './MemberRow.svelte';
  import EmptyState from './EmptyState.svelte';

  let { events, emptyMessage }: { events: EventDTO[]; emptyMessage?: string } = $props();
</script>

{#if events.length === 0}
  <EmptyState message={emptyMessage} />
{:else}
  <ul class="divide-y divide-hairline">
    {#each events as event (event.igId + event.eventType + event.detectedAt)}
      <MemberRow {event} />
    {/each}
  </ul>
{/if}
