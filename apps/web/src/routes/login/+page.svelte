<script lang="ts">
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Masuk — Follow Tracker</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-white px-6">
  <div class="w-full max-w-sm">
    <div class="mb-8 text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <h1 class="text-lg font-semibold text-ink">Follow Tracker</h1>
      <p class="mt-1 text-sm text-muted">Masukkan passphrase untuk lanjut.</p>
    </div>
    <form method="POST" class="space-y-3">
      <input type="password" name="password" autocomplete="current-password" placeholder="Passphrase"
        class="w-full rounded-xl border border-hairline px-4 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        required />
      {#if form?.error}
        <p class="text-sm text-fall">{form.error}</p>
      {/if}
      <button type="submit"
        class="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition active:scale-[0.98]">
        Masuk
      </button>
    </form>
  </div>
</div>
