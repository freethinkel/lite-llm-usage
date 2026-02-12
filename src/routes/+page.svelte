<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fetch } from "@tauri-apps/plugin-http";
  import { listen, type UnlistenFn } from "@tauri-apps/api/event";
  import type { UserInfo, KeyInfo, Team } from "$lib/types";
  import { getApiCredentials, type ApiCredentials } from "$lib/credentials";
  import {
    isMockMode,
    MOCK_USER_INFO,
    MOCK_DAILY_SPEND,
    MOCK_MONTHLY_SPEND,
  } from "$lib/mock-data";
  import {
    Loading,
    ErrorMessage,
    StickyHeader,
    TotalUsage,
    KeysList,
  } from "$lib/components";

  let userInfo = $state<UserInfo | null>(null);
  let dailySpend = $state<number | undefined>(undefined);
  let monthlySpend = $state<number | undefined>(undefined);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let scrolled = $state(false);
  let containerEl: HTMLElement;
  let unlisten: UnlistenFn | null = null;

  const fetchUsage = async (credentials: ApiCredentials): Promise<UserInfo> => {
    const response = await fetch(credentials.baseUrl + "/user/info", {
      headers: {
        "x-litellm-api-key": credentials.token,
      },
    });
    const data = await response.json();
    return data as UserInfo;
  };

  const fetchSpendForPeriod = async (
    credentials: ApiCredentials,
    startDate: string,
    endDate: string,
  ): Promise<number> => {
    const response = await fetch(
      `${credentials.baseUrl}/spend/logs?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: {
          "x-litellm-api-key": credentials.token,
        },
      },
    );
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.reduce(
        (sum: number, log: { spend?: number }) => sum + (log.spend || 0),
        0,
      );
    }
    return 0;
  };

  const getDateRanges = () => {
    const today = new Date();

    // Daily: today to tomorrow
    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Monthly: first day of current month to tomorrow
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstOfMonthStr = firstOfMonth.toISOString().split("T")[0];

    return {
      daily: { start: todayStr, end: tomorrowStr },
      monthly: { start: firstOfMonthStr, end: tomorrowStr },
    };
  };

  const loadMockData = () => {
    userInfo = MOCK_USER_INFO;
    dailySpend = MOCK_DAILY_SPEND;
    monthlySpend = MOCK_MONTHLY_SPEND;
    loading = false;
  };

  const loadData = async () => {
    error = null;

    if (isMockMode()) {
      loadMockData();
      return;
    }

    try {
      const credentials = await getApiCredentials();
      const dateRanges = getDateRanges();

      const [usageData, dailySpendData, monthlySpendData] = await Promise.all([
        fetchUsage(credentials),
        fetchSpendForPeriod(
          credentials,
          dateRanges.daily.start,
          dateRanges.daily.end,
        ).catch(() => undefined),
        fetchSpendForPeriod(
          credentials,
          dateRanges.monthly.start,
          dateRanges.monthly.end,
        ).catch(() => undefined),
      ]);

      userInfo = usageData;
      dailySpend = dailySpendData;
      monthlySpend = monthlySpendData;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load usage data";
    } finally {
      loading = false;
    }
  };

  const handleScroll = () => {
    scrolled = containerEl.scrollTop > 60;
  };

  onMount(async () => {
    // Initial load
    await loadData();

    // Listen for popover open events to refresh data
    unlisten = await listen("popover-opened", () => {
      loadData();
    });
  });

  onDestroy(() => {
    unlisten?.();
  });

  const keys = $derived(
    userInfo?.teams.flatMap((team: Team) =>
      team.keys.slice().sort((a: KeyInfo, b: KeyInfo) => b.spend - a.spend),
    ) ?? [],
  );
</script>

<main class="container" bind:this={containerEl} onscroll={handleScroll}>
  {#if loading}
    <Loading />
  {:else if error}
    <ErrorMessage message={error} />
  {:else if userInfo}
    <StickyHeader {dailySpend} visible={scrolled} />

    <TotalUsage
      totalSpend={userInfo.user_info.spend}
      maxBudget={userInfo.user_info.max_budget}
      {dailySpend}
      {monthlySpend}
      collapsed={scrolled}
    />

    <KeysList {keys} />
  {/if}
</main>

<style>
  .container {
    overflow: auto;
    height: 100%;
    max-height: 100%;
    padding: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, sans-serif;
    color: var(--color-text);
    box-sizing: border-box;
    position: relative;
  }
</style>
