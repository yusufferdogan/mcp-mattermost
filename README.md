# MCP Mattermost Server

This is an MCP (Model Context Protocol) server for Mattermost, written in TypeScript. It provides various tools for interacting with the Mattermost API.

## Installation

To run this tool, you need to set the following environment variables:

```json
{
  ...
  "mcp-mattermost": {
    "command": "npx",
    "args": [
      "@dakatan/mcp-mattermost"
    ],
    "env": {
      "MCP_MATTERMOST_URL": "https://your-mattermost-address.local",
      "MCP_MATTERMOST_TOKEN": "your-token",
      "MCP_MATTERMOST_TEAM_NAME": "your-team-name"
    }
  },
  ...
}
```

## Configuration

To run this tool, you need to set the following environment variables:

| Variable Name              | Description                                               | Required |
|----------------------------|-----------------------------------------------------------|----------|
| `MCP_MATTERMOST_URL`       | The URL of your Mattermost instance                       | Yes      |
| `MCP_MATTERMOST_TOKEN`     | Your Mattermost personal access token                     | Yes      |
| `MCP_MATTERMOST_TEAM_NAME` | The name of the Mattermost team you want to interact with | Yes      |

## Tools Provided

The MCP server provides the following tools:

- User management: `get_users`, `search_users`
- Channel management: `search_channels`, `get_channels`
- Post management: `search_posts`, `get_posts`, `create_post`, `get_posts_thread`, `pin_post`, `unpin_post`, `get_pinned_posts`
- Reaction management: `add_reaction`, `remove_reaction`, `get_reactions`