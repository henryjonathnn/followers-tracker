<script lang="ts">
  import type { PageData } from "./$types";
  import type { SummaryCardKind } from "$lib/types";
  import MemberList from "$lib/components/MemberList.svelte";
  import Shimmer from "$lib/components/Shimmer.svelte";
  import { relativeTimeId } from "$lib/format";
  import { goto } from "$app/navigation";

  let { data }: { data: PageData } = $props();

  const CARD_DEFS: {
    label: string;
    kind: SummaryCardKind;
    eventType: "new_follower" | "unfollow";
    range: "today" | "week";
    mutual?: true;
  }[] = [
    {
      label: "Baru Hari Ini",
      kind: "newToday",
      eventType: "new_follower",
      range: "today",
    },
    {
      label: "Baru Minggu Ini",
      kind: "newWeek",
      eventType: "new_follower",
      range: "week",
    },
    {
      label: "Unfollow Hari Ini",
      kind: "unfollowToday",
      eventType: "unfollow",
      range: "today",
    },
    {
      label: "Unfollow Minggu",
      kind: "unfollowWeek",
      eventType: "unfollow",
      range: "week",
    },
    {
      label: "Mutual Hari Ini",
      kind: "mutualUnfollowToday",
      eventType: "unfollow",
      range: "today",
      mutual: true,
    },
    {
      label: "Mutual Minggu",
      kind: "mutualUnfollowWeek",
      eventType: "unfollow",
      range: "week",
      mutual: true,
    },
  ];

  const range = $derived(data.filter.range);
  const activeType = $derived(data.filter.type);

  function isCardActive(def: (typeof CARD_DEFS)[number]) {
    return (
      range === def.range &&
      activeType === def.eventType &&
      (def.mutual ? data.filter.mutual === true : !data.filter.mutual)
    );
  }

  function navigate(params: Record<string, string | undefined>) {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    goto(url.toString(), { invalidateAll: true });
  }

  function handleCardClick(def: (typeof CARD_DEFS)[number]) {
    if (isCardActive(def)) {
      navigate({ type: undefined, range: undefined, mutual: undefined });
    } else {
      navigate({
        range: def.range,
        type: def.eventType,
        mutual: def.mutual ? "true" : undefined,
      });
    }
  }

  const lastSyncLabel = $derived(
    data.latestJob?.finishedAt
      ? `Sync ${relativeTimeId(data.latestJob.finishedAt)}`
      : "Belum pernah sync",
  );
  const sessionExpired = $derived(data.latestJob?.status === "failed");
</script>

<svelte:head><title>Follow Tracker</title></svelte:head>

<div class="mx-auto max-w-md min-h-screen bg-white">
 <header class="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-white/90 px-4 py-3 backdrop-blur-sm">
  <div class="flex items-center gap-2.5">
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
      {data.account?.username?.slice(0, 1).toUpperCase() ?? '?'}
    </div>
    <div>
      <h1 class="text-sm font-semibold text-ink leading-tight">
        {data.account?.username ?? 'Follow Tracker'}
      </h1>
      <p class="text-[11px] text-muted leading-tight mt-0.5">
        {#if sessionExpired}
          <span class="text-fall">⚠ Session IG expired</span>
        {:else}
          {lastSyncLabel}
        {/if}
      </p>
    </div>
  </div>
  <button
   onclick={() => location.reload()}
    class="rounded-lg px-3 py-1.5 text-xs font-medium text-accent bg-accent-soft active:scale-95 transition-transform">
    Refresh
  </button>
</header>

  {#if data.accountNotFound}
    <div
      class="flex flex-col items-center justify-center px-6 py-20 text-center"
    >
      <p class="text-sm font-medium text-ink">Belum ada data.</p>
      <p class="mt-1 text-xs text-muted">
        Jalankan sync job pertama kali dulu via GitHub Actions.
      </p>
    </div>
  {:else}
    <section class="grid grid-cols-3 gap-2 px-4 py-4">
      {#each CARD_DEFS as def (def.kind)}
        {@const count = data.summary?.[def.kind] ?? 0}
        {@const active = isCardActive(def)}
        <button
          onclick={() => handleCardClick(def)}
          class="rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95
            {def.eventType === 'new_follower'
            ? active
              ? 'border-rise bg-rise-soft'
              : 'border-hairline bg-white'
            : def.mutual
              ? active
                ? 'border-mutual bg-mutual-soft'
                : 'border-hairline bg-white'
              : active
                ? 'border-fall bg-fall-soft'
                : 'border-hairline bg-white'}"
          aria-pressed={active}
        >
          <p
            class="text-xl font-bold leading-none
            {def.eventType === 'new_follower'
              ? 'text-rise'
              : def.mutual
                ? 'text-mutual'
                : 'text-fall'}"
          >
            {count}
          </p>
          <p class="mt-1 text-[10px] leading-tight text-muted">{def.label}</p>
        </button>
      {/each}
    </section>

    <div class="flex gap-2 px-4 pb-3">
      {#each ["today", "week"] as const as r}
        <button
          onclick={() => navigate({ range: r, type: activeType })}
          class="rounded-full border px-3.5 py-1 text-xs font-medium transition-all active:scale-95
            {range === r
            ? 'border-accent bg-accent text-white'
            : 'border-hairline bg-white text-muted'}"
          aria-pressed={range === r}
        >
          {r === "today" ? "Hari Ini" : "Minggu Ini"}
        </button>
      {/each}
      {#if activeType}
        <button
          onclick={() => navigate({ type: undefined, mutual: undefined })}
          class="ml-auto rounded-full border border-hairline bg-white px-3 py-1 text-xs text-muted active:scale-95 transition-transform"
        >
          ✕ {activeType === "new_follower"
            ? "Baru"
            : data.filter.mutual
              ? "Mutual"
              : "Unfollow"}
        </button>
      {/if}
    </div>

    <section>
      <MemberList
        events={data.events}
        emptyMessage={activeType
          ? "Tidak ada event untuk filter ini."
          : range === "today"
            ? "Tidak ada perubahan hari ini."
            : "Tidak ada perubahan minggu ini."}
      />
    </section>
  {/if}
</div>
