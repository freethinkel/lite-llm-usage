import { readTextFile } from "@tauri-apps/plugin-fs";
import { BaseDirectory } from "@tauri-apps/api/path";

export interface ApiCredentials {
  baseUrl: string;
  token: string;
  source: string;
}

interface ClaudeSettingsFile {
  env?: {
    // Base URL variations
    ANTHROPIC_BASE_URL?: string;
    LITELLM_BASE_URL?: string;
    API_BASE_URL?: string;
    // Token variations
    ANTHROPIC_AUTH_TOKEN?: string;
    ANTHROPIC_API_TOKEN?: string;
    ANTHROPIC_API_KEY?: string;
    LITELLM_API_KEY?: string;
    LITELLM_API_TOKEN?: string;
    LITELLM_AUTH_TOKEN?: string;
    API_KEY?: string;
    API_TOKEN?: string;
  };
}

interface CredentialSource {
  name: string;
  load: () => Promise<Partial<ApiCredentials> | null>;
}

async function tryReadJsonFile<T>(
  path: string,
  baseDir: BaseDirectory
): Promise<T | null> {
  try {
    const content = await readTextFile(path, { baseDir });
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function extractCredentialsFromClaudeSettings(
  settings: ClaudeSettingsFile | null,
  sourceName: string
): Partial<ApiCredentials> | null {
  if (!settings?.env) return null;

  const env = settings.env;

  // Check base URL in priority order
  const baseUrl =
    env.ANTHROPIC_BASE_URL ||
    env.LITELLM_BASE_URL ||
    env.API_BASE_URL;

  // Check token in priority order (auth_token, api_token, api_key)
  const token =
    env.ANTHROPIC_AUTH_TOKEN ||
    env.ANTHROPIC_API_TOKEN ||
    env.ANTHROPIC_API_KEY ||
    env.LITELLM_AUTH_TOKEN ||
    env.LITELLM_API_TOKEN ||
    env.LITELLM_API_KEY ||
    env.API_TOKEN ||
    env.API_KEY;

  if (!baseUrl && !token) return null;

  return {
    baseUrl: baseUrl || undefined,
    token: token || undefined,
    source: sourceName,
  };
}

const credentialSources: CredentialSource[] = [
  // 1. Claude local settings (highest priority - user overrides)
  {
    name: "~/.claude/settings.local.json",
    load: async () => {
      const settings = await tryReadJsonFile<ClaudeSettingsFile>(
        ".claude/settings.local.json",
        BaseDirectory.Home
      );
      return extractCredentialsFromClaudeSettings(settings, "Claude local settings");
    },
  },

  // 2. Claude global settings
  {
    name: "~/.claude/settings.json",
    load: async () => {
      const settings = await tryReadJsonFile<ClaudeSettingsFile>(
        ".claude/settings.json",
        BaseDirectory.Home
      );
      return extractCredentialsFromClaudeSettings(settings, "Claude settings");
    },
  },

  // 3. Project-level .claude/settings.json
  {
    name: ".claude/settings.json (project)",
    load: async () => {
      const settings = await tryReadJsonFile<ClaudeSettingsFile>(
        ".claude/settings.json",
        BaseDirectory.Resource
      );
      return extractCredentialsFromClaudeSettings(settings, "Project Claude settings");
    },
  },

  // 4. LiteLLM config in home directory
  {
    name: "~/.litellm/config.json",
    load: async () => {
      const config = await tryReadJsonFile<{
        api_base?: string;
        api_key?: string;
      }>(".litellm/config.json", BaseDirectory.Home);

      if (!config) return null;

      return {
        baseUrl: config.api_base || undefined,
        token: config.api_key || undefined,
        source: "LiteLLM config",
      };
    },
  },

  // 5. Generic .env-style config in home
  {
    name: "~/.config/litellm-usage/config.json",
    load: async () => {
      const config = await tryReadJsonFile<{
        baseUrl?: string;
        token?: string;
        apiKey?: string;
      }>(".config/litellm-usage/config.json", BaseDirectory.Home);

      if (!config) return null;

      return {
        baseUrl: config.baseUrl || undefined,
        token: config.token || config.apiKey || undefined,
        source: "App config",
      };
    },
  },
];

export async function getApiCredentials(): Promise<ApiCredentials> {
  let baseUrl: string | undefined;
  let token: string | undefined;
  let baseUrlSource: string | undefined;
  let tokenSource: string | undefined;

  // Try each source in order, collecting credentials
  for (const source of credentialSources) {
    try {
      const creds = await source.load();
      if (!creds) continue;

      // Take baseUrl from first source that has it
      if (!baseUrl && creds.baseUrl) {
        baseUrl = creds.baseUrl;
        baseUrlSource = creds.source;
      }

      // Take token from first source that has it
      if (!token && creds.token) {
        token = creds.token;
        tokenSource = creds.source;
      }

      // If we have both, we're done
      if (baseUrl && token) break;
    } catch {
      // Continue to next source on error
    }
  }

  // Validate we have required credentials
  const missingFields: string[] = [];
  if (!baseUrl) missingFields.push("Base URL (ANTHROPIC_BASE_URL)");
  if (!token) missingFields.push("API Token (ANTHROPIC_AUTH_TOKEN)");

  if (missingFields.length > 0) {
    const checkedLocations = credentialSources.map((s) => `  - ${s.name}`).join("\n");
    throw new Error(
      `Missing credentials: ${missingFields.join(", ")}\n\n` +
        `Checked locations:\n${checkedLocations}\n\n` +
        `Please configure your credentials in ~/.claude/settings.json:\n` +
        `{\n` +
        `  "env": {\n` +
        `    "ANTHROPIC_BASE_URL": "https://your-litellm-server.com",\n` +
        `    "ANTHROPIC_AUTH_TOKEN": "your-api-key"\n` +
        `  }\n` +
        `}`
    );
  }

  const source =
    baseUrlSource === tokenSource
      ? baseUrlSource!
      : `${baseUrlSource} + ${tokenSource}`;

  return { baseUrl: baseUrl!, token: token!, source };
}

export async function validateCredentials(
  credentials: ApiCredentials
): Promise<boolean> {
  // Basic validation - could be extended with actual API check
  try {
    new URL(credentials.baseUrl);
  } catch {
    throw new Error(`Invalid base URL: ${credentials.baseUrl}`);
  }

  if (!credentials.token || credentials.token.trim().length === 0) {
    throw new Error("Token cannot be empty");
  }

  return true;
}
