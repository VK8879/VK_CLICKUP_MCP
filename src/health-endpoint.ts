/**
 * Standalone health endpoint for debugging
 */

import * as http from 'http';

export function createHealthServer(port: number = 8000) {
  const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/health' && req.method === 'GET') {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'clickup-mcp-server',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        clickup: {
          apiKeyPresent: !!process.env.CLICKUP_API_KEY,
          teamIdPresent: !!process.env.CLICKUP_TEAM_ID,
          documentSupport: process.env.DOCUMENT_SUPPORT === 'true'
        },
        railway: {
          deployment_id: process.env.RAILWAY_DEPLOYMENT_ID || 'unknown',
          service_name: process.env.RAILWAY_SERVICE_NAME || 'clickup-mcp-server'
        }
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
    } else if (req.url === '/debug' && req.method === 'GET') {
      const debug = {
        environment: process.env,
        argv: process.argv,
        cwd: process.cwd(),
        versions: process.versions,
        platform: process.platform,
        arch: process.arch
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(debug, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Not Found',
        message: 'ClickUp MCP Server Debug Interface',
        endpoints: ['/health', '/debug']
      }));
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`🏥 Health server listening on port ${port}`);
  });

  return server;
}

// If this file is run directly, start the health server
if (require.main === module) {
  const port = parseInt(process.env.PORT || '8000');
  createHealthServer(port);
  console.log('🔍 Debug health server started. Check /health and /debug endpoints.');
}
