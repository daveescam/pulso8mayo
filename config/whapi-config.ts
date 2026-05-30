export interface WhapiConfig {
  apiToken: string | undefined;
}

export function getWhapiConfig(): WhapiConfig {
  return {
    apiToken: process.env.WHAPI_API_TOKEN || undefined,
  };
}

export const whapiConfig = getWhapiConfig();

export const WHAPI_BASE_URL = 'https://gate.whapi.cloud';
