import { z } from 'zod';

/**
 * Neo4j Action Tracking Tools
 * Tools for recording and analyzing MCP actions across different services
 */

export const NEO4J_ACTION_TOOLS = {
  get_similar_actions: {
    name: 'mattermost_get_similar_actions',
    description: 'Finds similar actions to the current one',
    parameter: {
      mcpType: z.string().describe('Type of MCP (Mattermost, DynamoDB, Jira, etc.)'),
      actionType: z.string().describe('Type of action being performed'),
      parameters: z.record(z.any()).describe('Parameters of the action'),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe('Maximum number of similar actions to return'),
    },
  },

  get_user_history: {
    name: 'mattermost_get_user_history',
    description: "Gets a user's action history",
    parameter: {
      userId: z.string().describe('ID of the user'),
      limit: z.number().optional().default(20).describe('Maximum number of actions to return'),
    },
  },

  suggest_next_action: {
    name: 'mattermost_suggest_next_action',
    description: 'Suggests the next action based on typical patterns',
    parameter: {
      userId: z.string().describe('ID of the user'),
      mcpType: z.string().describe('Type of MCP (Mattermost, DynamoDB, Jira, etc.)'),
      currentActionType: z.string().describe('Type of the current action'),
      currentParameters: z.record(z.any()).describe('Parameters of the current action'),
    },
  },

  find_user_by_email: {
    name: 'mattermost_find_user_by_email',
    description: 'Finds a user by email in Neo4j and returns their attributes',
    parameter: {
      email: z.string().describe('Email of the user to find'),
      env: z.enum(['uat', 'prod']).describe('Environment: uat or prod'),
    },
  },
} as const;

export type Neo4jActionToolNames = keyof typeof NEO4J_ACTION_TOOLS;
