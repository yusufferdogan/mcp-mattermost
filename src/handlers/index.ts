import { MattermostClient } from '../client/mattermost-client';
import { MattermostConfig } from '../config/config';
import { ActionTracker } from '../utils/action-tracker';

import { HandlerChannel } from './handler-channel';
import { HandlerPost } from './handler-post';
import { HandlerReaction } from './handler-reaction';
import { HandlerUser } from './handler-user';
import { HandlerNeo4j } from './handler-neo4j';

/**
 * Initialize Neo4j Action Tracker if configuration is available
 * @returns ActionTracker instance or null if not configured
 */
async function initializeActionTracker(): Promise<ActionTracker | null> {
  const neo4jUri = process.env.NEO4J_URI;
  const neo4jUsername = process.env.NEO4J_USERNAME;
  const neo4jPassword = process.env.NEO4J_PASSWORD;

  if (neo4jUri && neo4jUsername && neo4jPassword) {
    try {
      const actionTracker = new ActionTracker(neo4jUri, neo4jUsername, neo4jPassword);
      await actionTracker.connect();
      console.log('Neo4j Action Tracker initialized successfully');
      return actionTracker;
    } catch (error) {
      console.warn('Failed to initialize Neo4j Action Tracker:', error);
      return null;
    }
  } else {
    console.log('Neo4j configuration not found. Action tracking will be disabled.');
    return null;
  }
}

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

  // Initialize action tracker
  const actionTracker = await initializeActionTracker();

  // Create handlers with action tracker
  const handlerUser = new HandlerUser(mattermostClient, actionTracker);
  const handlerChannel = new HandlerChannel(mattermostClient, actionTracker);
  const handlerPost = new HandlerPost(mattermostClient, actionTracker);
  const handlerReaction = new HandlerReaction(mattermostClient, actionTracker);
  const handlerNeo4j = new HandlerNeo4j(mattermostClient);

  const tools = [
    ...handlerUser.getMcpTools(),
    ...handlerChannel.getMcpTools(),
    ...handlerPost.getMcpTools(),
    ...handlerReaction.getMcpTools(),
    ...handlerNeo4j.getMcpTools(),
  ];

  return tools;
}
