<script lang="ts">
  interface Props {
    message?: string;
  }

  let { message = "Loading..." }: Props = $props();
</script>

<div class="loading">
  <div class="spinner"></div>
  <span>{message}</span>
</div>

<style>
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    gap: 12px;
    color: oklch(from var(--color-text) l c h / 0.4);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid oklch(from var(--color-text) l c h / 0.1);
    border-top-color: oklch(from var(--color-text) l c h / 0.5);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
