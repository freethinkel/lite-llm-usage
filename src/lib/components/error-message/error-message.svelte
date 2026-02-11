<script lang="ts">
  interface Props {
    message: string;
  }

  let { message }: Props = $props();
</script>

<div class="error">
  <span>{message}</span>
</div>

<style>
  .error {
    padding: 12px 16px;
    background: oklch(from var(--color-text) l c h / 0.05);
    border: 1px solid oklch(from var(--color-text) l c h / 0.1);
    border-radius: 8px;
    color: oklch(from var(--color-text) l c h / 0.6);
    font-size: 0.875rem;
  }
</style>
