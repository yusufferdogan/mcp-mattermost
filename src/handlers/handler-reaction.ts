import { z } from 'zod';

import { AbstractHandler } from './handler';

/**
 * Handler for reaction-related MCP tools
 */
export class HandlerReaction extends AbstractHandler {
  /**
   * Add reactions to a post
   */
  private async addReaction({ postId, emojiName }: { postId: string; emojiName: string[] }) {
    return Promise.all(emojiName.map(v => this.client.addReaction({ postId, emojiName: v })));
  }

  /**
   * Remove reactions from a post
   */
  private async removeReaction({ postId, emojiName }: { postId: string; emojiName: string[] }) {
    return Promise.all(emojiName.map(v => this.client.removeReaction({ postId, emojiName: v })));
  }

  /**
   * Get reactions for a post
   */
  private async getReactions({ postId }: { postId: string }) {
    return this.client.getReactionsForPost({ postId });
  }

  /**
   * Get the MCP tools provided by this handler
   */
  getMcpTools() {
    return [
      this.createMcpTool({
        name: 'mattermost_add_reaction',
        description: 'Add a reaction (emoji) to a post',
        parameter: {
          postId: z.string().describe('Post ID to add the reaction to'),
          emojiName: z
            .string()
            .describe('Comma splitted of array of name of the emoji to use as reaction'),
        },
        handler: async ({ postId, emojiName }: { postId: string; emojiName: string }) => {
          return this.addReaction({ postId, emojiName: emojiName.split(',').map(v => v.trim()) });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_remove_reaction',
        description: 'Remove a reaction (emoji) from a post',
        parameter: {
          postId: z.string().describe('Post ID to remove the reaction from'),
          emojiName: z
            .string()
            .describe('Comma splitted array of name of the emoji reaction to remove'),
        },
        handler: async ({ postId, emojiName }: { postId: string; emojiName: string }) => {
          return this.removeReaction({
            postId,
            emojiName: emojiName.split(',').map(v => v.trim()),
          });
        },
      }),
      this.createMcpTool({
        name: 'mattermost_get_reactions',
        description: 'Get all reactions for a post',
        parameter: { postId: z.string().describe('Post ID to get reactions for') },
        handler: async ({ postId }: { postId: string }) => {
          return this.getReactions({ postId });
        },
      }),
    ];
  }
}
