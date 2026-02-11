export interface KeyInfo {
  key_alias: string;
  spend: number;
  max_budget?: number;
}

export interface Team {
  team_alias: string;
  keys: KeyInfo[];
}

export interface UserInfo {
  user_info: {
    spend: number;
    max_budget?: number;
  };
  teams: Team[];
}

export interface DailySpend {
  date: string;
  spend: number;
}
