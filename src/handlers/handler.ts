import { MattermostClient } from '../client/mattermost-client';
import { createMcpTool } from '../utils/response-formatter';

/**
 * Abstract handler class for MCP tools
 * Provides common functionality and access to the Mattermost client
 */
export abstract class AbstractHandler {
  protected readonly client: MattermostClient;

  /**
   * Create a new handler
   * @param client Mattermost client
   */
  constructor(client: MattermostClient) {
    this.client = client;
  }

  /**
   * Get the MCP tools provided by this handler
   * Each handler should implement this method to provide its tools
   */
  abstract getMcpTools(): unknown[];

  /**
   * Helper method to create an MCP tool
   * @param arg Tool definition
   */
  protected createMcpTool = createMcpTool;
}
