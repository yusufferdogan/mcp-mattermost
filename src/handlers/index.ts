import { MattermostClient } from '../client/mattermost-client';
import { MattermostConfig } from '../config/config';
import { ActionTracker } from '../utils/action-tracker';

import { HandlerChannel } from './handler-channel';
import { HandlerPost } from './handler-post';
import { HandlerReaction } from './handler-reaction';
import { HandlerUser } from './handler-user';
import { HandlerNeo4j } from './handler-neo4j';

let mattermostClient: MattermostClient | null = null;
let actionTracker: ActionTracker | null = null;
let clientInitializationPromise: Promise<void> | null = null;

/**
 * Initialize Neo4j Action Tracker if configuration is available
 * @returns ActionTracker instance or null if not configured
 */
async function initializeActionTracker(): Promise<ActionTracker | null> {
  if (actionTracker) {
    return actionTracker;
  }

  const neo4jUri = process.env.NEO4J_URI;
  const neo4jUsername = process.env.NEO4J_USERNAME;
  const neo4jPassword = process.env.NEO4J_PASSWORD;

  if (neo4jUri && neo4jUsername && neo4jPassword) {
    try {
      actionTracker = new ActionTracker(neo4jUri, neo4jUsername, neo4jPassword);
      await actionTracker.connect();
      console.error('Neo4j Action Tracker initialized successfully');
      return actionTracker;
    } catch (error) {
      console.warn('Failed to initialize Neo4j Action Tracker:', error);
      return null;
    }
  } else {
    console.error('Neo4j configuration not found. Action tracking will be disabled.');
    return null;
  }
}

/**
 * Initialize Mattermost client lazily
 * @param config Mattermost configuration
 * @returns Promise that resolves when client is initialized
 */
async function initializeMattermostClient(config: MattermostConfig): Promise<void> {
  if (mattermostClient) {
    return;
  }

  if (clientInitializationPromise) {
    return clientInitializationPromise;
  }

  clientInitializationPromise = (async () => {
    try {
      mattermostClient = new MattermostClient(config);
      await mattermostClient.init();
      console.error('Mattermost client initialized successfully');
    } catch (e) {
      mattermostClient = null;
      clientInitializationPromise = null;
      throw new Error(
        `Initializing mattermost client failed, please check your configuration, Error: ${e}`,
      );
    }
  })();

  return clientInitializationPromise;
}

/**
 * Get initialized Mattermost client
 * @param config Mattermost configuration
 * @returns Initialized Mattermost client
 */
async function getMattermostClient(config: MattermostConfig): Promise<MattermostClient> {
  if (!mattermostClient) {
    await initializeMattermostClient(config);
  }

  if (!mattermostClient) {
    throw new Error('Mattermost client failed to initialize');
  }

  return mattermostClient;
}

/**
 * Create a lazy MCP tool that initializes the client on first use
 * @param config Mattermost configuration
 * @param toolFactory Function that creates tools given initialized handlers
 * @returns Lazy MCP tool
 */
function createLazyMcpTool(
  config: MattermostConfig,
  toolFactory: (handlers: {
    handlerUser: HandlerUser;
    handlerChannel: HandlerChannel;
    handlerPost: HandlerPost;
    handlerReaction: HandlerReaction;
    handlerNeo4j: HandlerNeo4j;
  }) => any,
) {
  return {
    ...toolFactory({} as any), // Provide dummy handlers for tool definition
    handler: async (...args: any[]) => {
      // Initialize client on first tool invocation
      const client = await getMattermostClient(config);
      const tracker = await initializeActionTracker();

      // Create real handlers
      const handlerUser = new HandlerUser(client, tracker);
      const handlerChannel = new HandlerChannel(client, tracker);
      const handlerPost = new HandlerPost(client, tracker);
      const handlerReaction = new HandlerReaction(client, tracker);
      const handlerNeo4j = new HandlerNeo4j(client, tracker);

      // Get the actual tool and call its handler
      const actualTool = toolFactory({
        handlerUser,
        handlerChannel,
        handlerPost,
        handlerReaction,
        handlerNeo4j,
      });

      return actualTool.handler(...args);
    },
  };
}

/**
 * Get MCP tools for Mattermost with lazy initialization
 * @param config Mattermost configuration
 * @returns Array of MCP tools
 */
export async function getMattermostMcpTools(config: MattermostConfig) {
  // Initialize action tracker early (it's independent of Mattermost)
  const tracker = await initializeActionTracker();

  // Create dummy client for tool definitions (no network calls)
  const dummyClient = new MattermostClient(config);

  // Create handlers with dummy client for tool definitions
  const handlerUser = new HandlerUser(dummyClient, tracker);
  const handlerChannel = new HandlerChannel(dummyClient, tracker);
  const handlerPost = new HandlerPost(dummyClient, tracker);
  const handlerReaction = new HandlerReaction(dummyClient, tracker);
  const handlerNeo4j = new HandlerNeo4j(dummyClient, tracker);

  // Get all tool definitions
  const userTools = handlerUser.getMcpTools();
  const channelTools = handlerChannel.getMcpTools();
  const postTools = handlerPost.getMcpTools();
  const reactionTools = handlerReaction.getMcpTools();
  const neo4jTools = handlerNeo4j.getMcpTools();

  // Wrap each tool with lazy initialization
  const tools = [
    ...userTools.map(tool => ({
      ...tool,
      handler: async (args: any) => {
        const client = await getMattermostClient(config);
        const realHandler = new HandlerUser(client, tracker);
        const realTool = realHandler.getMcpTools().find(t => t.name === tool.name);
        return realTool?.handler(args);
      },
    })),
    ...channelTools.map(tool => ({
      ...tool,
      handler: async (args: any) => {
        const client = await getMattermostClient(config);
        const realHandler = new HandlerChannel(client, tracker);
        const realTool = realHandler.getMcpTools().find(t => t.name === tool.name);
        return realTool?.handler(args);
      },
    })),
    ...postTools.map(tool => ({
      ...tool,
      handler: async (args: any) => {
        const client = await getMattermostClient(config);
        const realHandler = new HandlerPost(client, tracker);
        const realTool = realHandler.getMcpTools().find(t => t.name === tool.name);
        return realTool?.handler(args);
      },
    })),
    ...reactionTools.map(tool => ({
      ...tool,
      handler: async (args: any) => {
        const client = await getMattermostClient(config);
        const realHandler = new HandlerReaction(client, tracker);
        const realTool = realHandler.getMcpTools().find(t => t.name === tool.name);
        return realTool?.handler(args);
      },
    })),
    ...neo4jTools,
  ];

  return tools;
}
