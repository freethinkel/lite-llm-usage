import type { UserInfo } from "./types";

export const MOCK_USER_INFO: UserInfo = {
  user_info: {
    spend: 847.52,
    max_budget: 2000,
  },
  teams: [
    {
      team_alias: "Engineering",
      keys: [
        { key_alias: "claude-code-main", spend: 312.45, max_budget: 500 },
        { key_alias: "api-production", spend: 198.30, max_budget: 400 },
        { key_alias: "ci-pipeline", spend: 89.12, max_budget: 150 },
        { key_alias: "dev-testing", spend: 45.67, max_budget: 100 },
      ],
    },
    {
      team_alias: "Research",
      keys: [
        { key_alias: "experiments", spend: 124.88, max_budget: 300 },
        { key_alias: "data-analysis", spend: 77.10, max_budget: 200 },
      ],
    },
  ],
};

export const MOCK_DAILY_SPEND = 23.45;
export const MOCK_MONTHLY_SPEND = 312.87;

export function isMockMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("mock") || params.has("demo");
}
