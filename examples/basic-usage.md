# Basic Usage Examples

This document provides examples of how to use the Mattermost MCP server with Claude.

## Prerequisites

1. Configure the MCP server in your Cursor configuration
2. Ensure you have a valid Mattermost token and URL

## Example Conversations

### Searching for Posts

**You:** "Search for posts about 'project meeting' in the last week"

**Claude will:**

1. Use the `mattermost_search_posts` tool
2. Apply appropriate search modifiers like `after:2023-12-01`
3. Return relevant posts with their content, authors, and channels

### Creating Posts

**You:** "Create a post in the general channel saying 'Hello team, hope everyone is having a great day!'"

**Claude will:**

1. First search for the channel using `mattermost_search_channels` if needed
2. Use `mattermost_create_post` to create the post
3. Confirm the post was created successfully

### Channel Management

**You:** "Show me all the channels I'm a member of"

**Claude will:**

1. Use `mattermost_get_my_channels` to list your channels
2. Display them in an organized format with names and purposes

**You:** "Find channels related to 'engineering'"

**Claude will:**

1. Use `mattermost_search_channels` with the term "engineering"
2. Show matching channels with their descriptions

### User Operations

**You:** "Find users named John in our Mattermost"

**Claude will:**

1. Use `mattermost_search_users` with "John"
2. Display matching users with their usernames and roles

### Working with Reactions

**You:** "Add a thumbs up reaction to post ID abc123"

**Claude will:**

1. Use `mattermost_add_reaction` with the emoji "thumbs_up"
2. Confirm the reaction was added

**You:** "Show me all reactions on post xyz789"

**Claude will:**

1. Use `mattermost_get_reactions` to get all reactions
2. Display them grouped by emoji type

## Advanced Search Examples

### Date-based Searches

- "Find posts from alice about deadlines in the last month"
- "Show me posts from yesterday in the dev-team channel"
- "Search for posts about 'release' before December 1st"

### Multi-criteria Searches

- "Find posts from john or jane about 'bug fixes' in engineering channels"
- "Search for posts with 'urgent' but not 'resolved' in the last week"
- "Show me posts about 'meeting' that have been pinned"

### Thread Management

- "Get all replies in the thread starting with post abc123"
- "Show me recent unread posts in the announcements channel"

## Tips for Better Results

1. **Be specific about timeframes** - Claude can apply date filters automatically
2. **Mention channel names** - This helps Claude search in the right context
3. **Use natural language** - Claude will translate to appropriate search modifiers
4. **Combine operations** - You can ask Claude to search, then react to posts in one request

## Error Handling

If you encounter errors:

1. **Authentication issues** - Check your Mattermost token is valid
2. **Permission errors** - Ensure you have access to the channels/posts you're querying
3. **Rate limiting** - The server handles rate limits automatically, but very frequent requests may be delayed
4. **Network issues** - The server will retry failed requests automatically

## Next Steps

- Explore [Action Tracking](action-tracking.md) to see how your usage patterns are analyzed
- Check the main README for complete tool documentation
- Try combining Mattermost operations with other MCP tools for powerful workflows
