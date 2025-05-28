# Mattermost MCP Server

A [Model Context Protocol server](https://modelcontextprotocol.io/) for Mattermost, enabling Claude to interact with your Mattermost instance.

## Author

dakatan (tkdtkd0022@gmail.com)

## Features

### Core Mattermost Integration

- **Post Management**: Create, search, pin/unpin posts, and manage threads
- **Channel Operations**: Search and retrieve channel information
- **User Management**: Search and retrieve user information
- **Reaction Management**: Add, remove, and retrieve post reactions

### Neo4j Action Tracking

- **Action Recording**: Automatically record all MCP actions in a Neo4j graph database
- **Pattern Recognition**: Find similar actions and usage patterns
- **Smart Recommendations**: Get action suggestions based on historical data
- **Cross-MCP Analytics**: Track relationships between different MCP systems
- **User Identity Management**: Link actions to specific users and teams
- **Organizational Memory**: Build a knowledge graph of team actions and workflows

## Setup

### Quick Start with Docker

The fastest way to get started is using Docker with the provided `docker-compose.yml`:

1. Clone the repository:

```bash
git clone https://github.com/dakatan/mcp-mattermost.git
cd mcp-mattermost
```

2. Create environment file:

```bash
cp env.example .env
# Edit .env with your configuration
```

3. Start the services:

```bash
docker-compose up -d
```

This will start both the MCP server and a Neo4j instance for action tracking.

### Docker Deployment

#### Building the Docker Image

```bash
docker build -t mcp-mattermost .
```

#### Running with Docker

```bash
docker run -d \
  --name mcp-mattermost \
  -e MATTERMOST_URL="https://your-mattermost-instance.com" \
  -e MATTERMOST_TOKEN="your-personal-access-token" \
  -e NEO4J_URI="bolt://neo4j:7687" \
  -e NEO4J_USERNAME="neo4j" \
  -e NEO4J_PASSWORD="your_password" \
  mcp-mattermost
```

#### Environment Variables

| Variable            | Required | Description                                |
| ------------------- | -------- | ------------------------------------------ |
| `MATTERMOST_URL`    | Yes      | Your Mattermost instance URL               |
| `MATTERMOST_TOKEN`  | Yes      | Personal access token for Mattermost       |
| `NEO4J_URI`         | No       | Neo4j connection URI (for action tracking) |
| `NEO4J_USERNAME`    | No       | Neo4j username                             |
| `NEO4J_PASSWORD`    | No       | Neo4j password                             |
| `CURSOR_USER_ID`    | No       | User ID for Cursor integration             |
| `CURSOR_USER_NAME`  | No       | User name for Cursor integration           |
| `CURSOR_USER_EMAIL` | No       | User email for Cursor integration          |
| `CURSOR_USER_TEAM`  | No       | Team name for Cursor integration           |

### Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
# Required: Mattermost configuration
export MATTERMOST_URL="https://your-mattermost-instance.com"
export MATTERMOST_TOKEN="your-personal-access-token"

# Optional: Neo4j Action Tracking
export NEO4J_URI="bolt://localhost:7687"
export NEO4J_USERNAME="neo4j"
export NEO4J_PASSWORD="your_password"

# Optional: Cursor Integration (for user identity)
export CURSOR_USER_ID="your_user_id"
export CURSOR_USER_NAME="Your Name"
export CURSOR_USER_EMAIL="your@email.com"
export CURSOR_USER_TEAM="Your Team"
```

3. (Optional) Initialize Neo4j schema for action tracking:

```bash
npm run build
npm run init-neo4j
```

4. Build and start the server:

```bash
npm run build
npm start
```

### Neo4j Setup for Action Tracking

If you want to enable advanced action tracking and analytics:

#### Using Docker (Recommended)

The `docker-compose.yml` file includes a Neo4j service that's automatically configured:

```bash
docker-compose up neo4j -d
```

Neo4j will be available at:

- Browser interface: http://localhost:7474
- Bolt connection: bolt://localhost:7687
- Default credentials: neo4j/password (change via NEO4J_PASSWORD env var)

#### Manual Neo4j Installation

1. Install Neo4j Desktop or use Neo4j AuraDB
2. Create a new database
3. Set the Neo4j environment variables as shown above
4. Run the schema initialization:

```bash
npm run init-neo4j
```

This will create the necessary constraints and indexes:

```cypher
CREATE CONSTRAINT IF NOT EXISTS FOR (user:User) REQUIRE user.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (mcp:MCP) REQUIRE mcp.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (action:Action) REQUIRE action.id IS UNIQUE;
CREATE INDEX IF NOT EXISTS FOR (user:User) ON (user.email);
CREATE INDEX IF NOT EXISTS FOR (user:User) ON (user.team);
CREATE INDEX IF NOT EXISTS FOR (action:Action) ON (action.type);
CREATE INDEX IF NOT EXISTS FOR (action:Action) ON (action.name);
CREATE FULLTEXT INDEX actionContext IF NOT EXISTS FOR (a:Action) ON EACH [a.name, a.type];
```

## Architecture

### Lazy Initialization

The MCP server uses lazy initialization to avoid connection failures during startup. The Mattermost client is only initialized when the first tool is invoked, allowing the server to start successfully even without immediate Mattermost connectivity.

### Action Tracking

When Neo4j is configured, the server automatically tracks:

- **User Actions**: All MCP tool invocations with user context
- **Action Relationships**: Links between different actions and services
- **Usage Patterns**: Historical data for recommendations and insights
- **Cross-Service Data**: Relationships between Mattermost and other MCP systems

## Tools

### Post Management

#### mattermost_search_posts

Search posts with advanced modifiers support.

**Parameters:**

- `terms` (string): Search term with optional modifiers
- `page` (number, optional): Page number for pagination
- `perPage` (number, optional): Number of posts per page

**Search Modifiers:**

- `from:username` - Find posts from specific users
- `in:channel` - Find posts in specific channels
- `before:YYYY-MM-DD` - Find posts before a date
- `after:YYYY-MM-DD` - Find posts after a date
- `on:YYYY-MM-DD` - Find posts on a specific date
- `-term` - Exclude posts containing the term
- `"exact phrase"` - Search for exact phrases
- `term*` - Wildcard search
- `#hashtag` - Search for hashtags

**Example:**

```json
{
  "terms": "meeting in:town-square from:john after:2023-01-01",
  "page": 0,
  "perPage": 50
}
```

#### mattermost_create_post

Create a new post in a channel.

**Parameters:**

- `channelId` (string): Target channel ID
- `message` (string): Message content
- `rootId` (string, optional): Reply to this post ID

#### mattermost_get_posts

Get posts by their IDs.

**Parameters:**

- `postId` (string): Comma-separated list of post IDs

#### mattermost_get_posts_unread

Get unread posts in a channel for the current user.

**Parameters:**

- `channelId` (string): Channel ID

#### mattermost_get_posts_thread

Get all posts in a thread.

**Parameters:**

- `rootId` (string): Thread parent post ID
- `perPage` (number, optional): Number of posts per page
- `fromPost` (string, optional): Start from this post ID

#### mattermost_pin_post / mattermost_unpin_post

Pin or unpin a post to/from a channel.

**Parameters:**

- `postId` (string): Post ID to pin/unpin

#### mattermost_get_pinned_posts

Get all pinned posts in a channel.

**Parameters:**

- `channelId` (string): Channel ID

### Channel Management

#### mattermost_search_channels

Search channels by term.

**Parameters:**

- `term` (string): Search term
- `page` (number, optional): Page number
- `perPage` (number, optional): Number of channels per page

#### mattermost_get_channels

Get channels by ID or name.

**Parameters:**

- `channelId` (string, optional): Comma-separated channel IDs
- `name` (string, optional): Comma-separated channel names

#### mattermost_get_my_channels

Get channels that the current user is a member of.

**Parameters:** None

### User Management

#### mattermost_get_users

Get users by username or user ID.

**Parameters:**

- `username` (string, optional): Comma-separated usernames
- `userId` (string, optional): Comma-separated user IDs

#### mattermost_search_users

Search users by term.

**Parameters:**

- `term` (string): Search term

### Reaction Management

#### mattermost_add_reaction

Add emoji reactions to a post.

**Parameters:**

- `postId` (string): Target post ID
- `emojiName` (string): Comma-separated emoji names

#### mattermost_remove_reaction

Remove emoji reactions from a post.

**Parameters:**

- `postId` (string): Target post ID
- `emojiName` (string): Comma-separated emoji names

#### mattermost_get_reactions

Get all reactions for a post.

**Parameters:**

- `postId` (string): Post ID

### Neo4j Action Tracking Tools

#### mattermost_get_similar_actions

Find actions similar to the current one based on MCP type, action type, and parameters.

**Parameters:**

- `mcpType` (string): Type of MCP (Mattermost, DynamoDB, Jira, etc.)
- `actionType` (string): Type of action being performed
- `parameters` (object): Parameters of the action
- `limit` (number, optional): Maximum number of similar actions to return (default: 5)

**Example:**

```json
{
  "mcpType": "Mattermost",
  "actionType": "post_creation",
  "parameters": {
    "channelId": "channel123"
  },
  "limit": 10
}
```

#### mattermost_get_user_history

Get a user's action history.

**Parameters:**

- `userId` (string): ID of the user
- `limit` (number, optional): Maximum number of actions to return (default: 20)

#### mattermost_suggest_next_action

Suggest the next action based on historical patterns.

**Parameters:**

- `userId` (string): ID of the user
- `mcpType` (string): Type of MCP
- `currentActionType` (string): Type of the current action
- `currentParameters` (object): Parameters of the current action

#### mattermost_find_user_by_email

Find a user by email in the action tracking system.

**Parameters:**

- `email` (string): Email of the user to find
- `env` (string): Environment ('uat' or 'prod')

## Action Tracking Benefits

The Neo4j action tracking system provides several key benefits:

### 1. Knowledge Retention

- Captures organizational knowledge that would otherwise be lost
- Preserves context around decisions and actions
- Builds institutional memory

### 2. Pattern Recognition

- Identifies common workflows and successful approaches
- Recognizes inefficient patterns and bottlenecks
- Discovers best practices automatically

### 3. Smart Recommendations

- Suggests relevant actions based on historical patterns
- Provides context-aware recommendations
- Helps users discover new capabilities

### 4. Cross-Service Insights

- Shows dependencies between different systems (Mattermost, Jira, etc.)
- Tracks how teams use multiple tools together
- Identifies integration opportunities

### 5. Team Collaboration

- Enhances knowledge sharing between team members
- Shows how different teams approach similar problems
- Facilitates cross-team learning

### 6. User Identity Management

- Links actions to specific users and teams
- Enables personalized recommendations
- Supports team-based analytics

## Usage with Cursor

Add this to your `cursor_desktop_config.json`:

```json
{
  "mcpServers": {
    "mattermost": {
      "command": "node",
      "args": ["/path/to/mcp-mattermost/build/index.js"],
      "env": {
        "MATTERMOST_URL": "https://your-mattermost-instance.com",
        "MATTERMOST_TOKEN": "your-personal-access-token",
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "your_password",
        "CURSOR_USER_ID": "your_user_id",
        "CURSOR_USER_NAME": "Your Name",
        "CURSOR_USER_EMAIL": "your@email.com",
        "CURSOR_USER_TEAM": "Your Team"
      },
      "includeAuth": true,
      "authHeaders": {
        "cursor-auth": "${BASE64_ENCODED_USER_INFO}"
      }
    }
  }
}
```

### Using with Docker

If you're running the server in Docker, use this configuration:

```json
{
  "mcpServers": {
    "mattermost": {
      "command": "docker",
      "args": ["exec", "mcp-mattermost", "node", "build/index.js"],
      "env": {
        "CURSOR_USER_ID": "your_user_id",
        "CURSOR_USER_NAME": "Your Name",
        "CURSOR_USER_EMAIL": "your@email.com",
        "CURSOR_USER_TEAM": "Your Team"
      },
      "includeAuth": true
    }
  }
}
```

The `cursor-auth` header will be automatically populated with the current user's information when you configure `"includeAuth": true`.

## Sample Questions

Here are some example questions you can ask Claude when using this Mattermost MCP server:

### Basic Operations

- "Search for posts about 'project alpha' in the engineering channel"
- "Create a post in the general channel saying 'Hello team!'"
- "Get the last 10 unread posts in the announcements channel"
- "Show me all pinned posts in the town-square channel"
- "Find users with 'john' in their name"

### Advanced Search

- "Find all posts from alice about meetings in the last week"
- "Search for posts containing 'deadline' but not 'extended'"
- "Show me posts in the dev-team channel from yesterday"

### Reactions and Engagement

- "Add a thumbs up reaction to post abc123"
- "Show me all reactions on post xyz789"
- "Remove the fire emoji from post def456"

### Action Tracking and Analytics

- "Show me similar actions to creating posts in channels"
- "What actions has user123 performed recently?"
- "Suggest what I should do next after creating a post"
- "Find users by email in the action tracking system"

## Development

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Docker Development

For development with Docker:

```bash
# Build development image
docker build -t mcp-mattermost:dev .

# Run with volume mounting for development
docker run -it --rm \
  -v $(pwd):/app \
  -e MATTERMOST_URL="https://your-mattermost-instance.com" \
  -e MATTERMOST_TOKEN="your-token" \
  mcp-mattermost:dev npm run dev
```

## Troubleshooting

### Connection Issues

The server uses lazy initialization, so it will start successfully even if Mattermost is unavailable. Connection errors will only occur when tools are invoked.

### Neo4j Connection

If Neo4j action tracking fails to connect:

1. Verify Neo4j is running (check `docker-compose logs neo4j`)
2. Check environment variables are correctly set
3. Ensure Neo4j credentials are correct
4. The server will continue to work without action tracking

### Docker Issues

Common Docker problems:

- **Build failures**: Ensure all dependencies are correctly specified in package.json
- **Permission issues**: The container runs as non-root user `mcp` (uid 1001)
- **Environment variables**: Use `docker-compose` or set env vars correctly

## Cross-MCP Integration

This Mattermost MCP server is designed to work seamlessly with other MCP servers through the Neo4j action tracking system. When used alongside:

- **DynamoDB MCP**: Track database operations related to chat activities
- **Jira MCP**: Link project management activities with team communications
- **Other MCPs**: Build a comprehensive view of team workflows

The action tracking system creates relationships between actions across different services, enabling powerful insights and recommendations.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
