# MIDDLEWARE.md - PrivateShare Middleware Specification

## Overview

The Middleware module (`3-privateShare-middleware`) is installed on **MCP Servers** to track tool calls and provide statistics to the PrivateShare Core system. It integrates with FlowMCP's RemoteServer pattern to automatically track usage and manage the server locking mechanism during payment processing.

**Integration Point**: The middleware runs **inside MCP servers**, while the Core module runs as a **separate PrivateShare Server** that polls MCP servers for statistics.

## Architecture

### Module Structure
```
3-privateShare-middleware/
├── src/
│   ├── index.mjs                 # Main export
│   ├── task/
│   │   ├── PrivateShareMiddleware.mjs   # Main tracking class
│   │   └── StatsManager.mjs             # Statistics management
│   └── data/
│       └── config.mjs            # Configuration
├── tests/
│   └── manual/
│       └── 0-test.mjs           # Manual test
└── package.json
```

### Integration with RemoteServer

#### Installation Pattern
```javascript
import { RemoteServer } from 'mcpServers'
import { FlowMCP } from 'flowmcp'
import { PrivateShareMiddleware } from 'privateshare-middleware'

// Create RemoteServer instance
const remoteServer = new RemoteServer( { silent: false } )

// Get Express app from RemoteServer
const app = remoteServer.getApp()

// Create and install middleware
const middleware = new PrivateShareMiddleware( {
    routePath: '/privateShare',
    bearerToken: process.env.PRIVATESHARE_API_TOKEN,
    silent: false
} )

// Install middleware on Express app
middleware.install( { app } )

// Add your MCP tools via activation payloads
const { activationPayloads } = FlowMCP.prepareActivations( { 
    arrayOfSchemas: [ /* your tool schemas */ ], 
    envObject: {} 
} )

remoteServer.addActivationPayloads( {
    activationPayloads,
    routePath: '/privateShare',
    transportProtocols: [ 'sse' ]
} )

// Start server
remoteServer.start()
```

## PrivateShareMiddleware Class

### Constructor & Configuration
```javascript
const middleware = new PrivateShareMiddleware({
    routePath: '/privateShare',              // Base route for middleware
    bearerToken: 'secret_token_123',         // Bearer token protection
    silent: false,                           // Enable console logging
    periodDurationMs: 300000,                // 5 minute periods  
    maxDataRetentionMs: 86400000             // 24 hour data retention
})
```

### Installation Method
```javascript
// Install middleware routes on Express app
const { installed } = middleware.install({ app })
```

### Tool Call Tracking
```javascript
// Track tool calls (automatic via middleware hooks)
const { tracked } = middleware.trackToolCall({ 
    toolName: 'tools/getAllPrices_dune',
    timestamp: Date.now()
})
```

### Server Management
```javascript
// Check server lock status
const { isLocked, lockedSince } = middleware.getServerStatus()

// Lock server during processing
const { locked } = middleware.lockServer({ reason: 'payment_processing' })

// Unlock server after processing complete
const { unlocked } = middleware.unlockServer()
```

## HTTP Routes

### POST /privateShare/stats
**Purpose**: Deliver statistics to PrivateShare Core system

**Authentication**: Bearer token required
```http
Authorization: Bearer secret_token_123
```

**Request**: Empty POST body

**Response (Data Available)**:
```json
{
    "status": true,
    "data": {
        "stats": {
            "PRIVATESHARE__GETALLPRICES_DUNE": 45,
            "PRIVATESHARE__GETWEATHER_API": 30,
            "PRIVATESHARE__SENTIMENT_ANALYSIS": 25
        },
        "unixFrom": 1705123200,
        "unixTo": 1705126800,
        "dataId": "1234567890"
    },
    "serverLocked": true
}
```

**Response (No Data / Processing)**:
```json
{
    "status": false,
    "message": "No stats available" // or "Server locked for processing",
    "serverLocked": true
}
```

### POST /privateShare/finished  
**Purpose**: Receive completion notification from PrivateShare Core

**Authentication**: Bearer token required

**Request**:
```json
{
    "dataId": "1234567890"
}
```

**Response**:
```json
{
    "status": true,
    "message": "Server unlocked, new period started",
    "newPeriodStarted": true
}
```

### GET /privateShare/debug
**Purpose**: Development route for debugging (only enabled during development)

**Authentication**: Bearer token required

**Response**:
```json
{
    "status": "running",
    "serverLocked": false,
    "currentPeriod": {
        "startTime": "2025-01-15T10:30:00Z",
        "toolCalls": 156,
        "uniqueTools": 8
    },
    "lastProcessed": "2025-01-15T10:25:00Z",
    "statsAvailable": true
}
```

### GET /privateShare/health
**Response**:
```json
{
    "status": "healthy",
    "middleware": "active",
    "serverLocked": false,
    "timestamp": "2025-01-15T10:30:00Z"
}
```

## StatsManager Class

### Statistics Collection
```javascript
static addToolCall({ toolName, timestamp }) {
    const { methodId } = this.#generateMethodId({ routePath, toolName })
    const { added } = this.#recordToolCall({ methodId, timestamp })
    
    return { added, methodId }
}

static getCurrentStats() {
    const { stats, unixFrom, unixTo, dataId } = this.#getActivePeriodStats()
    
    return { stats, unixFrom, unixTo, dataId }
}

static startNewPeriod() {
    const { started, newPeriodId } = this.#initializeNewPeriod()
    
    return { started, newPeriodId }
}
```

### Server Lock Management
```javascript
static lockServer({ reason }) {
    const { locked, lockTime } = this.#setServerLock({ reason })
    
    return { locked, lockTime }
}

static unlockServer() {
    const { unlocked, unlockTime } = this.#removeServerLock()
    
    return { unlocked, unlockTime }
}

static getServerLockStatus() {
    const { isLocked, lockedSince, reason } = this.#checkServerLock()
    
    return { isLocked, lockedSince, reason }
}
```

## Tool Call Tracking Workflow

### Automatic Integration
```javascript
// RemoteServer with automatic tool tracking
import { RemoteServer } from 'mcpServers'
import { FlowMCP } from 'flowmcp'
import { PrivateShareMiddleware } from 'privateshare-middleware'

const remoteServer = new RemoteServer({ silent: false })
const app = remoteServer.getApp()

// Install middleware (tracks all tool calls automatically)
const middleware = new PrivateShareMiddleware({
    routePath: '/privateShare',
    bearerToken: process.env.PRIVATESHARE_API_TOKEN
})

middleware.install({ app })

// Add tools via activation payloads
const toolSchema = {
    name: 'getAllPrices_dune',
    description: 'Get all crypto prices from Dune',
    parameters: { /* ... */ },
    handler: async ({ request }) => {
        // Tool logic here
        return { result: 'data' }
    }
}

const { activationPayloads } = FlowMCP.prepareActivations({ 
    arrayOfSchemas: [ toolSchema ], 
    envObject: {} 
})

remoteServer.addActivationPayloads({
    activationPayloads,
    routePath: '/privateShare',
    transportProtocols: ['sse']
})

remoteServer.start()
```

### Tracking Implementation
```javascript
// Middleware hooks into MCP tool execution
#hookIntoToolExecution({ app }) {
    // Intercept all tool calls
    app.use('*', (req, res, next) => {
        // Extract tool name from request
        const toolName = this.#extractToolName({ req })
        
        if (toolName) {
            this.#trackToolCall({ toolName, timestamp: Date.now() })
        }
        
        next()
    })
}

#extractToolName({ req }) {
    // Extract from MCP request format
    const { method, params } = req.body
    if (method === 'tools/call') {
        return params.name
    }
    return null
}
```

## Server Locking Mechanism

### Locking Behavior
```javascript
// When stats are requested and delivered:
POST /privateShare/stats → Server locks automatically

// During lock period:
// - New tool calls are REJECTED
// - Stats requests return same data  
// - New period cannot start

// When finished notification received:
POST /privateShare/finished → Server unlocks, new period starts
```

### Lock State Management
```javascript
#serverLockState = {
    isLocked: false,
    lockedSince: null,
    reason: null,
    dataId: null,
    statsDelivered: null
}

#lockServerForProcessing({ dataId }) {
    this.#serverLockState = {
        isLocked: true,
        lockedSince: Date.now(),
        reason: 'payment_processing',
        dataId: dataId,
        statsDelivered: this.#getCurrentStats()
    }
}
```

### Request Rejection During Lock
```javascript
#handleIncomingToolCall({ toolName, timestamp }) {
    const { isLocked } = this.#getServerLockStatus()
    
    if (isLocked) {
        throw new Error('Server locked for payment processing. Please retry later.')
    }
    
    // Process normally
    this.#trackToolCall({ toolName, timestamp })
}
```

## Data Structures

### Stats Object (Internal)
```javascript
{
    currentPeriod: {
        startTime: 1705123200000,
        endTime: null,
        toolCalls: {
            'PRIVATESHARE__GETALLPRICES_DUNE': [
                { timestamp: 1705123250000 },
                { timestamp: 1705123300000 }
            ],
            'PRIVATESHARE__GETWEATHER_API': [
                { timestamp: 1705123400000 }
            ]
        },
        dataId: 'uuid-generated-string'
    }
}
```

### Method ID Generation
```javascript
// Same as Core module
#generateMethodId({ routePath, toolName }) {
    // routePath: "/privateShare" → "PRIVATESHARE"
    const cleanedRoutePath = routePath.replace(/^\//, '').toUpperCase()
    
    // toolName: "tools/getAllPrices_dune" → "GETALLPRICES_DUNE"
    const cleanedToolName = toolName.replace(/^tools\//, '').toUpperCase()
    
    // Result: "PRIVATESHARE__GETALLPRICES_DUNE"
    const methodId = cleanedRoutePath + '__' + cleanedToolName
    
    return { methodId }
}
```

### Server Lock Object
```javascript
{
    isLocked: true,
    lockedSince: 1705123200000,
    reason: 'payment_processing',
    dataId: '1234567890',
    statsDelivered: {
        'PRIVATESHARE__GETALLPRICES_DUNE': 45,
        'PRIVATESHARE__GETWEATHER_API': 30
    }
}
```

## Environment Variables

```bash
# Middleware Configuration
PRIVATESHARE_API_TOKEN=bearer_token_for_api_protection

# Route Configuration
PRIVATESHARE_ROUTE_PATH=/privateShare

# Period Management
PRIVATESHARE_PERIOD_DURATION_MS=300000
PRIVATESHARE_DATA_RETENTION_MS=86400000
```

## Complete Integration Example

```javascript
import { RemoteServer } from 'mcpServers'
import { FlowMCP } from 'flowmcp'
import { PrivateShareMiddleware } from 'privateshare-middleware'

// 1. Create RemoteServer instance
const remoteServer = new RemoteServer({ silent: false })
const app = remoteServer.getApp()

// 2. Define monetized tool schemas
const getAllPricesDune = {
    name: 'getAllPrices_dune',
    description: 'Get cryptocurrency prices from Dune Analytics',
    parameters: {
        type: 'object',
        properties: {
            tokens: { type: 'array', items: { type: 'string' } }
        }
    },
    handler: async ({ request }) => {
        // Expensive API call to Dune
        const prices = await duneAnalytics.getPrices(request.params.tokens)
        return { prices }
    }
}

const getWeatherApi = {
    name: 'getWeather_api',
    description: 'Get weather data from premium API',
    parameters: {
        type: 'object',
        properties: {
            location: { type: 'string' }
        }
    },
    handler: async ({ request }) => {
        // Premium weather API call
        const weather = await weatherAPI.getWeather(request.params.location)
        return { weather }
    }
}

// 3. Install PrivateShare Middleware
const middleware = new PrivateShareMiddleware({
    routePath: '/privateShare',
    bearerToken: process.env.PRIVATESHARE_API_TOKEN,
    silent: false
})

middleware.install({ app })

// 4. Add tools via activation payloads
const { activationPayloads } = FlowMCP.prepareActivations({ 
    arrayOfSchemas: [ getAllPricesDune, getWeatherApi ], 
    envObject: {} 
})

remoteServer.addActivationPayloads({
    activationPayloads,
    routePath: '/privateShare',
    transportProtocols: ['sse']
})

// 5. Start server
remoteServer.start()
```

## Testing Strategy

### Manual Tests
```javascript
// tests/manual/0-test.mjs
// Test middleware installation and basic functionality
```

### Integration Tests
```javascript
// Test complete workflow:
// 1. Install middleware on test server
// 2. Simulate tool calls
// 3. Test stats endpoint
// 4. Test server locking
// 5. Test finished endpoint
// 6. Verify new period starts
```

---

**Status**: 🚧 Specification complete, implementation pending  
**Version**: 0.1.0