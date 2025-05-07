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
   * Get the MCP tools provided by this handler
   */
  getMcpTools() {
    return [
      this.createMcpTool({
        name: 'mattermost_search_channels',
        description: 'Search channels by term',
        parameter: {
          term: z.string().describe('Search term'),
          page: z.number().optional().describe('Page number'),
          perPage: z.number().optional().describe('Number of channels per page'),
        },
        handler: async ({
          term,
          page,
          perPage,
        }: {
          term: string;
          page?: number;
          perPage?: number;
        }) => {
          return this.searchChannels({ term, page, perPage });
        },
      }),
      this.createMcpTool({
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
        handler: async ({ channelId, name }: { channelId?: string; name?: string }) => {
          if (channelId) {
            return this.getChannels({ channelId: channelId.split(',').map(v => v.trim()) });
          }
          if (name) {
            return this.getChannels({ name: name.split(',').map(v => v.trim()) });
          }
          throw new Error('Please provide channel ID or channel name');
        },
      }),
    ];
  }
}
