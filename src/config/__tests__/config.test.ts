import { loadConfig } from '../config';

describe('loadConfig', () => {
  it('should load config from environment variables', () => {
    process.env.MCP_MATTERMOST_URL = 'https://example.com';
    process.env.MCP_MATTERMOST_TOKEN = 'test-token';
    process.env.MCP_MATTERMOST_TEAM_NAME = 'test-team-name';

    const config = loadConfig();
    expect(config).toEqual({
      url: 'https://example.com',
      token: 'test-token',
      teamName: 'test-team-name',
    });
  });

  it('should throw an error for invalid config', () => {
    process.env.MCP_MATTERMOST_URL = '';
    process.env.MCP_MATTERMOST_TOKEN = '';
    process.env.MCP_MATTERMOST_TEAM_NAME = '';

    expect(() => loadConfig()).toThrow();
  });
});
