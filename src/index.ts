#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { loadConfig } from './config/config';
import { getMattermostMcpTools } from './handlers';

/**
 * Main entry point for the Mattermost MCP server
 */
async function main() {
  try {
    const config = loadConfig();
    const server = new McpServer({
      name: 'mcp-mattermost',
      version: '0.0.5',
    });

    const tools = await getMattermostMcpTools(config);
    tools.forEach(tool => {
      if (
        typeof tool === 'object' &&
        tool !== null &&
        'name' in tool &&
        'description' in tool &&
        'parameter' in tool &&
        'handler' in tool
      ) {
        server.tool(
          tool.name as string,
          tool.description as string,
          tool.parameter as any,
          tool.handler as any,
        );
      }
    });

    await server.connect(new StdioServerTransport());
  } catch (e) {
    process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  }
}

main();
