#!/usr/bin/env node

/**
 * Minimal ClickUp MCP Server for debugging Railway deployment
 * This version starts successfully and provides debugging information
 */

import { createHealthServer } from './health-endpoint.js';

async function main() {
  console.log('🚀 Starting Minimal ClickUp MCP Server...');
  
  // Validate environment
  const requiredEnvVars = ['CLICKUP_API_KEY', 'CLICKUP_TEAM_ID'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('🔧 Please set these variables in Railway dashboard');
    process.exit(1);
  }

  // Get port from environment (Railway sets this)
  const port = parseInt(process.env.PORT || '8000');
  
  console.log('✅ Environment validation passed');
  console.log(`📊 Starting on port ${port}`);
  
  // Create health server
  const healthServer = createHealthServer(port);
  
  // Set up graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, shutting down gracefully...');
    healthServer.close(() => {
      console.log('🔌 Health server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down gracefully...');
    healthServer.close(() => {
      console.log('🔌 Health server closed');
      process.exit(0);
    });
  });

  console.log('✅ Minimal ClickUp MCP Server started successfully');
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`🔍 Debug info: http://localhost:${port}/debug`);
  
  // TODO: Once this works, integrate the actual MCP server functionality
  console.log('⚠️  This is a minimal debug version');
  console.log('⚠️  Full MCP functionality will be added once deployment is stable');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
