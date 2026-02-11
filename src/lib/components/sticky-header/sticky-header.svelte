<script lang="ts">
  import { formatCurrency } from "$lib/utils";

  interface Props {
    dailySpend?: number;
    visible: boolean;
  }

  let { dailySpend, visible }: Props = $props();
</script>

<header class="sticky-header" class:visible>
  <span class="sticky-label">Today</span>
  <span class="sticky-amount">
    {dailySpend !== undefined ? formatCurrency(dailySpend) : "—"}
  </span>
</header>

<style>
  .sticky-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 44px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 calc(var(--padding) + 16px) 16px;
    z-index: 100;
    opacity: 0;
    transform: translateY(-100%);
    padding-top: calc(var(--padding) + 16px);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
    animation: fix_blur 1s linear infinite;
  }

  @keyframes fix_blur {
    0% {
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    100% {
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
    }
  }

  .sticky-header.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .sticky-label {
    font-size: 0.8125rem;
    color: oklch(from var(--color-text) l c h / 0.5);
    font-weight: 500;
  }

  .sticky-amount {
    font-size: 0.9375rem;
    font-weight: 600;
    color: oklch(from var(--color-text) l c h / 0.9);
  }
</style>
