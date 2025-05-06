import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * Standard MCP response format
 */
export type McpResponse = CallToolResult;

/**
 * Handle a promise and format the result for MCP
 * @param promise Promise to handle
 * @returns Formatted response
 */
export async function handleMcp<T>(promise: Promise<T>): Promise<McpResponse> {
  try {
    return formatSuccess(await promise);
  } catch (e) {
    return formatError(`${e}`);
  }
}

/**
 * Handle a promise and format the result for MCP
 * @returns Formatted handler
 * @param handler
 */
export function wrapMcpHandler<E extends z.ZodRawShape>(
  handler: (arg: z.objectOutputType<E, z.ZodTypeAny>) => Promise<unknown>,
) {
  return (arg: z.objectOutputType<E, z.ZodTypeAny>) => handleMcp(handler(arg));
}

/**
 * Create a typed MCP tool definition
 * @param arg Tool definition
 * @returns Tool definition with proper typing
 */
export function createMcpTool<E extends z.ZodRawShape>(arg: {
  name: string;
  description: string;
  parameter: E;
  handler: (arg: z.objectOutputType<E, z.ZodTypeAny>) => Promise<unknown>;
}) {
  return { ...arg, handler: wrapMcpHandler(arg.handler) };
}

/**
 * Format a successful response
 * @param data Data to include in the response
 * @returns Formatted MCP response
 */
export function formatSuccess(data: unknown): McpResponse {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
    isError: false,
  };
}

/**
 * Format an error response
 * @param message Error message
 * @returns Formatted MCP response
 */
export function formatError(message: string): McpResponse {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
