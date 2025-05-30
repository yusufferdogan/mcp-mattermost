import { z } from 'zod';

/**
 * Configuration schema for Mattermost MCP server
 * @typedef {Object} MattermostConfigSchema
 * @property {string} url - Mattermost instance URL
 * @property {string} token - Mattermost personal access token
 * @property {string} [teamName] - Mattermost team name
 * @property {string} [teamId] - Mattermost team ID
 */
const configSchema = z
  .object({
    url: z.string().url('Invalid Mattermost URL'),
    token: z.string().min(1, 'Mattermost token is required'),
    teamName: z.string().optional(),
    teamId: z.string().optional(),
  })
  .refine(data => data.teamName || data.teamId, {
    message: 'Either team name or team ID must be provided',
  });

export type MattermostConfig = z.infer<typeof configSchema>;

/**
 * Load configuration from environment variables
 * Supports both MCP_ prefixed and non-prefixed environment variables
 * @returns Validated configuration object
 */
export function loadConfig(): MattermostConfig {
  const config = {
    url: process.env.MCP_MATTERMOST_URL || process.env.MATTERMOST_URL || '',
    token: process.env.MCP_MATTERMOST_TOKEN || process.env.MATTERMOST_TOKEN || '',
    teamName: process.env.MCP_MATTERMOST_TEAM_NAME || process.env.MATTERMOST_TEAM_NAME || undefined,
    teamId: process.env.MCP_MATTERMOST_TEAM_ID || process.env.MATTERMOST_TEAM_ID || undefined,
  };

  return configSchema.parse(config);
}
