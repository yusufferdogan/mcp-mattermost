import { z } from 'zod';

import { AbstractHandler } from './handler';

/**
 * Handler for channel-related MCP tools
 */
export class HandlerChannel extends AbstractHandler {
  /**
   * Get channels by ID or name
   */
  private async getChannels({ channelId, name }: { channelId?: string[]; name?: string[] }) {
    if (channelId) {
      return Promise.all(channelId.map(v => this.client.getChannel({ channelId: v })));
    }
    if (name) {
      return Promise.all(name.map(v => this.client.getChannelByName({ name: v })));
    }
    throw new Error('Either channelId or name must be provided');
  }

  /**
   * Search channels by term
   */
  private async searchChannels({
    term,
    page = 0,
    perPage = 100,
  }: {
    term: string;
    page?: number;
    perPage?: number;
  }) {
    return this.client.searchChannels({ term, page, perPage });
  }

  /**
   * Get channels for the current user
   */
  private async getMyChannels() {
    return this.client.getMyChannels();
  }

  /**
   * Get the MCP tools provided by this handler
   */
  getMcpTools() {
    return [
      this.createTrackedMcpTool({
        name: 'mattermost_search_channels',
        description: 'Search channels by term',
        parameter: {
          term: z.string().describe('Search term'),
          page: z.number().optional().describe('Page number'),
          perPage: z.number().optional().describe('Number of channels per page'),
        },
        actionType: 'channel_search',
        handler: async (args: Record<string, any>) => {
          const { term, page, perPage } = args as { term: string; page?: number; perPage?: number };
          return this.searchChannels({ term, page, perPage });
        },
      }),
      this.createTrackedMcpTool({
        name: 'mattermost_get_channels',
        description: 'Get channels by channel ID or name',
        parameter: {
          channelId: z
            .string()
            .describe('Channel ID')
            .optional()
            .describe(
              'Comma splitted array of channel IDs, which channel ID or channel name is required',
            ),
          name: z
            .string()
            .describe('Channel name')
            .optional()
            .describe(
              'Comma splitted array of channel names, which channel ID or channel name is required',
            ),
        },
        actionType: 'channel_retrieval',
        handler: async (args: Record<string, any>) => {
          const { channelId, name } = args as { channelId?: string; name?: string };
          if (channelId) {
            return this.getChannels({ channelId: channelId.split(',').map(v => v.trim()) });
          }
          if (name) {
            return this.getChannels({ name: name.split(',').map(v => v.trim()) });
          }
          throw new Error('Please provide channel ID or channel name');
        },
      }),
      this.createTrackedMcpTool({
        name: 'mattermost_get_my_channels',
        description: 'Get channels that the current user is a member of',
        parameter: {},
        actionType: 'channel_retrieval',
        handler: async () => {
          return this.getMyChannels();
        },
      }),
    ];
  }
}
