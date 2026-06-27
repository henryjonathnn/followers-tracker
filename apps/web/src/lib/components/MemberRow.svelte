<script lang="ts">
  import type { EventDTO } from '$lib/types';
  import { relativeTimeId } from '$lib/format';

  let { event }: { event: EventDTO } = $props();
  const isNew = $derived(event.eventType === 'new_follower');
  let imgFailed = $state(false);
</script>

<li class="flex items-center gap-3 px-4 py-3">
  {#if event.profilePicUrl && !imgFailed}
    <img src={event.profilePicUrl} alt="" class="h-10 w-10 shrink-0 rounded-full object-cover"
      onerror={() => (imgFailed = true)} />
  {:else}
    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-muted">
      {event.username.slice(0, 1).toUpperCase()}
    </div>
  {/if}

  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-medium text-ink">{event.username}</p>
    <p class="text-xs text-muted">{relativeTimeId(event.detectedAt)}</p>
  </div>

  {#if event.wasMutual}
    <span class="rounded-full bg-mutual-soft px-2 py-0.5 text-[11px] font-medium text-mutual">mutual</span>
  {/if}

  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full
    {isNew ? 'bg-rise-soft text-rise' : 'bg-fall-soft text-fall'}"
    aria-label={isNew ? 'Follower baru' : 'Unfollow'}>
    <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
      {#if isNew}
        <path d="M10 3a1 1 0 0 1 1 1v9.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-5 5a1 1 0 0 1-1.414 0l-5-5a1 1 0 1 1 1.414-1.414L9 13.586V4a1 1 0 0 1 1-1z" transform="rotate(180 10 10)" />
      {:else}
        <path d="M10 3a1 1 0 0 1 1 1v9.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-5 5a1 1 0 0 1-1.414 0l-5-5a1 1 0 1 1 1.414-1.414L9 13.586V4a1 1 0 0 1 1-1z" />
      {/if}
    </svg>
  </span>
</li>
