import { z } from 'zod';

import { AbstractHandler } from './handler';
import { ActionTracker } from '../utils/action-tracker';
import { NEO4J_ACTION_TOOLS } from '../utils/neo4j-tools';

/**
 * Handler for Neo4j action tracking MCP tools
 */
export class HandlerNeo4j extends AbstractHandler {
  constructor(client: any, actionTracker?: ActionTracker | null) {
    super(client, actionTracker);
    if (!this.actionTracker) {
      this.initializeActionTracker();
    }
  }

  private async initializeActionTracker() {
    const neo4jUri = process.env.NEO4J_URI;
    const neo4jUsername = process.env.NEO4J_USERNAME;
    const neo4jPassword = process.env.NEO4J_PASSWORD;

    if (neo4jUri && neo4jUsername && neo4jPassword) {
      try {
        this.actionTracker = new ActionTracker(neo4jUri, neo4jUsername, neo4jPassword);
        await this.actionTracker.connect();
        console.log('Neo4j Action Tracker connected successfully');
      } catch (error) {
        console.warn('Failed to connect to Neo4j Action Tracker:', error);
        this.actionTracker = null;
      }
    } else {
      console.log('Neo4j configuration not found. Action tracking will be disabled.');
    }
  }

  /**
   * Get similar actions based on MCP type, action type, and parameters
   */
  private async getSimilarActions({
    mcpType,
    actionType,
    parameters,
    limit = 5,
  }: {
    mcpType: string;
    actionType: string;
    parameters: Record<string, any>;
    limit?: number;
  }) {
    if (!this.actionTracker) {
      throw new Error('Neo4j Action Tracker not available');
    }

    return this.actionTracker.findSimilarActions({
      mcpType,
      actionType,
      parameters,
      limit,
    });
  }

  /**
   * Get user action history
   */
  private async getUserHistory({ userId, limit = 20 }: { userId: string; limit?: number }) {
    if (!this.actionTracker) {
      throw new Error('Neo4j Action Tracker not available');
    }

    return this.actionTracker.getUserActionHistory(userId, limit);
  }

  /**
   * Suggest next action based on patterns
   */
  private async suggestNextAction({
    userId,
    mcpType,
    currentActionType,
    currentParameters,
  }: {
    userId: string;
    mcpType: string;
    currentActionType: string;
    currentParameters: Record<string, any>;
  }) {
    if (!this.actionTracker) {
      throw new Error('Neo4j Action Tracker not available');
    }

    return this.actionTracker.suggestNextAction({
      userId,
      mcpType,
      currentActionType,
      currentParameters,
    });
  }

  /**
   * Find user by email
   */
  private async findUserByEmail({ email, env }: { email: string; env: 'uat' | 'prod' }) {
    if (!this.actionTracker) {
      throw new Error('Neo4j Action Tracker not available');
    }

    return this.actionTracker.findUserByEmail(email, env);
  }

  /**
   * Get the MCP tools provided by this handler
   */
  getMcpTools() {
    return [
      this.createMcpTool({
        name: NEO4J_ACTION_TOOLS.get_similar_actions.name,
        description: NEO4J_ACTION_TOOLS.get_similar_actions.description,
        parameter: NEO4J_ACTION_TOOLS.get_similar_actions.parameter,
        handler: async ({
          mcpType,
          actionType,
          parameters,
          limit,
        }: {
          mcpType: string;
          actionType: string;
          parameters: Record<string, any>;
          limit?: number;
        }) => {
          return this.getSimilarActions({ mcpType, actionType, parameters, limit });
        },
      }),

      this.createMcpTool({
        name: NEO4J_ACTION_TOOLS.get_user_history.name,
        description: NEO4J_ACTION_TOOLS.get_user_history.description,
        parameter: NEO4J_ACTION_TOOLS.get_user_history.parameter,
        handler: async ({ userId, limit }: { userId: string; limit?: number }) => {
          return this.getUserHistory({ userId, limit });
        },
      }),

      this.createMcpTool({
        name: NEO4J_ACTION_TOOLS.suggest_next_action.name,
        description: NEO4J_ACTION_TOOLS.suggest_next_action.description,
        parameter: NEO4J_ACTION_TOOLS.suggest_next_action.parameter,
        handler: async ({
          userId,
          mcpType,
          currentActionType,
          currentParameters,
        }: {
          userId: string;
          mcpType: string;
          currentActionType: string;
          currentParameters: Record<string, any>;
        }) => {
          return this.suggestNextAction({
            userId,
            mcpType,
            currentActionType,
            currentParameters,
          });
        },
      }),

      this.createMcpTool({
        name: NEO4J_ACTION_TOOLS.find_user_by_email.name,
        description: NEO4J_ACTION_TOOLS.find_user_by_email.description,
        parameter: NEO4J_ACTION_TOOLS.find_user_by_email.parameter,
        handler: async ({ email, env }: { email: string; env: 'uat' | 'prod' }) => {
          return this.findUserByEmail({ email, env });
        },
      }),
    ];
  }

  /**
   * Get action tracker instance
   */
  getActionTracker(): ActionTracker | null {
    return this.actionTracker;
  }

  /**
   * Close action tracker connection
   */
  async close() {
    if (this.actionTracker) {
      await this.actionTracker.close();
    }
  }
}
