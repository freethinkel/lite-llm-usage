<script lang="ts">
  import type { KeyInfo } from "$lib/types";
  import { formatCurrency, getSpendPercentage } from "$lib/utils";

  interface Props {
    keyInfo: KeyInfo;
  }

  let { keyInfo }: Props = $props();
</script>

<li class="key-item">
  <div class="key-info">
    <span class="key-name" title={keyInfo.key_alias}>{keyInfo.key_alias}</span>
    <span class="key-spend">{formatCurrency(keyInfo.spend)}</span>
  </div>
  {#if keyInfo.max_budget}
    <div class="key-progress">
      <div
        class="progress-fill"
        style="width: {getSpendPercentage(keyInfo.spend, keyInfo.max_budget)}%"
      ></div>
    </div>
  {/if}
</li>

<style>
  .key-item {
    background: oklch(from var(--color-text) l c h / 0.03);
    border-radius: 6px;
    padding: 8px 10px;
    transition: background 0.15s ease;
  }

  .key-item:hover {
    background: oklch(from var(--color-text) l c h / 0.06);
  }

  .key-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .key-name {
    font-weight: 500;
    color: oklch(from var(--color-text) l c h / 0.85);
    font-size: 0.8125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .key-spend {
    font-weight: 500;
    color: oklch(from var(--color-text) l c h / 0.5);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .key-progress {
    height: 2px;
    background: oklch(from var(--color-text) l c h / 0.08);
    border-radius: 1px;
    overflow: hidden;
    margin-top: 6px;
  }

  .progress-fill {
    height: 100%;
    background: oklch(from var(--color-accent) l c h / 0.5);
    border-radius: 1px;
    transition: width 0.5s ease;
  }
</style>
