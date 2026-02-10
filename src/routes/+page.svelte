<script lang="ts">
  import { onMount } from "svelte";
  import { readTextFile } from "@tauri-apps/plugin-fs";
  import { BaseDirectory } from "@tauri-apps/api/path";
  import { fetch } from "@tauri-apps/plugin-http";

  interface KeyInfo {
    key_alias: string;
    spend: number;
    max_budget?: number;
  }

  interface Team {
    team_alias: string;
    keys: KeyInfo[];
  }

  interface UserInfo {
    user_info: {
      spend: number;
      max_budget?: number;
    };
    teams: Team[];
  }

  interface ClaudeSettings {
    env: {
      ANTHROPIC_BASE_URL: string;
      ANTHROPIC_AUTH_TOKEN: string;
    };
  }

  let userInfo = $state<UserInfo | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let scrolled = $state(false);
  let containerEl: HTMLElement;

  const fetchUsage = async (settings: ClaudeSettings): Promise<UserInfo> => {
    const url = settings.env.ANTHROPIC_BASE_URL;
    const token = settings.env.ANTHROPIC_AUTH_TOKEN;
    const response = await fetch(url + "/user/info", {
      headers: {
        "x-litellm-api-key": token,
      },
    });
    const data = await response.json();
    return data as UserInfo;
  };

  const readClaudeSettings = async (): Promise<ClaudeSettings> => {
    const settings = await readTextFile(".claude/settings.json", {
      baseDir: BaseDirectory.Home,
    });
    return JSON.parse(settings);
  };

  const handleScroll = () => {
    scrolled = containerEl.scrollTop > 60;
  };

  onMount(async () => {
    try {
      const claudeSettings = await readClaudeSettings();
      const res = await fetchUsage(claudeSettings);
      userInfo = res;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load usage data";
    } finally {
      loading = false;
    }
  });

  const keys = $derived(
    userInfo?.teams.flatMap((team: Team) =>
      team.keys.slice().sort((a: KeyInfo, b: KeyInfo) => b.spend - a.spend),
    ) ?? [],
  );

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getSpendPercentage = (spend: number, maxBudget?: number): number => {
    if (!maxBudget || maxBudget === 0) return 0;
    return Math.min((spend / maxBudget) * 100, 100);
  };
</script>

<main class="container" bind:this={containerEl} onscroll={handleScroll}>
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading...</span>
    </div>
  {:else if error}
    <div class="error">
      <span>{error}</span>
    </div>
  {:else if userInfo}
    <header class="sticky-header" class:visible={scrolled}>
      <span class="sticky-label">Total Spend</span>
      <span class="sticky-amount"
        >{formatCurrency(userInfo.user_info.spend)}</span
      >
    </header>

    <section class="total-usage" class:collapsed={scrolled}>
      <div class="usage-label">Total Spend</div>
      <div class="usage-amount">{formatCurrency(userInfo.user_info.spend)}</div>
      {#if userInfo.user_info.max_budget}
        <div class="budget-info">
          <div class="progress-bar">
            <div
              class="progress-fill"
              style="width: {getSpendPercentage(
                userInfo.user_info.spend,
                userInfo.user_info.max_budget,
              )}%"
            ></div>
          </div>
          <div class="budget-text">
            of {formatCurrency(userInfo.user_info.max_budget)} budget
          </div>
        </div>
      {/if}
    </section>

    {#if keys.length > 0}
      <section class="keys-section">
        <h2>API Keys</h2>
        <ul class="keys-list">
          {#each keys as key}
            <li class="key-item">
              <div class="key-info">
                <span class="key-name">{key.key_alias}</span>
                <span class="key-spend">{formatCurrency(key.spend)}</span>
              </div>
              {#if key.max_budget}
                <div class="key-progress">
                  <div
                    class="progress-fill"
                    style="width: {getSpendPercentage(
                      key.spend,
                      key.max_budget,
                    )}%"
                  ></div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</main>

<style>
  .container {
    overflow: auto;
    height: 100%;
    max-height: 100%;
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, sans-serif;
    color: rgba(255, 255, 255, 0.9);
    box-sizing: border-box;
    position: relative;
  }

  /* Sticky header that appears on scroll */
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
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
  }

  .sticky-amount {
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    gap: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top-color: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
  }

  .total-usage {
    text-align: center;
    padding: 32px 16px;
    margin-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease,
      padding 0.25s ease;
  }

  .total-usage.collapsed {
    opacity: 0.3;
    transform: scale(0.95);
    padding: 16px;
  }

  .usage-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .usage-amount {
    font-size: 2.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    letter-spacing: -1px;
    font-variant-numeric: tabular-nums;
  }

  .budget-info {
    margin-top: 16px;
    max-width: 200px;
    margin-left: auto;
    margin-right: auto;
  }

  .progress-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .budget-text {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .keys-section h2 {
    font-size: 0.6875rem;
    font-weight: 500;
    margin: 0 0 12px 0;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .keys-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .key-item {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 12px 14px;
    transition: background 0.15s ease;
  }

  .key-item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .key-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .key-name {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.875rem;
  }

  .key-spend {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
  }

  .key-progress {
    height: 2px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 1px;
    overflow: hidden;
    margin-top: 10px;
  }

  .key-progress .progress-fill {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
