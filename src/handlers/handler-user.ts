import { z } from 'zod';

import { AbstractHandler } from './handler';

/**
 * Handler for user-related MCP tools
 */
export class HandlerUser extends AbstractHandler {
  /**
   * Get users by user ID or username
   */
  private async getUsers({ userId, username }: { userId?: string[]; username?: string[] }) {
    if (userId) {
      return Promise.all(userId.map(v => this.client.getUser({ userId: v })));
    }
    if (username) {
      return Promise.all(username.map(v => this.client.getUserByUsername({ username: v })));
    }
    throw new Error('Either userId or username must be provided');
  }

  /**
   * Search users by term
   */
  private async searchUsers({ term }: { term: string }) {
    return this.client.searchUsers({ term });
  }

  /**
   * Get the MCP tools provided by this handler
   */
  getMcpTools() {
    return [
      this.createTrackedMcpTool({
        name: 'mattermost_get_users',
        description: 'Get users by username or user ID',
        parameter: {
          username: z
            .string()
            .describe('Username')
            .optional()
            .describe('Comma splitted array of usernames, which username or user ID is required'),
          userId: z
            .string()
            .describe('User ID')
            .optional()
            .describe('Comma splitted array of user ID, which username or user ID is required'),
        },
        actionType: 'user_retrieval',
        handler: async (args: Record<string, any>) => {
          const { username, userId } = args as { username?: string; userId?: string };
          if (userId) {
            return this.getUsers({ userId: userId.split(',').map(v => v.trim()) });
          }
          if (username) {
            return this.getUsers({ username: username.split(',').map(v => v.trim()) });
          }
          throw new Error('Please provide username or user ID');
        },
      }),
      this.createTrackedMcpTool({
        name: 'mattermost_search_users',
        description: 'Search users by term',
        parameter: { term: z.string().describe('Search term') },
        actionType: 'user_search',
        handler: async (args: Record<string, any>) => {
          const { term } = args as { term: string };
          return this.searchUsers({ term });
        },
      }),
    ];
  }
}
