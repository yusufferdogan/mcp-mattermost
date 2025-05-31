import neo4j, { Driver, Session, Record as Neo4jRecord } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';

/**
 * Neo4j Action Tracker for recording and analyzing MCP actions
 */
export class ActionTracker {
  private driver: Driver;

  constructor(uri: string, username: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async connect() {
    try {
      await this.driver.verifyConnectivity();
      console.error('Connected to Neo4j Action Tracker');

      // Initialize schema constraints
      await this.initializeSchema();
    } catch (error) {
      console.error('Failed to connect to Neo4j Action Tracker:', error);
      throw error;
    }
  }

  private async initializeSchema() {
    const session = this.driver.session();
    try {
      // Create constraints for unique IDs
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (user:User) REQUIRE user.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (action:Action) REQUIRE action.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (mcp:MCP) REQUIRE mcp.id IS UNIQUE
      `);

      // Create indices for faster lookups
      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (user:User) ON (user.email)
      `);

      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (user:User) ON (user.team)
      `);

      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (action:Action) ON (action.type)
      `);

      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (action:Action) ON (action.name)
      `);

      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (action:Action) ON (action.timestamp)
      `);

      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (action:Action) ON (action.mcpType)
      `);

      // Create fulltext index for context-based search
      try {
        await session.run(`
          CREATE FULLTEXT INDEX actionContext IF NOT EXISTS FOR (a:Action) ON EACH [a.name, a.type]
        `);
      } catch (error) {
        // Fulltext index might already exist, ignore error
        console.error('Fulltext index might already exist:', error);
      }
    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }

  async recordAction({
    userId,
    userName,
    userEmail,
    userTeam,
    mcpId,
    mcpType,
    mcpName,
    actionType,
    actionName,
    parameters,
    result,
    status,
  }: {
    userId: string;
    userName?: string;
    userEmail?: string;
    userTeam?: string;
    mcpId: string;
    mcpType: string;
    mcpName: string;
    actionType: string;
    actionName: string;
    parameters: Record<string, any>;
    result: any;
    status: 'success' | 'failure';
  }) {
    const session = this.driver.session();
    const actionId = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      // Create the action record with all relationships
      await session.run(
        `
        // Ensure the User exists
        MERGE (user:User {id: $userId})
        ON CREATE SET user.name = $userName, user.email = $userEmail, user.team = $userTeam, user.createdAt = $timestamp
        ON MATCH SET user.name = COALESCE($userName, user.name), 
                     user.email = COALESCE($userEmail, user.email), 
                     user.team = COALESCE($userTeam, user.team)
        
        // Ensure the MCP exists
        MERGE (mcp:MCP {id: $mcpId})
        ON CREATE SET mcp.type = $mcpType, mcp.name = $mcpName, mcp.createdAt = $timestamp
        
        // Create a new Action node
        CREATE (action:Action {
          id: $actionId,
          type: $actionType,
          name: $actionName,
          parameters: $parametersJson,
          result: $resultJson,
          status: $status,
          timestamp: $timestamp
        })
        
        // Create relationships
        CREATE (user)-[:PERFORMED]->(action)
        CREATE (action)-[:USED]->(mcp)
        
        RETURN action.id as actionId
      `,
        {
          userId,
          userName,
          userEmail,
          userTeam,
          mcpId,
          mcpType,
          mcpName,
          actionId,
          actionType,
          actionName,
          parametersJson: JSON.stringify(parameters),
          resultJson: JSON.stringify(result),
          status,
          timestamp,
        },
      );

      return {
        success: true,
        actionId,
        message: 'Action recorded successfully',
      };
    } catch (error) {
      console.error('Error recording action:', error);
      return {
        success: false,
        message: `Failed to record action: ${error}`,
      };
    } finally {
      await session.close();
    }
  }

  async findSimilarActions({
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
    const session = this.driver.session();

    try {
      // Find similar actions based on MCP type, action type, and parameters
      const result = await session.run(
        `
        MATCH (action:Action)-[:USED]->(mcp:MCP)
        WHERE mcp.type = $mcpType AND action.type = $actionType
        WITH action, mcp
        // Simple similarity based on parameter keys
        WITH action, mcp, 
             size(keys(apoc.convert.fromJsonMap(action.parameters))) as actionParamCount,
             size(keys($parameters)) as inputParamCount
        WHERE actionParamCount > 0 AND inputParamCount > 0
        WITH action, mcp,
             1.0 * size([key IN keys($parameters) WHERE key IN keys(apoc.convert.fromJsonMap(action.parameters))]) / 
             size(keys($parameters) + [key IN keys(apoc.convert.fromJsonMap(action.parameters)) WHERE NOT key IN keys($parameters)]) as similarity
        WHERE similarity > 0.3
        RETURN action, mcp, similarity
        ORDER BY similarity DESC, action.timestamp DESC
        LIMIT $limit
      `,
        {
          mcpType,
          actionType,
          parameters,
          limit: neo4j.int(limit),
        },
      );

      const similarActions = result.records.map((record: Neo4jRecord) => {
        const action = record.get('action').properties;
        const mcp = record.get('mcp').properties;
        const similarity = record.get('similarity');

        return {
          action: {
            ...action,
            parameters: JSON.parse(action.parameters as string),
            result: JSON.parse(action.result as string),
          },
          mcp,
          similarity,
        };
      });

      return {
        success: true,
        similarActions,
      };
    } catch (error) {
      console.error('Error finding similar actions:', error);
      return {
        success: false,
        message: `Failed to find similar actions: ${error}`,
      };
    } finally {
      await session.close();
    }
  }

  async getUserActionHistory(userId: string, limit = 20) {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (user:User {id: $userId})-[:PERFORMED]->(action:Action)-[:USED]->(mcp:MCP)
        RETURN action, mcp
        ORDER BY action.timestamp DESC
        LIMIT $limit
      `,
        {
          userId,
          limit: neo4j.int(limit),
        },
      );

      const actions = result.records.map((record: Neo4jRecord) => {
        const action = record.get('action').properties;
        const mcp = record.get('mcp').properties;

        return {
          action: {
            ...action,
            parameters: JSON.parse(action.parameters as string),
            result: JSON.parse(action.result as string),
          },
          mcp,
        };
      });

      return {
        success: true,
        actions,
      };
    } catch (error) {
      console.error('Error getting user action history:', error);
      return {
        success: false,
        message: `Failed to get user action history: ${error}`,
      };
    } finally {
      await session.close();
    }
  }

  async suggestNextAction({
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
    const session = this.driver.session();

    try {
      // Find patterns in previous action sequences to suggest the next action
      const result = await session.run(
        `
        // Find similar current actions
        MATCH (currentAction:Action {type: $currentActionType})-[:USED]->(mcp:MCP {type: $mcpType})
        
        // Find users who performed these actions
        MATCH (user:User)-[:PERFORMED]->(currentAction)
        
        // Find what these users did next with the same MCP
        MATCH (user)-[:PERFORMED]->(nextAction:Action)-[:USED]->(mcp)
        WHERE nextAction.timestamp > currentAction.timestamp
        
        // Get the next action within a reasonable time window (30 minutes)
        WITH currentAction, nextAction, mcp,
             duration.between(datetime(currentAction.timestamp), datetime(nextAction.timestamp)) AS timeDiff
        WHERE timeDiff.minutes < 30
        
        // Count occurrences of each next action type to find patterns
        RETURN nextAction.type AS nextActionType, 
               nextAction.name AS nextActionName,
               COLLECT(DISTINCT nextAction.parameters) AS parametersList,
               COUNT(nextAction) AS frequency
        ORDER BY frequency DESC
        LIMIT 3
      `,
        {
          userId,
          mcpType,
          currentActionType,
        },
      );

      const suggestions = result.records.map((record: Neo4jRecord) => {
        return {
          actionType: record.get('nextActionType'),
          actionName: record.get('nextActionName'),
          possibleParameters: record
            .get('parametersList')
            .map((param: string) => JSON.parse(param)),
          frequency: record.get('frequency').toInt(),
        };
      });

      return {
        success: true,
        suggestions,
      };
    } catch (error) {
      console.error('Error suggesting next action:', error);
      return {
        success: false,
        message: `Failed to suggest next action: ${error}`,
      };
    } finally {
      await session.close();
    }
  }

  async getActionRecommendations(userId: string, context: string) {
    const session = this.driver.session();

    try {
      // Use context to find relevant previous actions
      const result = await session.run(
        `
        // Simple text search for now - can be enhanced with fulltext search if available
        MATCH (action:Action)-[:USED]->(mcp:MCP)
        WHERE toLower(action.name) CONTAINS toLower($context) 
           OR toLower(action.type) CONTAINS toLower($context)
        
        // Get the user who performed them
        MATCH (user:User)-[:PERFORMED]->(action)
        
        // Group and count to find most common actions
        WITH mcp, action, user
        
        RETURN mcp.type as mcpType, 
               mcp.name as mcpName, 
               action.type as actionType,
               action.name as actionName,
               COLLECT(DISTINCT action.parameters) as parameterSamples,
               COUNT(action) as frequency
        ORDER BY frequency DESC
        LIMIT 5
      `,
        {
          userId,
          context,
        },
      );

      const recommendations = result.records.map((record: Neo4jRecord) => {
        return {
          mcpType: record.get('mcpType'),
          mcpName: record.get('mcpName'),
          actionType: record.get('actionType'),
          actionName: record.get('actionName'),
          parameterSamples: record
            .get('parameterSamples')
            .map((param: string) => JSON.parse(param)),
          frequency: record.get('frequency').toInt(),
        };
      });

      return {
        success: true,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting action recommendations:', error);
      return {
        success: false,
        message: `Failed to get action recommendations: ${error}`,
      };
    } finally {
      await session.close();
    }
  }

  async findUserByEmail(email: string, env: 'uat' | 'prod') {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (user:User {email: $email})
        RETURN user
        LIMIT 1
      `,
        { email },
      );

      if (result.records.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const user = result.records[0].get('user').properties;

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return {
        success: false,
        message: `Failed to find user: ${error}`,
      };
    } finally {
      await session.close();
    }
  }
}
