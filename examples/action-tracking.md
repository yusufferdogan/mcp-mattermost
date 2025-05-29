# Action Tracking with Neo4j

This document explains how to use the Neo4j action tracking features of the Mattermost MCP server.

## Overview

The action tracking system automatically records all MCP operations in a Neo4j graph database, creating a knowledge graph of your team's workflows and patterns.

## Prerequisites

1. Neo4j instance running (use `docker-compose up neo4j -d`)
2. Environment variables configured:
   ```bash
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_password
   ```

## Automatic Action Recording

Every MCP tool usage is automatically recorded with:

- **User Information**: Who performed the action
- **Action Details**: What was done and with what parameters
- **Context**: When and where the action occurred
- **Results**: What the outcome was
- **Relationships**: How actions connect to each other

## Action Tracking Tools

### Finding Similar Actions

**You:** "Show me similar actions to creating posts in channels"

**Claude will:**

1. Use `mattermost_get_similar_actions`
2. Find previous post creation actions with similar parameters
3. Show patterns and common approaches

Example response:

```json
{
  "mcpType": "Mattermost",
  "actionType": "post_creation",
  "parameters": {
    "channelId": "channel123"
  },
  "limit": 5
}
```

### User Action History

**You:** "What actions have I performed recently?"

**Claude will:**

1. Use `mattermost_get_user_history`
2. Show your recent MCP interactions
3. Highlight patterns and frequent actions

### Next Action Suggestions

**You:** "What should I do next after creating a post about the project update?"

**Claude will:**

1. Use `mattermost_suggest_next_action`
2. Analyze historical patterns
3. Suggest likely follow-up actions based on what others typically do

## Insights and Analytics

### Workflow Patterns

The system can identify common workflow patterns like:

1. **Post → React → Comment** - Engagement patterns
2. **Search → Create** - Research before posting
3. **Channel Search → Post Creation** - Finding the right audience
4. **User Search → Direct Message** - Team communication flows

### Team Collaboration Insights

- **Most Active Channels**: Where your team collaborates most
- **Communication Patterns**: Peak activity times and collaboration styles
- **Knowledge Sharing**: How information flows through your organization
- **Tool Adoption**: Which MCP features are most/least used

### Cross-Service Integration

When used with other MCP servers:

- **Mattermost + Jira**: Link chat discussions to project tickets
- **Mattermost + DynamoDB**: Connect chat actions to data operations
- **Multi-Service Workflows**: See how teams use multiple tools together

## Example Queries

### Finding Workflow Patterns

**You:** "Show me how our team typically handles urgent issues"

The system can analyze:

1. Search patterns for "urgent" posts
2. Reaction patterns (🚨, ⚡, 👀)
3. Follow-up actions (comments, channel switches)
4. Resolution timelines

### Team Onboarding Insights

**You:** "What are the most common first actions for new team members?"

Analysis might reveal:

1. Channel joining patterns
2. First post types and locations
3. Common questions and help-seeking behavior
4. Integration with other tools

### Project Communication Analysis

**You:** "How did we communicate about the Alpha project release?"

The system can trace:

1. All posts mentioning "Alpha project"
2. Related channel activities
3. Timeline of communications
4. Team member involvement patterns

## Configuration and Setup

### Initializing Schema

```bash
npm run init-neo4j
```

### Custom Indexes

```cypher
CREATE INDEX action_timestamp IF NOT EXISTS FOR (a:Action) ON (a.timestamp);
CREATE INDEX user_team IF NOT EXISTS FOR (u:User) ON (u.team);
```

## Troubleshooting

### Connection Issues

```bash
# Check Neo4j status
docker-compose logs neo4j

# Test connection
curl -u neo4j:password http://localhost:7474/db/data/
```

### Query Performance

- Use EXPLAIN and PROFILE for slow queries
- Ensure proper indexing
- Consider query optimization

## Next Steps

- Explore the Neo4j Browser at http://localhost:7474
- Create custom dashboards for your team's needs
- Integrate with other analytics tools
- Set up automated reporting for leadership insights

## Integration with Other MCPs

The action tracking system becomes more powerful when combined with other MCP servers:

- **Jira Integration**: Link Mattermost discussions to tickets
- **GitHub Integration**: Connect code commits to chat conversations
- **Calendar Integration**: Correlate meeting schedules with communication patterns
- **Document Systems**: Track how documentation relates to team discussions

This creates a comprehensive organizational memory that improves over time.
