<script lang="ts">
  let { message = 'Belum ada perubahan.' }: { message?: string } = $props();
</script>
<div class="flex flex-col items-center justify-center px-4 py-16 text-center">
  <p class="text-sm text-muted">{message}</p>
</div>
