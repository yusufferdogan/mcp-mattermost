import {
  handleMcp,
  wrapMcpHandler,
  createMcpTool,
  formatSuccess,
  formatError,
} from '../response-formatter';

describe('response-formatter', () => {
  it('should handle a successful promise', async () => {
    const result = await handleMcp(Promise.resolve('success'));
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('"success"');
  });

  it('should handle a failed promise', async () => {
    const result = await handleMcp(Promise.reject('error'));
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('error');
  });

  it('should wrap an MCP handler', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = wrapMcpHandler(async (_arg: any) => 'success');
    const result = await handler({});
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('"success"');
  });

  it('should create an MCP tool', async () => {
    const tool = createMcpTool({
      name: 'test-tool',
      description: 'Test tool',
      parameter: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async (_arg: any) => ({ result: 'success' }),
    });
    expect(tool.name).toBe('test-tool');
    expect(tool.description).toBe('Test tool');
    const result = await tool.handler({});
    expect(result.isError).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(JSON.parse(result.content[0].text as any).result).toBe('success');
  });

  it('should format a successful response', () => {
    const result = formatSuccess('success');
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('"success"');
  });

  it('should format an error response', () => {
    const result = formatError('error');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('error');
  });
});
