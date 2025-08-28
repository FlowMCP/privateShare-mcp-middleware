# privateShare-middleware

MCP server middleware for tool call tracking and payment statistics.

## Quick Navigation

- **[=� Full Specification](./src/MIDDLEWARE.md)** - Complete API and integration guide
- **[=� Main Documentation](https://github.com/a6b8/privateShare)** - Project overview and guides
- **[� Core Module](https://github.com/FlowMCP/privateShare-core)** - Payment processing system

## Key Documentation Links

- **[EERC20.md](https://github.com/a6b8/privateShare/blob/main/EERC20.md)** - Encrypted ERC-20 technical reference
- **[SERVER.md](https://github.com/a6b8/privateShare/blob/main/server/SERVER.md)** - MCP server implementation guide

## What This Module Does

The Middleware runs **inside MCP servers** to:
- Track all tool call usage
- Provide statistics via POST /stats endpoint
- Implement server locking during payment processing
- Manage period-based billing cycles

## Quick Start with RemoteServer

```javascript
import { RemoteServer } from 'mcpServers'
import { FlowMCP } from 'flowmcp'
import { PrivateShareMiddleware } from 'privateshare-middleware'

// Create RemoteServer instance
const remoteServer = new RemoteServer({ silent: false })

// Get Express app from RemoteServer
const app = remoteServer.getApp()

// Create and install middleware
const middleware = new PrivateShareMiddleware({
    routePath: '/privateShare',
    bearerToken: process.env.PRIVATESHARE_API_TOKEN
})

// Install middleware on Express app
middleware.install({ app })

// Add your MCP tools via activation payloads
const { activationPayloads } = FlowMCP.prepareActivations({ 
    arrayOfSchemas: [ /* your schemas */ ], 
    envObject: {} 
})

remoteServer.addActivationPayloads({
    activationPayloads,
    routePath: '/privateShare',
    transportProtocols: ['sse']
})

// Start server
remoteServer.start()
```

## Repository

https://github.com/FlowMCP/privateShare-mcp-middleware