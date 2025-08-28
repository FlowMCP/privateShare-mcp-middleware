# privateShare-middleware

MCP server middleware for tool call tracking and payment statistics.

## Quick Navigation

- **[=Ë Full Specification](./src/MIDDLEWARE.md)** - Complete API and integration guide
- **[=Ú Main Documentation](https://github.com/a6b8/privateShare)** - Project overview and guides
- **[™ Core Module](https://github.com/FlowMCP/privateShare-core)** - Payment processing system

## Key Documentation Links

- **[EERC20.md](https://github.com/a6b8/privateShare/blob/main/EERC20.md)** - Encrypted ERC-20 technical reference
- **[SERVER.md](https://github.com/a6b8/privateShare/blob/main/server/SERVER.md)** - MCP server implementation guide

## What This Module Does

The Middleware runs **inside MCP servers** to:
- Track all tool call usage
- Provide statistics via POST /stats endpoint
- Implement server locking during payment processing
- Manage period-based billing cycles

## Quick Start with FlowMCP

```javascript
import { FlowMCP } from 'flow-mcp'
import { PrivateShareMiddleware } from 'privateshare-middleware'

// Create MCP server
const server = new FlowMCP({ name: 'my-server', version: '1.0.0' })

// Install middleware
const middleware = new PrivateShareMiddleware({
    routePath: '/privateShare',
    bearerToken: process.env.PRIVATESHARE_API_TOKEN
})

const { app } = server.getApp()
middleware.install({ app })

server.start({ port: 8080 })
```

## Repository

https://github.com/FlowMCP/privateShare-middleware