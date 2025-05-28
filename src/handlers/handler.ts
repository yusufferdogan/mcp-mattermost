import { MattermostClient } from '../client/mattermost-client';
import { createMcpTool } from '../utils/response-formatter';
import { ActionTracker } from '../utils/action-tracker';

/**
 * User identity information extracted from Cursor auth headers
 */
export interface UserIdentity {
  userId: string;
  userName?: string;
  userEmail?: string;
  userTeam?: string;
}

/**
 * Abstract handler class for MCP tools
 * Provides common functionality and access to the Mattermost client
 */
export abstract class AbstractHandler {
  protected readonly client: MattermostClient;
  protected actionTracker: ActionTracker | null = null;

  /**
   * Create a new handler
   * @param client Mattermost client
   * @param actionTracker Optional action tracker for recording actions
   */
  constructor(client: MattermostClient, actionTracker?: ActionTracker | null) {
    this.client = client;
    this.actionTracker = actionTracker || null;
  }

  /**
   * Get the MCP tools provided by this handler
   * Each handler should implement this method to provide its tools
   */
  abstract getMcpTools(): unknown[];

  /**
   * Helper method to create an MCP tool with optional action tracking
   * @param arg Tool definition
   */
  protected createMcpTool = createMcpTool;

  /**
   * Extract user identity from Cursor auth headers
   * @param headers Request headers
   * @returns User identity or null if not available
   */
  protected extractUserIdentity(headers?: Record<string, string>): UserIdentity | null {
    try {
      const cursorAuth = headers?.['cursor-auth'];
      if (!cursorAuth) {
        // Fallback to environment variables
        const userId = process.env.CURSOR_USER_ID;
        const userName = process.env.CURSOR_USER_NAME;
        const userEmail = process.env.CURSOR_USER_EMAIL;
        const userTeam = process.env.CURSOR_USER_TEAM;

        if (userId) {
          return {
            userId,
            userName,
            userEmail,
            userTeam,
          };
        }

        return null;
      }

      const decoded = Buffer.from(cursorAuth, 'base64').toString('utf-8');
      const userInfo = JSON.parse(decoded);

      return {
        userId: userInfo.userId || 'unknown',
        userName: userInfo.userName,
        userEmail: userInfo.userEmail,
        userTeam: userInfo.userTeam,
      };
    } catch (error) {
      console.warn('Failed to extract user identity:', error);
      return null;
    }
  }

  /**
   * Record an action in the action tracker
   * @param userIdentity User identity
   * @param actionType Type of action
   * @param actionName Name of the action
   * @param parameters Action parameters
   * @param result Action result
   * @param status Action status
   */
  protected async recordAction(
    userIdentity: UserIdentity | null,
    actionType: string,
    actionName: string,
    parameters: Record<string, any>,
    result: any,
    status: 'success' | 'failure',
  ) {
    if (!this.actionTracker || !userIdentity) {
      return;
    }

    try {
      await this.actionTracker.recordAction({
        userId: userIdentity.userId,
        userName: userIdentity.userName,
        userEmail: userIdentity.userEmail,
        userTeam: userIdentity.userTeam,
        mcpId: 'mcp-mattermost',
        mcpType: 'Mattermost',
        mcpName: 'Mattermost MCP Server',
        actionType,
        actionName,
        parameters,
        result,
        status,
      });
    } catch (error) {
      console.warn('Failed to record action:', error);
    }
  }

  /**
   * Create an MCP tool with action tracking support
   * @param config Tool configuration
   * @returns Tool with action tracking
   */
  protected createTrackedMcpTool(config: {
    name: string;
    description: string;
    parameter: any;
    handler: (args: Record<string, any>, userIdentity?: UserIdentity | null) => Promise<any>;
    actionType?: string;
  }) {
    return this.createMcpTool({
      name: config.name,
      description: config.description,
      parameter: config.parameter,
      handler: async (args: Record<string, any>) => {
        const userIdentity = this.extractUserIdentity();
        const actionType = config.actionType || 'mattermost_action';
        const actionName = config.name;

        try {
          const result = await config.handler(args, userIdentity);

          // Record successful action
          await this.recordAction(userIdentity, actionType, actionName, args, result, 'success');

          return result;
        } catch (error) {
          // Record failed action
          await this.recordAction(
            userIdentity,
            actionType,
            actionName,
            args,
            { error: error instanceof Error ? error.message : String(error) },
            'failure',
          );

          throw error;
        }
      },
    });
  }
}
