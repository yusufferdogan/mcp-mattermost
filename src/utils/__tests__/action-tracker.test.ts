import { ActionTracker } from '../action-tracker';

// Mock Neo4j driver
jest.mock('neo4j-driver', () => ({
  driver: jest.fn(() => ({
    verifyConnectivity: jest.fn(),
    session: jest.fn(() => ({
      run: jest.fn(),
      close: jest.fn(),
    })),
    close: jest.fn(),
  })),
  auth: {
    basic: jest.fn(),
  },
  int: jest.fn(value => value),
}));

describe('ActionTracker', () => {
  let actionTracker: ActionTracker;
  const mockSession = {
    run: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    actionTracker = new ActionTracker('bolt://localhost:7687', 'neo4j', 'password');

    // Mock the driver session
    const neo4j = require('neo4j-driver');
    neo4j.driver().session.mockReturnValue(mockSession);
  });

  describe('connect', () => {
    it('should connect to Neo4j and initialize schema', async () => {
      const neo4j = require('neo4j-driver');
      neo4j.driver().verifyConnectivity.mockResolvedValue(undefined);
      mockSession.run.mockResolvedValue({ records: [] });

      await actionTracker.connect();

      expect(neo4j.driver().verifyConnectivity).toHaveBeenCalled();
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE CONSTRAINT IF NOT EXISTS FOR (user:User)'),
      );
    });

    it('should handle connection errors', async () => {
      const neo4j = require('neo4j-driver');
      neo4j.driver().verifyConnectivity.mockRejectedValue(new Error('Connection failed'));

      await expect(actionTracker.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('recordAction', () => {
    beforeEach(async () => {
      const neo4j = require('neo4j-driver');
      neo4j.driver().verifyConnectivity.mockResolvedValue(undefined);
      mockSession.run.mockResolvedValue({ records: [] });
      await actionTracker.connect();
    });

    it('should record an action successfully', async () => {
      const actionData = {
        userId: 'user123',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        userTeam: 'Engineering',
        mcpId: 'mcp-mattermost',
        mcpType: 'Mattermost',
        mcpName: 'Mattermost MCP Server',
        actionType: 'post_creation',
        actionName: 'mattermost_create_post',
        parameters: { channelId: 'channel123', message: 'Hello world' },
        result: { postId: 'post123' },
        status: 'success' as const,
      };

      mockSession.run.mockResolvedValue({
        records: [{ get: () => 'action-id-123' }],
      });

      const result = await actionTracker.recordAction(actionData);

      expect(result.success).toBe(true);
      expect(result.actionId).toBeDefined();
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (user:User {id: $userId})'),
        expect.objectContaining({
          userId: 'user123',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          userTeam: 'Engineering',
        }),
      );
    });

    it('should handle recording errors', async () => {
      mockSession.run.mockRejectedValue(new Error('Database error'));

      const actionData = {
        userId: 'user123',
        mcpId: 'mcp-mattermost',
        mcpType: 'Mattermost',
        mcpName: 'Mattermost MCP Server',
        actionType: 'post_creation',
        actionName: 'mattermost_create_post',
        parameters: {},
        result: {},
        status: 'success' as const,
      };

      const result = await actionTracker.recordAction(actionData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to record action');
    });
  });

  describe('findSimilarActions', () => {
    beforeEach(async () => {
      const neo4j = require('neo4j-driver');
      neo4j.driver().verifyConnectivity.mockResolvedValue(undefined);
      mockSession.run.mockResolvedValue({ records: [] });
      await actionTracker.connect();
    });

    it('should find similar actions', async () => {
      const mockRecords = [
        {
          get: (field: string) => {
            if (field === 'action') {
              return {
                properties: {
                  id: 'action123',
                  type: 'post_creation',
                  name: 'mattermost_create_post',
                  parameters: '{"channelId":"channel123"}',
                  result: '{"postId":"post123"}',
                },
              };
            }
            if (field === 'mcp') {
              return {
                properties: {
                  id: 'mcp-mattermost',
                  type: 'Mattermost',
                },
              };
            }
            if (field === 'similarity') {
              return 0.8;
            }
          },
        },
      ];

      mockSession.run.mockResolvedValue({ records: mockRecords });

      const result = await actionTracker.findSimilarActions({
        mcpType: 'Mattermost',
        actionType: 'post_creation',
        parameters: { channelId: 'channel123' },
        limit: 5,
      });

      expect(result.success).toBe(true);
      expect(result.similarActions).toHaveLength(1);
      expect(result.similarActions[0].action.type).toBe('post_creation');
      expect(result.similarActions[0].similarity).toBe(0.8);
    });
  });

  describe('getUserActionHistory', () => {
    beforeEach(async () => {
      const neo4j = require('neo4j-driver');
      neo4j.driver().verifyConnectivity.mockResolvedValue(undefined);
      mockSession.run.mockResolvedValue({ records: [] });
      await actionTracker.connect();
    });

    it('should get user action history', async () => {
      const mockRecords = [
        {
          get: (field: string) => {
            if (field === 'action') {
              return {
                properties: {
                  id: 'action123',
                  type: 'post_creation',
                  parameters: '{"channelId":"channel123"}',
                  result: '{"postId":"post123"}',
                  timestamp: '2023-12-01T10:00:00.000Z',
                },
              };
            }
            if (field === 'mcp') {
              return {
                properties: {
                  id: 'mcp-mattermost',
                  type: 'Mattermost',
                },
              };
            }
          },
        },
      ];

      mockSession.run.mockResolvedValue({ records: mockRecords });

      const result = await actionTracker.getUserActionHistory('user123', 10);

      expect(result.success).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].action.type).toBe('post_creation');
    });
  });

  describe('close', () => {
    it('should close the driver connection', async () => {
      const neo4j = require('neo4j-driver');

      await actionTracker.close();

      expect(neo4j.driver().close).toHaveBeenCalled();
    });
  });
});
