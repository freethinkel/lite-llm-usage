<script lang="ts">
  import { formatCurrency, getSpendPercentage } from "$lib/utils";

  interface Props {
    totalSpend: number;
    maxBudget?: number;
    dailySpend?: number;
    monthlySpend?: number;
    collapsed?: boolean;
  }

  let {
    totalSpend,
    maxBudget,
    dailySpend,
    monthlySpend,
    collapsed = false,
  }: Props = $props();

  const currentMonth = new Date().toLocaleString("default", { month: "short" });
</script>

<section class="total-usage" class:collapsed>
  <div class="usage-label">Today</div>
  <div class="usage-amount">
    {dailySpend !== undefined ? formatCurrency(dailySpend) : "—"}
  </div>

  <div class="spend-badges">
    {#if monthlySpend !== undefined}
      <div class="spend-badge">
        <span class="badge-label">{currentMonth}</span>
        <span class="badge-amount">{formatCurrency(monthlySpend)}</span>
      </div>
    {/if}
    <div class="spend-badge">
      <span class="badge-label">Total</span>
      <span class="badge-amount">{formatCurrency(totalSpend)}</span>
    </div>
  </div>

  {#if maxBudget && monthlySpend !== undefined}
    <div class="budget-info">
      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: {getSpendPercentage(monthlySpend, maxBudget)}%"
        ></div>
      </div>
      <div class="budget-text">
        {formatCurrency(monthlySpend)} of {formatCurrency(maxBudget)} this month
      </div>
    </div>
  {/if}
</section>

<style>
  .total-usage {
    text-align: center;
    padding: 20px 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid oklch(from var(--color-text) l c h / 0.06);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease,
      padding 0.25s ease;
  }

  .total-usage.collapsed {
    opacity: 0.3;
    transform: scale(0.95);
    padding: 12px;
  }

  .usage-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: oklch(from var(--color-text) l c h / 0.4);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .usage-amount {
    font-size: 2rem;
    font-weight: 600;
    color: oklch(from var(--color-text) l c h / 0.95);
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
  }

  .spend-badges {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 10px;
    flex-wrap: wrap;
  }

  .spend-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: oklch(from var(--color-text) l c h / 0.05);
    border-radius: 12px;
  }

  .badge-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: oklch(from var(--color-text) l c h / 0.4);
    font-weight: 500;
  }

  .badge-amount {
    font-size: 0.8125rem;
    font-weight: 600;
    color: oklch(from var(--color-text) l c h / 0.8);
    font-variant-numeric: tabular-nums;
  }

  .budget-info {
    margin-top: 12px;
    max-width: 180px;
    margin-left: auto;
    margin-right: auto;
  }

  .progress-bar {
    height: 3px;
    background: oklch(from var(--color-text) l c h / 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: oklch(from var(--color-accent) l c h / 0.8);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .budget-text {
    font-size: 0.75rem;
    color: oklch(from var(--color-text) l c h / 0.4);
  }
</style>
