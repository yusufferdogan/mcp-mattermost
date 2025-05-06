import { MattermostClient } from '../client/mattermost-client';
import { MattermostConfig } from '../config/config';

import { HandlerChannel } from './handler-channel';
import { HandlerPost } from './handler-post';
import { HandlerReaction } from './handler-reaction';
import { HandlerUser } from './handler-user';

/**
 * Get MCP tools for Mattermost
 * @param config Mattermost configuration
 * @returns Array of MCP tools
 */
export async function getMattermostMcpTools(config: MattermostConfig) {
  const mattermostClient = new MattermostClient(config);
  try {
    await mattermostClient.init();
  } catch (e) {
    throw new Error(
      `Initializing mattermost client failed, please check your configuration, Error: ${e}`,
    );
  }

  const handlerUser = new HandlerUser(mattermostClient);
  const handlerChannel = new HandlerChannel(mattermostClient);
  const handlerPost = new HandlerPost(mattermostClient);
  const handlerReaction = new HandlerReaction(mattermostClient);

  return [
    ...handlerUser.getMcpTools(),
    ...handlerChannel.getMcpTools(),
    ...handlerPost.getMcpTools(),
    ...handlerReaction.getMcpTools(),
  ];
}
